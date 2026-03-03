# FlutterForge AI — Flaws & Improvement Opportunities

Pro audit of the codebase. Categories: **Critical**, **High**, **Medium**, **Low**, **Dead code**, **Hardening**.

---

## Critical

### 1. ⌘Enter in Enhance textarea triggers **Generate** with wrong content
**Where:** `useKeyboard.ts` + Sidebar (two textareas).

**What:** Global handler runs `generate(textarea.value.trim())` for any focused input/textarea on ⌘Enter. The **prompt** textarea uses `onKeyDown` + `stopPropagation()`, so it never reaches the handler. The **Enhance** textarea has no key handler, so when the user presses ⌘Enter there, the handler runs and **starts a new project generation using the enhance instruction as the app description**.

**Fix:** Only run generate when the focused element is the main prompt textarea (e.g. `data-purpose="prompt"` and check in useKeyboard), or remove global ⌘Enter and rely only on the Sidebar’s own handler for the prompt.

---

### 2. Sidebar / Explorer / Preview “collapse” never actually collapses
**Where:** `uiStore.ts` (`setSidebarWidth`, `setExplorerWidth`, `setPreviewWidth`) + `IDELayout.tsx`.

**What:** Collapsed state is `width <= 40` (e.g. `COLLAPSED_WIDTH = 28`). The store clamps width to `[180, 400]` (sidebar), so `setSidebarWidth(28)` becomes `180`. The panel never goes ≤ 40, so `sidebarCollapsed` is always false and the narrow “collapsed” strip is never shown.

**Fix:** Allow a “collapsed” range in the store (e.g. 28–40) or use separate `sidebarCollapsed` (and similar) flags and keep width only for the expanded size.

---

## High

### 3. Gemini retry-after can yield NaN
**Where:** `geminiService.ts` — `retryAfter` header parsing.

**What:** `parseInt(retryAfter, 10) * 1000` can be `NaN` if the header is non-numeric (e.g. an HTTP-date). Then `Math.min(NaN, 120000)` is `NaN`, and `sleep(NaN)` doesn’t delay.

**Fix:** Use `const parsed = parseInt(retryAfter, 10); const waitMs = Number.isNaN(parsed) ? 60000 : Math.min(parsed * 1000, 120000);` (or parse HTTP-date if desired).

---

### 4. History can exhaust localStorage
**Where:** `projectStore.ts` — history includes full `previewHtml` (large HTML).

**What:** Up to 5 full projects with preview HTML and file contents can hit quota and `saveHistoryToStorage` will fail silently (catch block ignores).

**Fix:** Either store a lighter history (e.g. omit `previewHtml`, or only first N files), or surface a “Storage full” notification and/or trim oldest entries when save fails.

---

### 5. No guard for missing `#root`
**Where:** `main.tsx`.

**What:** `document.getElementById('root')!` — if `index.html` is changed and `#root` is removed, this is null and `.render()` throws without a clear message.

**Fix:** Check for element and render a minimal error message or throw a clear error.

---

## Medium

### 6. EditorPanel “Copy all” file order
**Where:** `EditorPanel.tsx` — `handleCopyAll`.

**What:** Uses `Object.entries(project.files)` with no defined order; ZIP and copy-summary use sorted order elsewhere.

**Fix:** Use the same `sortFilePaths` (or shared util) so “Copy all” matches export order (e.g. pubspec, lib/main.dart, then rest).

---

### 7. Preview iframe blob URL on rapid project switch
**Where:** `PreviewPanel.tsx` — `blobUrl` from `project?.previewHtml`, cleanup in `useEffect`.

**What:** If `previewHtml` changes very quickly (e.g. load from history then regenerate), revoke is tied to `blobUrl` dependency; generally fine, but rapid toggling could theoretically create many blob URLs in one tick before cleanup runs.

**Fix:** Revoke previous blob in the same effect before creating a new one, or use a ref to always revoke the last URL.

---

### 8. ErrorBoundary “Try again” only resets local state
**Where:** `ErrorBoundary.tsx`.

**What:** “Try again” sets `hasError: false` but doesn’t remount children, so the same error can rethrow immediately.

**Fix:** Either remount (e.g. key from error or a retry counter) or document that “Try again” is best-effort and a full reload may be needed.

---

### 9. ApiKeyModal test uses live API
**Where:** `ApiKeyModal.tsx` — key validation by calling the real API.

**What:** Every test sends a real request (and can be rate-limited or leak key patterns in logs if any).

**Fix:** Optional: add a “Validate format only” path, or document that “Test” performs a real minimal request.

---

## Low

### 10. `loadFromHistory` index out of range
**Where:** `projectStore.ts` — `loadFromHistory(index)`.

**What:** If `index` is negative or ≥ `history.length`, `history[index]` is undefined and `setProject(p)` is never called; no feedback to the user.

**Fix:** Guard: `if (index < 0 || index >= history.length) return;` and optionally notify.

---

### 11. Resize panel widths not persisted
**Where:** `uiStore.ts` — sidebar/explorer/preview widths.

**What:** Widths reset on reload; power users may want them persisted (e.g. localStorage).

**Fix:** Optional: persist and rehydrate widths (with sane defaults and limits).

---

### 12. No focus trap in modals
**Where:** `ApiKeyModal`, `SettingsModal`, `ShortcutsModal`.

**What:** Keyboard users can tab out of the modal into the page; no Escape-to-close documented in all modals (ShortcutsModal may list it).

**Fix:** Add focus trap and ensure Escape closes the modal and returns focus.

---

### 13. Duplicate “Copy” actions
**Where:** EditorPanel has “Copy file” and “Copy all”; Export has “Copy project summary”; Sidebar error has “Copy raw response”; ⌘S copies current file.

**What:** Slight UX confusion between “copy current file”, “copy all file contents”, and “copy project summary (setup steps + file list)”.

**Fix:** Clear labels and/or shortcuts list (e.g. in Shortcuts modal) to distinguish them.

---

## Dead / unused code

These files or modules are not imported by the active app (IDELayout → Sidebar, EditorPanel, etc.):

- **Components:** `src/components/Sidebar.tsx` (different from `layout/Sidebar.tsx`), `ChatMessage.tsx`, `MobilePhonePreview.tsx`, `ProjectPanel.tsx`, `ApiKeySettings.tsx`, `WidgetTree.tsx`
- **Stores:** `providerStore.ts`, `changeStore.ts`, `agentStore.ts`
- **Services:** `previewService.ts` (preview is done by `previewGenerator` + Claude/Gemini)
- **Agent/diff/providers:** `agentOrchestrator`, `agentRunner`, `taskQueue`, `conflictResolver`, `providerRegistry`, `claudeProvider`, `geminiProvider`, `providerInterface`, `ChangeQueuePanel`, `ChangeCard`, `ChangeHistoryPanel`, `DiffViewer`, `AgentOrchestrator`, `AgentCard`, `AgentActivityFeed`, `AgentConfigModal`, `ChatPanel`, `ProviderSelector`, `ProviderBadge`, `ApiKeyManager`, etc.
- **Utils:** `flutterRenderer.tsx`, `flutterParser.ts` (if only used by WidgetTree / unused components)
- **Hooks:** `useAgentActivity.ts`, `useOrchestrator.ts`
- **Workers:** `agentWorker.ts`

Removing or archiving these will reduce bundle size and confusion; keep them only if you plan to re-enable agents/diff/providers.

---

## Hardening

- **CORS:** App calls Anthropic/Gemini from the browser; document that users may need to allow the origin or use a proxy if blocked.
- **API keys:** Stored in localStorage; document risk and recommend not using on shared machines.
- **Preview HTML:** Injected into a blob iframe with `sandbox="allow-scripts"` (no same-origin); already locked down; no extra hardening needed for XSS from AI HTML beyond current sanitization.
- **File paths:** Parser and export already use `sanitizeFilePath` / `safeZipPath`; no path traversal found in FileExplorer for opening files (paths come from project store).
- **Enhance payload:** Already capped (`ENHANCE_MAX_TOTAL_CHARS`, `ENHANCE_MAX_PER_FILE`).

---

## Multi-enhance flow (2nd, 3rd, … time)

When the user enhances the same project multiple times, the following happens and where it can go wrong.

### What the code does today

1. **Enhance** sends to the API: `currentDescription` (full accumulated text), latest `instruction`, and `files` (capped: 60k total, 8k per file).
2. **Description** is updated as: `project.description + '\n\nEnhancement: ' + instruction` every time. So after 3 enhances you get: `original + "\n\nEnhancement: A" + "\n\nEnhancement: B" + "\n\nEnhancement: C"`.
3. **Preview** after each enhance is generated with `project.description + '\n\n' + instruction` (accumulated description + latest instruction). Preview is then stored and set as `previewSource: 'description'`.
4. **History**: each enhanced project is pushed to history. So one generate + 3 enhances = 4 history entries (original + after enhance 1, 2, 3).
5. **Tabs**: `setProject(updated)` is called with the new project. In the store, `setProject` does `activeFilePath: null`, `openTabs: []`, then opens only the first file (e.g. `lib/main.dart`). So **all other tabs are closed** on every enhance.
6. **Enhance textarea**: `enhanceInstruction` is **never cleared** after a successful enhance. The same text stays in the box.
7. **Progress UI**: During enhance, `setStep('Enhancing…', 10)` etc. are used, but **`setSteps()` is not called**. The sidebar step list is still the one from the **last full Generate** (e.g. “1. Initializing ✓, 2. Generating ✓, …”). So the user sees “all steps done” from the previous run while the current operation is “Enhancing project… / Updating preview…”.

### Flaws and risks (multi-enhance)

| Issue | Severity | What happens |
|-------|----------|--------------|
| **Tabs reset every enhance** | High | User has 4–5 files open; after each Enhance only the first file stays open. They lose their working context on 2nd/3rd enhance and have to reopen tabs every time. |
| **Enhance instruction not cleared** | High | After “Add dark mode” the textarea still says “Add dark mode”. User can accidentally click Enhance again → same instruction applied twice. Description gets duplicated (“Enhancement: Add dark mode” twice), extra API call, and possible confusion. |
| **Progress steps mismatch** | Medium | Sidebar shows the **generate** steps (all done) while the real operation is “Enhancing…”. Progress bar and `currentStep` text are correct, but the step list is misleading. |
| **Description grows without bound** | Medium | Only **files** are capped (60k total, 8k per file). `currentDescription` and the “Enhancement: …” block are **not** capped. After many enhances the enhance payload can get very large and eventually hit API limits or odd behavior. |
| **History fills with every enhance** | Medium | Each enhance adds one history entry. So “1 generate + 4 enhances” = 5 entries. History (max 5) can become “same app at different enhance stages” with no clear “different app” entries. |
| **No “undo last enhance”** | Low | The only way to go back is to pick an older “Recent build” from history. Users may expect an “Undo last enhance” instead of “Load a previous build”. |
| **Large project + later enhances** | Medium | With many files, the 60k / 8k cap means the model sees only part of the code on 2nd/3rd enhance. New or rarely edited files may be truncated or dropped from context → inconsistent or wrong edits. |
| **Destructive enhance (e.g. “remove X”)** | Low | If the user says “Remove the settings screen”, the API may return fewer files. The app replaces `project.files` entirely with the API response, so that file is gone. No confirmation and no in-app undo (only history). |

### Recommendations (no code changes until you say)

- **Tabs**: Either preserve `openTabs` / `activeFilePath` across enhance (e.g. set project but keep tabs that still exist in the new file set), or at least preserve the **active file** if it still exists in the updated project.
- **Enhance textarea**: Clear `enhanceInstruction` (or set to placeholder) after a successful enhance so the user must type the next instruction and doesn’t re-run the same one by mistake.
- **Progress**: During enhance, show enhance-specific steps (e.g. “Enhancing…”, “Updating preview…”) instead of the last generate steps, or hide the generate step list while `isGenerating` and the last action was enhance.
- **Description cap**: Optionally cap or summarize `project.description` before sending to the enhance API (e.g. last N chars or “last 3 enhancements + original”) so many enhances don’t blow up the payload.
- **History**: Consider not pushing **every** enhance to history (e.g. only push on Generate, or “Add to history” only when user explicitly saves), or show “Enhancement 1/2/3” in history labels so it’s clear they’re the same app.
- **Undo**: Optional “Undo last enhance” that restores the previous project state (e.g. keep last snapshot in memory for one step back).

---

## Summary

| Severity | Count | Suggested order |
|----------|--------|------------------|
| Critical | 2      | Fix first (⌘Enter scope, collapse) |
| High     | 3      | Retry-after NaN, history quota, #root |
| Medium   | 4      | Copy-all order, blob lifecycle, ErrorBoundary, API test |
| Low      | 4      | History index, persist widths, focus trap, copy labels |
| Dead code| Many   | Remove or archive unused agent/diff/providers and duplicate components |
| **Multi-enhance** | See section above | Tabs reset, instruction not cleared, steps mismatch, description/history growth |

Implementing the two critical fixes next is recommended; then high, then medium as needed.
