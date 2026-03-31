import type { ProjectFile } from '../types';

const API_BASE = 'http://localhost:3001';

export async function startFlutterRuntimePreview(files: Record<string, ProjectFile>): Promise<string> {
  const raw: Record<string, string> = {};
  for (const [p, file] of Object.entries(files)) {
    raw[p] = file.content;
  }

  const res = await fetch(`${API_BASE}/flutter-preview/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: raw }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || 'Failed to start Flutter runtime preview');
  }
  if (!data?.url) throw new Error('Flutter preview URL not returned');
  return data.url as string;
}
