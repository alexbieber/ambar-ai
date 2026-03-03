/** File extension → { icon character, color class or hex } */
export const FILE_ICONS: Record<string, { icon: string; color: string }> = {
  dart: { icon: '◆', color: '#00f0ff' },
  yaml: { icon: '⚙', color: '#eab308' },
  yml: { icon: '⚙', color: '#eab308' },
  json: { icon: '{}', color: '#f97316' },
  md: { icon: '📄', color: '#4a4a72' },
  gradle: { icon: '🐘', color: '#22c55e' },
  xml: { icon: '</>', color: '#ec4899' },
  txt: { icon: '📄', color: '#4a4a72' },
};

export function getFileIcon(path: string): { icon: string; color: string } {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return FILE_ICONS[ext] ?? { icon: '•', color: '#4a4a72' };
}
