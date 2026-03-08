/**
 * Visitor badge API: increments count via CountAPI, then redirects to a dynamic
 * shields.io badge that shows the current value. Use this URL as the src of an
 * <img> in the README or in-app (each load = one count).
 *
 * CountAPI: https://countapi.xyz/  (namespace/key = alexbieber/ambar-ai)
 */
const COUNTAPI_NAMESPACE = 'alexbieber';
const COUNTAPI_KEY = 'ambar-ai';
const COUNTAPI_HIT = `https://api.countapi.xyz/hit/${COUNTAPI_NAMESPACE}/${COUNTAPI_KEY}`;
const COUNTAPI_GET = `https://api.countapi.xyz/get/${COUNTAPI_NAMESPACE}/${COUNTAPI_KEY}`;

const SHIELDS_BADGE = [
  'https://img.shields.io/badge/dynamic/json',
  `?url=${encodeURIComponent(COUNTAPI_GET)}`,
  '&label=Visitors',
  '&query=value',
  '&color=6366f1',
].join('');

export default async function handler(_req: unknown, res: { redirect: (code: number, url: string) => void }): Promise<void> {
  try {
    await fetch(COUNTAPI_HIT, { cache: 'no-store' });
  } catch {
    // CountAPI down or blocked: redirect to static badge so the image still loads
  }
  res.redirect(302, SHIELDS_BADGE);
}
