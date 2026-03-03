import React, { useState, useRef } from 'react'
import { Copy, Search, Download, FileCode, X } from 'lucide-react'

interface CodeEditorProps {
  code: string
  onCopy: (code: string) => void
  fileName?: string
  lineNumbers?: boolean
}

const CodeEditor: React.FC<CodeEditorProps> = ({ code, onCopy, fileName = 'main.dart', lineNumbers = true }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const editorRef = useRef<HTMLDivElement>(null)

  const safeCode = typeof code === 'string' ? code : ''

  const escapeHtml = (text: string): string =>
    String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const highlightDart = (line: string): string => {
    const escaped = escapeHtml(line)
    return escaped
      .replace(/(import\s+[\w\s.]+;)/g, '<span class="text-cyan-400">$1</span>')
      .replace(/(class\s+\w+)/g, '<span class="text-violet-400">$1</span>')
      .replace(/(\w+)\s*\(/g, '<span class="text-cyan-300">$1</span>(')
      .replace(/(return\s+)/g, '<span class="text-violet-300">$1</span>')
      .replace(/(@override)/g, '<span class="text-obsidian-300">$1</span>')
      .replace(/(Widget\s+\w+)/g, '<span class="text-violet-400">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="text-obsidian-400">$1</span>')
      .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-obsidian-400">$1</span>')
      .replace(/(['"])(?:(?=(\\?))\2.)*?\1/g, '<span class="text-green-400">$&</span>')
      .replace(/\b(const|final|var|late)\b/g, '<span class="text-violet-300">$1</span>')
      .replace(/\b(if|else|for|while|switch|case|break|continue|return)\b/g, '<span class="text-pink-400">$1</span>')
  }

  const safeFileName = typeof fileName === 'string' ? fileName : 'main.dart'

  const isDart = safeFileName.endsWith('.dart')
  const isYaml = safeFileName.endsWith('.yaml') || safeFileName.endsWith('.yml')
  const highlightLine = (line: string): string => {
    if (isDart) return highlightDart(line)
    if (isYaml) {
      const escaped = escapeHtml(line)
      return escaped
        .replace(/^(\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/, '$1<span class="text-cyan-400">$2</span>:')
        .replace(/(#.*)$/, '<span class="text-obsidian-400">$1</span>')
    }
    return escapeHtml(line || ' ')
  }
  const lines = safeCode.split('\n')
  const codeWithLineNumbers = lines.map((line, idx) => {
    const lineNum = (idx + 1).toString().padStart(3, '0')
    const content = highlightLine(line)
    return { num: lineNum, content, original: line }
  })

  const handleExport = () => {
    const blob = new Blob([safeCode], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = safeFileName || 'file.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-obsidian-900">
      {/* Editor Toolbar */}
      <div className="h-10 border-b border-obsidian-700/30 bg-obsidian-800/40 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <FileCode className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-obsidian-300 font-mono truncate max-w-[200px]" title={safeFileName}>{safeFileName}</span>
          <span className="text-xs text-obsidian-500">({lines.length} lines)</span>
        </div>
        
        <div className="flex items-center gap-2">
          {showSearch && (
            <div className="flex items-center gap-2 px-2 py-1 bg-obsidian-700/50 rounded border border-obsidian-600/30">
              <Search className="w-3 h-3 text-obsidian-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-xs text-obsidian-200 w-32"
                autoFocus
              />
              <button
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="text-obsidian-400 hover:text-obsidian-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-1.5 hover:bg-obsidian-700/30 rounded transition-colors"
            title="Search (⌘F)"
          >
            <Search className="w-4 h-4 text-obsidian-400" />
          </button>
          
          <button
            onClick={handleExport}
            className="p-1.5 hover:bg-obsidian-700/30 rounded transition-colors"
            title="Export file"
          >
            <Download className="w-4 h-4 text-obsidian-400" />
          </button>
          
          <button
            onClick={() => onCopy(safeCode)}
            className="px-3 py-1.5 text-xs bg-obsidian-700/50 hover:bg-obsidian-700 border border-obsidian-600/30 rounded text-obsidian-300 hover:text-obsidian-100 transition-all flex items-center gap-1.5"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex-1 overflow-auto scrollbar-thin" ref={editorRef}>
        <div className="flex">
          {lineNumbers && (
            <div className="w-16 shrink-0 bg-obsidian-800/30 border-r border-obsidian-700/30 py-4 text-right select-none">
              {codeWithLineNumbers.map((line, idx) => (
                <div
                  key={idx}
                  className="text-xs text-obsidian-500 font-mono leading-relaxed px-2 hover:bg-obsidian-700/20"
                >
                  {line.num}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex-1 py-4 px-4">
            <pre className="text-sm leading-relaxed font-mono">
              <code>
                {codeWithLineNumbers.map((line, idx) => (
                  <div
                    key={idx}
                    className={`hover:bg-obsidian-800/30 px-2 py-0.5 rounded ${
                      searchQuery && line.original.toLowerCase().includes(searchQuery.toLowerCase())
                        ? 'bg-yellow-500/10 border-l-2 border-yellow-400'
                        : ''
                    }`}
                    dangerouslySetInnerHTML={{ __html: line.content || '&nbsp;' }}
                  />
                ))}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CodeEditor
