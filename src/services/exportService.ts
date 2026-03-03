import type { Project, ProjectFile } from '../types';
import { zipSync } from 'fflate';

/** Reject path traversal; only allow safe relative paths in ZIP. */
function safeZipPath(path: string): string | null {
  const p = path.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (p.includes('..') || p.startsWith('/') || p.includes('\0')) return null;
  return p || null;
}

export async function exportAsZip(project: Project): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  const encoder = new TextEncoder();

  for (const [path, file] of Object.entries(project.files)) {
    const safe = safeZipPath(path);
    if (safe) files[safe] = encoder.encode(file.content);
  }

  const readme = generateReadme(project);
  files['README.md'] = encoder.encode(readme);

  const zipped = zipSync(files, { level: 6 });
  const copy = new Uint8Array(zipped.length);
  copy.set(zipped);
  return new Blob([copy], { type: 'application/zip' });
}

export function exportFileAsText(file: ProjectFile): void {
  const name = file.path.split('/').pop() || 'file.txt';
  const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export function copyProjectSummary(project: Project): string {
  const fileList = Object.keys(project.files).join('\n');
  return `# ${project.name}\n\nGenerated with FlutterForge AI\n\n## Files\n\n${fileList}\n\n## Setup\n\n1. flutter create my_app\n2. Replace lib/ and pubspec.yaml with generated files\n3. flutter run`;
}

export function generateReadme(project: Project): string {
  const fileList = Object.keys(project.files)
    .sort()
    .map((p) => `- ${p}`)
    .join('\n');
  const deps = project.files['pubspec.yaml']?.content?.match(/dependencies:[\s\S]*?(?=\n\w|$)/)?.[0] ?? 'See pubspec.yaml';
  return `# ${project.name}\n\n${project.description}\n\n## Getting started\n\n1. \`flutter create my_app\`\n2. Replace \`lib/\` and \`pubspec.yaml\` with the generated files\n3. \`cd my_app && flutter run\`\n\n## File structure\n\n${fileList}\n\n## Dependencies\n\n\`\`\`yaml\n${deps}\n\`\`\`\n\n---\nGenerated with [FlutterForge IDE](https://github.com/flutterforge)`;
}
