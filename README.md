# FlutterForge AI 🚀

Build complete Flutter mobile apps with just a prompt using AI. Powered by Claude Sonnet 4.

## Features

- 🤖 **AI-Powered Generation** - Uses Claude Sonnet 4 to generate complete, runnable Flutter apps
- 📱 **Live Preview** - See your app rendered in a realistic phone mockup
- 🎨 **Professional UI** - Modern dark theme with glassmorphism and smooth animations
- 📋 **One-Click Copy** - Copy generated code instantly
- 🗂 **Build History** - Saves your last 5 generated apps
- ⌨️ **Keyboard Shortcuts** - Press ⌘↵ (Cmd+Enter) to generate

## Tech Stack

- **Vite** - Lightning-fast build tool
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Express** - Backend proxy server (solves CORS issues)
- **Claude API** - AI code generation

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start both server and client:**
   ```bash
   npm run dev:full
   ```
   
   This starts:
   - Proxy server on `http://localhost:3001`
   - Frontend on `http://localhost:5173`

   Or start them separately:
   ```bash
   # Terminal 1: Start proxy server
   npm run server
   
   # Terminal 2: Start frontend
   npm run dev
   ```

3. **Get your API key:**
   - Visit [console.anthropic.com](https://console.anthropic.com)
   - Create an API key
   - Paste it into the app

4. **Generate your first app:**
   - Enter a prompt like "A finance tracker with charts and dark theme"
   - Click "Generate App" or press ⌘↵
   - Copy the code and paste into your Flutter project!

## Why a Proxy Server?

The Anthropic API has CORS restrictions that prevent direct browser calls. The proxy server (`server.js`) handles API requests server-side, avoiding CORS issues.

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Using Generated Code

1. Create a new Flutter project:
   ```bash
   flutter create my_app
   ```

2. Replace `lib/main.dart` with the generated code

3. Run your app:
   ```bash
   flutter run
   ```

## Project Structure

```
├── src/
│   ├── App.tsx          # Main application component
│   ├── components/
│   │   └── MobilePhonePreview.tsx  # Phone preview component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── server.js            # Express proxy server
├── index.html           # HTML template
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Dependencies
```

## Troubleshooting

### "Failed to fetch" Error
- Make sure the proxy server is running on port 3001
- Run `npm run dev:full` to start both server and client
- Check that port 3001 is not already in use

### API Key Issues
- Verify your API key starts with `sk-ant-`
- Check that the key is active in your Anthropic console
- Ensure you have API credits

## License

MIT
