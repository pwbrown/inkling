/**
 * Turns Claude Code session logs into readable Markdown in docs/transcripts/,
 * so anyone can see how Inky Keys was built (see the README's AI note).
 *
 *   npm run transcript                 # every session for this project
 *   npm run transcript -- <file.jsonl> # specific session logs
 *
 * By default it reads the logs Claude Code keeps for this folder in
 * ~/.claude/projects/<folder>/. Re-running it rewrites each session's file, so
 * a session that kept going is brought up to date.
 *
 * What's kept: the developer's prompts, Claude's replies,
 * plans, questions and answers, and a one-line summary of every tool call
 * (commands are shown, cut short when long). What's left out: tool output,
 * hidden reasoning, system prompts and app reminders. Before writing, it
 * removes email addresses, one-time codes and any words listed in
 * `.private-words`, and replaces the home folder with `~`.
 *
 * Always read the result before committing it: the redaction is a safety net,
 * not a guarantee.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs/transcripts');
const home = homedir();
/** The home folder as Claude Code encodes it in log folder names (`-Users-name-`). */
const encodedHome = home.replace(/[^A-Za-z0-9]/g, '-');

/** The local part of the git email, which can turn up on its own (e.g. in a search). */
function emailUser(): string {
  try {
    const email = execFileSync('git', ['config', 'user.email'], { cwd: root, encoding: 'utf8' }).trim();
    return email.split('@')[0] ?? '';
  } catch {
    return '';
  }
}
/**
 * Extra words to remove, one per line, from `.private-words` at the project
 * root (git-ignored, so the list itself is never published). Use it for
 * account IDs and other details that turn up in commands or URLs. Lines
 * starting with `#` are comments.
 */
function localPrivateWords(): string[] {
  const file = join(root, '.private-words');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));
}
// Longest first, so a full ID is replaced before a fragment of it.
const privateWords = [emailUser(), basename(home), ...localPrivateWords()]
  .filter((w) => w.length >= 4)
  .sort((a, b) => b.length - a.length);

/** Longest command or tool input shown before it's cut short. */
const MAX_INPUT = 600;

/** Tool calls that only drive the app's own UI and say nothing about the build. */
const HIDDEN_TOOLS = new Set(['mcp__ccd_turn__update_plan', 'mcp__ccd_turn__wrap_up', 'ToolSearch']);

interface Block {
  type: string;
  text?: string;
  name?: string;
  id?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: unknown;
}

interface Entry {
  type: string;
  timestamp?: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  isCompactSummary?: boolean;
  message?: { content: string | Block[] };
  attachment?: { type: string; prompt?: string };
}

/** Removes private details. Run on every string that reaches the output. */
export function redact(text: string): string {
  let out = text;
  for (const word of privateWords) out = out.replaceAll(word, '[removed]');
  return out
    .replaceAll(encodedHome, '-~')
    .replace(/[A-Za-z0-9._%+-]+@(?!anthropic\.com)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[email removed]')
    .replaceAll(home, '~')
    .replace(/~\/Library\/Application Support\/Claude\/scratch-workspaces\/[^\s"'`)]*/g, '<scratch folder>')
    .replace(/\/private\/tmp\/claude-\d+\/[^\s"'`)]*/g, '<temp file>')
    // One-time sign-in codes (e.g. GitHub's device codes). Long expired, but no need to publish them.
    .replace(/\b(?=[A-Z0-9]{0,3}\d)(?=[A-Z0-9]{0,3}[A-Z])[A-Z0-9]{4}-[A-Z0-9]{4}\b/g, '[code removed]');
}

/** Strips the app's injected context, leaving only what the person typed. */
function userText(raw: string): string {
  return raw
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/g, '')
    .replace(/<task-notification>[\s\S]*?<\/task-notification>/g, '')
    .replace(/<preview-annotation-context>[\s\S]*?<\/preview-annotation-context>/g, '')
    .replace(/\[Image: source: [^\]]*\]/g, '')
    .replace(/<command-[a-z]+>[\s\S]*?<\/command-[a-z]+>/g, '')
    .replace(/<local-command-[a-z]+>[\s\S]*?<\/local-command-[a-z]+>/g, '')
    .trim();
}

function clip(text: string, max = MAX_INPUT): string {
  return text.length > max ? `${text.slice(0, max)}\n… (${text.length - max} more characters)` : text;
}

function quote(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `> ${line}` : '>'))
    .join('\n');
}

function fence(text: string, lang = ''): string {
  const ticks = text.includes('```') ? '````' : '```';
  return `${ticks}${lang}\n${text}\n${ticks}`;
}

/**
 * The project folder's paths, current and earlier. Sessions from before the
 * folder was renamed (inkling → inky-keys, 2026-11-16) still use the old path.
 */
const rootPrefixes = [root, join(dirname(root), 'inkling')].map((r) => `${r}/`);

function relPath(path: unknown): string {
  const p = String(path ?? '');
  const prefix = rootPrefixes.find((r) => p.startsWith(r));
  return prefix ? p.slice(prefix.length) : p;
}

/** One line (plus an optional code block) describing a tool call. */
function describeTool(block: Block): string {
  const input = block.input ?? {};
  const name = block.name ?? 'tool';
  switch (name) {
    case 'Bash': {
      const what = input.description ? `${String(input.description)}` : 'Ran a command';
      return `- **Shell:** ${what}\n\n${indent(fence(clip(String(input.command ?? '')), 'bash'))}`;
    }
    case 'Read':
      return `- **Read** \`${relPath(input.file_path)}\``;
    case 'Write':
      return `- **Wrote** \`${relPath(input.file_path)}\``;
    case 'Edit':
      return `- **Edited** \`${relPath(input.file_path)}\``;
    case 'WebSearch':
      return `- **Web search:** ${String(input.query ?? '')}`;
    case 'ExitPlanMode':
      return '- **Presented the plan** (shown above)';
    case 'AskUserQuestion':
      return '- **Asked questions** (shown above)';
    default: {
      const short = name.replace(/^mcp__[^_]+(?:_[^_]+)*?__/, '');
      const detail = clip(JSON.stringify(input), 300);
      return `- **${short}** \`${detail.replaceAll('`', "'")}\``;
    }
  }
}

function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n');
}

function resultText(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c: Block) => (c.type === 'text' ? (c.text ?? '') : '')).join('\n');
  }
  return '';
}

/** Renders one session log as Markdown. */
export function renderSession(lines: string[], title: string): { markdown: string; date: string } {
  const entries: Entry[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line) as Entry);
    } catch {
      // Skip a half-written last line.
    }
  }

  // Answers to AskUserQuestion live in the tool result that follows the call.
  const results = new Map<string, string>();
  for (const e of entries) {
    if (e.type !== 'user' || !Array.isArray(e.message?.content)) continue;
    for (const b of e.message.content) {
      if (b.type === 'tool_result' && b.tool_use_id) results.set(b.tool_use_id, resultText(b.content));
    }
  }

  const out: string[] = [];
  let tools: string[] = [];
  let first = '';
  let prompts = 0;

  const flushTools = () => {
    if (!tools.length) return;
    const n = tools.length;
    out.push(
      `<details><summary>${n} tool call${n === 1 ? '' : 's'}</summary>\n\n${tools.join('\n')}\n\n</details>\n`,
    );
    tools = [];
  };

  const pushUser = (text: string, note = '') => {
    flushTools();
    prompts++;
    out.push(`## 🧑 ${note || 'Prompt'}\n\n${quote(text)}\n`);
  };

  for (const e of entries) {
    if (e.isSidechain) continue;
    if (!first && e.timestamp && (e.type === 'user' || e.type === 'assistant')) first = e.timestamp;

    if (e.type === 'attachment' && e.attachment?.type === 'queued_command' && e.attachment.prompt) {
      const text = userText(e.attachment.prompt);
      if (text) pushUser(text, 'Sent while Claude was working');
      continue;
    }

    if (e.type === 'user' && !e.isMeta && e.message) {
      if (e.isCompactSummary) {
        flushTools();
        out.push(
          '---\n\n*The conversation grew too long here, so Claude Code summarized the earlier part and carried on from the summary.*\n\n---\n',
        );
        continue;
      }
      const content = e.message.content;
      if (typeof content === 'string') {
        const text = userText(content);
        if (text) pushUser(text);
        continue;
      }
      const hasImage = content.some((b) => b.type === 'image');
      const text = userText(
        content
          .filter((b) => b.type === 'text')
          .map((b) => b.text ?? '')
          .join('\n'),
      );
      if (text || hasImage) {
        pushUser(text || '(no text)', hasImage ? 'Prompt, with an annotated screenshot of the game' : '');
      }
      continue;
    }

    if (e.type === 'assistant' && Array.isArray(e.message?.content)) {
      for (const b of e.message.content) {
        if (b.type === 'text' && b.text?.trim()) {
          flushTools();
          out.push(`### 🤖 Claude\n\n${b.text.trim()}\n`);
        } else if (b.type === 'tool_use') {
          if (HIDDEN_TOOLS.has(b.name ?? '')) continue;
          if (b.name === 'ExitPlanMode' && b.input?.plan) {
            flushTools();
            out.push(
              `<details><summary><strong>📋 Plan for approval</strong></summary>\n\n${String(b.input.plan)}\n\n</details>\n`,
            );
          }
          if (b.name === 'AskUserQuestion' && Array.isArray(b.input?.questions)) {
            flushTools();
            const qs = (b.input.questions as { question: string; options: { label: string }[] }[])
              .map((q) => `- ${q.question}\n${q.options.map((o) => `  - ${o.label}`).join('\n')}`)
              .join('\n');
            const answer = b.id ? results.get(b.id) : '';
            out.push(`### ❓ Claude asked\n\n${qs}\n\n**Answer:** ${quote(answer || '(none)').slice(2)}\n`);
          }
          tools.push(describeTool(b));
        }
      }
    }
  }
  flushTools();

  const date = (first || new Date().toISOString()).slice(0, 10);
  const header = [
    `# ${title}`,
    '',
    `Claude Code session started ${date}. ${prompts} prompts.`,
    '',
    'Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.',
    '',
    '---',
    '',
  ];
  return { markdown: redact([...header, ...out].join('\n')), date };
}

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50) || 'session'
  );
}

function sessionTitle(file: string): string {
  const meta = join(file.replace(/\.jsonl$/, ''), 'custom-title.json');
  if (existsSync(meta)) {
    try {
      const t = (JSON.parse(readFileSync(meta, 'utf8')) as { customTitle?: string }).customTitle;
      if (t) return t;
    } catch {
      // Fall through to the default.
    }
  }
  return `Session ${basename(file, '.jsonl').slice(0, 8)}`;
}

function defaultLogs(): string[] {
  const dir = join(home, '.claude/projects', root.replace(/[^A-Za-z0-9]/g, '-'));
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.jsonl'))
    .map((f) => join(dir, f));
}

function main() {
  const files = process.argv.slice(2).length ? process.argv.slice(2) : defaultLogs();
  if (!files.length) {
    console.error('No session logs found. Pass .jsonl paths as arguments.');
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });

  for (const file of files) {
    const title = sessionTitle(file);
    const { markdown, date } = renderSession(readFileSync(file, 'utf8').split('\n'), title);
    const name = `${date}-${slug(title)}-${basename(file, '.jsonl').slice(0, 8)}.md`;
    writeFileSync(join(outDir, name), markdown);
    console.log(`Wrote docs/transcripts/${name} (${Math.round(markdown.length / 1024)} KB)`);
  }

  const sessions = readdirSync(outDir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .sort();
  const index = [
    '# How Inky Keys was built',
    '',
    'Inky Keys was written almost entirely by Claude (an AI coding assistant) in Claude Code, from my direction. These are the conversations, in order, so you can see what I asked for, what Claude planned and did, and how the game changed after playtesting.',
    '',
    'Each file is exported from the session log with `npm run transcript` (see `scripts/export-transcript.ts`). Tool output, hidden reasoning and system prompts are left out, and private details are removed.',
    '',
    ...sessions.map((f) => `- [${f.replace(/\.md$/, '')}](${f})`),
    '',
  ];
  writeFileSync(join(outDir, 'README.md'), index.join('\n'));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
