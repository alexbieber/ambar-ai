/**
 * Tool schemas for future agentic flows (read_file, edit_file, list_dir, etc.).
 * Typed for IDE support and optional JSON export to backends.
 */

export interface ToolParam {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  enum?: string[];
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParam[];
}

/** FlutterForge-relevant tools (project-scoped file and discovery). */
export const FLUTTERFORGE_TOOLS: ToolDefinition[] = [
  {
    name: 'read_file',
    description: 'Read the full content of a project file by path. Use when you need to see current implementation.',
    parameters: [
      { name: 'path', type: 'string', description: 'Project-relative path, e.g. lib/main.dart', required: true },
    ],
  },
  {
    name: 'edit_file',
    description: 'Replace content of a project file. Use for targeted edits; preserve style and imports.',
    parameters: [
      { name: 'path', type: 'string', description: 'Project-relative path', required: true },
      { name: 'old_string', type: 'string', description: 'Exact substring to replace (unique in file)' },
      { name: 'new_string', type: 'string', description: 'Replacement content' },
    ],
  },
  {
    name: 'list_dir',
    description: 'List files and folders at a project path. Use to discover structure before reading or editing.',
    parameters: [
      { name: 'path', type: 'string', description: 'Project-relative directory path, e.g. lib/screens', required: true },
    ],
  },
  {
    name: 'grep_search',
    description: 'Search for a regex pattern in project files. Use to find usages or definitions.',
    parameters: [
      { name: 'pattern', type: 'string', description: 'Regex pattern (escape special chars)' },
      { name: 'path', type: 'string', description: 'Directory or file to search' },
      { name: 'type', type: 'string', description: 'File type filter, e.g. dart' },
    ],
  },
];

/** Export as JSON-serializable for API/backend if needed. */
export function getToolsAsJson(): Record<string, unknown>[] {
  return FLUTTERFORGE_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: {
      type: 'object',
      properties: Object.fromEntries(
        t.parameters.map((p) => [
          p.name,
          {
            type: p.type,
            description: p.description,
            ...(p.enum && { enum: p.enum }),
          },
        ])
      ),
      required: t.parameters.filter((p) => p.required).map((p) => p.name),
    },
  }));
}
