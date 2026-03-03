<div align="center">

# ⚡ FlutterForge AI

### **Describe your app. Get a full Flutter codebase. In seconds.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Open Source](https://img.shields.io/badge/Open%20Source-♥-red.svg)](https://opensource.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

*No boilerplate. No scaffolding. Just a prompt.*

[Quick Start](#-quick-start) •
[Features](#-why-flutterforge) •
[For Developers](#-for-developers) •
[Collaborate](#-collaborate)

</div>

---

## 🚀 What is FlutterForge AI?

**FlutterForge AI** turns a single sentence into a complete, runnable **Flutter** mobile app. You describe what you want — a finance tracker, a todo app with categories, a social feed — and the AI generates a full multi-file project: `main.dart`, screens, models, `pubspec.yaml`, and a live preview in a phone mockup. Copy the code, paste into your project, run.

It’s **open source**, runs **locally** (your API keys stay in your browser), and supports **Claude** and **Google Gemini** so you can use the best model for you — or both. **We welcome collaborators** — see [Collaborate](#-collaborate) to contribute code, report issues, or help grow the project.

---

## ✨ Why FlutterForge?

| | |
|---|---|
| 🧠 **AI-native** | Powered by **Claude** (Anthropic) and **Google Gemini**. Choose one or both; switch in Settings. Free tier available with Gemini. |
| 📱 **Real Flutter, real fast** | Generates proper structure: `lib/screens/`, `lib/models/`, Material 3, const constructors — ready for `flutter run`. |
| 👁 **Live preview** | See your app in a phone frame before you copy a single line. Iterate with natural language. |
| 🔐 **Your keys, your machine** | API keys are stored only in your browser and sent directly to the provider. We never see them. |
| ⌨ **Built for flow** | Keyboard shortcuts (⌘↵ to generate, ⌘K for API key), dark UI, one-click copy. |
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

Type a prompt like *"A finance tracker with charts and dark theme"* → press **⌘↵** (or click Generate) → copy the code into your Flutter project.

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
│   ├── components/   # UI, modals, layout, diff viewer, agents
│   ├── hooks/        # useGenerate, useKeyboard
│   ├── services/     # claudeService, geminiService, fileParser, export
│   ├── stores/       # aiStore, project state
│   └── utils/        # constants, prompts
├── server.js         # Express proxy (Claude + Gemini)
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
