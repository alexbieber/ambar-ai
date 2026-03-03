import React from 'react'
import { User, Sparkles } from 'lucide-react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp?: number
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
  return (
    <div className={`flex gap-3 ${role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
      {role === 'assistant' && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-cyan-400" />
        </div>
      )}
      
      <div className={`max-w-[80%] ${role === 'user' ? 'order-2' : ''}`}>
        <div className={`rounded-lg px-4 py-3 ${
          role === 'user' 
            ? 'bg-obsidian-700/50 text-obsidian-100 border border-obsidian-600/30' 
            : 'bg-obsidian-800/50 text-obsidian-200 border border-obsidian-700/30'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        {timestamp && (
          <span className="text-xs text-obsidian-500 mt-1 block">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>
      
      {role === 'user' && (
        <div className="w-8 h-8 rounded-lg bg-obsidian-700/50 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-obsidian-300" />
        </div>
      )}
    </div>
  )
}

export default ChatMessage
