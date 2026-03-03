#!/usr/bin/env node
/**
 * One-off: call proxy /api/generate and write the returned Flutter project to a folder.
 * Usage: API_KEY=your_gemini_key node scripts/generate-and-save.mjs "Your prompt"
 * Or:    node scripts/generate-and-save.mjs "Your prompt"  (uses API_KEY env)
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const apiKey = process.env.API_KEY;
const prompt = process.argv[2] || 'A finance tracker with charts, dark theme and expense categories';

if (!apiKey) {
  console.error('Set API_KEY environment variable. Example: API_KEY=xxx node scripts/generate-and-save.mjs "prompt"');
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), 'finance_tracker_app');

function extractProjectJson(responseText) {
  let jsonText = responseText;
  // Strip markdown code block if present
  if (responseText.includes('```')) {
    const m = responseText.match(/```(?:json)?\n?([\s\S]*?)```/);
    if (m) jsonText = m[1].trim();
  }
  // Find the outermost { ... } that contains "files"
  const start = jsonText.indexOf('{');
  if (start === -1) throw new Error('No JSON object in response');
  let depth = 0;
  let end = -1;
  for (let i = start; i < jsonText.length; i++) {
    if (jsonText[i] === '{') depth++;
    if (jsonText[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) throw new Error('Unbalanced braces');
  jsonText = jsonText.slice(start, end + 1);
  // Fix common issues: unescaped newlines in strings (replace \n that aren't \\n with \\n in string values is tricky - try parse first)
  try {
    return JSON.parse(jsonText);
  } catch (e) {
    // On failure, save raw slice for debugging
    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'last_response_slice.txt'), jsonText.slice(0, 3000), 'utf8');
    throw e;
  }
}

async function main() {
  console.log('Calling API...');
  const res = await fetch('http://localhost:3001/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      prompt,
      type: 'code',
      provider: 'gemini',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('API error:', res.status, err.error || res.statusText);
    process.exit(1);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text?.trim() || data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (!text) {
    console.error('Empty response');
    process.exit(1);
  }

  let parsed;
  try {
    parsed = extractProjectJson(text);
  } catch (e) {
    fs.writeFileSync(path.join(process.cwd(), 'scripts', 'last_full_response.txt'), text, 'utf8');
    console.error('Parse failed. Full response saved to scripts/last_full_response.txt');
    throw e;
  }
  if (!parsed || !parsed.files || typeof parsed.files !== 'object') {
    console.error('Response has no "files" object');
    process.exit(1);
  }

  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true });
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const [filePath, content] of Object.entries(parsed.files)) {
    const fullPath = path.join(OUT_DIR, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('  wrote', filePath);
  }

  console.log('\nDone. Project saved to:', OUT_DIR);
  console.log('Run: cd finance_tracker_app && flutter pub get && flutter run');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
