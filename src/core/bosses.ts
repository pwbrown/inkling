/**
 * Bosses (GAME_CONFIG.boss): one arrives first on the last page of a
 * chapter, taking turns chapter by chapter (bossFor in campaign.ts).
 *
 * Every boss is made of ordinary Scrawler targets with `boss: true`, so
 * typing, the zoom-in, the Blotter (which can't touch them) and page
 * clearing work as for any creature. What makes each one different lives
 * here: how it arrives, what it does each step, which of its parts can be
 * started, and what happens when a part is beaten.
 */
import { DIFFICULTY_PROFILES, GAME_CONFIG, type BossKind } from './config';
import { SPAWN_X, WORLD_WIDTH, estimateWidth, laneCount, laneY, rngFor, spawnTarget, type Target, type World } from './world';

/** The word complexity bosses use: a notch above the page. */
function bossComplexity(world: World): number {
  return Math.min(1, world.page.params.complexity + GAME_CONFIG.boss.complexityBonus);
}

/** A fresh word for a boss, different from `previous` when possible. */
export function bossWord(world: World, previous = '', complexity = bossComplexity(world)): string {
  const random = rngFor(world, 'boss', world.page.chapter, world.page.index, previous);
  let word = world.content.nextWord(complexity, random);
  for (let i = 0; i < 12 && word === previous; i++) word = world.content.nextWord(complexity, random);
  return word;
}

/** A short, easy word for a Bookworm segment or Squid tentacle (`part` numbers them, for seeded pages). */
export function partWord(world: World, part = 0): string {
  const max = GAME_CONFIG.boss.partWordMax;
  const random = rngFor(world, 'part', world.page.chapter, world.page.index, part);
  let best = world.content.nextWord(0, random);
  for (let i = 0; i < 10 && [...best].length > max; i++) {
    const next = world.content.nextWord(0, random);
    if ([...next].length < [...best].length) best = next;
  }
  return best;
}

/** The boss a part belongs to (a whole boss is its own group). */
export function bossGroup(target: Target): number {
  return target.partOf ?? target.id;
}

/** Bring on this page's boss. Returns its main target. */
export function spawnBoss(world: World, kind: BossKind): Target {
  const b = GAME_CONFIG.boss;
  const { params } = world.page;
  const middle = Math.floor(laneCount(world.laneStep) / 2);
  let main: Target;
  switch (kind) {
    case 'bookworm':
      main = spawnBookworm(world, middle);
      break;
    case 'squid':
      main = spawnSquid(world, middle);
      break;
    default:
      main = spawnTarget(world, {
        kind: 'blotling',
        lane: middle,
        text: bossWord(world),
        lives: b.lives,
        ghost: false,
        boss: true,
        bossKind: kind,
        speed: params.speed * b.speedFactor,
        ...(kind === 'shuffler' ? { bossTimerMs: b.shuffler.shuffleMs } : {}),
        ...(kind === 'quill' ? { rival: 0, bossTimerMs: b.quill.startDelayMs } : {}),
      })!;
  }
  world.page.bossSpawned = true;
  world.events.push({ type: 'boss', target: main });
  return main;
}

/** A chain of short-word segments in one lane, nose to tail, typed head first. */
function spawnBookworm(world: World, lane: number): Target {
  const w = GAME_CONFIG.boss.bookworm;
  const count = Math.min(w.segmentsMax, w.segmentsMin + Math.floor(world.page.chapter / 3));
  const speed = world.page.params.speed * w.speedFactor;
  let head: Target | null = null;
  let x = SPAWN_X;
  for (let i = 0; i < count; i++) {
    const segment: Target = spawnTarget(world, {
      kind: 'blotling',
      lane,
      x,
      prevX: x,
      y: laneY(lane, world.laneStep),
      text: partWord(world, i),
      lives: 1,
      ghost: false,
      boss: true,
      bossKind: 'bookworm',
      speed,
      entering: true,
      partIndex: i,
      ...(head ? { partOf: head.id } : { head: true }),
    })!;
    head ??= segment;
    x += estimateWidth(segment, world.targetScale) + GAME_CONFIG.entry.gapPx;
  }
  return head!;
}

/** A body word in the middle, with tentacle words above and below that must go first. */
function spawnSquid(world: World, middle: number): Target {
  const s = GAME_CONFIG.boss.squid;
  const speed = world.page.params.speed * s.speedFactor;
  const body = spawnTarget(world, {
    kind: 'blotling',
    lane: middle,
    text: bossWord(world),
    lives: s.lives,
    maxLives: s.lives,
    ghost: false,
    boss: true,
    bossKind: 'squid',
    speed,
  })!;
  const lanes = laneCount(world.laneStep);
  const used = new Set([middle]);
  const offsets = [-2, 2, -4, 4, -1, 1, -3, 3];
  for (let i = 0, made = 0; i < offsets.length && made < s.tentacles; i++) {
    const lane = middle + offsets[i]!;
    if (lane < 0 || lane >= lanes || used.has(lane)) continue;
    used.add(lane);
    const x = SPAWN_X + 50 * (made + 1);
    spawnTarget(world, {
      kind: 'blotling',
      lane,
      x,
      prevX: x,
      y: laneY(lane, world.laneStep),
      text: partWord(world, made),
      lives: 1,
      ghost: false,
      boss: true,
      bossKind: 'squid',
      partOf: body.id,
      speed,
      entering: true,
      partIndex: made,
      // Staggered, so the squirts don't all come at once.
      bossTimerMs: s.squirtMs * (1 + made * 0.35),
    });
    made++;
  }
  return body;
}

/** Can typing start on this target? Only a Bookworm's head, and a Squid's body once its tentacles are gone. */
export function canStart(world: World, target: Target): boolean {
  if (target.bossKind === 'bookworm') return target.head === true;
  if (target.bossKind === 'squid' && target.partOf === undefined) {
    return !world.targets.some((t) => t.partOf === target.id);
  }
  return true;
}

/** Shuffle the letters not yet typed, so the rest reads differently (when it can). */
export function shuffleRest(target: Target, random: () => number): boolean {
  const chars = [...target.text];
  const done = chars.slice(0, target.typed);
  const rest = chars.slice(target.typed);
  if (new Set(rest).size < 2) return false;
  const before = rest.join('');
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rest[i], rest[j]] = [rest[j]!, rest[i]!];
    }
    if (rest.join('') !== before) break;
  }
  if (rest.join('') === before) return false;
  target.text = [...done, ...rest].join('');
  return true;
}

/** One step of every boss on the page. Runs before targets move. */
export function stepBosses(world: World, stepMs: number): void {
  const b = GAME_CONFIG.boss;
  world.smudges = world.smudges.map((s) => ({ ...s, ms: s.ms - stepMs })).filter((s) => s.ms > 0);
  if (!world.targets.some((t) => t.boss)) return;

  // The Bookworm's head is whichever segment is nearest the margin.
  const heads = new Map<number, Target>();
  for (const t of world.targets) {
    if (t.bossKind !== 'bookworm') continue;
    const best = heads.get(bossGroup(t));
    if (!best || t.x < best.x) heads.set(bossGroup(t), t);
  }
  for (const t of world.targets) if (t.bossKind === 'bookworm') t.head = heads.get(bossGroup(t)) === t;

  for (const t of world.targets) {
    if (!t.boss || t.entering) continue;
    if (t.bossKind === 'shuffler') {
      t.bossTimerMs = (t.bossTimerMs ?? b.shuffler.shuffleMs) - stepMs;
      if (t.bossTimerMs <= 0) {
        t.bossTimerMs = b.shuffler.shuffleMs;
        if (shuffleRest(t, world.random)) world.events.push({ type: 'bossShuffled', target: t });
      }
    } else if (t.bossKind === 'squid' && t.partOf !== undefined) {
      // A tentacle you're typing doesn't squirt.
      if (world.lockedId === t.id) continue;
      t.bossTimerMs = (t.bossTimerMs ?? b.squid.squirtMs) - stepMs;
      if (t.bossTimerMs <= 0) {
        t.bossTimerMs = b.squid.squirtMs;
        const lane = squirtLane(world, t);
        world.smudges = [...world.smudges.filter((s) => s.lane !== lane), { lane, ms: b.squid.smudgeMs }];
        world.events.push({ type: 'squirt', target: t, lane });
      }
    } else if (t.bossKind === 'quill') {
      stepQuill(world, t, stepMs);
    }
  }
}

/** The lane a tentacle squirts: one with a creature in it, preferring one near the tentacle. */
function squirtLane(world: World, tentacle: Target): number {
  const busy = [...new Set(world.targets.filter((t) => t.x < WORLD_WIDTH && t.partOf === undefined).map((t) => t.lane))];
  if (busy.length === 0) return tentacle.lane;
  busy.sort((a, b) => Math.abs(a - tentacle.lane) - Math.abs(b - tentacle.lane));
  return busy[Math.floor(world.random() * Math.min(2, busy.length))]!;
}

/** Letters a second the rival quill writes on this page. */
export function quillSpeed(world: World): number {
  const base = GAME_CONFIG.base.blotling.speed * DIFFICULTY_PROFILES[world.difficulty].speed;
  const pace = Math.min(1.6, Math.max(0.6, world.page.params.speed / base));
  return GAME_CONFIG.boss.quill.cps * pace;
}

function stepQuill(world: World, t: Target, stepMs: number): void {
  const q = GAME_CONFIG.boss.quill;
  if ((t.bossTimerMs ?? 0) > 0) {
    t.bossTimerMs = Math.max(0, (t.bossTimerMs ?? 0) - stepMs);
    return;
  }
  t.rival = (t.rival ?? 0) + (quillSpeed(world) * stepMs) / 1000;
  if (t.rival < [...t.text].length) return;
  // The rival finished first: a splash of ink, and a new race.
  const inkLost = Math.min(q.inkLoss, world.ink);
  world.ink -= inkLost;
  world.cleanRun = 0;
  world.events.push({ type: 'quillWins', target: t, inkLost });
  if (world.lockedId === t.id) world.lockedId = null;
  t.text = bossWord(world, t.text);
  t.typed = 0;
  t.rival = 0;
  t.bossTimerMs = q.startDelayMs;
}

/** A boss word was finished and has lives left: reset whatever its race or timer was. */
export function bossNextLife(target: Target): void {
  const b = GAME_CONFIG.boss;
  if (target.bossKind === 'quill') {
    target.rival = 0;
    target.bossTimerMs = b.quill.startDelayMs;
  } else if (target.bossKind === 'shuffler') {
    target.bossTimerMs = b.shuffler.shuffleMs;
  }
}

/**
 * A boss part was beaten and removed. The Spill splits; a Bookworm's other
 * segments hurry up; and when nothing of a boss is left, it's defeated.
 */
export function onBossPartDone(world: World, target: Target, splitSpill: () => void): void {
  if (target.bossKind === undefined || target.bossKind === 'spill') {
    splitSpill();
    return;
  }
  const group = bossGroup(target);
  const rest = world.targets.filter((t) => t.boss && bossGroup(t) === group);
  if (target.bossKind === 'bookworm') {
    for (const t of rest) t.speed *= 1 + GAME_CONFIG.boss.bookworm.speedStep;
    // The next segment is the head straight away, so typing can go on.
    const next = rest.reduce<Target | null>((best, t) => (!best || t.x < best.x ? t : best), null);
    for (const t of rest) t.head = t === next;
  }
  if (rest.length === 0) world.events.push({ type: 'bossDefeated', target });
}

/** Does this boss target cost extra ink at the margin? Only the one-word bosses and the Squid's body do. */
export function costsBossInk(target: Target): boolean {
  return target.boss === true && target.bossKind !== 'bookworm' && target.partOf === undefined;
}
