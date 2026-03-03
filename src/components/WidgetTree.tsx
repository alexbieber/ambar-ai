import React, { useState } from 'react'
import { ChevronRight, ChevronDown, Package, Layers } from 'lucide-react'

interface WidgetNode {
  name: string
  type: string
  children?: WidgetNode[]
}

interface WidgetTreeProps {
  code: string
}

const WidgetTree: React.FC<WidgetTreeProps> = ({ code }) => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']))

  // Parse widget tree from code (simplified)
  const parseWidgetTree = (code: string): WidgetNode[] => {
    const widgets: WidgetNode[] = []
    
    // Extract class names
    const classMatches = code.matchAll(/class\s+(\w+)\s+extends\s+(\w+)/g)
    for (const match of classMatches) {
      widgets.push({
        name: match[1],
        type: match[2],
        children: []
      })
    }
    
    // Extract build methods
    const buildMatches = code.matchAll(/Widget\s+build\([^)]*\)\s*\{([^}]+)\}/gs)
    for (const match of buildMatches) {
      const _buildContent = match[1]
      void _buildContent
    }
    
    if (widgets.length === 0) {
      return [{
        name: 'MyApp',
        type: 'StatelessWidget',
        children: [{
          name: 'MaterialApp',
          type: 'Widget',
          children: [{
            name: 'Scaffold',
            type: 'Widget',
            children: []
          }]
        }]
      }]
    }
    
    return widgets
  }

  const tree = parseWidgetTree(code)

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded)
    if (newExpanded.has(path)) {
      newExpanded.delete(path)
    } else {
      newExpanded.add(path)
    }
    setExpanded(newExpanded)
  }

  const renderNode = (node: WidgetNode, path: string, depth: number = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = expanded.has(path)
    
    return (
      <div key={path} className="select-none">
        <div
          className={`flex items-center gap-1.5 py-1 px-2 hover:bg-obsidian-700/20 rounded cursor-pointer ${
            depth === 0 ? 'font-medium' : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => hasChildren && toggleExpand(path)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-3 h-3 text-obsidian-400" />
            ) : (
              <ChevronRight className="w-3 h-3 text-obsidian-400" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
          
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-obsidian-300">{node.name}</span>
          <span className="text-xs text-obsidian-500">({node.type})</span>
        </div>
        
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child, idx) =>
              renderNode(child, `${path}.${idx}`, depth + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-obsidian-800/30">
      <div className="h-10 border-b border-obsidian-700/30 flex items-center gap-2 px-4 shrink-0">
        <Package className="w-4 h-4 text-cyan-400" />
        <span className="text-sm text-obsidian-300">Widget Tree</span>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {tree.length === 0 ? (
          <div className="text-center py-8 text-obsidian-500 text-sm">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No widgets detected</p>
          </div>
        ) : (
          tree.map((node, idx) => renderNode(node, `root.${idx}`, 0))
        )}
      </div>
    </div>
  )
}

export default WidgetTree
