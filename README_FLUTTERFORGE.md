# FlutterForge IDE

A **web-based, AI-powered Flutter development environment** — like Cursor or Bolt.new, but specialized for Flutter/Dart. Generate full multi-file Flutter projects from a single prompt, edit with Monaco, and preview in a phone mockup.

![FlutterForge IDE](https://via.placeholder.com/800x500/0b0b17/00f0ff?text=FlutterForge+IDE)

## Tech stack

| Layer    | Technology              | Purpose           |
|----------|-------------------------|-------------------|
| Framework| React 18 + TypeScript   | UI                |
| Build    | Vite                    | Dev server + build|
| Styling  | Tailwind CSS + CSS vars | Design system     |
| State    | Zustand                 | Global state      |
| Editor   | Monaco Editor           | Code editing      |
| AI       | Anthropic Claude API    | Code generation   |
| Fonts    | Syne + DM Mono          | Typography        |
| Export   | fflate                  | ZIP download      |

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Deployment (Vercel)

```bash
npm run build
npm run deploy
```

Or connect the repo to [Vercel](https://vercel.com) for one-click deploy. The `vercel.json` rewrites all routes to `/` for SPA support.

## API key

The app is **100% client-side**. Your **Anthropic API key** is stored only in your browser’s `localStorage` and is sent directly to Anthropic’s API. We never see it.

1. Get a key at [console.anthropic.com](https://console.anthropic.com).
2. Click **Add API Key** in the app and paste it.
3. Use **Test** in the modal to verify the key.

## Features

- **Multi-file generation** — Full Flutter project (pubspec, lib/screens, widgets, models) from one prompt
- **Monaco editor** — Dart syntax, custom dark theme, tabs, dirty indicators
- **AI file editing** — Describe changes in natural language; content streams into the editor
- **Live preview** — HTML/CSS/JS mockup in iPhone/Android/Tablet frames
- **File explorer** — Tree, search, context menu, copy all
- **Export** — Download as ZIP, copy pubspec, copy all, README
- **Keyboard shortcuts** — ⌘↵ generate, ⌘B/E/P panels, ⌘K API key, ⌘, settings, ⌘? shortcuts
- **Resizable panels** — Sidebar, Explorer, Editor, Preview with drag handles

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — TypeScript check + Vite build
- `npm run preview` — Preview production build
- `npm run deploy` — Build and deploy to Vercel

## License

MIT.
