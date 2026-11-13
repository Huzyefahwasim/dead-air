#!/usr/bin/env node
// SessionStart hook. Prints the next milestone and a few repository health checks.
// Costs no credits. Always exits 0 so it can never block a session.
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const lines = [];
const warn = [];

// 1. Next unticked milestone from docs/status.md
try {
  const status = readFileSync('docs/status.md', 'utf8');
  const next = status.split(/\r?\n/).find((l) => /^\s*- \[ \]/.test(l));
  lines.push(
    next
      ? `Next milestone: ${next.replace(/^\s*- \[ \]\s*/, '').trim()}`
      : 'Every milestone in docs/status.md is ticked.',
  );
} catch {
  warn.push('docs/status.md is missing.');
}

// 2. .kiro must be committed: it must never be ignored (hackathon disqualification risk)
try {
  if (existsSync('.gitignore')) {
    const bad = readFileSync('.gitignore', 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))
      .filter((l) => /^\/?(\*\*\/)?\.kiro(\/.*)?$/.test(l));
    if (bad.length) warn.push(`.gitignore ignores Kiro files (${bad.join(', ')}). Remove those lines.`);
  }
} catch {
  /* ignore */
}

// 3. License file at the root
if (!['LICENSE', 'LICENSE.md', 'LICENSE.txt'].some((f) => existsSync(f))) {
  warn.push('No LICENSE file at the repository root.');
}

// 4. Kiro folders the rules ask for
for (const dir of ['.kiro/steering', '.kiro/hooks']) {
  if (!existsSync(dir)) warn.push(`${dir} is missing.`);
}
try {
  const specs = existsSync('.kiro/specs')
    ? readdirSync('.kiro/specs', { withFileTypes: true }).filter((d) => d.isDirectory()).length
    : 0;
  lines.push(`Specs so far: ${specs}.`);
} catch {
  /* ignore */
}

console.log('[Dead Air] ' + lines.join(' '));
if (warn.length) console.log('[Dead Air] WARNING: ' + warn.join(' '));
console.log('[Dead Air] Follow .kiro/steering/working-agreement.md. Briefs are in docs/briefs/.');
process.exit(0);
