#!/usr/bin/env node
// PostTaskExec hook. Appends one line per finished spec task to docs/kiro-journal.md.
// The journal is the raw material for the hackathon write-up, so it must be a true record:
// this script only writes what Kiro's hook payload says, plus a timestamp.
// Costs no credits. Always exits 0.
import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { findValue, parseJson, readStdin, stamp, truncate } from './lib.mjs';

const JOURNAL = 'docs/kiro-journal.md';
const payload = parseJson(await readStdin()) ?? {};

// Field names Kiro might use. If your journal shows "payload fields: ..." instead of task names,
// add the names you see there to these lists.
const SPEC_KEYS = ['specName', 'spec_name', 'spec', 'specId', 'spec_id', 'feature'];
const TASK_ID_KEYS = ['taskId', 'task_id', 'taskNumber', 'task_number'];
const TASK_TITLE_KEYS = ['taskTitle', 'task_title', 'taskName', 'task_name', 'title', 'task'];

const taskObject = payload.task && typeof payload.task === 'object' ? payload.task : undefined;
const spec = findValue(payload, SPEC_KEYS);
const taskId =
  findValue(payload, TASK_ID_KEYS) ?? (taskObject ? findValue(taskObject, ['id', 'number', 'index']) : undefined);
const title = findValue(payload, TASK_TITLE_KEYS);
const session = findValue(payload, ['session_id', 'sessionId']);
const event = findValue(payload, ['hook_event_name', 'hookEventName', 'event']) ?? 'PostTaskExec';

let what = [spec && `spec ${spec}`, taskId && `task ${taskId}`, title && `"${truncate(title)}"`]
  .filter(Boolean)
  .join(' · ');
if (!what) {
  const keys = Object.keys(payload);
  what = keys.length ? `task finished (payload fields: ${keys.join(', ')})` : 'task finished';
}

const line = `- ${stamp()} · ${event} · ${what}${session ? ` · session ${String(session).slice(0, 8)}` : ''}\n`;

try {
  if (!existsSync('docs')) mkdirSync('docs', { recursive: true });
  if (!existsSync(JOURNAL)) {
    writeFileSync(JOURNAL, '# Kiro build journal\n\n## Automatic log (written by the build-journal hook)\n\n');
  }
  appendFileSync(JOURNAL, line);
} catch (err) {
  console.error(`[Dead Air] journal hook could not write ${JOURNAL}: ${err.message}`);
}
process.exit(0);
