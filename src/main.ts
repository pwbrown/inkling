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
  startApprentice,
  startPractice,
  useBlotter,
  togglePause,
  typeChar,
  type EditKey,
} from './core/input';
import { apprenticePreset, builtInPresets, matchingPreset, type Preset } from './core/keySelection';
import { FixedStepLoop } from './core/loop';
import { improvedKeys } from './core/mastery';
import { accuracy, wpm } from './core/stats';
import { APPRENTICE_CHAPTERS, LESSONS, NEW_KEY_WEIGHT, apprenticeKeys, chapterStars, starsForGrade, totalStars } from './core/campaign';
import { pageGrade } from './core/grade';
import { createWorld, isLastPageOfChapter, setContent, stepWorld, type GamePhase } from './core/world';
import { formatNumber, setLocale, t, type MessageKey } from './i18n';
import { NOTEBOOK_BONUS, inkForPage, levelForInk, levelProgress, newUnlocks, rankForLevel } from './core/rewards';
import { defaultSave, migrate, type SaveData } from './storage/schema';
import { PlayerStore, cleanName, saveKeyFor, type Player } from './storage/profiles';
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
  recordApprenticePage,
  recordResult,
  snapshotNotebook,
} from './storage/progress';
import { openBackend, SaveStore } from './storage/store';
import { openSaveData } from './ui/saveData';
import { openSettings } from './ui/settingsDialog';
import { openTypeCase, presetName } from './ui/typeCase';
import { openUnlockDialog, type UnlockedItem } from './ui/unlockDialog';
import { openWordLists } from './ui/wordLists';

async function main(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app element missing');

  setLocale(navigator.language);
  registerOffline();

  const layout = US_QWERTY;
  const presets = builtInPresets(layout);
  const backend = await openBackend();
  // Each player on this browser has their own save (storage/profiles.ts).
  const players = await PlayerStore.open(backend, t('players.defaultName'));
  const store = await SaveStore.open(backend, 250, saveKeyFor(players.active.id));

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
  /** Ink earned on the page just finished, and any level-up, for the graded page. */
  let reward: { ink: number; levelUp: number | null; unlocked: string[]; items: UnlockedItem[] } = { ink: 0, levelUp: null, unlocked: [], items: [] };

  /** The chapter the player has reached in Apprentice (1-based). */
  const apprenticeChapter = () => Math.max(1, Math.min(store.data.apprentice.unlocked, APPRENTICE_CHAPTERS));
  /** Always matches the player's Apprentice progress. */
  const myApprenticePreset = () => apprenticePreset(apprenticeChapter(), t('preset.apprentice', { chapter: apprenticeChapter() }));

  const describeKeys = (keys: readonly string[]) => {
    const preset = matchingPreset([myApprenticePreset(), ...presets, ...customPresets()], keys);
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
          const lines = [];
          if (newlyMastered.length > 0) lines.push(t('overlay.newlyMastered', { keys: newlyMastered.map(keyLabel).join('  ') }));
          if (reward.ink > 0) lines.push(t('overlay.inkEarned', { ink: reward.ink }));
          if (reward.levelUp) {
            lines.push(t('overlay.levelUp', { level: reward.levelUp, rank: t(`rank.${rankForLevel(reward.levelUp)}` as MessageKey) }));
          }
          if (reward.unlocked.length > 0) lines.push(t('overlay.unlocked', { items: reward.unlocked.join(', ') }));
          return lines;
        }
        if (w.phase === 'gameOver') {
          return newBest ? [t('overlay.gameOver.newBest', { difficulty: difficultyLabel(w.difficulty) })] : [];
        }
        if (w.phase === 'notebookComplete') {
          const { earned, max } = totalStars(store.data.apprentice.stars);
          const lines = [t('overlay.complete.stars', { earned, max }), t('overlay.inkEarned', { ink: reward.ink })];
          if (reward.levelUp) {
            lines.push(t('overlay.levelUp', { level: reward.levelUp, rank: t(`rank.${rankForLevel(reward.levelUp)}` as MessageKey) }));
          }
          if (reward.unlocked.length > 0) lines.push(t('overlay.unlocked', { items: reward.unlocked.join(', ') }));
          return lines;
        }
        return [];
      },
    }, () => ({
      textScale: TEXT_SCALE[settings.textSize],
      reducedMotion: reducedMotion(settings, prefersReducedMotion()),
      cosmetics: store.data.profile.cosmetics,
    })),
  ]);

  /**
   * Content for a key set, weighted toward the player's weak keys and, in the
   * Apprentice campaign, toward the chapter's new (`focus`) keys.
   */
  const contentFor = (keys: readonly string[], focus: readonly string[] = []) => {
    const weights = keyWeights(store.data.keyStats, keys);
    for (const key of focus) weights[key] = (weights[key] ?? 1) * NEW_KEY_WEIGHT;
    return createContentSource({
      keys,
      words: pack.words,
      blocklist: pack.blocklist,
      trustedWords: true,
      keyWeights: weights,
      topicWords: store.data.vocab.filter((list) => list.enabled).flatMap((list) => list.words),
    });
  };

  const game = createWorld({
    content: contentFor(store.data.keys),
    difficulty: store.data.difficulty,
    makeContent: contentFor,
  });
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
    menu.refresh();
  };

  /** Enter on an in-game card (next page, or retry after game over), or Start on the menu. */
  actions.start = () => {
    if (dialogOpen) return;
    if (game.phase === 'notebookComplete') {
      goToMenu();
      return;
    }
    // Enter while playing fires the Blotter, if charged.
    if (game.phase === 'playing') {
      useBlotter(game);
      return;
    }
    if (game.phase === 'ready') {
      // A Practice notebook uses the player's own keys, with fresh weak-key weights.
      setContent(game, contentFor(store.data.keys));
      startPractice(game);
    } else {
      confirm(game);
    }
    loop.reset();
  };

  const startChapter = (chapter: number) => {
    if (dialogOpen || game.phase !== 'ready') return;
    startApprentice(game, chapter);
    loop.reset();
  };

  const continueSaved = () => {
    const saved = store.data.notebook;
    if (dialogOpen || game.phase !== 'ready' || !saved) return;
    setContent(game, contentFor(store.data.keys));
    continueNotebook(game, saved);
    loop.reset();
  };

  const openKeys = () => {
    if (dialogOpen || game.phase !== 'ready') return;
    dialogOpen = true;
    openTypeCase(document.body, {
      layout,
      builtInPresets: [myApprenticePreset(), ...presets],
      customPresets: customPresets(),
      initial: store.data.keys,
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
    const refresh = () => setContent(game, contentFor(store.data.keys));
    openWordLists(document.body, {
      lists: store.data.vocab,
      blocklist: pack.blocklist,
      countFitting: (words) =>
        countTypeableWords(
          words.map((word) => ({ word, tier: 0 })),
          store.data.keys,
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

  /** Use a key set for Practice and remember it. */
  const useKeys = (keys: readonly string[]) => {
    setContent(game, contentFor(keys));
    store.update((save) => {
      save.keys = [...keys];
    });
  };

  /** Pause menu in an Apprentice chapter: leave it and practice its keys at the same difficulty. */
  const practiceChapterKeys = () => {
    if (game.phase !== 'paused' || game.mode !== 'apprentice') return;
    const keys = apprenticeKeys(game.page.chapter);
    const difficulty = game.difficulty;
    quitToMenu(game);
    useKeys(keys);
    store.update((save) => {
      save.difficulty = difficulty;
    });
    game.selectedDifficulty = difficulty;
    startPractice(game, difficulty);
    loop.reset();
  };

  /** "Level 5 · Apprentice chapter 4"-style summaries of each player, read from their saves. */
  const playerDetails = new Map<string, string>();
  const describePlayer = (save: Readonly<SaveData>) => {
    const level = levelForInk(save.profile.ink);
    return t('players.detail', {
      rank: t(`rank.${rankForLevel(level)}` as MessageKey),
      level,
      chapter: Math.max(1, Math.min(save.apprentice.unlocked, APPRENTICE_CHAPTERS)),
    });
  };
  const refreshPlayerDetails = async () => {
    for (const p of players.list.players) {
      if (p.id === players.active.id) continue;
      try {
        const raw = await backend.load(saveKeyFor(p.id));
        playerDetails.set(p.id, describePlayer(raw === undefined ? defaultSave() : migrate(raw)));
      } catch {
        playerDetails.delete(p.id);
      }
    }
    menu.refresh();
  };

  /** Switch to another player: their save, keys, difficulty and desk. */
  const switchPlayer = async (id: string) => {
    if (dialogOpen || game.phase !== 'ready') return;
    if (id !== players.active.id) {
      await store.switchTo(saveKeyFor(id));
      await players.setActive(id);
      reward = { ink: 0, levelUp: null, unlocked: [], items: [] };
      applySave();
      renderer.rebuild();
      void refreshPlayerDetails();
    }
    menu.show('title');
  };

  const savePlayer = async (id: string | null, name: string, badge: Player['badge']) => {
    if (!cleanName(name)) return false;
    if (id === null) {
      if (!(await players.add(name, badge))) return false;
    } else {
      await players.edit(id, name, badge);
    }
    void refreshPlayerDetails();
    return true;
  };

  const deletePlayer = async (id: string) => {
    if (dialogOpen || game.phase !== 'ready') return;
    if (id === players.active.id) {
      // Move to someone else first, so the deleted save isn't written again.
      const next = players.list.players.find((p) => p.id !== id);
      if (!next) return;
      await store.switchTo(saveKeyFor(next.id));
      await players.setActive(next.id);
      applySave();
      renderer.rebuild();
    }
    await players.remove(id);
    playerDetails.delete(id);
    menu.refresh();
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
    keysSummary: () => `${describeKeys(store.data.keys)} · ${t('menu.keyCount', { count: store.data.keys.length })}`,
    apprenticeDetail: () => {
      const { earned, max } = totalStars(store.data.apprentice.stars);
      return store.data.apprentice.completed
        ? t('menu.apprenticeDone', { earned, max })
        : t('menu.apprenticeDetail', { chapter: store.data.apprentice.unlocked, total: APPRENTICE_CHAPTERS, earned, max });
    },
    chapters: () =>
      LESSONS.map((lesson, chapter) => ({
        chapter,
        newKeys: lesson.newKeys.map(keyLabel).join(' '),
        stars: chapterStars(store.data.apprentice.stars, chapter),
        locked: chapter >= store.data.apprentice.unlocked,
      })),
    onStartApprentice: (chapter) => after(() => startChapter(chapter)),
    rankLine: () => {
      const { level, into, needed } = levelProgress(store.data.profile.ink);
      return t('menu.rank', { rank: t(`rank.${rankForLevel(level)}` as MessageKey), level, into, needed });
    },
    levelFraction: () => {
      const { into, needed } = levelProgress(store.data.profile.ink);
      return needed > 0 ? into / needed : 1;
    },
    level: () => levelForInk(store.data.profile.ink),
    cosmetics: () => store.data.profile.cosmetics,
    onEquip: (slot, item) => equip(slot, item),
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
    canPracticeChapterKeys: () => game.phase === 'paused' && game.mode === 'apprentice',
    onPracticeChapterKeys: () => after(practiceChapterKeys),
    apprenticeKeysChapter: apprenticeChapter,
    onUseApprenticeKeys: () => useKeys(myApprenticePreset().chars),
    players: () =>
      players.list.players.map((p) => ({
        ...p,
        active: p.id === players.active.id,
        detail: p.id === players.active.id ? describePlayer(store.data) : (playerDetails.get(p.id) ?? ''),
      })),
    activePlayer: () => players.active,
    canAddPlayer: () => players.canAdd,
    onChoosePlayer: (id) => void switchPlayer(id),
    onSavePlayer: savePlayer,
    onDeletePlayer: (id) => void deletePlayer(id),
  });
  // With more than one player, ask who's writing first.
  if (players.list.players.length > 1) menu.show('players');
  void refreshPlayerDetails();

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

  /** Add ink to the profile; report the ink, any new level, and new unlocks by name. */
  const earnInk = (save: SaveData, ink: number) => {
    const before = levelForInk(save.profile.ink);
    save.profile.ink += ink;
    const after = levelForInk(save.profile.ink);
    const items = newUnlocks(before, after);
    return {
      ink,
      levelUp: after > before ? after : null,
      unlocked: items.map(({ slot, item }) => t(`${slot}.${item}` as MessageKey)),
      items,
    };
  };

  /** Show what was just unlocked, with pictures and a button to use each one now. */
  const showUnlocks = () => {
    if (reward.items.length === 0 || dialogOpen) return;
    const levelUp = reward.levelUp;
    dialogOpen = true;
    openUnlockDialog(document.body, {
      levelUp: levelUp ? { level: levelUp, rank: t(`rank.${rankForLevel(levelUp)}` as MessageKey) } : null,
      items: reward.items,
      isEquipped: ({ slot, item }) => store.data.profile.cosmetics[slot] === item,
      onEquip: ({ slot, item }) => equip(slot, item),
      onClose: () => {
        dialogOpen = false;
      },
    });
  };

  const equip = (slot: UnlockedItem['slot'], item: string) => {
    store.update((save) => {
      (save.profile.cosmetics as unknown as Record<string, string>)[slot] = item;
    });
    renderer.rebuild();
  };

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
          let stars = 0;
          if (game.mode === 'apprentice') {
            const earned = starsForGrade(pageGrade(game.pageStats, game.page.params.size));
            stars = earned;
            recordApprenticePage(save, game.page.chapter, game.page.index, earned, isLastPageOfChapter(game.page));
          }
          // Ink (XP): level-ups and unlocks show on the graded page.
          reward = earnInk(save, inkForPage(game.pageStats.score, stars));
          recordResult(save, game.difficulty, game.stats.score, game.page.chapter + 1);
          save.notebook = snapshotNotebook(game, nextPagePosition(game.page));
        });
        showUnlocks();
        break;
      case 'notebookComplete':
        store.update((save) => {
          save.notebook = null;
          reward = earnInk(save, NOTEBOOK_BONUS);
        });
        showUnlocks();
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
          // On a chapter's new-keys card, Esc backs out to the menu instead.
          if (game.phase === 'intro') goToMenu();
          else togglePause(game);
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
