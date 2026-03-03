/**
 * Sync preview HTML to the server so it can be opened on mobile via GET /preview.
 * Uses relative /preview in dev (Vite proxy to Express); same origin in production.
 */

function getBase(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    return ''; // Vite proxy forwards /preview to server
  }
  return import.meta.env?.VITE_PREVIEW_SERVER_URL ?? '';
}

export async function syncPreviewToServer(html: string): Promise<void> {
  const base = getBase();
  await fetch(`${base}/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
}

export async function getPreviewUrl(): Promise<string> {
  const base = getBase();
  const res = await fetch(`${base}/preview/url`);
  if (!res.ok) throw new Error('Failed to get preview URL');
  const data = await res.json();
  return typeof data?.url === 'string' ? data.url : '';
}
