import type { ProjectFile, FileNode } from '../types';
import { SUPPORTED_LANGUAGES } from '../utils/constants';

/**
 * Extracts XML from response: strip markdown fences and leading/trailing text.
 */
function extractProjectXML(raw: string): string {
  let s = raw.trim();
  // Strip markdown code fences: ```xml\n... or ```\n... (allow optional newline after ```)
  if (s.includes('```')) {
    const open = s.indexOf('```');
    const afterOpen = s.slice(open + 3).replace(/^(?:xml)?\s*\n?/i, '');
    const close = afterOpen.indexOf('```');
    if (close !== -1) {
      s = afterOpen.slice(0, close).trim();
    } else {
      s = afterOpen.trim();
    }
  }
  // Start from first <project> or <file (allow <file path= with possible newlines)
  const projectStart = s.indexOf('<project>');
  const fileStart = s.indexOf('<file');
  const start =
    projectStart === -1 && fileStart === -1
      ? 0
      : Math.min(
          projectStart === -1 ? s.length : projectStart,
          fileStart === -1 ? s.length : fileStart
        );
  if (start < s.length) s = s.slice(start);
  // End at last </project> if present
  const projectEnd = s.lastIndexOf('</project>');
  if (projectEnd !== -1) s = s.slice(0, projectEnd + '</project>'.length);
  return s;
}

/**
 * Parses <project><file path="...">content</file></project> XML.
 * Tolerates markdown fences, extra text, single/double quotes, newlines in tags.
 * Returns empty object if no valid files; never throws.
 */
export function parseProjectXML(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const xml = extractProjectXML(raw);
    const closeTag = '</file>';
    // Match <file ... path="..." ...> or path='...' (path/filename/name attribute, case-insensitive)
    const pathRegex =
      /<file[\s\S]*?(?:path|filename|name)\s*=\s*["']([^"']+)["'][\s\S]*?>/gi;
    const extractContent = (text: string, match: RegExpExecArray): void => {
      const path = match[1].trim();
      const start = match.index + match[0].length;
      const end = text.indexOf(closeTag, start);
      if (end === -1) return;
      let content = text.slice(start, end).replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
      content = content
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      const normalized = path.endsWith('.dart') && !path.startsWith('lib/') ? 'lib/' + path : path;
      out[normalized] = content;
    };
    let match: RegExpExecArray | null;
    while ((match = pathRegex.exec(xml)) !== null) extractContent(xml, match);
    // If nothing found, try raw string (in case extraction removed needed content)
    if (Object.keys(out).length === 0 && raw !== xml) {
      const pathRegex2 =
        /<file[\s\S]*?(?:path|filename|name)\s*=\s*["']([^"']+)["'][\s\S]*?>/gi;
      let m: RegExpExecArray | null;
      while ((m = pathRegex2.exec(raw)) !== null) extractContent(raw, m);
    }

    // Fallback: parse markdown-style code blocks (```dart, ```yaml) with path in preceding lines
    if (Object.keys(out).length === 0) {
      const fromMarkdown = parseMarkdownCodeBlocks(raw);
      for (const [p, c] of Object.entries(fromMarkdown)) {
        out[p] = c;
      }
    }

    // Last resort: response contains Dart code but no structure we recognized — extract as lib/main.dart + minimal pubspec
    if (Object.keys(out).length === 0) {
      const extracted = extractDartFromRaw(raw);
      if (extracted.dartContent) {
        out['lib/main.dart'] = extracted.dartContent;
        out['pubspec.yaml'] =
          extracted.pubspecContent ||
          `name: app\nenvironment:\n  sdk: ">=3.0.0 <4.0.0"\ndependencies:\n  flutter:\n    sdk: flutter\n`;
      }
    }

    if (Object.keys(out).length === 0) {
      const preview = raw.length > 1800 ? raw.slice(0, 1800) + '…' : raw;
      console.warn(
        '[FlutterForge] No project files parsed. Raw response length:',
        raw.length,
        '\nPreview (first ~1800 chars):',
        preview
      );
    }
  } catch {
    // no-op
  }
  return out;
}

/** Returns a short preview of the raw response for inclusion in parse-failure errors. */
export function getParseFailurePreview(raw: string, maxChars = 800): string {
  if (!raw || typeof raw !== 'string') return '(empty or invalid response)';
  const trimmed = raw.trim();
  if (trimmed.length === 0) return '(empty response)';
  return trimmed.length > maxChars ? trimmed.slice(0, maxChars) + '…' : trimmed;
}

/** Path-like line: contains .dart, .yaml, or lib/ or pubspec */
function looksLikePath(line: string): boolean {
  const t = line.trim();
  return (
    t.endsWith('.dart') ||
    t.endsWith('.yaml') ||
    t.includes('lib/') ||
    t === 'pubspec.yaml' ||
    /^[\w\/.-]+\.(dart|yaml|yml)$/.test(t)
  );
}

/** Extract path from a line that might be "## lib/main.dart" or "File: lib/main.dart" or "lib/main.dart" */
function extractPathFromLine(line: string): string | null {
  const t = line.trim();
  // Strip markdown: ## path, ### path, **path**, *path*
  let s = t.replace(/^#+\s*/, '').replace(/\*+/g, '').replace(/^\[.*?\]\s*\(.*?\)/, '').trim();
  // "File: lib/main.dart" or "path: lib/main.dart"
  const fileMatch = s.match(/(?:file|path):\s*([^\s]+)/i);
  if (fileMatch) return fileMatch[1].trim();
  // Plain path
  if (looksLikePath(s)) return s;
  // Try to find path substring (e.g. "Here is lib/main.dart:")
  const pathInLine = s.match(/(?:^|\s)(lib\/[^\s]+\.dart|pubspec\.yaml|[\w/-]+\.(dart|yaml|yml))(?:$|\s)/);
  if (pathInLine) return pathInLine[1].trim();
  return null;
}

/** Check if content looks like Dart (Flutter) code — main entry or widget tree */
function looksLikeDart(s: string): boolean {
  const t = s.trim();
  if (!t.includes('package:flutter') && !t.includes("package:flutter")) return false;
  return (
    t.includes('void main') ||
    t.includes('runApp') ||
    t.includes('MaterialApp') ||
    t.includes('StatelessWidget') ||
    t.includes('StatefulWidget') ||
    t.includes('extends State') ||
    /\bclass\s+\w+\s+extends\s+/.test(t)
  );
}

/** Check if content looks like pubspec YAML */
function looksLikePubspec(s: string): boolean {
  const t = s.trim();
  return t.includes('dependencies:') && (t.includes('flutter:') || t.includes('sdk:'));
}

/**
 * Last resort: find Dart code anywhere in the response (inside ``` or from import flutter to end).
 */
function extractDartFromRaw(raw: string): { dartContent: string; pubspecContent: string | null } {
  let dartContent = '';
  let pubspecContent: string | null = null;

  // 1) Any ``` block that looks like Dart
  const blockRegex = /```(\w*)\s*[\r\n]*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  while ((match = blockRegex.exec(raw)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const content = match[2].trim();
    const minLen = lang === 'dart' || lang === 'yaml' || lang === 'yml' ? 50 : 100;
    if (content.length < minLen) continue;
    if (lang === 'yaml' || lang === 'yml' || looksLikePubspec(content)) {
      if (!pubspecContent) pubspecContent = content;
    } else if ((lang === 'dart' || looksLikeDart(content)) && !dartContent) {
      dartContent = content;
    }
  }

  // 2) No block found: look for import 'package:flutter' and take from there (accept even if truncated)
  if (!dartContent && raw.length > 200) {
    const flutterStart = raw.search(/import\s+['"]package:flutter/);
    if (flutterStart !== -1) {
      const slice = raw.slice(flutterStart, flutterStart + 50000).trim();
      if (slice.length > 200 && slice.includes('package:flutter')) {
        dartContent = slice;
        const lastComplete = dartContent.lastIndexOf('\n\n');
        if (lastComplete > 1000) dartContent = dartContent.slice(0, lastComplete + 1).trim();
      }
    }
  }

  return { dartContent, pubspecContent };
}

/**
 * Fallback: find ```lang blocks and use preceding line(s) as file path when they look like paths.
 */
function parseMarkdownCodeBlocks(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  const blockRegex = /```(\w*)\s*[\r\n]*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;
  let dartIndex = 0;
  while ((match = blockRegex.exec(raw)) !== null) {
    const lang = (match[1] || '').toLowerCase();
    const content = match[2].trim();
    const blockStart = match.index;
    const beforeBlock = raw.slice(Math.max(0, blockStart - 500), blockStart);
    const lines = beforeBlock.split(/\n/).filter(Boolean);
    let path: string | null = null;
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4); i--) {
      path = extractPathFromLine(lines[i]);
      if (path) break;
    }
    if (!path && content.length > 20) {
      if (lang === 'yaml' || lang === 'yml' || looksLikePubspec(content)) path = 'pubspec.yaml';
      else if (lang === 'dart' || looksLikeDart(content)) {
        dartIndex += 1;
        path = dartIndex === 1 ? 'lib/main.dart' : `lib/file_${dartIndex}.dart`;
      }
    }
    if (path && content) {
      path = path.replace(/^\.\//, '');
      if (!path.startsWith('lib/') && path.endsWith('.dart')) path = 'lib/' + path;
      if (out[path]) path = path.replace(/\.(dart|yaml)$/, `_${Object.keys(out).length}.$1`);
      out[path] = content;
    }
  }
  return out;
}

export function inferLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return SUPPORTED_LANGUAGES[ext] ?? 'plaintext';
}

/**
 * Builds nested FileNode tree from flat files record.
 */
export function buildFileTree(files: Record<string, ProjectFile>): FileNode[] {
  const folderMap = new Map<string, FileNode>();
  const rootFiles: FileNode[] = [];

  const getOrCreateFolder = (path: string): FileNode => {
    if (folderMap.has(path)) return folderMap.get(path)!;
    const name = path.split('/').pop() || path;
    const node: FileNode = { name, path, type: 'folder', children: [] };
    folderMap.set(path, node);
    const parts = path.split('/').filter(Boolean);
    if (parts.length > 1) {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = getOrCreateFolder(parentPath);
      parent.children!.push(node);
    } else {
      rootFiles.push(node);
    }
    return node;
  };

  const paths = Object.keys(files).sort();
  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    const name = parts[parts.length - 1];
    const file = files[path];
    const fileNode: FileNode = {
      name,
      path,
      type: 'file',
      language: file.language,
    };

    if (parts.length <= 1) {
      rootFiles.push(fileNode);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = getOrCreateFolder(parentPath);
      parent.children!.push(fileNode);
    }
  }

  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
    nodes.forEach((n) => n.children && sortNodes(n.children));
  };
  sortNodes(rootFiles);

  return rootFiles;
}
