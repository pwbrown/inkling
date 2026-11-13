// Lets PixiJS run under our strict CSP (no 'unsafe-eval'). REQUIREMENTS §9.
import 'pixi.js/unsafe-eval';
import './style.css';
import { countTypeableWords, createContentSource, MIN_WORD_POOL } from './content/contentSource';
import { loadEnglishPack } from './content/en';
import { US_QWERTY } from './content/layouts/us-qwerty';
import {
  autoPause,
  confirm,
  cycleLock,
  editKey,
  quitToMenu,
  restartPage,
  retryChapter,
  selectDifficulty,
  togglePause,
  typeChar,
  type EditKey,
} from './core/input';
import { builtInPresets, matchingPreset, type Preset } from './core/keySelection';
import { FixedStepLoop } from './core/loop';
import { improvedKeys } from './core/mastery';
import { accuracy, wpm } from './core/stats';
import { createWorld, setContent, stepWorld, type GamePhase } from './core/world';
import { formatNumber, setLocale, t } from './i18n';
import { bindKeyboard, type SpecialKey } from './input/keyboard';
import { loadFonts } from './fonts';
import { registerOffline } from './pwa';
import { difficultyLabel, type OverlayLinkId } from './render/overlay';
import { Menu } from './ui/menu';
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
import { openWordLists } from './ui/wordLists';

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
  /** A dialog (Type Case, Save data…) is open and owns the keyboard. */
  let dialogOpen = false;
  /** Set when the last notebook ended with a new best score, for the game-over card. */
  let newBest = false;
  /** Keys that became mastered on the page just finished, for the graded page. */
  let newlyMastered: string[] = [];

  const describeKeys = (keys: readonly string[]) => {
    const preset = matchingPreset([...presets, ...customPresets()], keys);
    return preset ? presetName(preset) : t('preset.custom');
  };

  // The overlay's handlers only run once the game exists, after the word pack loads.
  const actions: { onLink: (id: OverlayLinkId) => void; start: () => void } = { onLink: () => {}, start: () => {} };

  // Fonts first: canvas text is rasterised once, in whatever font is ready.
  const packLoading = loadEnglishPack();
  await loadFonts();

  const [pack, renderer] = await Promise.all([
    packLoading,
    createRenderer(host, {
      onConfirm: () => actions.start(),
      onLink: (id) => actions.onLink(id),
      extraLines: (w) => {
        if (w.phase === 'pageCleared') {
          return newlyMastered.length > 0
            ? [t('overlay.newlyMastered', { keys: newlyMastered.map(keyLabel).join('  ') })]
            : [];
        }
        if (w.phase === 'gameOver') {
          return newBest ? [t('overlay.gameOver.newBest', { difficulty: difficultyLabel(w.difficulty) })] : [];
        }
        return [];
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
      topicWords: store.data.vocab.filter((list) => list.enabled).flatMap((list) => list.words),
    });

  const game = createWorld({ content: contentFor(store.data.keys), difficulty: store.data.difficulty });
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

  /** Enter on an in-game card (next page, or retry after game over), or Start on the menu. */
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
        menu.refresh();
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
        menu.refresh();
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

  const openVocab = () => {
    if (dialogOpen || game.phase !== 'ready') return;
    dialogOpen = true;
    /** Rebuild content so word pages pick up list changes. */
    const refresh = () => setContent(game, contentFor(game.keys));
    openWordLists(document.body, {
      lists: store.data.vocab,
      blocklist: pack.blocklist,
      countFitting: (words) =>
        countTypeableWords(
          words.map((word) => ({ word, tier: 0 })),
          game.keys,
        ),
      onAdd: (list) => {
        store.update((save) => {
          save.vocab.push(list);
        });
        refresh();
      },
      onToggle: (id, enabled) => {
        store.update((save) => {
          const list = save.vocab.find((l) => l.id === id);
          if (list) list.enabled = enabled;
        });
        refresh();
      },
      onDelete: (id) => {
        store.update((save) => {
          save.vocab = save.vocab.filter((l) => l.id !== id);
        });
        refresh();
      },
      onClose: () => {
        dialogOpen = false;
      },
    });
  };

  const goToMenu = () => {
    quitToMenu(game);
    loop.reset();
    void store.flush();
  };

  // Game-over card links.
  actions.onLink = (id) =>
    after(() => {
      if (id === 'retry') {
        retryChapter(game);
        loop.reset();
      } else {
        goToMenu();
      }
    });

  const menu = new Menu(document.body, {
    continueDetail: () => {
      const saved = store.data.notebook;
      return saved
        ? t('menu.continueDetail', { difficulty: difficultyLabel(saved.difficulty), chapter: saved.chapter + 1, page: saved.page + 1 })
        : null;
    },
    keysSummary: () => `${describeKeys(game.keys)} · ${t('menu.keyCount', { count: game.keys.length })}`,
    bestLine: (d) => {
      const best = store.data.records.bestScore[d];
      return best
        ? t('menu.best', { difficulty: difficultyLabel(d), score: formatNumber(best), chapter: store.data.records.furthestChapter[d] ?? 1 })
        : null;
    },
    pauseSummary: () =>
      t('overlay.stats', {
        score: formatNumber(game.pageStats.score),
        wpm: formatNumber(Math.round(wpm(game.pageStats))),
        accuracy: formatNumber(Math.round(accuracy(game.pageStats) * 100)),
      }),
    selectedDifficulty: () => game.selectedDifficulty,
    onSelectDifficulty: (d) => selectDifficulty(game, d),
    onContinue: () => after(continueSaved),
    onStart: () => after(actions.start),
    onKeys: () => openKeys(),
    onWordLists: () => openVocab(),
    onSettings: () => openSettingsDialog(),
    onSaveData: () => openSaves(),
    onResume: () =>
      after(() => {
        if (game.phase === 'paused') togglePause(game);
        loop.reset();
      }),
    onRestart: () =>
      after(() => {
        restartPage(game);
        loop.reset();
      }),
    onQuit: () => after(goToMenu),
  });

  /** Run an action, then update the menu right away rather than on the next frame. */
  function after(action: () => void): void {
    action();
    syncMenu();
  }

  /** Show the right menu for the current phase (the main menu when idle, the pause menu when paused). */
  function syncMenu(): void {
    if (game.phase === 'ready') {
      if (!menu.visible || menu.screen === 'pause') menu.show('title');
    } else if (game.phase === 'paused') {
      if (menu.screen !== 'pause') menu.show('pause');
    } else if (menu.visible) {
      menu.hide();
    }
  }

  /** Phase before the latest change, to tell starting a page from resuming one. */
  let lastPhase: GamePhase = game.phase;

  /** Save progress when the game moves between screens (REQUIREMENTS §8). */
  const onPhase = (phase: GamePhase) => {
    switch (phase) {
      case 'playing':
        // A page is starting (not just resuming from pause): save the notebook
        // here, so Continue and Quit to menu always come back to this page.
        if (lastPhase !== 'paused') {
          if (lastPhase === 'ready') newBest = false;
          store.update((save) => {
            save.difficulty = game.difficulty;
            save.notebook = snapshotNotebook(
              game,
              { chapter: game.page.chapter, page: game.pageStart.pageIndex },
              new Date(),
              game.pageStart,
            );
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
    lastPhase = phase;
  };

  const EDIT_KEYS: Partial<Record<SpecialKey, EditKey>> = {
    Backspace: 'backspace',
    Delete: 'delete',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Home: 'home',
    End: 'end',
  };

  /** While playing, these keys edit Run-ons and Misprints, and Tab switches target. */
  const handleSpecial = (key: SpecialKey): boolean => {
    if (game.phase !== 'playing') return false;
    if (key === 'Tab') {
      cycleLock(game);
      return true;
    }
    const edit = EDIT_KEYS[key];
    if (edit) editKey(game, edit);
    // Swallow the rest too, so arrows never scroll the page mid-game.
    return true;
  };

  bindKeyboard(
    window,
    {
      onChar: (char) => {
        // Shortcuts on the game-over card: R retries the chapter, M goes to the menu.
        if (game.phase === 'gameOver') {
          const lower = char.toLowerCase();
          if (lower === 'r' || lower === 'm') actions.onLink(lower === 'r' ? 'retry' : 'mainMenu');
          return;
        }
        typeChar(game, char);
      },
      onConfirm: () => after(actions.start),
      onSpecial: (key) => handleSpecial(key),
      onPause: () =>
        after(() => {
          togglePause(game);
          loop.reset();
        }),
    },
    // Menus and dialogs handle their own keys.
    () => dialogOpen || menu.visible,
  );

  // Pause when the player looks away (REQUIREMENTS §10), and make sure the save is written.
  window.addEventListener('blur', () => after(() => autoPause(game)));
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
    hit: 'pop',
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
    syncMenu();
  });
  syncMenu();

  if (import.meta.env.DEV) {
    // Handy for poking at state from the console during development.
    (window as unknown as { inkling: unknown }).inkling = { world: game, loop, renderer, pack, store, menu, openKeys, openSaves, openSettings: openSettingsDialog, openVocab };
  }
}

main().catch((error: unknown) => {
  console.error(error);
});
