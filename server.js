import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import os from 'os';

const app = express();
const PORT = 3001;

/** In-memory store for mobile preview (GET /preview returns this). */
let sharedPreviewHtml = '';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

function escapeForTemplate(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// Proxy endpoint for generating Flutter code
app.post('/api/generate', async (req, res) => {
  const rawKey = req.body.apiKey;
  const apiKey = typeof rawKey === 'string' ? rawKey.trim() : '';
  const { prompt, type = 'code', provider = 'anthropic', currentProject, model } = req.body;
  const safePrompt = escapeForTemplate(typeof prompt === 'string' ? prompt : '');

  if (!apiKey || !prompt) {
    return res.status(400).json({ error: 'API key and prompt are required' });
  }

  try {
    let content = '';
    const hasExistingProject = currentProject && typeof currentProject === 'object' && Object.keys(currentProject).length > 0;

    if (type === 'code') {
      if (hasExistingProject) {
        const filesText = Object.entries(currentProject)
          .map(([path, text]) => `--- FILE: ${path} ---\n${typeof text === 'string' ? text : ''}`)
          .join('\n\n');
        const capped = filesText.length > 28000 ? filesText.slice(0, 28000) + '\n\n... (truncated)' : filesText;
        content = `You must respond with a single valid JSON object. No markdown, no code fences. Start with {"files": and end with closing braces.

The user has an EXISTING Flutter project and wants to make CHANGES. Apply only what they ask; keep everything else the same.

USER REQUEST: "${safePrompt}"

EXISTING PROJECT FILES (path and content):

${capped}

Return the COMPLETE updated project in the same JSON format: {"files": {"path": "full file content", ...}}. Include EVERY file (all paths above) with their content updated only where the user's request requires it. Use \\n for newlines and \\" for quotes inside strings. Return ONLY the JSON.`;
      } else {
        content = `You must respond with a single valid JSON object. No markdown, no code fences, no text before or after. Start with {"files": and end with closing braces.

Generate a Flutter mobile app (iOS/Android) for: "${safePrompt}"

MANDATORY PROJECT STRUCTURE (follow exactly):

1. lib/main.dart
   - ONLY: void main() => runApp(MyApp());
   - Class MyApp extends StatelessWidget with MaterialApp (title, theme, home: or routes).
   - Import and use screens from lib/screens/. Do NOT put full screen code in main.dart.

2. lib/screens/ — one file per screen
   - Example: lib/screens/home_screen.dart, lib/screens/todo_screen.dart.
   - Each file: a single StatefulWidget or StatelessWidget (the full screen with Scaffold, AppBar, body).
   - main.dart only references these (e.g. home: HomeScreen() or routes).

3. lib/models/ — only if the app has data models
   - Example for todo app: lib/models/todo.dart with class Todo { String id; String title; bool done; }.
   - Use for lists, forms, persistence.

4. Root files (always include)
   - pubspec.yaml (name, dependencies: flutter, any packages used)
   - README.md (short setup: flutter pub get, flutter run)
   - .gitignore (standard Flutter: /build/, .dart_tool/, etc.)

RULES:
- Do NOT put entire app logic or multiple screens inside lib/main.dart. Split every screen into lib/screens/<name>_screen.dart.
- For a todo app: include lib/main.dart, lib/screens/todo_screen.dart (or home_screen.dart), lib/models/todo.dart, pubspec.yaml, README.md, .gitignore.
- Use \\n for newlines and \\" for double quotes inside JSON strings.
- Mobile-first: Scaffold, AppBar, ListView/Column, bottom nav or tabs if needed.

Return ONLY the JSON object. First character must be {.`;
      }
    } else if (type === 'preview') {
      content = `You are an expert at analyzing Flutter code and creating pixel-perfect HTML/CSS previews.

Analyze this Flutter code and create an EXACT visual representation in HTML/CSS. Extract:
1. All text content (AppBar titles, button labels, card text, list items)
2. Exact colors (primaryColor, backgroundColor, theme colors)
3. Widget structure (Cards, ListTiles, Buttons, Columns, Rows)
4. Layout (padding, margins, spacing)
5. Material Design 3 styling

Flutter Code:
${prompt.substring(0, 6000)}

Create a complete, standalone HTML page with inline CSS that shows EXACTLY what this Flutter app looks like. 
- Use the exact colors from the code
- Include all text content
- Match the widget hierarchy
- Use Material Design 3 components
- Make it look like a real mobile app

Return ONLY the complete HTML document. Start with <!DOCTYPE html> or <html>. No markdown, no explanation.`;
    } else if (type === 'plan') {
      content = `You are an expert Flutter developer. The user wants to build this mobile app (iOS/Android): "${safePrompt}"

Reply with a short implementation plan only. Use bullet points. Include:
1. App structure: lib/main.dart (only main + MaterialApp), lib/screens/ (one file per screen), lib/models/ if needed (e.g. Todo model for todo app)
2. Exact file paths to create (e.g. lib/main.dart, lib/screens/todo_screen.dart, lib/models/todo.dart, pubspec.yaml, README.md, .gitignore)
3. Main features or widgets per screen
4. Suggested dependencies (e.g. provider, hive)

Keep under 15 bullets. No code. No markdown. Plain bullet list.`;
    }

    let response;
    
    if (provider === 'gemini') {
      const geminiModel = typeof model === 'string' && model ? model : 'gemini-2.5-flash';
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: content
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: type === 'code' ? 8000 : type === 'plan' ? 1024 : 4000,
          }
        })
      });
    } else {
      const claudeModel = typeof model === 'string' && model ? model : 'claude-3-5-sonnet-20241022';
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: type === 'code' ? 8000 : type === 'plan' ? 1024 : 4000,
          messages: [{
            role: 'user',
            content: content
          }]
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.error?.message || errorData.error?.message || 'API request failed';
      
      if (provider === 'gemini') {
        // Handle Gemini API errors
        if (errorMessage.includes('API key') || response.status === 401 || response.status === 403) {
          errorMessage = 'Invalid Gemini API key. Please check your API key and try again.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        }
      } else {
        // Handle Anthropic API errors
        if (errorMessage.includes('credit balance') || errorMessage.includes('too low')) {
          errorMessage = 'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits at console.anthropic.com';
        } else if (errorMessage.includes('authentication') || response.status === 401) {
          errorMessage = 'Invalid API key. Please check your API key and try again.';
        } else if (response.status === 429) {
          errorMessage = 'Rate limit exceeded. Please try again later.';
        }
      }
      
      return res.status(response.status).json({ 
        error: errorMessage,
        status: response.status,
        details: errorData
      });
    }

    const data = await response.json();
    
    // Transform Gemini response to match Anthropic format
    if (provider === 'gemini' && data.candidates && data.candidates[0]) {
      const geminiResponse = {
        content: [{
          text: data.candidates[0].content.parts[0].text
        }]
      };
      res.json(geminiResponse);
    } else {
      res.json(data);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy server is running' });
});

// ── Mobile preview (scan QR to open on phone) ─────────────────────────────
app.post('/preview', (req, res) => {
  const html = typeof req.body?.html === 'string' ? req.body.html : (typeof req.body === 'string' ? req.body : '');
  sharedPreviewHtml = html || '';
  res.json({ ok: true });
});

app.get('/preview', (_req, res) => {
  res.type('text/html').send(sharedPreviewHtml || '<!DOCTYPE html><html><body style="background:#1a1a2e;color:#888;font-family:sans-serif;padding:2rem;text-align:center;">No preview yet. Generate an app in FlutterForge and open “Open on phone” to sync.</body></html>');
});

function getLocalNetworkUrl() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:${PORT}/preview`;
      }
    }
  }
  return `http://localhost:${PORT}/preview`;
}

app.get('/preview/url', (_req, res) => {
  res.json({ url: getLocalNetworkUrl() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`📱 Mobile preview: ${getLocalNetworkUrl()}`);
  console.log(`   Scan QR in the app to open preview on your phone (same Wi‑Fi).`);
});
