# FlutterForge AI 🚀

Build complete Flutter mobile apps with just a prompt using AI. Supports **Claude (Anthropic)** and **Google Gemini** — use one or both.

## Features

- 🤖 **AI-Powered Generation** - Generate complete, runnable Flutter apps with Claude or Gemini
- 🔄 **Dual API Support** - Use **Anthropic (Claude)** and/or **Google Gemini**; switch in Settings (⌘K)
- 📱 **Live Preview** - See your app rendered in a realistic phone mockup
- 🎨 **Professional UI** - Modern dark theme with glassmorphism and smooth animations
- 📋 **One-Click Copy** - Copy generated code instantly
- 🗂 **Build History** - Saves your last generated apps
- ⌨️ **Keyboard Shortcuts** - Press ⌘↵ (Cmd+Enter) to generate

## Tech Stack

- **Vite** - Lightning-fast build tool
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icons
- **Express** - Backend proxy (avoids CORS for Claude & Gemini)
- **Anthropic API (Claude)** - AI code generation
- **Google Gemini API** - AI code generation (optional alternative / fallback)

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start both server and client**
   ```bash
   npm run dev:full
   ```
   - Proxy server: `http://localhost:3001`
   - Frontend: `http://localhost:5173`

   Or run separately:
   ```bash
   npm run server   # Terminal 1
   npm run dev      # Terminal 2
   ```

3. **Add an API key (in the app)**  
   Click **“Add API Key”** (or press ⌘K). You can use **either or both**:

   | Provider | Get key from | Key format |
   |----------|----------------|------------|
   | **Google Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) | Starts with `AIza...` |
   | **Anthropic (Claude)** | [Anthropic Console](https://console.anthropic.com) | Starts with `sk-ant-...` |

   Keys are stored only in your browser (localStorage) and are sent directly to the provider; they are never sent to our servers.

4. **Generate your first app**
   - Enter a prompt (e.g. “A finance tracker with charts and dark theme”)
   - Click **Generate App** or press ⌘↵
   - Copy the code into your Flutter project

## API Keys & Providers

- **Gemini** – Free tier available; good for getting started. Get a key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
- **Claude** – Requires credits. Get a key at [console.anthropic.com](https://console.anthropic.com).
- You can set **Gemini only**, **Claude only**, or **both**. In Settings you can choose provider (e.g. “Auto” prefers Gemini when a Gemini key is set, otherwise Claude).
- If you hit **Gemini rate limits**, wait ~1 minute or add a Claude key and switch provider in Settings.

## Why a Proxy Server?

Anthropic and Gemini APIs are called from the backend to avoid CORS. The Express server (`server.js`) proxies requests so the frontend never exposes your API keys to third-party origins.

## Optional: CLI script (environment variable)

The script `scripts/generate-and-save.mjs` calls the proxy to generate a project and write it to disk. It uses **Gemini** by default and expects an API key via environment variable:

```bash
# Start the proxy first (in another terminal): npm run server
API_KEY=your_gemini_api_key node scripts/generate-and-save.mjs "A todo app with categories"
```

Output is written to `finance_tracker_app/` (see script for the default prompt and folder).

## Building for Production

```bash
npm run build
```

Output is in the `dist/` directory.

## Using Generated Code

1. Create a new Flutter project:
   ```bash
   flutter create my_app
   ```

2. Replace `lib/main.dart` (and add any other generated files) with the generated code.

3. Run:
   ```bash
   flutter pub get
   flutter run
   ```

## Project Structure

```
├── src/
│   ├── App.tsx                 # Main app
│   ├── main.tsx
│   ├── index.css
│   ├── components/             # UI components, modals, layout, diff, agents, chat
│   ├── hooks/                  # useGenerate, useKeyboard, etc.
│   ├── services/               # claudeService, geminiService, fileParser, preview, export, agents
│   ├── stores/                 # aiStore, project state, provider config
│   ├── utils/                  # constants, prompts, diffUtils
│   ├── types/
│   └── workers/
├── server.js                   # Express proxy (Claude + Gemini)
├── scripts/
│   └── generate-and-save.mjs   # CLI: generate project via proxy (uses API_KEY env)
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

## Troubleshooting

### "Failed to fetch"
- Ensure the proxy is running on port 3001 (e.g. `npm run dev:full` or `npm run server` in one terminal).
- Check that nothing else is using port 3001.

### API key errors
- **Gemini**: Key should start with `AIza...` and be from [Google AI Studio](https://aistudio.google.com/apikey). Check quota and rate limits.
- **Claude**: Key should start with `sk-ant-...`. Confirm it’s active and you have credits in [Anthropic Console](https://console.anthropic.com).

### Gemini rate limit
- Wait about a minute and retry, or add a Claude key and switch provider in Settings (⌘K).

## License

MIT
