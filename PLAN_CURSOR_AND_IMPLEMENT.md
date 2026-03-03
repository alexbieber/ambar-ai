# How Cursor Works & How Implement Works

## 1. What is Cursor?

Cursor is an AI-first code editor built on VS Code. It combines:

- **Your codebase** (files, structure, open tabs)
- **Natural language** (what you want to do)
- **LLMs** (Claude, GPT, etc.) that read context and edit code

You stay in one place: describe the task in plain English, and Cursor proposes or applies edits.

---

## 2. Core Loop: Chat and Composer

- **Chat (sidebar)**  
  You ask questions or give instructions. The model sees your message plus optional context (selected code, file paths). It replies with text and can suggest code blocks or run commands.

- **Composer (agentic)**  
  You describe a multi-step or multi-file task (e.g. “add auth” or “refactor this module”). Cursor uses the same kind of loop as below: **plan → implement**.

---

## 3. How “Implement” Works (Plan → Implement)

Implement is the flow where Cursor **plans first**, then **makes changes**.

### Phase 1: Plan

1. **Input:** Your request (e.g. “Add a settings screen with dark mode toggle”) plus context (repo, open files, selection).
2. **Model** produces a **plan**:
   - High-level steps (e.g. “1. Create SettingsScreen, 2. Add theme state, 3. Wire to App”).
   - List of files to create or modify.
   - Optional: short rationale so you see *why* before any edit.
3. **Output:** A structured or bullet-point plan shown in the UI. No code changes yet.

### Phase 2: Implement

1. **Input:** The same request + the approved plan (and again, codebase context).
2. **Model** produces **concrete edits**:
   - New files (full contents).
   - Edits to existing files (diffs or search/replace).
3. **Output:** Applied edits (or suggested diffs you accept/reject).

So: **Plan = what to do and where; Implement = actual code changes.**

---

## 4. Why Plan Then Implement?

- **Accuracy:** The model commits to a structure and file list before writing code, so edits are more consistent.
- **Control:** You can review (and tweak) the plan before any file is changed.
- **Scale:** For large tasks, breaking into “plan” and “implement” keeps the model focused and reduces mistakes.

---

## 5. Applying This in FlutterForge (Flutter Mobile Apps)

FlutterForge is built for **Flutter mobile apps** (iOS/Android). It mirrors the Cursor flow:

| Step | Cursor-style | FlutterForge |
|------|----------------|--------------|
| **1. Describe** | User writes in Composer/Chat | User describes Flutter mobile app in chat |
| **2. Plan** | Model returns a short plan (steps + files) | **Plan** button → API `type: 'plan'` → plan shown in chat |
| **3. Implement** | Model applies edits to repo | **Implement** button → API `type: 'code'` → full mobile project + preview |
| **4. Review** | User accepts/rejects diffs | User sees code, mobile preview, and can export ZIP |

So: **Plan** = “here’s what I’ll build” (text only). **Implement (Generate)** = “here’s the full Flutter project” (files + preview).

### Implemented in FlutterForge

- **Plan** button in the chat input bar calls the API with `type: 'plan'` and shows the model’s bullet-point plan in the chat.
- **Send (Implement)** button runs the existing flow: `type: 'code'` → full project JSON → code editor + preview + export.
- You can use **Plan** first to see the approach, then **Implement** to generate the app.

---

## 6. Summary

- **Cursor** = VS Code + AI that uses your codebase and natural language to edit code.
- **Implement** = **Plan** (what and where) → **Implement** (actual code changes).
- **FlutterForge** can support the same idea: **Plan** (bulleted plan in chat) → **Generate** (full app as files + preview).
