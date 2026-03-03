import React from 'react'
import { Smartphone, Loader2 } from 'lucide-react'

interface MobilePhonePreviewProps {
  preview?: string
  isLoading?: boolean
  loadingMessage?: string
  device?: 'iphone-16-pro' | 'iphone-15' | 'android'
  className?: string
}

const MobilePhonePreview: React.FC<MobilePhonePreviewProps> = ({
  preview,
  isLoading = false,
  loadingMessage = 'Generating preview...',
  device = 'iphone-16-pro',
  className = ''
}) => {
  const renderDevice = () => {
    switch (device) {
      case 'iphone-16-pro':
        return (
          <div className={`w-[393px] h-[852px] bg-gradient-to-br from-obsidian-700 via-obsidian-800 to-obsidian-700 rounded-[3.5rem] p-[6px] shadow-2xl border-[3px] border-obsidian-500/50 relative ${preview ? 'animate-glow' : ''} ${className}`}>
            {/* Titanium Frame Effect */}
            <div className="absolute inset-0 rounded-[3.5rem] bg-gradient-to-br from-white/5 via-transparent to-white/5 pointer-events-none" />
            
            {/* Dynamic Island - iPhone 16 Pro */}
            <div className="absolute top-[12px] left-1/2 -translate-x-1/2 w-[126px] h-[37px] bg-obsidian-900 rounded-full z-20 flex items-center justify-center">
              <div className="w-[106px] h-[30px] bg-obsidian-800 rounded-full flex items-center justify-center gap-2 px-3">
                <div className="w-1.5 h-1.5 bg-obsidian-500 rounded-full" />
                <div className="flex-1 h-2 bg-obsidian-700 rounded-full" />
                <div className="w-1.5 h-1.5 bg-obsidian-500 rounded-full" />
              </div>
            </div>
            
            {/* Screen */}
            <div className="w-full h-full bg-obsidian-900 rounded-[3rem] overflow-hidden relative">
              {/* Status Bar Area */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-obsidian-900/80 to-transparent z-10 pointer-events-none" />
              
              {preview ? (
                <iframe
                  srcDoc={preview}
                  className="w-full h-full border-0 rounded-[3rem]"
                  sandbox="allow-scripts allow-same-origin"
                  title="App Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isLoading ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-obsidian-400 text-sm">{loadingMessage}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 text-obsidian-600 mx-auto mb-3" />
                      <p className="text-obsidian-400 text-sm">Preview will appear here</p>
                      <p className="text-obsidian-500 text-xs mt-1">Generate an app to see the preview</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Bottom Safe Area Indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-obsidian-900/80 to-transparent z-10 pointer-events-none" />
            </div>
            
            {/* Home Indicator - iPhone 16 Pro */}
            <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 w-[134px] h-[5px] bg-obsidian-400/60 rounded-full backdrop-blur-sm" />
            
            {/* Camera Bump Shadow */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-2 bg-obsidian-900/50 rounded-full blur-sm" />
          </div>
        )
      
      case 'iphone-15':
        return (
          <div className={`w-[393px] h-[852px] bg-gradient-to-br from-obsidian-700 via-obsidian-800 to-obsidian-700 rounded-[3rem] p-2 shadow-2xl border-4 border-obsidian-600 relative ${preview ? 'animate-glow' : ''} ${className}`}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-obsidian-900 rounded-b-2xl z-10 flex items-center justify-center gap-1">
              <div className="w-1 h-1 bg-obsidian-600 rounded-full" />
              <div className="w-12 h-5 bg-obsidian-700 rounded-full" />
            </div>
            
            {/* Screen */}
            <div className="w-full h-full bg-obsidian-900 rounded-[2.5rem] overflow-hidden relative">
              {preview ? (
                <iframe
                  srcDoc={preview}
                  className="w-full h-full border-0 rounded-[2.5rem]"
                  sandbox="allow-scripts allow-same-origin"
                  title="App Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isLoading ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-obsidian-400 text-sm">{loadingMessage}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 text-obsidian-600 mx-auto mb-3" />
                      <p className="text-obsidian-400 text-sm">Preview will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Home Indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-obsidian-600 rounded-full" />
          </div>
        )
      
      case 'android':
        return (
          <div className={`w-[360px] h-[800px] bg-gradient-to-br from-obsidian-700 via-obsidian-800 to-obsidian-700 rounded-[2rem] p-2 shadow-2xl border-2 border-obsidian-600 relative ${preview ? 'animate-glow' : ''} ${className}`}>
            {/* Screen */}
            <div className="w-full h-full bg-obsidian-900 rounded-[1.5rem] overflow-hidden relative">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-obsidian-900/90 z-10 flex items-center justify-between px-4 text-xs text-obsidian-300">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 border border-obsidian-400 rounded-sm">
                    <div className="w-full h-full bg-obsidian-400 rounded-sm" style={{ width: '75%' }} />
                  </div>
                </div>
              </div>
              
              {preview ? (
                <iframe
                  srcDoc={preview}
                  className="w-full h-full border-0 rounded-[1.5rem]"
                  sandbox="allow-scripts allow-same-origin"
                  title="App Preview"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center pt-8">
                  {isLoading ? (
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-obsidian-400 text-sm">{loadingMessage}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Smartphone className="w-12 h-12 text-obsidian-600 mx-auto mb-3" />
                      <p className="text-obsidian-400 text-sm">Preview will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const getDeviceLabel = () => {
    switch (device) {
      case 'iphone-16-pro':
        return 'iPhone 16 Pro'
      case 'iphone-15':
        return 'iPhone 15'
      case 'android':
        return 'Android'
      default:
        return ''
    }
  }

  return (
    <div className="relative">
      {renderDevice()}
      {/* Device Label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-obsidian-400 font-mono">
        {getDeviceLabel()}
      </div>
    </div>
  )
}

export default MobilePhonePreview
