// Flutter to HTML/CSS Renderer - Converts parsed Flutter widgets to visual HTML

import { ParsedFlutterApp, FlutterWidget, flutterColorToCSS } from './flutterParser'

export function renderFlutterToHTML(app: ParsedFlutterApp): string {
  const primaryColor = app.theme.primaryColor ? flutterColorToCSS(app.theme.primaryColor) : '#2196F3'
  const backgroundColor = app.theme.backgroundColor ? flutterColorToCSS(app.theme.backgroundColor) : '#FFFFFF'
  const isDark = app.theme.brightness === 'dark' || backgroundColor === '#000000' || backgroundColor.toLowerCase().includes('dark')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${app.appName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: ${backgroundColor};
      color: ${isDark ? '#FFFFFF' : '#000000'};
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    .app-container {
      width: 100%;
      min-height: 100vh;
      background: ${backgroundColor};
      position: relative;
    }
    
    .appbar {
      background: ${primaryColor};
      color: white;
      padding: 12px 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      height: 56px;
    }
    
    .appbar-title {
      font-size: 20px;
      font-weight: 500;
      flex: 1;
    }
    
    .scaffold-body {
      padding: 16px;
      padding-bottom: 80px;
    }
    
    .card {
      background: ${isDark ? '#1E1E1E' : '#FFFFFF'};
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,${isDark ? '0.3' : '0.1'});
      border: 1px solid ${isDark ? '#333' : '#E0E0E0'};
    }
    
    .list-item {
      padding: 16px;
      border-bottom: 1px solid ${isDark ? '#333' : '#E0E0E0'};
      display: flex;
      align-items: center;
      background: ${isDark ? '#1E1E1E' : '#FFFFFF'};
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .text {
      font-size: 16px;
      line-height: 1.5;
      color: ${isDark ? '#FFFFFF' : '#000000'};
      margin: 8px 0;
    }
    
    .text-large {
      font-size: 24px;
      font-weight: 600;
    }
    
    .text-medium {
      font-size: 18px;
      font-weight: 500;
    }
    
    .button {
      background: ${primaryColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s;
      margin: 8px 0;
      width: 100%;
    }
    
    .button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }
    
    .button:active {
      transform: translateY(0);
    }
    
    .fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: ${primaryColor};
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    
    .fab:hover {
      transform: scale(1.1);
    }
    
    .container {
      padding: 16px;
    }
    
    .row {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    
    .column {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .spacer {
      flex: 1;
    }
    
    .icon {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      opacity: 0.7;
    }
    
    .divider {
      height: 1px;
      background: ${isDark ? '#333' : '#E0E0E0'};
      margin: 16px 0;
    }
    
    .chip {
      display: inline-block;
      padding: 6px 12px;
      background: ${primaryColor}20;
      color: ${primaryColor};
      border-radius: 16px;
      font-size: 14px;
      margin: 4px;
    }
    
    .input {
      width: 100%;
      padding: 12px;
      border: 1px solid ${isDark ? '#333' : '#E0E0E0'};
      border-radius: 8px;
      background: ${isDark ? '#1E1E1E' : '#FFFFFF'};
      color: ${isDark ? '#FFFFFF' : '#000000'};
      font-size: 16px;
      margin: 8px 0;
    }
    
    .input:focus {
      outline: none;
      border-color: ${primaryColor};
      box-shadow: 0 0 0 2px ${primaryColor}30;
    }
    
    .checkbox {
      width: 24px;
      height: 24px;
      margin-right: 12px;
      accent-color: ${primaryColor};
    }
    
    .progress {
      width: 100%;
      height: 4px;
      background: ${isDark ? '#333' : '#E0E0E0'};
      border-radius: 2px;
      overflow: hidden;
      margin: 8px 0;
    }
    
    .progress-bar {
      height: 100%;
      background: ${primaryColor};
      transition: width 0.3s;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 16px 0;
    }
    
    @media (max-width: 480px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="app-container">
    ${renderAppBar(app)}
    <div class="scaffold-body">
      ${renderWidgets(app.widgets, isDark, primaryColor)}
    </div>
    ${renderFAB(app.widgets, primaryColor)}
  </div>
</body>
</html>
  `.trim()

  return html
}

function renderAppBar(app: ParsedFlutterApp): string {
  const appBar = app.widgets.find(w => w.type === 'AppBar')
  const title = (appBar?.properties?.title as string) || app.appName || 'App'
  return `
    <div class="appbar">
      <div class="appbar-title">${escapeHtml(String(title))}</div>
    </div>
  `
}

function renderWidgets(widgets: FlutterWidget[], isDark: boolean, primaryColor: string): string {
  const filteredWidgets = widgets.filter(w => w.type !== 'AppBar' && w.type !== 'FloatingActionButton')
  
  if (filteredWidgets.length === 0) {
    // If no widgets, try to show at least something from the app
    return `
      <div class="container">
        <div class="text text-large">Welcome</div>
        <div class="text">Your Flutter app is ready!</div>
        <div class="text">The preview will show your app's UI here.</div>
      </div>
    `
  }

  return filteredWidgets
    .map(w => renderWidget(w, isDark, primaryColor))
    .join('')
}

function renderWidget(widget: FlutterWidget, isDark: boolean, primaryColor: string): string {
  switch (widget.type) {
    case 'Text':
      return `<div class="text">${escapeHtml(widget.text || '')}</div>`
    
    case 'Card':
      return `
        <div class="card">
          ${widget.children.map(c => renderWidget(c, isDark, primaryColor)).join('')}
          ${widget.text ? `<div class="text">${escapeHtml(widget.text)}</div>` : ''}
        </div>
      `
    
    case 'ListTile':
      return `
        <div class="list-item">
          ${widget.text ? `<div class="text">${escapeHtml(widget.text)}</div>` : ''}
        </div>
      `
    
    case 'ElevatedButton':
    case 'TextButton':
      return `<button class="button">${escapeHtml(widget.text || 'Button')}</button>`
    
    case 'Container':
      return `
        <div class="container">
          ${widget.children.map(c => renderWidget(c, isDark, primaryColor)).join('')}
        </div>
      `
    
    case 'Column':
      return `
        <div class="column">
          ${widget.children.map(c => renderWidget(c, isDark, primaryColor)).join('')}
        </div>
      `
    
    case 'Row':
      return `
        <div class="row">
          ${widget.children.map(c => renderWidget(c, isDark, primaryColor)).join('')}
        </div>
      `
    
    case 'ListView':
      return `
        <div class="column">
          ${widget.children.map(c => renderWidget(c, isDark, primaryColor)).join('')}
        </div>
      `
    
    default:
      if (widget.text) {
        return `<div class="text">${escapeHtml(widget.text)}</div>`
      }
      if (widget.children.length > 0) {
        return widget.children.map(c => renderWidget(c, isDark, primaryColor)).join('')
      }
      return ''
  }
}

function renderFAB(widgets: FlutterWidget[], _primaryColor: string): string {
  const fab = widgets.find(w => w.type === 'FloatingActionButton')
  if (!fab) return ''
  
  return `<button class="fab">+</button>`
}

function escapeHtml(text: string): string {
  if (!text) return ''
  // Server-side safe HTML escaping
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
