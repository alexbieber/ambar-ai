// ── AI Providers ──────────────────────────────────────────────
export type ProviderId = 'claude' | 'gemini';

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  models: ModelOption[];
  defaultModel: string;
  color: string;
  icon: string;
}

export interface ModelOption {
  id: string;
  name: string;
  contextWindow: number;
  recommended?: boolean;
}

export interface ApiKeys {
  claude: string | null;
  gemini: string | null;
}

// ── Agents ────────────────────────────────────────────────────
export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'editing'
  | 'waiting'
  | 'done'
  | 'error'
  | 'paused';

export interface Agent {
  id: string;
  name: string;
  colorIndex: number;
  provider: ProviderId;
  model: string;
  status: AgentStatus;
  currentTask: string | null;
  lockedFiles: string[];
  completedTasks: number;
  createdAt: number;
  lastActiveAt: number;
  systemPromptOverride?: string;
  specialty?: AgentSpecialty;
}

export type AgentSpecialty =
  | 'architect'
  | 'ui'
  | 'logic'
  | 'refactor'
  | 'debugger'
  | 'general';

// ── Change Queue ──────────────────────────────────────────────
export type ChangeStatus =
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type ChangePriority = 'low' | 'normal' | 'high' | 'critical';

export interface ChangeRequest {
  id: string;
  instruction: string;
  targetFiles: string[];
  priority: ChangePriority;
  status: ChangeStatus;
  assignedAgentId: string | null;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
  resultSummary: string | null;
}

// ── Change History (diffs) ─────────────────────────────────────
export interface FileDiff {
  path: string;
  before: string;
  after: string;
  linesAdded: number;
  linesRemoved: number;
}

export interface ChangeRecord {
  id: string;
  changeRequestId: string;
  agentId: string;
  agentName: string;
  provider: ProviderId;
  model: string;
  instruction: string;
  diffs: FileDiff[];
  timestamp: number;
  duration: number;
  tokensUsed?: number;
}

// ── Activity Feed ──────────────────────────────────────────────
export type ActivityEventType =
  | 'agent_started'
  | 'agent_thinking'
  | 'agent_locked_file'
  | 'agent_editing_file'
  | 'agent_unlocked_file'
  | 'agent_completed'
  | 'agent_error'
  | 'conflict_detected'
  | 'conflict_resolved'
  | 'change_queued'
  | 'change_assigned'
  | 'change_completed';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  agentId?: string;
  agentName?: string;
  agentColor?: string;
  message: string;
  detail?: string;
  filePaths?: string[];
  timestamp: number;
}

// ── Project & Files ────────────────────────────────────────────
export interface ProjectFile {
  path: string;
  content: string;
  language: string;
  isDirty: boolean;
  lastModified: number;
  lockedByAgentId: string | null;
  lastEditedByAgentId: string | null;
  lastEditedByProvider: ProviderId | null;
}

export type PreviewSource = 'description' | 'code' | 'one_call';

export interface Project {
  id: string;
  name: string;
  description: string;
  files: Record<string, ProjectFile>;
  createdAt: number;
  previewHtml: string;
  /** Whether preview was generated from app description or from current code */
  previewSource?: PreviewSource;
  generatedByProvider: ProviderId;
  /** Plan/spec generated before code (plan-then-build flow); shown in Plan tab */
  planMarkdown?: string;
}

// ── File Tree ──────────────────────────────────────────────────
export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  language?: string;
  isLocked?: boolean;
  lockedByColor?: string;
}

// ── Notifications ──────────────────────────────────────────────
export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'agent';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  timestamp: number;
  detail?: string;
  agentColor?: string;
  duration?: number;
}

// ── General ───────────────────────────────────────────────────
export type PanelId = 'sidebar' | 'explorer' | 'editor' | 'preview' | 'agents';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: ProviderId;
  timestamp: number;
  filesChanged?: string[];
}

export interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  agentId?: string;
  detail?: string;
}
