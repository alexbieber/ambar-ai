import React from 'react'
import { History, Sparkles, Settings, FileCode } from 'lucide-react'

interface SidebarProps {
  buildHistory: Array<{
    id: string
    prompt: string
    code: string
    preview: string
    timestamp: number
  }>
  onLoadHistory: (build: any) => void
  onNewChat: () => void
  activeView: 'chat' | 'history' | 'examples'
  onViewChange: (view: 'chat' | 'history' | 'examples') => void
}

const Sidebar: React.FC<SidebarProps> = ({
  buildHistory,
  onLoadHistory,
  onNewChat,
  activeView,
  onViewChange
}) => {
  return (
    <div className="w-64 bg-obsidian-800/40 border-r border-obsidian-700/50 h-full flex flex-col">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-obsidian-700/50">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          New Chat
        </button>
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-obsidian-700/50">
        <nav className="space-y-1">
          <button
            onClick={() => onViewChange('chat')}
            className={`w-full px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
              activeView === 'chat'
                ? 'bg-obsidian-700/50 text-cyan-400'
                : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/30'
            }`}
          >
            <FileCode className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => onViewChange('history')}
            className={`w-full px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
              activeView === 'history'
                ? 'bg-obsidian-700/50 text-cyan-400'
                : 'text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/30'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {activeView === 'history' && (
          <div className="space-y-2">
            {buildHistory.length === 0 ? (
              <div className="text-center py-8 text-obsidian-500 text-sm">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No history yet</p>
              </div>
            ) : (
              buildHistory.map((build) => (
                <button
                  key={build.id}
                  onClick={() => onLoadHistory(build)}
                  className="w-full text-left p-3 rounded-lg bg-obsidian-700/30 hover:bg-obsidian-700/50 border border-obsidian-600/30 hover:border-cyan-400/30 transition-all group"
                >
                  <p className="text-xs text-obsidian-400 mb-1">
                    {new Date(build.timestamp).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-obsidian-200 line-clamp-2 group-hover:text-obsidian-100">
                    {build.prompt}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-obsidian-700/50">
        <button className="w-full px-3 py-2 rounded-lg text-sm text-obsidian-400 hover:text-obsidian-200 hover:bg-obsidian-700/30 transition-all flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>
    </div>
  )
}

export default Sidebar
