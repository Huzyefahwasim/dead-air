#!/usr/bin/env node
// PostFileSave hook. Formats the file the agent just saved with Prettier, if Prettier is installed.
// Usage: node scripts/hooks/format.mjs "<path>"   (falls back to the JSON payload on stdin)
// Costs no credits. Always exits 0 so formatting can never break the agent's work.
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, relative, resolve, sep } from 'node:path';
import { findValue, parseJson, readStdin } from './lib.mjs';

const EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.js', '.mjs', '.cjs', '.json', '.css']);

let file = process.argv[2];
if (!file || file.includes('{{')) {
  // The {{filePath}} template was not substituted: look in the hook payload instead.
  const payload = parseJson(await readStdin());
  file = payload ? findValue(payload, ['filePath', 'file_path', 'path', 'file']) : undefined;
}
if (!file) process.exit(0);

const abs = resolve(file);
const rel = relative(process.cwd(), abs);
const parts = rel.split(sep);
const skip =
  rel.startsWith('..') || // outside the workspace
  !existsSync(abs) ||
  !EXTENSIONS.has(extname(abs)) ||
  parts[0] === '.kiro' || // never reformat Kiro's own files
  parts.includes('node_modules') ||
  parts.includes('dist');
if (skip) process.exit(0);

// Run Prettier's JS entry point with the current Node binary: no shell, works on every OS.
const entry = ['node_modules/prettier/bin/prettier.cjs', 'node_modules/prettier/bin-prettier.js']
  .map((p) => resolve(p))
  .find((p) => existsSync(p));
if (!entry) process.exit(0); // Prettier not installed yet

spawnSync(process.execPath, [entry, '--write', '--log-level', 'warn', abs], { stdio: 'inherit' });
process.exit(0);
