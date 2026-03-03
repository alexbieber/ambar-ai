import React, { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, CheckCircle, X, Info } from 'lucide-react'

interface ApiKeyInfo {
  key: string
  name: string
  provider: 'anthropic' | 'gemini'
}

interface ApiKeySettingsProps {
  apiKey: string
  apiKeyInfo: ApiKeyInfo | null
  isConnected: boolean
  onConnect: (info: ApiKeyInfo) => void
  onDisconnect: () => void
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  apiKey,
  apiKeyInfo,
  isConnected,
  onConnect,
  onDisconnect
}) => {
  const [showApiKey, setShowApiKey] = useState(false)
  const [tempKey, setTempKey] = useState(apiKey)
  const [tempProvider, setTempProvider] = useState<'anthropic' | 'gemini'>(apiKeyInfo?.provider || 'anthropic')
  const [showDetails, setShowDetails] = useState(false)

  // When disconnected, clear/sync temp state so the form doesn't show the previous key
  useEffect(() => {
    if (!isConnected) {
      setTempKey(apiKey)
      setTempProvider(apiKeyInfo?.provider || 'anthropic')
    }
  }, [isConnected, apiKey, apiKeyInfo?.provider])

  const handleConnect = () => {
    if (!tempKey.trim()) return

    const info: ApiKeyInfo = {
      key: tempKey.trim(),
      name: tempProvider === 'gemini' ? 'Gemini API Key' : 'Anthropic API Key',
      provider: tempProvider
    }

    onConnect(info)
  }

  const detectProvider = (key: string): 'anthropic' | 'gemini' => {
    if (key.startsWith('sk-ant-')) return 'anthropic'
    if (key.startsWith('AIza')) return 'gemini'
    return 'anthropic' // default
  }

  const handleKeyChange = (key: string) => {
    setTempKey(key)
    const detected = detectProvider(key)
    setTempProvider(detected)
  }

  if (isConnected && apiKeyInfo) {
    return (
      <div className="bg-obsidian-800/50 border-b border-obsidian-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-slow" />
                <span className="text-sm text-green-400 font-medium">Connected</span>
              </div>
              <div className="h-4 w-px bg-obsidian-700" />
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-obsidian-300">
                  {apiKeyInfo.provider === 'gemini' ? 'Google Gemini' : 'Anthropic Claude'}
                </span>
              </div>
              {apiKeyInfo.name && (
                <>
                  <div className="h-4 w-px bg-obsidian-700" />
                  <span className="text-sm text-obsidian-400">{apiKeyInfo.name}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-3 py-1.5 text-xs bg-obsidian-700/30 hover:bg-obsidian-700/50 border border-obsidian-600/30 rounded text-obsidian-300 hover:text-obsidian-100 transition-all flex items-center gap-1.5"
              >
                <Info className="w-3 h-3" />
                Details
              </button>
              <button
                onClick={onDisconnect}
                className="px-3 py-1.5 text-xs bg-obsidian-700/30 hover:bg-red-500/20 border border-obsidian-600/30 hover:border-red-500/30 rounded text-obsidian-300 hover:text-red-400 transition-all flex items-center gap-1.5"
              >
                <X className="w-3 h-3" />
                Disconnect
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="mt-4 p-4 bg-obsidian-700/30 border border-obsidian-600/30 rounded-lg">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-obsidian-400 mb-1 block">API Key</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-obsidian-800/50 border border-obsidian-600/30 rounded text-xs text-obsidian-300 font-mono">
                      {showApiKey ? apiKeyInfo.key : (apiKeyInfo.key.length > 16 ? `${apiKeyInfo.key.substring(0, 12)}...${apiKeyInfo.key.slice(-4)}` : '••••••••••••')}
                    </code>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2 hover:bg-obsidian-700/50 rounded transition-colors"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-obsidian-800/50 border-b border-obsidian-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="space-y-4">
          {/* Provider Selection */}
          <div>
            <label className="text-sm text-obsidian-300 mb-2 block">API Provider</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTempProvider('anthropic')}
                className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
                  tempProvider === 'anthropic'
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400'
                    : 'bg-obsidian-700/30 border-obsidian-600/30 text-obsidian-300 hover:border-obsidian-500/50'
                }`}
              >
                <div className="text-sm font-medium">Anthropic Claude</div>
                <div className="text-xs text-obsidian-400 mt-0.5">sk-ant-...</div>
              </button>
              <button
                onClick={() => setTempProvider('gemini')}
                className={`flex-1 px-4 py-2.5 rounded-lg border transition-all ${
                  tempProvider === 'gemini'
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-400'
                    : 'bg-obsidian-700/30 border-obsidian-600/30 text-obsidian-300 hover:border-obsidian-500/50'
                }`}
              >
                <div className="text-sm font-medium">Google Gemini</div>
                <div className="text-xs text-obsidian-400 mt-0.5">AIza...</div>
              </button>
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="text-sm text-obsidian-300 mb-2 block">API Key</label>
            <div className="flex items-center gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={tempKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={tempProvider === 'gemini' ? 'Enter your Gemini API key (AIza...)' : 'Enter your Anthropic API key (sk-ant-...)'}
                className="flex-1 px-4 py-2.5 bg-obsidian-700/50 border border-obsidian-600/50 rounded-lg text-obsidian-100 placeholder-obsidian-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400/50 transition-all"
              />
              <button
                onClick={() => setShowApiKey(!showApiKey)}
                className="p-2.5 hover:bg-obsidian-700/50 rounded-lg transition-colors"
              >
                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>


          {/* Connect Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleConnect}
              disabled={!tempKey.trim()}
              className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-obsidian-700/30 disabled:text-obsidian-500 text-obsidian-900 font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-cyan-500/25 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Connect
            </button>
            <p className="text-xs text-obsidian-400">
              Get your API key from{' '}
              {tempProvider === 'gemini' ? (
                <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                  Google AI Studio
                </a>
              ) : (
                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline">
                  console.anthropic.com
                </a>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ApiKeySettings
