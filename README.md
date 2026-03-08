<div align="center">

# ⚡ FlutterForge AI

### **Describe your app. Get a full Flutter codebase. In seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-♥-red.svg)](https://opensource.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

[![GitHub stars](https://img.shields.io/github/stars/alexbieber/ambar-ai?style=social)](https://github.com/alexbieber/ambar-ai)
[![GitHub forks](https://img.shields.io/github/forks/alexbieber/ambar-ai?style=social)](https://github.com/alexbieber/ambar-ai/fork)
[![Visitors](https://api.visitorbadge.io/api/visitors?path=alexbieber%2Fambar-ai&labelColor=%23555555&countColor=%236366f1)](https://visitorbadge.io/status?path=alexbieber/ambar-ai)

*No boilerplate. No scaffolding. Just a prompt.*

[About](#-about) •
[Quick Start](#-quick-start) •
[Features](#-why-flutterforge) •
[For Developers](#-for-developers) •
[Collaborate](#-collaborate)

</div>

---

## 📌 About

**FlutterForge AI** is an open-source IDE that turns a short prompt into a complete, runnable Flutter app. Type *"Todo app"*, *"Instagram clone"*, or *"A finance tracker with charts"* — we **plan all screens and requirements**, then generate a full multi-file project (screens, models, `pubspec.yaml`) with **Unsplash demo images** and a **live preview** rendered from your Flutter code. One plan-then-build flow; powered by **Claude** and **Google Gemini**. Your API keys stay in your browser. No vendor lock-in. Built for developers who want to ship Flutter apps faster.

---

## 🚀 What is FlutterForge AI?

**FlutterForge AI** turns a short prompt into a complete, runnable **Flutter** mobile app. Type *"Todo app"*, *"Instagram clone"*, or *"Recipe browser"* — we **plan every screen and requirement** (feed, profile, explore, etc. for clones), then generate a full multi-file project: `lib/screens/`, `lib/models/`, `pubspec.yaml`, **Unsplash demo images**, and a **live preview** that renders your Flutter code as HTML in a phone mockup. Copy the code and run with `flutter run`.

It’s **open source**, runs **locally** (your API keys stay in your browser), and supports **Claude** and **Google Gemini**. **We welcome collaborators** — see [Collaborate](#-collaborate).

---

## ✨ Why FlutterForge?

| | |
|---|---|
| 🧠 **Plan-then-build** | One flow: we plan all screens and requirements from your prompt, then generate the full Flutter project. Short prompts (e.g. *"Instagram clone"*) get a complete app with 8–15+ files. |
| 📱 **Real Flutter, real fast** | Proper structure: `lib/screens/`, `lib/models/`, Material 3, Unsplash demo images — ready for `flutter run`. |
| 👁 **Preview from your code** | After generate, we render your Flutter code as HTML in a phone mockup so you see the app before you export. |
| 🖼 **Unsplash images** | Every generated app includes demo images (avatars, cards, list thumbnails) via Unsplash so it looks polished out of the box. |
| 🔐 **Your keys, your machine** | API keys stay in your browser and are sent only to the provider. We never see them. |
| ⌨ **Built for flow** | ⌘↵ to generate, ⌘K for API key, dark UI, GitHub stars/forks in the header. |
| 🌐 **100% open source** | MIT license. Inspect, fork, and improve. No vendor lock-in. |

---

## 📸 See it in action

*One prompt → full Flutter app with live preview. Add a screenshot or GIF above to showcase the flow.*

---

## 🎯 Quick Start

**1. Clone and install**

```bash
git clone https://github.com/alexbieber/ambar-ai.git
cd ambar-ai
npm install
```

**2. Run the app**

```bash
npm run dev:full
```

Opens the **proxy** at `http://localhost:3001` and the **app** at `http://localhost:5173`.

**3. Add an API key (in the app)**

Click **Add API Key** (or press **⌘K**). Use **Gemini** (free tier) or **Claude** — or both.

| Provider | Get key | Key format |
|----------|---------|------------|
| **Google Gemini** | [Google AI Studio](https://aistudio.google.com/apikey) | `AIza...` |
| **Anthropic Claude** | [Anthropic Console](https://console.anthropic.com) | `sk-ant-...` |

**4. Generate**

Type a short prompt — e.g. *"Todo app"*, *"Instagram clone"*, *"Recipe browser"* — then press **⌘↵** (or click **Generate**). We plan all screens and requirements, generate the Flutter project with Unsplash demo images, and show a live preview from your code. Copy the files into your Flutter project when ready.

---

## 📖 Using Generated Code

```bash
flutter create my_app && cd my_app
# Replace lib/main.dart (and add any generated files) with FlutterForge output
flutter pub get && flutter run
```

---

## 🛠 For Developers

### Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Express (proxy for Claude & Gemini; avoids CORS)
- **AI:** Anthropic API (Claude), Google Gemini API

### Project structure

```
├── src/
│   ├── agent/           # Plan-then-build prompts, clone-app & Unsplash rules
│   ├── components/      # UI, layout (Sidebar, TopBar, PreviewPanel), GitHubRepoStats
│   ├── hooks/            # useGenerate (plan+code, preview-from-code)
│   ├── services/         # claudeService, geminiService, fileParser, export, previewGenerator
│   ├── stores/           # aiStore, projectStore, uiStore
│   └── utils/            # constants, fileParser helpers
├── server.js             # Express proxy (Claude + Gemini)
├── scripts/
│   └── generate-and-save.mjs   # CLI: generate project (uses API_KEY env)
└── package.json
```

### CLI (optional)

Generate a project from the terminal. **Start the proxy first** (`npm run server`), then:

```bash
API_KEY=your_gemini_key node scripts/generate-and-save.mjs "A todo app with categories"
```

Output is written to `finance_tracker_app/` (see script for options).

### Build for production

```bash
npm run build
```

Output is in `dist/`.

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| **Failed to fetch** | Ensure proxy is running: `npm run dev:full` or `npm run server` on port 3001. |
| **Invalid API key** | **Gemini:** key from [AI Studio](https://aistudio.google.com/apikey), starts with `AIza...`. **Claude:** key from [Console](https://console.anthropic.com), starts with `sk-ant-...`. |
| **Gemini rate limit** | Wait ~1 min or add a Claude key and switch provider in Settings (⌘K). |

---

## 🤝 Collaborate

We’d love to build FlutterForge AI with you. Here are ways to get involved:

| How | What to do |
|-----|------------|
| **💻 Code** | Open a **Pull Request** — fix a bug, add a feature, or improve prompts. See [Contributing](#contributing-code) below. |
| **🐛 Bugs & ideas** | Open an **Issue** — report bugs, suggest features, or propose improvements. |
| **📝 Docs & examples** | Improve the README, add example prompts, or write a short tutorial and share it via a PR or Issue. |
| **🌍 Spread the word** | Star the repo, share with Flutter or AI communities, or blog about your experience. |
| **🔧 Maintain / co-maintain** | Interested in triaging issues, reviewing PRs, or helping steer the project? Open an Issue and say hi. |

Every contribution counts — from a one-line fix to a new feature. We’re happy to guide first-time contributors.

### Contributing code

1. **Fork** the repo and clone it locally.
2. **Create a branch:** `git checkout -b feature/your-idea` (or `fix/issue-description`).
3. **Make your changes** — keep PRs focused and add a short description.
4. **Push** and open a **Pull Request** against `main`. We’ll review and merge.

Ideas we’d especially welcome:

- Better prompts and code-generation quality
- Support for more Flutter patterns or packages
- UI/UX and accessibility improvements
- Tests, docs, and example projects

---

## 📄 License

This project is open source under the [MIT License](https://opensource.org/licenses/MIT).

---

<div align="center">

**If FlutterForge AI saves you time, consider giving it a ⭐ — it helps others discover the project.**

</div>
