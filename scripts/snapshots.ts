/**
 * Takes a standard set of screenshots of the game for the progression
 * gallery in docs/progression/ (see its README).
 *
 *   npm run snapshots -- m15        # writes docs/progression/m15/*.png
 *   npm run snapshots -- latest     # refreshes the "latest" column
 *
 * It starts the Vite dev server (which exposes `window.inkling`, see
 * src/main.ts), opens headless Chrome, and drives the game over the Chrome
 * DevTools Protocol: menus by clicking buttons by their text, and gameplay
 * with a little auto-typer that reads the targets from the world. One shot is
 * staged: "lineup" replaces the targets with one of every kind and variant so
 * creature looks can be compared between versions.
 *
 * Needs Google Chrome or Chromium (set CHROME_PATH if it isn't found) and
 * Node 22+ (for the built-in WebSocket). Nothing here touches the network
 * beyond localhost.
 *
 * When a milestone adds a new screen, add a step to TOUR below so later
 * milestones keep capturing it.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const folder = process.argv[2];
if (!folder || !/^[\w-]+$/.test(folder)) {
  console.error('Usage: npm run snapshots -- <folder>   (for example m15 or latest)');
  process.exit(1);
}
const outDir = join(root, 'docs/progression', folder);
const WIDTH = 1280;
const HEIGHT = 800;

type Step =
  | { shot: string }
  | { wait: number }
  | { key: string }
  | { click: string }
  | { eval: string }
  | { play: number; maxX?: number };

/** Scroll every scrolled box back to the top, so long dialogs show their start. */
const SCROLL_TOP = `document.querySelectorAll('*').forEach((e) => { if (e.scrollTop) e.scrollTop = 0; })`;

/** Swap the targets for one of each kind and variant, barely moving. */
const LINEUP = `(() => {
  const w = window.inkling.world;
  const base = w.targets[0];
  if (!base) return 'no targets yet';
  const make = (o) => ({ ...base, typed: 0, buffer: undefined, cursor: undefined, lives: 1, maxLives: undefined,
    ghost: false, boss: false, speed: 4, ...o, y: 120 + o.lane * 48, prevX: o.x, id: w.nextId++ });
  const items = [
    { kind: 'drip', text: 'f', x: 520, lane: 0 },
    { kind: 'blotling', text: 'quill', x: 760, lane: 2 },
    { kind: 'blotling', text: 'ink', x: 1000, lane: 4, lives: 2, maxLives: 2 },
    { kind: 'blotling', text: 'pen', x: 640, lane: 6, lives: 3, maxLives: 3 },
    { kind: 'runon', text: 'ink pot', buffer: '', cursor: 0, x: 860, lane: 8 },
  ];
  w.page.spawned += items.length - w.targets.length;
  w.targets = items.map(make);
  w.lockedId = null;
  return 'ok';
})()`;

/** Scrolls Settings to the keyboard layout choice, if there is one. */
const SHOW_LAYOUT = `(() => {
  const legend = [...document.querySelectorAll('.settings legend')].find((l) => /layout/i.test(l.textContent));
  if (legend) legend.scrollIntoView({ block: 'center' });
  return 'ok';
})()`;

/** Scrolls How to play to its bosses, if it has a section for them (M19). */
const SHOW_BOSSES = `(() => {
  const heading = [...document.querySelectorAll('.how-section h3')].find((h) => /boss/i.test(h.textContent));
  if (heading) heading.scrollIntoView({ block: 'start' });
  return 'ok';
})()`;

/**
 * A sample Daily Page history for the shot (M20): a three-day streak that
 * includes today, so the streak strip, page grades and share text all show.
 * Only in memory, for the picture; nothing is saved.
 */
const SAMPLE_DAILY = `(() => {
  const store = window.inkling && window.inkling.store;
  if (!store || !store.data.daily) return 'no daily';
  const now = new Date();
  const today = Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(2026, 10, 17)) / 86400000) + 1;
  const result = (score, grades) => ({ score, grades, wpm: 38, accuracy: 96, finished: true });
  store.data.daily = {
    lastId: today,
    streak: 3,
    bestStreak: 5,
    best: 6120,
    results: {
      [today - 2]: result(4410, ['A', 'B', 'A']),
      [today - 1]: result(5230, ['A+', 'A', 'B']),
      [today]: result(4820, ['A+', 'B', 'C']),
    },
  };
  return 'ok';
})()`;

/** The next character the auto-typer should press, or '' to wait. */
const NEXT_KEY = (maxX: number) => `(() => {
  const w = window.inkling && window.inkling.world;
  if (!w || !w.targets) return '';
  const live = w.targets.filter((t) => t.typed < t.text.length && t.buffer === undefined && t.x < ${maxX});
  if (!live.length) return '';
  const t = live.find((t) => t.typed > 0) || live.sort((a, b) => a.x - b.x)[0];
  return t.text[t.typed];
})()`;

/** The free-play mode's button: "Free Write" since M17, "Practice" before. */
const FREE_WRITE = 'Free Write|Practice';

const TOUR: Step[] = [
  { shot: 'menu' },
  { click: 'Desk' }, { eval: SCROLL_TOP }, { shot: 'desk' }, { key: 'Escape' },
  { click: 'Switch player' }, { shot: 'players' }, { key: 'Escape' },
  { click: 'Settings' }, { shot: 'settings' }, { key: 'Escape' },
  // Another keyboard layout (M16): the Type Case and the first chapter card follow it.
  { click: 'Settings' }, { click: 'Dvorak' }, { eval: SHOW_LAYOUT }, { shot: 'settings-layout' }, { key: 'Escape' },
  { click: FREE_WRITE }, { click: 'Change keys' }, { shot: 'type-case-dvorak' }, { key: 'Escape' }, { key: 'Escape' },
  { click: 'Apprentice' }, { click: 'Chapter 1' }, { shot: 'chapter-intro-dvorak' }, { key: 'Escape' }, { key: 'Escape' },
  { click: 'Settings' }, { click: 'US QWERTY' }, { key: 'Escape' },
  { click: 'How to play' }, { eval: SCROLL_TOP }, { shot: 'how-to-play' },
  { eval: SHOW_BOSSES }, { wait: 300 }, { shot: 'how-to-play-bosses' }, { key: 'Escape' },
  // The Daily Page (M20), with a sample streak.
  { eval: SAMPLE_DAILY }, { click: 'Daily Page' }, { eval: SCROLL_TOP }, { shot: 'daily' }, { key: 'Escape' },
  { click: FREE_WRITE }, { shot: 'practice' },
  { click: 'Change keys' }, { shot: 'type-case' }, { key: 'Escape' },
  // A fresh player gets the "New on this page" briefing before their first page.
  { click: 'Start writing' }, { wait: 800 }, { shot: 'briefing' }, { key: 'Enter' },
  { wait: 4000 }, { eval: LINEUP }, { wait: 700 }, { shot: 'lineup' },
  { key: 'Escape' }, { click: 'Quit to menu' },
  { click: 'Apprentice' }, { shot: 'contents' },
  { click: 'Chapter 1' }, { shot: 'chapter-intro' }, { key: 'Enter' },
  { play: 8000, maxX: 700 }, { shot: 'play' },
  { key: 'Escape' }, { shot: 'pause' }, { key: 'Escape' },
  // Let the grade stamp and the stars fill in before the shot.
  { play: 60000, maxX: 1000 }, { wait: 1500 }, { shot: 'page-done' },
];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error('Chrome not found: set CHROME_PATH');
  return found;
}

const server = await createServer({ root, logLevel: 'error', server: { port: 5199, strictPort: false } });
await server.listen();
const url = server.resolvedUrls?.local[0] ?? 'http://localhost:5199/';

const profile = mkdtempSync(join(tmpdir(), 'inkling-snapshots-'));
const debugPort = 9400 + Math.floor(Math.random() * 400);
const chrome = spawn(findChrome(), [
  '--headless=new', `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`,
  `--window-size=${WIDTH},${HEIGHT}`, '--hide-scrollbars', '--mute-audio', 'about:blank',
], { stdio: 'ignore' });

let pageSocketUrl = '';
for (let i = 0; i < 50 && !pageSocketUrl; i++) {
  try {
    const targets = (await (await fetch(`http://127.0.0.1:${debugPort}/json`)).json()) as { type: string; webSocketDebuggerUrl: string }[];
    pageSocketUrl = targets.find((t) => t.type === 'page')?.webSocketDebuggerUrl ?? '';
  } catch {
    await sleep(200);
  }
}
if (!pageSocketUrl) throw new Error('Could not connect to Chrome');

const socket = new WebSocket(pageSocketUrl);
await new Promise((resolve) => socket.addEventListener('open', resolve));
let nextId = 0;
const pending = new Map<number, (result: Record<string, unknown>) => void>();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data)) as { id?: number; result?: Record<string, unknown> };
  if (message.id !== undefined) pending.get(message.id)?.(message.result ?? {});
});
function send(method: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const id = ++nextId;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    socket.send(JSON.stringify({ id, method, params }));
  });
}
async function evaluate(expression: string): Promise<unknown> {
  const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  return (reply.result as { value?: unknown } | undefined)?.value;
}

const SPECIAL_KEYS: Record<string, number> = { Enter: 13, Escape: 27, Tab: 9, Backspace: 8 };
async function press(key: string): Promise<void> {
  const special = key in SPECIAL_KEYS;
  const code = special ? key : key === ' ' ? 'Space' : `Key${key.toUpperCase()}`;
  const base = { key, code, windowsVirtualKeyCode: SPECIAL_KEYS[key] ?? key.toUpperCase().charCodeAt(0) };
  const text = key === 'Enter' ? { text: '\r' } : special ? {} : { text: key };
  await send('Input.dispatchKeyEvent', { type: special ? 'rawKeyDown' : 'keyDown', ...base, ...text });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}

/**
 * Clicks the first visible, enabled button (else list item or label) whose
 * text contains `label`. `label` may list alternatives as "A|B" (first match
 * wins), for buttons renamed between milestones.
 */
async function click(label: string): Promise<void> {
  const ok = await evaluate(`(() => {
    const options = ${JSON.stringify(label.toLowerCase().split('|'))};
    const find = (sel, q) => [...document.querySelectorAll(sel)].find((e) =>
      e.offsetParent !== null && !e.disabled && e.textContent.trim().toLowerCase().includes(q));
    for (const q of options) {
      const el = find('button, a, [role=button]', q) || find('li, label', q);
      if (el) {
        el.click();
        return true;
      }
    }
    return false;
  })()`);
  if (!ok) console.warn(`  (no "${label}" button on screen; skipped)`);
}

try {
  mkdirSync(outDir, { recursive: true });
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url });
  for (let i = 0; i < 100 && !(await evaluate('Boolean(window.inkling)')); i++) await sleep(200);
  await sleep(1000);

  for (const step of TOUR) {
    if ('shot' in step) {
      const { data } = (await send('Page.captureScreenshot', { format: 'png' })) as { data: string };
      writeFileSync(join(outDir, `${step.shot}.png`), Buffer.from(data, 'base64'));
      console.log(`  ${folder}/${step.shot}.png`);
    } else if ('wait' in step) {
      await sleep(step.wait);
    } else if ('key' in step) {
      await press(step.key);
      await sleep(400);
    } else if ('click' in step) {
      await click(step.click);
      await sleep(900);
    } else if ('eval' in step) {
      await evaluate(step.eval);
    } else {
      const end = Date.now() + step.play;
      const nextKey = NEXT_KEY(step.maxX ?? 700);
      while (Date.now() < end) {
        if (await evaluate("window.inkling.world.phase !== 'playing'")) break;
        const key = await evaluate(nextKey);
        if (typeof key === 'string' && key) await press(key);
        await sleep(typeof key === 'string' && key ? 80 : 150);
      }
      await sleep(800);
    }
  }
} finally {
  socket.close();
  chrome.kill();
  await server.close();
  await sleep(500);
  rmSync(profile, { recursive: true, force: true });
}
