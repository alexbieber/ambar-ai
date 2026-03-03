import {
  MODEL,
  MAX_TOKENS_PROJECT,
  MAX_TOKENS_PREVIEW,
  MAX_TOKENS_EDIT,
  FLUTTER_SYSTEM_PROMPT,
  ENHANCE_SYSTEM_PROMPT,
  PREVIEW_SYSTEM_PROMPT,
  EDIT_SYSTEM_PROMPT,
} from '../utils/constants';
import { parseProjectXML, getParseFailurePreview } from './fileParser';
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
}): Promise<Record<string, string>> {
  const { apiKey, prompt, model, onProgress, onStreamChunk } = params;
  onProgress?.('Sending prompt to API…', 10);
  let received = 0;
  let lastReported = 0;
  const fullText = await streamCompletion({
    apiKey,
    model,
    system: FLUTTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: MAX_TOKENS_PROJECT,
    onChunk: (chunk) => {
      onStreamChunk?.(chunk);
      received += chunk.length;
      if (received - lastReported >= 2000 || received < 500) {
        lastReported = received;
        const pct = 10 + Math.min(45, (received / 80000) * 45);
        onProgress?.(`Streaming source code… ${(received / 1024).toFixed(1)}k chars`, pct);
      }
    },
  });

  onProgress?.('Parsing XML response…', 58);
  const files = parseProjectXML(fullText);
  if (Object.keys(files).length === 0) {
    const preview = getParseFailurePreview(fullText);
    const isEmpty = !preview || preview.startsWith('(empty');
    const mainMsg =
      isEmpty
        ? 'The API returned no text (empty stream). Check your API key and try again.'
        : 'No project files were parsed from the response. Describe your app in detail (e.g. "A todo app with a list screen, add/edit screen, and categories") and try again.';
    throw new APIError(mainMsg + (preview && !isEmpty ? `\n\nResponse preview:\n${preview}` : ''));
  }
  onProgress?.(`Parsed ${Object.keys(files).length} files`, 60);
  return files;
}

function buildEnhanceUserMessage(description: string, instruction: string, files: Record<string, string>): string {
  const fileBlocks = Object.entries(files).map(([path, content]) => `--- FILE: ${path} ---\n${content}\n`);
  return `Current app description:\n${description}\n\nUser wants to make these changes:\n${instruction}\n\nCurrent project files (output the FULL updated project in XML after this):\n${fileBlocks.join('\n')}`;
}

export async function enhanceProject(params: {
  apiKey: string;
  currentDescription: string;
  instruction: string;
  files: Record<string, string>;
  model?: string;
  onProgress?: (step: string, percent?: number) => void;
  onStreamChunk?: (chunk: string) => void;
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
    const preview = getParseFailurePreview(fullText);
    const isEmpty = !preview || preview.startsWith('(empty');
    throw new APIError(
      isEmpty ? 'API returned no text. Try again.' : 'Could not parse updated project. Try describing the change in more detail.'
    );
  }
  onProgress?.(`Parsed ${Object.keys(out).length} files`, 60);
  return out;
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
  const system = `You are FlutterForge AI. The user is working on a Flutter project. Answer questions about the project and suggest code when relevant.\n\n${projectSummary}`;

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
