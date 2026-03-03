import {
  MODEL,
  MAX_TOKENS_PROJECT,
  MAX_TOKENS_PREVIEW,
  MAX_TOKENS_EDIT,
  FLUTTER_SYSTEM_PROMPT,
  GENERATE_WITH_PLAN_SYSTEM_PROMPT,
  ENHANCE_SYSTEM_PROMPT,
  ENHANCE_MAX_TOTAL_CHARS,
  ENHANCE_MAX_PER_FILE,
  ENHANCE_MAX_DESCRIPTION_CHARS,
  PREVIEW_SYSTEM_PROMPT,
  CODE_TO_HTML_PREVIEW_PROMPT,
  EDIT_SYSTEM_PROMPT,
} from '../utils/constants';
import { getChatSystemPrompt } from '../agent/prompts';
import { parseProjectXML, parsePlanAndProject, getParseFailurePreview, ensureCriticalFiles } from './fileParser';
import { wrapPreviewHtml } from './previewGenerator';
import type { Project, ProjectFile, ChatMessage } from '../types';

export class APIError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

interface StreamCompletionParams {
  apiKey: string;
  system: string;
  messages: { role: string; content: string }[];
  maxTokens: number;
  model?: string;
  onChunk?: (text: string) => void;
  onDone?: (fullText: string) => void;
}

export async function streamCompletion(params: StreamCompletionParams): Promise<string> {
  const { apiKey, system, messages, maxTokens, model = MODEL, onChunk, onDone } = params;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    let msg = body;
    try {
      const j = JSON.parse(body);
      msg = j.error?.message || j.message || body;
    } catch {
      // use body as-is
    }
    if (response.status === 401) throw new APIError(msg || 'Invalid API key', 'invalid_key');
    if (response.status === 429) throw new APIError(msg || 'Rate limit exceeded', 'rate_limit');
    if (response.status === 529) throw new APIError(msg || 'Service overloaded', 'overloaded');
    throw new APIError(msg || `HTTP ${response.status}`, 'api_error');
  }

  const reader = response.body?.getReader();
  if (!reader) throw new APIError('No response body');

  const decoder = new TextDecoder();
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
    for (const line of lines) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const block = parsed.delta?.text ?? parsed.type === 'content_block_delta' ? (parsed.delta?.text ?? '') : '';
        if (block) {
          fullText += block;
          onChunk?.(block);
        }
      } catch {
        // skip malformed chunk
      }
    }
  }

  onDone?.(fullText);
  return fullText;
}

export async function generateProject(params: {
  apiKey: string;
  prompt: string;
  model?: string;
  onProgress?: (step: string, percent: number) => void;
  onStreamChunk?: (text: string) => void;
  onParseFailure?: (raw: string) => void;
}): Promise<{ files: Record<string, string>; planMarkdown?: string }> {
  const { apiKey, prompt, model, onProgress, onStreamChunk } = params;
  onProgress?.('Planning & generating (one pass)…', 10);
  let received = 0;
  let lastReported = 0;
  const fullText = await streamCompletion({
    apiKey,
    model,
    system: GENERATE_WITH_PLAN_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: MAX_TOKENS_PROJECT,
    onChunk: (chunk) => {
      onStreamChunk?.(chunk);
      received += chunk.length;
      if (received - lastReported >= 2000 || received < 500) {
        lastReported = received;
        const pct = 10 + Math.min(45, (received / 80000) * 45);
        onProgress?.(`Streaming… ${(received / 1024).toFixed(1)}k chars`, pct);
      }
    },
  });

  onProgress?.('Parsing plan & project…', 58);
  const { planMarkdown, projectXML } = parsePlanAndProject(fullText ?? '');
  let files = parseProjectXML(projectXML);
  if (Object.keys(files).length === 0) files = parseProjectXML(fullText ?? '');
  if (Object.keys(files).length === 0 && fullText.trim().length > 200) {
    onProgress?.('Parse failed, retrying with XML-only prompt…', 55);
    const repairText = await streamCompletion({
      apiKey,
      model,
      system: FLUTTER_SYSTEM_PROMPT + '\n\nCRITICAL: Your response must be ONLY the <project>...</project> XML. No preamble, no explanation, no markdown. Include ALL files (at least 5-7). Never output only main.dart.',
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: fullText ?? '' },
        { role: 'user', content: 'Re-output the full <project>...</project> XML from your previous response. You MUST include EVERY file (pubspec.yaml, lib/main.dart, and every screen/widget/model file). Do not output only main.dart. No other text.' },
      ],
      maxTokens: MAX_TOKENS_PROJECT,
    });
    files = parseProjectXML(repairText ?? '');
  }
  if (Object.keys(files).length === 0) {
    params.onParseFailure?.(fullText ?? '');
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[FlutterForge] generateProject parse failed', { responseLength: fullText?.length ?? 0 });
    }
    const preview = getParseFailurePreview(fullText ?? '');
    const isEmpty = !preview || preview.startsWith('(empty');
    const mainMsg =
      isEmpty
        ? 'The API returned no text (empty stream). Check your API key and try again.'
        : 'No project files were parsed from the response. Describe your app in detail (e.g. "A todo app with a list screen, add/edit screen, and categories") and try again.';
    throw new APIError(mainMsg + (preview && !isEmpty ? `\n\nResponse preview:\n${preview}` : ''));
  }
  if (Object.keys(files).length < 3 && fullText.trim().length > 500) {
    onProgress?.('Only 1–2 files parsed, requesting full project…', 56);
    const fullProjectText = await streamCompletion({
      apiKey,
      model,
      system: GENERATE_WITH_PLAN_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: fullText ?? '' },
        { role: 'user', content: 'Your previous response had too few files. Generate the COMPLETE multi-file project: pubspec.yaml, lib/main.dart, and at least 4–6 more .dart files (one per screen in lib/screens/, plus lib/widgets/ or lib/models/ as needed). Output the full <project>...</project> XML with every file. No other text.' },
      ],
      maxTokens: MAX_TOKENS_PROJECT,
    });
    const reparse = parseProjectXML(parsePlanAndProject(fullProjectText ?? '').projectXML);
    if (Object.keys(reparse).length >= 3) files = reparse;
  }
  onProgress?.(`Parsed ${Object.keys(files).length} files`, 60);
  return { files: ensureCriticalFiles(files), planMarkdown: planMarkdown || undefined };
}

function buildEnhanceUserMessage(description: string, instruction: string, files: Record<string, string>): string {
  const descCapped =
    description.length > ENHANCE_MAX_DESCRIPTION_CHARS
      ? description.slice(0, ENHANCE_MAX_DESCRIPTION_CHARS) + '\n\n... (earlier enhancements truncated)'
      : description;
  let total = 0;
  let hadTruncation = description.length > ENHANCE_MAX_DESCRIPTION_CHARS;
  const fileBlocks: string[] = [];
  for (const [path, content] of Object.entries(files)) {
    if (total >= ENHANCE_MAX_TOTAL_CHARS) break;
    const capped = content.length > ENHANCE_MAX_PER_FILE ? content.slice(0, ENHANCE_MAX_PER_FILE) + '\n\n... (truncated)' : content;
    if (content.length > ENHANCE_MAX_PER_FILE) hadTruncation = true;
    const block = `--- FILE: ${path} ---\n${capped}\n`;
    if (total + block.length > ENHANCE_MAX_TOTAL_CHARS) {
      fileBlocks.push(block.slice(0, ENHANCE_MAX_TOTAL_CHARS - total));
      hadTruncation = true;
      break;
    }
    fileBlocks.push(block);
    total += block.length;
  }
  const truncNote = hadTruncation
    ? '\n\nNote: Some file contents above were truncated due to length limits; preserve structure and only modify what you can see.'
    : '';
  return `Current app description:\n${descCapped}\n\nUser's enhancement request (apply ONLY this; leave all other code unchanged):\n${instruction}\n\nCurrent project files. For any file you do not need to change, output its content exactly as below. Output the full project in XML:\n${fileBlocks.join('\n')}${truncNote}`;
}

export async function enhanceProject(params: {
  apiKey: string;
  currentDescription: string;
  instruction: string;
  files: Record<string, string>;
  model?: string;
  onProgress?: (step: string, percent?: number) => void;
  onStreamChunk?: (chunk: string) => void;
  onParseFailure?: (raw: string) => void;
}): Promise<Record<string, string>> {
  const { apiKey, currentDescription, instruction, files, model, onProgress, onStreamChunk } = params;
  onProgress?.('Preparing enhance request…', 5);
  const userMessage = buildEnhanceUserMessage(currentDescription, instruction, files);
  onProgress?.('Sending to API…', 10);
  let received = 0;
  const fullText = await streamCompletion({
    apiKey,
    model,
    system: ENHANCE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: MAX_TOKENS_PROJECT,
    onChunk: (chunk) => {
      onStreamChunk?.(chunk);
      received += chunk.length;
      if (received % 2000 < chunk.length) onProgress?.(`Streaming… ${(received / 1024).toFixed(1)}k chars`, 10 + Math.min(50, (received / 80000) * 50));
    },
  });
  onProgress?.('Parsing updated project…', 58);
  const out = parseProjectXML(fullText);
  if (Object.keys(out).length === 0) {
    params.onParseFailure?.(fullText);
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[FlutterForge] enhanceProject parse failed', { responseLength: fullText?.length ?? 0 });
    }
    const preview = getParseFailurePreview(fullText);
    const isEmpty = !preview || preview.startsWith('(empty');
    throw new APIError(
      isEmpty ? 'API returned no text. Try again.' : 'Could not parse updated project. Try describing the change in more detail.'
    );
  }
  onProgress?.(`Parsed ${Object.keys(out).length} files`, 60);
  return ensureCriticalFiles(out);
}

export async function generatePreview(params: {
  apiKey: string;
  prompt: string;
  model?: string;
  onProgress?: (step: string) => void;
}): Promise<string> {
  const { apiKey, prompt, model, onProgress } = params;
  onProgress?.('Requesting preview from API…');
  const fullText = await streamCompletion({
    apiKey,
    model,
    system: PREVIEW_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: MAX_TOKENS_PREVIEW,
    onChunk: (chunk) => {
      if (chunk.length > 0) onProgress?.('Streaming preview HTML…');
    },
  });
  onProgress?.('Wrapping preview…');
  const html = fullText.trim();
  if (!html.toLowerCase().includes('<!doctype') && !html.toLowerCase().startsWith('<html')) {
    return wrapPreviewHtml(html);
  }
  return wrapPreviewHtml(html);
}

/** Generate preview HTML from current Dart/code (not from description). */
export async function generatePreviewFromCode(params: {
  apiKey: string;
  code: string;
  model?: string;
  onProgress?: (step: string) => void;
}): Promise<string> {
  const { apiKey, code, model, onProgress } = params;
  onProgress?.('Requesting preview from code…');
  const cappedCode = code.slice(0, 12000);
  const codeMessage =
    code.length > 12000
      ? `The following Dart code was truncated to 12000 characters; render based on what you see.\n\n${cappedCode}`
      : cappedCode;
  const fullText = await streamCompletion({
    apiKey,
    model,
    system: CODE_TO_HTML_PREVIEW_PROMPT,
    messages: [{ role: 'user', content: codeMessage }],
    maxTokens: MAX_TOKENS_PREVIEW,
    onChunk: (chunk) => {
      if (chunk.length > 0) onProgress?.('Streaming preview HTML…');
    },
  });
  onProgress?.('Wrapping preview…');
  const html = fullText.trim();
  if (!html) return wrapPreviewHtml('<p style="padding:16px;color:#888;">No HTML generated from code.</p>');
  return wrapPreviewHtml(html);
}

export async function editFile(params: {
  apiKey: string;
  instruction: string;
  targetFile: ProjectFile;
  projectContext: string;
  model?: string;
  onChunk?: (text: string) => void;
}): Promise<string> {
  const { apiKey, instruction, targetFile, projectContext, model, onChunk } = params;
  const userContent = `Instruction: ${instruction}\n\nCurrent file (${targetFile.path}):\n\`\`\`\n${targetFile.content}\n\`\`\`\n\nProject context:\n${projectContext}`;

  const fullText = await streamCompletion({
    apiKey,
    model,
    system: EDIT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }],
    maxTokens: MAX_TOKENS_EDIT,
    onChunk,
  });

  return fullText.trim();
}

export async function chatWithProject(params: {
  apiKey: string;
  message: string;
  project: Project;
  history: ChatMessage[];
  model?: string;
  onChunk?: (text: string) => void;
}): Promise<ChatMessage> {
  const { apiKey, message, project, history, model, onChunk } = params;
  const projectSummary = `Project: ${project.name}\nDescription: ${project.description}\nFiles: ${Object.keys(project.files).join(', ')}`;
  const system = getChatSystemPrompt(projectSummary);

  const messages: { role: string; content: string }[] = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const content = await streamCompletion({
    apiKey,
    model,
    system,
    messages,
    maxTokens: MAX_TOKENS_EDIT,
    onChunk,
  });

  return {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content,
    timestamp: Date.now(),
  };
}
