// Lets PixiJS run under our strict CSP (no 'unsafe-eval'). REQUIREMENTS §9.
import 'pixi.js/unsafe-eval';
import './style.css';
import { countTypeableWords, createContentSource, MIN_WORD_POOL } from './content/contentSource';
import { loadEnglishPack } from './content/en';
import { US_QWERTY } from './content/layouts/us-qwerty';
import { autoPause, confirm, moveSelection, selectDifficulty, togglePause, typeChar } from './core/input';
import { builtInPresets, matchingPreset, type Preset } from './core/keySelection';
import { FixedStepLoop } from './core/loop';
import { improvedKeys } from './core/mastery';
import { createWorld, setContent, stepWorld, type GamePhase, type World } from './core/world';
import { formatNumber, setLocale, t } from './i18n';
import { bindKeyboard } from './input/keyboard';
import { registerOffline } from './pwa';
import { difficultyLabel, type OverlayLinkId } from './render/overlay';
import { Sfx, type Sound } from './audio/sfx';
import { createRenderer } from './render/renderer';
import { keyLabel, prefersReducedMotion, setTheme } from './render/theme';
import { TEXT_SCALE, loadSettings, reducedMotion, saveSettings, type Settings } from './settings';
import {
  continueNotebook,
  keyWeights,
  mergeKeyStats,
  nextPagePosition,
  recordResult,
  snapshotNotebook,
} from './storage/progress';
import { openBackend, SaveStore } from './storage/store';
import { openSaveData } from './ui/saveData';
import { openSettings } from './ui/settingsDialog';
import { openTypeCase, presetName } from './ui/typeCase';

async function main(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app element missing');

  setLocale(navigator.language);
  registerOffline();

  const layout = US_QWERTY;
  const presets = builtInPresets(layout);
  const store = await SaveStore.open(await openBackend());

  // Comfort settings (REQUIREMENTS §10), applied before anything is drawn.
  let settings: Settings = loadSettings();
  const sfx = new Sfx();
  const applyColors = () => {
    setTheme(settings.theme);
    document.documentElement.dataset.theme = settings.theme;
    sfx.setVolume(settings.volume, settings.muted);
  };
  applyColors();

  const customPresets = (): Preset[] => store.data.customPresets.map((p) => ({ ...p, builtIn: false }));
  /** A menu screen (Type Case, Save data) is open and owns the keyboard. */
  let dialogOpen = false;
  /** Set when the last notebook ended with a new best score, for the game-over card. */
  let newBest = false;
  /** Keys that became mastered on the page just finished, for the graded page. */
  let newlyMastered: string[] = [];

  const describeKeys = (keys: readonly string[]) => {
    const preset = matchingPreset([...presets, ...customPresets()], keys);
    return preset ? presetName(preset) : t('preset.custom');
  };

  // `world` is assigned once the word pack loads; the overlay's handlers only run after that.
  let world: World | null = null;
  const actions: { onLink: (id: OverlayLinkId) => void; start: () => void } = { onLink: () => {}, start: () => {} };

  const [pack, renderer] = await Promise.all([
    loadEnglishPack(),
    createRenderer(host, {
      onPick: (difficulty) => world && !dialogOpen && selectDifficulty(world, difficulty),
      onConfirm: () => actions.start(),
      onLink: (id) => actions.onLink(id),
      describeKeys,
      continueLabel: () => {
        const saved = store.data.notebook;
        return saved
          ? t('overlay.ready.continue', {
              difficulty: difficultyLabel(saved.difficulty),
              chapter: saved.chapter + 1,
              page: saved.page + 1,
            })
          : null;
      },
      extraLines: (w) => {
        if (w.phase === 'pageCleared') {
          return newlyMastered.length > 0
            ? [t('overlay.newlyMastered', { keys: newlyMastered.map(keyLabel).join('  ') })]
            : [];
        }
        if (w.phase === 'gameOver') {
          return newBest ? [t('overlay.gameOver.newBest', { difficulty: difficultyLabel(w.difficulty) })] : [];
        }
        if (w.phase !== 'ready') return [];
        const d = w.selectedDifficulty;
        const best = store.data.records.bestScore[d];
        return best
          ? [
              t('overlay.ready.best', {
                difficulty: difficultyLabel(d),
                score: formatNumber(best),
                chapter: store.data.records.furthestChapter[d] ?? 1,
              }),
            ]
          : [];
      },
    }, () => ({
      textScale: TEXT_SCALE[settings.textSize],
      reducedMotion: reducedMotion(settings, prefersReducedMotion()),
    })),
  ]);

  /** Content for a key set, weighted toward the player's weak keys. */
  const contentFor = (keys: readonly string[]) =>
    createContentSource({
      keys,
      words: pack.words,
      blocklist: pack.blocklist,
      trustedWords: true,
      keyWeights: keyWeights(store.data.keyStats, keys),
    });

  const game = createWorld({ content: contentFor(store.data.keys), difficulty: store.data.difficulty });
  world = game;
  /** Large text uses every other line so targets don't overlap. */
  const applyLayout = () => {
    game.targetScale = TEXT_SCALE[settings.textSize];
    game.laneStep = game.targetScale > 1 ? 2 : 1;
  };
  applyLayout();
  const loop = new FixedStepLoop((stepMs) => stepWorld(game, stepMs));

  /** Re-read keys and difficulty from the save (after an import or erase). */
  const applySave = () => {
    setContent(game, contentFor(store.data.keys));
    game.selectedDifficulty = store.data.difficulty;
  };

  actions.start = () => {
    if (dialogOpen) return;
    // Refresh weak-key weights from the latest stats before a new notebook.
    if (game.phase === 'ready') setContent(game, contentFor(game.keys));
    confirm(game);
    loop.reset();
  };

  const continueSaved = () => {
    const saved = store.data.notebook;
    if (dialogOpen || game.phase !== 'ready' || !saved) return;
    setContent(game, contentFor(game.keys));
    continueNotebook(game, saved);
    loop.reset();
  };

  const openKeys = () => {
    if (dialogOpen || game.phase !== 'ready') return;
    dialogOpen = true;
    openTypeCase(document.body, {
      layout,
      builtInPresets: presets,
      customPresets: customPresets(),
      initial: game.keys,
      keyStats: store.data.keyStats,
      countWords: (keys) => countTypeableWords(pack.words, keys),
      minWords: MIN_WORD_POOL,
      onDone: (keys) => {
        dialogOpen = false;
        setContent(game, contentFor(keys));
        store.update((save) => {
          save.keys = [...keys];
        });
      },
      onCancel: () => {
        dialogOpen = false;
      },
      onSavePreset: (name, keys) => {
        const preset = { id: `custom-${Date.now()}`, name, chars: [...keys] };
        store.update((save) => {
          save.customPresets.push(preset);
        });
        return { ...preset, builtIn: false };
      },
      onDeletePreset: (id) => {
        store.update((save) => {
          save.customPresets = save.customPresets.filter((p) => p.id !== id);
        });
      },
    });
  };

  const openSaves = () => {
    if (dialogOpen || game.phase !== 'ready') return;
    dialogOpen = true;
    openSaveData(document.body, {
      store,
      onImported: applySave,
      onErased: applySave,
      onClose: () => {
        dialogOpen = false;
      },
    });
  };

  const openSettingsDialog = () => {
    if (dialogOpen || (game.phase !== 'ready' && game.phase !== 'paused')) return;
    dialogOpen = true;
    openSettings(document.body, {
      settings,
      onChange: (next) => {
        const redraw = next.theme !== settings.theme || next.textSize !== settings.textSize || next.motion !== settings.motion;
        settings = next;
        saveSettings(settings);
        applyColors();
        applyLayout();
        if (redraw) renderer.rebuild();
      },
      onTestSound: () => {
        sfx.unlock();
        sfx.play('page');
      },
      onClose: () => {
        dialogOpen = false;
      },
    });
  };

  actions.onLink = (id) => {
    if (id === 'continue') continueSaved();
    else if (id === 'keys') openKeys();
    else if (id === 'settings') openSettingsDialog();
    else openSaves();
  };

  /** Save progress when the game moves between screens (REQUIREMENTS §8). */
  const onPhase = (phase: GamePhase) => {
    switch (phase) {
      case 'playing':
        // A fresh notebook: remember it and its difficulty right away.
        if (game.page.chapter === 0 && game.page.index === 0 && game.stats.playMs === 0) {
          newBest = false;
          store.update((save) => {
            save.difficulty = game.difficulty;
            save.notebook = snapshotNotebook(game);
          });
        }
        break;
      case 'pageCleared':
        store.update((save) => {
          const before = structuredClone(save.keyStats);
          mergeKeyStats(save, game.pageStats);
          newlyMastered = improvedKeys(before, save.keyStats);
          recordResult(save, game.difficulty, game.stats.score, game.page.chapter + 1);
          save.notebook = snapshotNotebook(game, nextPagePosition(game.page));
        });
        break;
      case 'gameOver':
        store.update((save) => {
          mergeKeyStats(save, game.pageStats);
          newBest = recordResult(save, game.difficulty, game.stats.score, game.page.chapter + 1);
          save.notebook = null;
        });
        break;
      default:
        break;
    }
  };

  const shortcuts: Record<string, () => void> = { k: openKeys, b: openSaves, c: continueSaved, s: openSettingsDialog };

  bindKeyboard(
    window,
    {
      onChar: (char) => {
        const lower = char.toLowerCase();
        const shortcut =
          game.phase === 'ready' ? shortcuts[lower] : game.phase === 'paused' && lower === 's' ? openSettingsDialog : undefined;
        if (shortcut) shortcut();
        else typeChar(game, char);
      },
      onConfirm: () => actions.start(),
      onNavigate: (delta) => moveSelection(game, delta),
      onPause: () => {
        togglePause(game);
        loop.reset();
      },
    },
    () => dialogOpen,
  );

  // Pause when the player looks away (REQUIREMENTS §10), and make sure the save is written.
  window.addEventListener('blur', () => autoPause(game));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      autoPause(game);
      void store.flush();
    }
    loop.reset();
  });
  window.addEventListener('pagehide', () => void store.flush());

  // Audio may only start after a user gesture.
  window.addEventListener('keydown', () => sfx.unlock());
  window.addEventListener('pointerdown', () => sfx.unlock());

  const soundFor: Partial<Record<string, Sound>> = {
    locked: 'key',
    progress: 'key',
    destroyed: 'pop',
    error: 'error',
    marginHit: 'leak',
  };

  renderer.app.ticker.add((ticker) => {
    const alpha = loop.advance(ticker.deltaMS);
    // Look at events before the renderer consumes them: saving and sound.
    for (const event of game.events) {
      if (event.type === 'phase') {
        onPhase(event.phase);
        if (event.phase === 'pageCleared') sfx.play('page');
      }
      const sound = soundFor[event.type];
      if (sound) sfx.play(sound);
    }
    renderer.sync(game, alpha, ticker.deltaMS);
  });

  if (import.meta.env.DEV) {
    // Handy for poking at state from the console during development.
    (window as unknown as { inkling: unknown }).inkling = { world: game, loop, renderer, pack, store, openKeys, openSaves, openSettings: openSettingsDialog };
  }
}

main().catch((error: unknown) => {
  console.error(error);
});
