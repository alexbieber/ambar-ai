/**
 * System prompts for FlutterForge AI.
 * Built from agent/instructions.ts — single source of truth.
 */

import {
  IDENTITY,
  OUTPUT_XML_ONLY,
  PROJECT_STRUCTURE,
  CODE_QUALITY,
  DESIGN_RULES,
  INTERACTIVITY_RULES,
  PLAN_THEN_BUILD,
  PLAN_IMPLEMENTATION_MANDATE,
  IMAGES_UNSPLASH,
  ENHANCE_IDENTITY,
  ENHANCE_INPUT,
  ENHANCE_OUTPUT,
  PREVIEW_INTERACTIVITY,
  PREVIEW_HTML_RULES,
  EDIT_IDENTITY,
  EDIT_INPUT,
  EDIT_OUTPUT,
  BEHAVIOR_GUARD,
} from './instructions';

/** Full project generation from a single user description. */
export const FLUTTER_SYSTEM_PROMPT = `${IDENTITY}
Generate a COMPLETE, multi-file Flutter project from a single user description.

${OUTPUT_XML_ONLY}

${PROJECT_STRUCTURE}

${CODE_QUALITY}

${DESIGN_RULES}

${IMAGES_UNSPLASH}

${BEHAVIOR_GUARD}`;

/** Plan-then-build: one response = markdown spec + project XML. Fully interactive app. */
export const GENERATE_WITH_PLAN_SYSTEM_PROMPT = `${IDENTITY}
Generate a COMPLETE, multi-file Flutter project from the user's app description. First plan (markdown), then implement (XML). The app must be fully interactive — every button and action must work.

${PLAN_THEN_BUILD}

${PLAN_IMPLEMENTATION_MANDATE}

${PROJECT_STRUCTURE}

${CODE_QUALITY}

${INTERACTIVITY_RULES}

${DESIGN_RULES}

${IMAGES_UNSPLASH}

Output rules: Your response must start with the markdown spec (no code fences around it). After a blank line, output only the <project>...</project> XML. No other text after the XML. First character of your response should be # or <. ${BEHAVIOR_GUARD}`;

/** Enhance existing project (add/change features, same XML output). */
export const ENHANCE_SYSTEM_PROMPT = `${ENHANCE_IDENTITY}

${ENHANCE_INPUT}

${ENHANCE_OUTPUT}

${BEHAVIOR_GUARD}`;

/** Generate a single HTML preview from app description. */
export const PREVIEW_SYSTEM_PROMPT = `You are a mobile UI renderer. Given a Flutter app description, produce a SINGLE
self-contained HTML file (starting with <!DOCTYPE html>) that looks AND works like the app.

${PREVIEW_INTERACTIVITY}

${PREVIEW_HTML_RULES}

${BEHAVIOR_GUARD}`;

/** Generate HTML preview from existing Dart code. */
export const CODE_TO_HTML_PREVIEW_PROMPT = `You are a mobile UI renderer. You will receive Flutter/Dart code. Produce a SINGLE self-contained HTML file (starting with <!DOCTYPE html>) that looks like the app that code would render.

Use the SAME conventions as the description-based preview:
• Real <button> or data-action for tappable elements.
• Tabs: data-tab="panelId" on tab, id="panelId" data-panel on content.
• Bottom nav: data-nav="screenId" on nav items, id="screenId" data-screen on each screen.
• body { margin: 0; overflow: hidden; width: 390px; height: 760px; font-family: Roboto, sans-serif; }
• Include status bar; use Material 3 colors. Output raw HTML only — no markdown, no explanation.

${BEHAVIOR_GUARD}`;

/** Single-file edit (output is raw file content, no XML). */
export const EDIT_SYSTEM_PROMPT = `${EDIT_IDENTITY}

${EDIT_INPUT}

${EDIT_OUTPUT}

${BEHAVIOR_GUARD}`;

/**
 * Chat/assistant system prompt. Prepend project context when calling.
 * Usage: getChatSystemPrompt(projectSummary)
 */
export function getChatSystemPrompt(projectSummary: string): string {
  return `You are FlutterForge AI. The user is working on a Flutter project. Answer questions about the project and suggest code when relevant.

${projectSummary}

${BEHAVIOR_GUARD}`;
}
