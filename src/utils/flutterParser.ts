// Flutter Code Parser - Extracts UI elements from Flutter code accurately

export interface FlutterWidget {
  type: string
  properties: Record<string, any>
  children: FlutterWidget[]
  text?: string
  color?: string
  backgroundColor?: string
}

export interface ParsedFlutterApp {
  appName: string
  theme: {
    primaryColor?: string
    backgroundColor?: string
    brightness?: 'light' | 'dark'
  }
  widgets: FlutterWidget[]
  screens: Array<{
    name: string
    widgets: FlutterWidget[]
  }>
}

export function parseFlutterCode(code: string): ParsedFlutterApp {
  const app: ParsedFlutterApp = {
    appName: 'Flutter App',
    theme: {},
    widgets: [],
    screens: []
  }

  // Extract app name from MaterialApp title first, then class name
  const materialAppTitle = code.match(/MaterialApp\s*\([\s\S]*?title:\s*['"]([^'"]+)['"]/)
  if (materialAppTitle) {
    app.appName = materialAppTitle[1].trim()
  } else {
    const appClassMatch = code.match(/class\s+(\w+)\s+extends\s+(?:StatelessWidget|StatefulWidget)/)
    if (appClassMatch) {
      app.appName = appClassMatch[1].replace(/App$/, '') || 'Flutter App'
    }
  }

  // Extract theme - ThemeData and ColorScheme.fromSeed
  const themeMatch = code.match(/ThemeData\s*\(([\s\S]*?)\)/)
  if (themeMatch) {
    const themeContent = themeMatch[1]
    const primaryMatch = themeContent.match(/primaryColor:\s*Colors\.(\w+)|primaryColor:\s*Color\(0x([0-9a-fA-F]+)\)/)
    if (primaryMatch) {
      app.theme.primaryColor = primaryMatch[1] || `#${primaryMatch[2]}`
    }
    const scaffoldBgMatch = themeContent.match(/scaffoldBackgroundColor:\s*Colors\.(\w+)|scaffoldBackgroundColor:\s*Color\(0x([0-9a-fA-F]+)\)/)
    if (scaffoldBgMatch) {
      app.theme.backgroundColor = scaffoldBgMatch[1] || `#${scaffoldBgMatch[2]}`
    }
    if (themeContent.includes('brightness: Brightness.dark')) {
      app.theme.brightness = 'dark'
    }
  }
  if (!app.theme.brightness && /ColorScheme\.fromSeed[^)]*brightness:\s*Brightness\.dark/.test(code)) {
    app.theme.brightness = 'dark'
  }
  if (!app.theme.primaryColor) {
    const seedMatch = code.match(/seedColor:\s*Colors\.(\w+)/)
    if (seedMatch) app.theme.primaryColor = seedMatch[1]
  }

  // Extract AppBar / SliverAppBar title
  const appBarMatch = code.match(/AppBar\s*\([\s\S]*?title:\s*(?:const\s+)?(?:Text\s*\()?['"]([^'"]+)['"]/) ||
    code.match(/SliverAppBar\s*\([\s\S]*?title:\s*(?:const\s+)?(?:Text\s*\()?['"]([^'"]+)['"]/)
  if (appBarMatch) {
    app.widgets.push({
      type: 'AppBar',
      properties: { title: appBarMatch[1] },
      children: []
    })
  }

  // Extract Scaffold body - multiple strategies
  let bodyWidgets: FlutterWidget[] = []
  
  // Strategy 1: Direct Scaffold body extraction
  const scaffoldMatch = code.match(/Scaffold\s*\([\s\S]*?body:\s*([\s\S]+?)(?:,\s*(?:floatingActionButton|appBar|bottomNavigationBar|drawer|endDrawer)|\))/)
  if (scaffoldMatch) {
    const bodyCode = scaffoldMatch[1].trim()
    bodyWidgets = extractWidgetsFromCode(bodyCode)
  }
  
  // Strategy 2: Extract from build method return
  if (bodyWidgets.length === 0) {
    const buildMatch = code.match(/Widget\s+build\([^)]*\)\s*\{[\s\S]*?return\s+([\s\S]+?);?\s*\}/)
    if (buildMatch) {
      const returnCode = buildMatch[1].trim()
      bodyWidgets = extractWidgetsFromCode(returnCode)
    }
  }
  
  // Strategy 3: Extract from Scaffold return directly
  if (bodyWidgets.length === 0) {
    const scaffoldReturnMatch = code.match(/return\s+Scaffold\s*\([\s\S]*?body:\s*([\s\S]+?)(?:,|\))/)
    if (scaffoldReturnMatch) {
      bodyWidgets = extractWidgetsFromCode(scaffoldReturnMatch[1])
    }
  }
  
  // Strategy 4: If still empty, extract all widgets from entire code
  if (bodyWidgets.length === 0) {
    bodyWidgets = extractWidgetsFromCode(code)
  }
  
  app.widgets.push(...bodyWidgets)

  // Extract FloatingActionButton
  const fabMatch = code.match(/floatingActionButton:\s*(?:FloatingActionButton|FAB)/)
  if (fabMatch) {
    app.widgets.push({
      type: 'FloatingActionButton',
      properties: {},
      children: []
    })
  }

  return app
}

function extractWidgetsFromCode(code: string): FlutterWidget[] {
  const widgets: FlutterWidget[] = []

  // Extract Column with children - more flexible regex
  const columnMatch = code.match(/Column\s*\([\s\S]*?children:\s*\[([\s\S]+?)\]/)
  if (columnMatch && columnMatch[1]) {
    const children = extractChildren(columnMatch[1])
    if (children.length > 0) {
      widgets.push({
        type: 'Column',
        properties: {},
        children: children
      })
      return widgets // Return early if Column found with children
    }
  }

  // Extract ListView with children
  const listViewChildrenMatch = code.match(/ListView\.children\s*\([\s\S]*?children:\s*\[([\s\S]+?)\]/)
  if (listViewChildrenMatch && listViewChildrenMatch[1]) {
    const children = extractChildren(listViewChildrenMatch[1])
    if (children.length > 0) {
      widgets.push(...children)
      return widgets
    }
  }
  
  // Also try ListView(children: [...])
  const listViewDirectMatch = code.match(/ListView\s*\([\s\S]*?children:\s*\[([\s\S]+?)\]/)
  if (listViewDirectMatch && listViewDirectMatch[1]) {
    const children = extractChildren(listViewDirectMatch[1])
    if (children.length > 0) {
      widgets.push(...children)
      return widgets
    }
  }

  // Extract ListView.builder items (simulate with sample items)
  const listViewBuilderMatch = code.match(/ListView\.builder/)
  if (listViewBuilderMatch) {
    // Extract itemBuilder content to understand structure
    const itemBuilderMatch = code.match(/itemBuilder:\s*\([^)]*\)\s*\{[\s\S]*?return\s+([\s\S]+?);?\s*\}/)
    if (itemBuilderMatch) {
      const itemWidget = extractWidgetsFromCode(itemBuilderMatch[1])
      // Create 3 sample items
      for (let i = 0; i < 3; i++) {
        widgets.push(...itemWidget.map(w => ({ ...w })))
      }
    }
  }

  // Extract Card widgets
  const cardMatches = code.matchAll(/Card\s*\(([\s\S]*?)\)/g)
  for (const match of cardMatches) {
    const cardContent = match[1]
    const cardWidgets = extractWidgetsFromCode(cardContent)
    widgets.push({
      type: 'Card',
      properties: {},
      children: cardWidgets,
      text: extractTextFromCode(cardContent)
    })
  }

  // Extract ListTile items
  const listTileMatches = code.matchAll(/ListTile\s*\([\s\S]*?title:\s*(?:Text\s*\()?['"]([^'"]+)['"]/g)
  for (const match of listTileMatches) {
    widgets.push({
      type: 'ListTile',
      properties: { title: match[1] },
      children: [],
      text: match[1]
    })
  }

  // Extract Text widgets (not in AppBar or comments) - be more aggressive
  const textMatches = Array.from(code.matchAll(/Text\s*\(\s*['"]([^'"]{1,100})['"]/g))
  for (const match of textMatches) {
    const beforeMatch = code.substring(0, match.index || 0)
    const textContent = match[1]
    
    // Skip if in AppBar, comment, or already extracted
    if (!beforeMatch.includes('AppBar') && 
        !beforeMatch.match(/\/\/[^\n]*$/m) &&
        !widgets.some(w => w.text === textContent) &&
        textContent.length > 0) {
      widgets.push({
        type: 'Text',
        properties: {},
        children: [],
        text: textContent
      })
    }
  }

  // Extract Buttons
  const buttonMatches = code.matchAll(/(ElevatedButton|TextButton|OutlinedButton|FloatingActionButton)\s*\([\s\S]*?(?:child|label):\s*(?:Text\s*\()?['"]([^'"]+)['"]/g)
  for (const match of buttonMatches) {
    widgets.push({
      type: match[1],
      properties: {},
      children: [],
      text: match[2]
    })
  }

  // Extract Container
  const containerMatches = code.matchAll(/Container\s*\([\s\S]*?child:\s*([\s\S]+?)(?:,|\))/g)
  for (const match of containerMatches) {
    const containerContent = match[1]
    widgets.push({
      type: 'Container',
      properties: {},
      children: extractWidgetsFromCode(containerContent)
    })
  }

  // Extract Padding
  const paddingMatches = code.matchAll(/Padding\s*\([\s\S]*?child:\s*([\s\S]+?)(?:,|\))/g)
  for (const match of paddingMatches) {
    widgets.push(...extractWidgetsFromCode(match[1]))
  }

  return widgets
}

function extractChildren(childrenCode: string): FlutterWidget[] {
  const widgets: FlutterWidget[] = []
  
  if (!childrenCode || childrenCode.trim().length === 0) {
    return widgets
  }
  
  // First, try to extract ListTile items (common pattern)
  const listTileMatches = childrenCode.matchAll(/ListTile\s*\([\s\S]*?title:\s*(?:Text\s*\()?['"]([^'"]+)['"]/g)
  for (const match of listTileMatches) {
    widgets.push({
      type: 'ListTile',
      properties: { title: match[1] },
      children: [],
      text: match[1]
    })
  }
  
  // Extract Text widgets
  const textMatches = childrenCode.matchAll(/Text\s*\(\s*['"]([^'"]{1,200})['"]/g)
  for (const match of textMatches) {
    const text = match[1]
    if (text && !widgets.some(w => w.text === text)) {
      widgets.push({
        type: 'Text',
        properties: {},
        children: [],
        text: text
      })
    }
  }
  
  // Extract Card widgets
  const cardMatches = childrenCode.matchAll(/Card\s*\(([\s\S]+?)\)/g)
  for (const match of cardMatches) {
    const cardContent = match[1]
    const cardText = extractTextFromCode(cardContent)
    const cardChildren = extractWidgetsFromCode(cardContent)
    
    widgets.push({
      type: 'Card',
      properties: {},
      children: cardChildren,
      text: cardText
    })
  }
  
  // Extract Buttons
  const buttonMatches = childrenCode.matchAll(/(ElevatedButton|TextButton|OutlinedButton|IconButton)\s*\([\s\S]*?(?:child|label):\s*(?:Text\s*\()?['"]([^'"]+)['"]/g)
  for (const match of buttonMatches) {
    widgets.push({
      type: match[1],
      properties: {},
      children: [],
      text: match[2]
    })
  }
  
  // If still no widgets, try simpler extraction
  if (widgets.length === 0) {
    // Look for any quoted strings that might be text content
    const stringMatches = childrenCode.matchAll(/['"]([^'"]{3,100})['"]/g)
    for (const match of stringMatches) {
      const text = match[1]
      // Skip if it looks like a color name or technical term
      if (!text.match(/^(Colors|Color|Widget|BuildContext|State|setState|void|return|import|package)/) &&
          !text.includes('://') && // URLs
          text.length > 2) {
        widgets.push({
          type: 'Text',
          properties: {},
          children: [],
          text: text
        })
        if (widgets.length >= 5) break // Limit to avoid too many
      }
    }
  }
  
  return widgets
}

function extractTextFromCode(code: string): string {
  const textMatch = code.match(/Text\s*\(\s*['"]([^'"]+)['"]/)
  return textMatch ? textMatch[1] : ''
}

// Color mapping from Flutter Colors to CSS
export function flutterColorToCSS(color: string): string {
  const colorMap: Record<string, string> = {
    'blue': '#2196F3',
    'red': '#F44336',
    'green': '#4CAF50',
    'orange': '#FF9800',
    'purple': '#9C27B0',
    'teal': '#009688',
    'indigo': '#3F51B5',
    'pink': '#E91E63',
    'amber': '#FFC107',
    'cyan': '#00BCD4',
    'lime': '#CDDC39',
    'brown': '#795548',
    'grey': '#9E9E9E',
    'gray': '#9E9E9E',
    'black': '#000000',
    'white': '#FFFFFF',
    'primary': '#2196F3',
    'secondary': '#FF9800',
    'accent': '#FF5722',
    'error': '#F44336',
    'background': '#FFFFFF',
    'surface': '#FFFFFF',
  }

  if (color.startsWith('#')) return color
  if (color.startsWith('0x')) {
    const hex = color.substring(2)
    // Handle ARGB format (Flutter uses 0xAARRGGBB)
    if (hex.length === 8) {
      return `#${hex.substring(2)}${hex.substring(0, 2)}` // Convert ARGB to RGBA
    }
    return `#${hex}`
  }
  
  const lowerColor = color.toLowerCase()
  return colorMap[lowerColor] || colorMap['primary'] || '#2196F3'
}
