// Shared helpers for the Kiro hook scripts. No dependencies. Works on macOS, Linux and Windows.

/**
 * Read all of stdin as text without ever hanging.
 * Kiro pipes a JSON context object to command hooks. If nothing arrives, resolve with ''.
 */
export function readStdin(timeoutMs = 800) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) return resolve('');
    let data = '';
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        process.stdin.pause();
      } catch {
        /* ignore */
      }
      resolve(data);
    };
    const timer = setTimeout(done, timeoutMs);
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
    });
    process.stdin.on('end', done);
    process.stdin.on('error', done);
  });
}

/** JSON.parse that returns null instead of throwing. */
export function parseJson(text) {
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Find the first string (or number) stored under any of `keys`, searching nested objects.
 * The exact shape of Kiro's hook payload is not something these scripts rely on.
 */
export function findValue(obj, keys, depth = 0) {
  if (obj === null || typeof obj !== 'object' || depth > 4) return undefined;
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = findValue(v, keys, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Shorten a string for one-line logs. */
export function truncate(text, max = 100) {
  const s = String(text).replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Local timestamp like 2026-11-12 14:03. */
export function stamp(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`;
}
