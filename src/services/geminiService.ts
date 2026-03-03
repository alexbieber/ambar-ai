import {
  GEMINI_MODEL,
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
import { APIError } from './claudeService';

function geminiStreamUrl(modelId: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent`;
}
function geminiGenerateUrl(modelId: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`;
}

/** Gemini free tier limits: use lower output tokens to avoid token-per-minute exhaustion. */
const GEMINI_SAFE_MAX_TOKENS = 4096;

/** Extract full text from a non-streaming GenerateContent response. */
function extractTextFromGenerateResponse(json: unknown): string {
  const candidates = (json as { candidates?: unknown[] })?.candidates;
  if (!candidates?.[0]) return '';
  const parts = (candidates[0] as { content?: { parts?: { text?: string }[] } })?.content?.parts;
  if (!parts || !Array.isArray(parts)) return '';
  return parts.map((p) => p?.text ?? '').filter(Boolean).join('');
}

interface StreamCompletionParams {
  apiKey: string;
  system: string;
  messages: { role: string; content: string }[];
  maxTokens: number;
  model?: string;
  onChunk?: (text: string) => void;
  onDone?: (fullText: string) => void;
  onRetryWait?: (message: string) => void;
  skipRetryWait?: boolean;
}

/** Convert messages to Gemini contents format. Gemini uses "user" and "model" roles. */
function toGeminiContents(messages: { role: string; content: string }[]): { role: string; parts: { text: string }[] }[] {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/** Parse Gemini API error body for message and status. */
function parseGeminiError(body: string, status: number): { message: string; code?: string } {
  let message = body;
  let code: string | undefined;
  try {
    const j = JSON.parse(body);
    const err = j.error || j;
    message = err.message || message;
    const statusStr = (err.status || err.code || '').toString().toUpperCase();
    if (statusStr.includes('RESOURCE_EXHAUSTED') || status === 429) {
      code = 'rate_limit';
      if (!message || message === body) {
        message = 'Gemini rate limit exceeded. Retrying in 1 min… or switch to Claude in Settings if you have a key.';
      }
    } else if (status === 403) {
      code = 'quota_exceeded';
      if (!message || message === body) {
        message = 'Gemini quota exceeded. Check your usage at aistudio.google.com or enable billing for higher limits.';
      }
    } else if (status === 401) {
      code = 'invalid_key';
    } else if (status === 400) {
      code = 'invalid_request';
    }
  } catch {
    if (status === 429) {
      code = 'rate_limit';
      message = 'Gemini rate limit exceeded. Retrying in 1 min… or use Claude in Settings.';
    } else if (status === 403) {
      code = 'quota_exceeded';
      message = 'Gemini quota exceeded. Check aistudio.google.com for your limits.';
    }
  }
  return { message, code };
}

/** Sleep for ms. */
function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export async function streamCompletion(params: StreamCompletionParams): Promise<string> {
  const { apiKey, system, messages, maxTokens, model = GEMINI_MODEL, onChunk, onDone } = params;
  const cappedTokens = Math.min(maxTokens, GEMINI_SAFE_MAX_TOKENS);

  const url = `${geminiStreamUrl(model)}?key=${encodeURIComponent(apiKey)}`;
  const contents = toGeminiContents(messages);
  const body = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: system }] },
    generationConfig: {
      maxOutputTokens: cappedTokens,
      temperature: 0.2,
    },
  });

  const maxRetries = 2;
  let lastError: APIError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (response.ok) {
      lastError = null;
      return await readStreamResponse(response, onChunk, onDone);
    }

    const bodyText = await response.text();
    const { message, code } = parseGeminiError(bodyText, response.status);
    lastError = new APIError(message, code);

    if (response.status === 429 || response.status === 503) {
      if (attempt < maxRetries) {
        const retryAfter = response.headers.get('retry-after');
        const waitMs = retryAfter
          ? Math.min(parseInt(retryAfter, 10) * 1000, 120000)
          : response.status === 429
            ? [60000, 90000, 120000][attempt] ?? 120000
            : Math.min(2000 * Math.pow(2, attempt), 30000);
        if (params.skipRetryWait) {
          break;
        }
        const waitSec = Math.ceil(waitMs / 1000);
        for (let s = waitSec; s > 0; s--) {
          params.onRetryWait?.(`Rate limited. Retrying in ${s}s… (attempt ${attempt + 1}/${maxRetries})`);
          await sleep(1000);
        }
        continue;
      }
    }

    if (response.status === 400) throw new APIError(message || 'Invalid request', 'invalid_request');
    if (response.status === 401) throw new APIError(message || 'Invalid API key', 'invalid_key');
    if (response.status === 403) throw new APIError(message, 'quota_exceeded');
    if (response.status === 429) throw new APIError(message, 'rate_limit');
    throw new APIError(message || `HTTP ${response.status}`, 'api_error');
  }

  throw lastError ?? new APIError('Request failed', 'api_error');
}

/** Non-streaming generateContent call — use when stream returns empty so we still get a result. */
async function generateContentNonStreaming(params: {
  apiKey: string;
  system: string;
  messages: { role: string; content: string }[];
  maxTokens: number;
  model?: string;
}): Promise<string> {
  const modelId = params.model ?? GEMINI_MODEL;
  const url = `${geminiGenerateUrl(modelId)}?key=${encodeURIComponent(params.apiKey)}`;
  const contents = toGeminiContents(params.messages);
  const body = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: params.system }] },
    generationConfig: {
      maxOutputTokens: Math.min(params.maxTokens, GEMINI_SAFE_MAX_TOKENS),
      temperature: 0.2,
    },
  });
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (!res.ok) {
    const errBody = await res.text();
    const { message, code } = parseGeminiError(errBody, res.status);
    throw new APIError(message, code);
  }
  const json = await res.json();
  return extractTextFromGenerateResponse(json) || '';
}

async function readStreamResponse(
  response: Response,
  onChunk?: (text: string) => void,
  onDone?: (fullText: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) throw new APIError('No response body');

  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  function tryExtractText(str: string): string | null {
    try {
      const parsed = JSON.parse(str);
      const parts = parsed.candidates?.[0]?.content?.parts;
      if (!parts || !Array.isArray(parts)) return null;
      const texts = parts.map((p: { text?: string }) => p?.text).filter(Boolean);
      return texts.length > 0 ? texts.join('') : null;
    } catch {
      return null;
    }
  }

  function processChunk(str: string): void {
    let trimmed = str.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('data:')) trimmed = trimmed.slice(5).trim();
    if (trimmed === '[DONE]' || trimmed === '') return;
    let text = tryExtractText(trimmed);
    if (text) {
      fullText += text;
      onChunk?.(text);
      return;
    }
    // Gemini may send multiple JSON objects concatenated without newlines
    const segments = trimmed.split(/\}\s*\{/);
    const objects =
      segments.length <= 1
        ? [trimmed]
        : segments.map((s, i, arr) => (i === 0 ? s + '}' : i === arr.length - 1 ? '{' + s : '{' + s + '}'));
    for (const obj of objects) {
      text = tryExtractText(obj);
      if (text) {
        fullText += text;
        onChunk?.(text);
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      processChunk(line);
    }
    processChunk(buffer);
  }
  if (buffer.trim()) {
    processChunk(buffer);
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
  onRetryWait?: (message: string) => void;
  skipRetryWait?: boolean;
}): Promise<Record<string, string>> {
  const { apiKey, prompt, model, onProgress, onStreamChunk, onRetryWait, skipRetryWait } = params;
  onProgress?.('Sending prompt to API…', 10);
  let received = 0;
  let lastReported = 0;
  let fullText = await streamCompletion({
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
    onRetryWait,
    skipRetryWait,
  });

  if (!fullText || fullText.trim().length === 0) {
    onProgress?.('Stream was empty, trying non-streaming request…', 50);
    fullText = await generateContentNonStreaming({
      apiKey,
      model,
      system: FLUTTER_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: MAX_TOKENS_PROJECT,
    });
    if (fullText) onStreamChunk?.(fullText);
  }

  onProgress?.('Parsing XML response…', 58);
  const files = parseProjectXML(fullText);
  if (Object.keys(files).length === 0) {
    const preview = getParseFailurePreview(fullText);
    const isEmpty = !preview || preview.startsWith('(empty');
    const mainMsg =
      isEmpty
        ? 'The API returned no text. Check your Gemini API key and quota at aistudio.google.com, then try again. You can also try Claude in Settings if you have a key.'
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
  onRetryWait?: (message: string) => void;
  skipRetryWait?: boolean;
}): Promise<Record<string, string>> {
  const { apiKey, currentDescription, instruction, files, model, onProgress, onStreamChunk, onRetryWait, skipRetryWait } = params;
  onProgress?.('Preparing enhance request…', 5);
  const userMessage = buildEnhanceUserMessage(currentDescription, instruction, files);
  onProgress?.('Sending to API…', 10);
  let received = 0;
  let lastReported = 0;
  let fullText = await streamCompletion({
    apiKey,
    model,
    system: ENHANCE_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: MAX_TOKENS_PROJECT,
    onChunk: (chunk) => {
      onStreamChunk?.(chunk);
      received += chunk.length;
      if (received - lastReported >= 2000 || received < 500) {
        lastReported = received;
        onProgress?.(`Streaming… ${(received / 1024).toFixed(1)}k chars`, 10 + Math.min(50, (received / 80000) * 50));
      }
    },
    onRetryWait,
    skipRetryWait,
  });
  if (!fullText || fullText.trim().length === 0) {
    onProgress?.('Stream empty, trying non-streaming…', 50);
    fullText = await generateContentNonStreaming({
      apiKey,
      model,
      system: ENHANCE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: MAX_TOKENS_PROJECT,
    });
    if (fullText) onStreamChunk?.(fullText);
  }
  onProgress?.('Parsing updated project…', 58);
  const out = parseProjectXML(fullText);
  if (Object.keys(out).length === 0) {
    const preview = getParseFailurePreview(fullText);
    const isEmpty = !preview || preview.startsWith('(empty');
    throw new APIError(
      isEmpty
        ? 'API returned no text. Try again or use a shorter enhancement.'
        : 'Could not parse updated project. Try describing the change in more detail.'
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
  let fullText = await streamCompletion({
    apiKey,
    model,
    system: PREVIEW_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
    maxTokens: MAX_TOKENS_PREVIEW,
    onChunk: (chunk) => {
      if (chunk.length > 0) onProgress?.('Streaming preview HTML…');
    },
  });
  if (!fullText || fullText.trim().length === 0) {
    onProgress?.('Stream empty, trying non-streaming request…');
    fullText = await generateContentNonStreaming({
      apiKey,
      model,
      system: PREVIEW_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: MAX_TOKENS_PREVIEW,
    });
  }
  onProgress?.('Wrapping preview…');
  const html = fullText.trim();
  if (!html) {
    return wrapPreviewHtml('<p style="padding:16px;color:#888;">Preview could not be generated (empty response).</p>');
  }
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
  onChunk?: (text: string) => void;
}): Promise<ChatMessage> {
  const { apiKey, message, project, history, onChunk } = params;
  const projectSummary = `Project: ${project.name}\nDescription: ${project.description}\nFiles: ${Object.keys(project.files).join(', ')}`;
  const system = `You are FlutterForge AI. The user is working on a Flutter project. Answer questions about the project and suggest code when relevant.\n\n${projectSummary}`;

  const messages: { role: string; content: string }[] = [
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const content = await streamCompletion({
    apiKey,
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
