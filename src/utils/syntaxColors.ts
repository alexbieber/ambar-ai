/** Monaco language ID by file extension (for editor) */
import { SUPPORTED_LANGUAGES } from './constants';

export function getLanguageForPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return SUPPORTED_LANGUAGES[ext] ?? 'plaintext';
}
