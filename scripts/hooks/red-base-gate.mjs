#!/usr/bin/env node
// PreTaskExec hook (shipped disabled). Refuses to start a new spec task while the type check
// or the test suite is failing, so new work is never stacked on a broken base.
// Exit code 2 tells Kiro to block the task. Exit code 0 lets it run.
// Costs no credits, but adds the duration of `npm run typecheck` and `npm test` before each task.
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('package.json') || !existsSync('node_modules')) process.exit(0); // nothing to check yet

let scripts = {};
try {
  scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts ?? {};
} catch {
  process.exit(0);
}

const checks = [
  ['typecheck', 'npm run -s typecheck'],
  ['test', 'npm test --silent'],
].filter(([name]) => typeof scripts[name] === 'string');

for (const [name, command] of checks) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8', timeout: 240_000 });
  if (result.error && result.error.code === 'ETIMEDOUT') {
    console.error(`[Dead Air] "${command}" took longer than 4 minutes. Letting the task start.`);
    continue;
  }
  if (result.status !== 0) {
    const tail = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim().split(/\r?\n/).slice(-25).join('\n');
    console.error(`[Dead Air] Task blocked: "${command}" is failing (${name}).`);
    console.error(tail);
    console.error('[Dead Air] Fix this first (ask in chat: "make typecheck and tests pass without changing any test"), then start the task again.');
    process.exit(2);
  }
}
process.exit(0);
