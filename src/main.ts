// Lets PixiJS run under our strict CSP (no 'unsafe-eval'). REQUIREMENTS §9.
import 'pixi.js/unsafe-eval';
import './style.css';
import { countTypeableWords, createContentSource, MIN_WORD_POOL } from './content/contentSource';
import { loadEnglishPack } from './content/en';
import { US_QWERTY } from './content/layouts/us-qwerty';
import { DEFAULT_KEYS } from './core/config';
import { autoPause, confirm, moveSelection, selectDifficulty, togglePause, typeChar } from './core/input';
import { builtInPresets, matchingPreset, type Preset } from './core/keySelection';
import { FixedStepLoop } from './core/loop';
import { createWorld, setContent, stepWorld, type World } from './core/world';
import { setLocale, t } from './i18n';
import { bindKeyboard } from './input/keyboard';
import { createRenderer } from './render/renderer';
import { openTypeCase, presetName } from './ui/typeCase';

async function main(): Promise<void> {
  const host = document.getElementById('app');
  if (!host) throw new Error('#app element missing');

  setLocale(navigator.language);

  const layout = US_QWERTY;
  const presets = builtInPresets(layout);
  // Custom presets live in memory for now; milestone 6 saves them on the device.
  let customPresets: Preset[] = [];
  let typeCaseOpen = false;

  const describeKeys = (keys: readonly string[]) => {
    const preset = matchingPreset([...presets, ...customPresets], keys);
    return preset ? presetName(preset) : t('preset.custom');
  };

  // Assigned once the word pack loads; the overlay's click handlers only run after that.
  let world: World | null = null;
  let openKeys = () => {};
  const start = () => {
    if (!world || typeCaseOpen) return;
    confirm(world);
    loop.reset();
  };

  const [pack, renderer] = await Promise.all([
    loadEnglishPack(),
    createRenderer(host, {
      onPick: (difficulty) => world && !typeCaseOpen && selectDifficulty(world, difficulty),
      onConfirm: start,
      onOpenKeys: () => openKeys(),
      describeKeys,
    }),
  ]);

  const contentFor = (keys: readonly string[]) =>
    createContentSource({ keys, words: pack.words, blocklist: pack.blocklist, trustedWords: true });

  const game = createWorld({ content: contentFor(DEFAULT_KEYS) });
  world = game;
  const loop = new FixedStepLoop((stepMs) => stepWorld(game, stepMs));

  openKeys = () => {
    if (typeCaseOpen || game.phase !== 'ready') return;
    typeCaseOpen = true;
    openTypeCase(document.body, {
      layout,
      builtInPresets: presets,
      customPresets,
      initial: game.keys,
      countWords: (keys) => countTypeableWords(pack.words, keys),
      minWords: MIN_WORD_POOL,
      onDone: (keys) => {
        typeCaseOpen = false;
        setContent(game, contentFor(keys));
      },
      onCancel: () => {
        typeCaseOpen = false;
      },
      onSavePreset: (name, keys) => {
        const preset: Preset = { id: `custom-${Date.now()}`, name, chars: keys, builtIn: false };
        customPresets = [...customPresets, preset];
        return preset;
      },
      onDeletePreset: (id) => {
        customPresets = customPresets.filter((p) => p.id !== id);
      },
    });
  };

  bindKeyboard(
    window,
    {
      onChar: (char) => {
        // K opens the Type Case from the new-notebook screen.
        if (game.phase === 'ready' && char.toLowerCase() === 'k') openKeys();
        else typeChar(game, char);
      },
      onConfirm: start,
      onNavigate: (delta) => moveSelection(game, delta),
      onPause: () => {
        togglePause(game);
        loop.reset();
      },
    },
    () => typeCaseOpen,
  );

  // Pause when the player looks away (REQUIREMENTS §10).
  window.addEventListener('blur', () => autoPause(game));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoPause(game);
    loop.reset();
  });

  renderer.app.ticker.add((ticker) => {
    const alpha = loop.advance(ticker.deltaMS);
    renderer.sync(game, alpha, ticker.deltaMS);
  });

  if (import.meta.env.DEV) {
    // Handy for poking at state from the console during development.
    (window as unknown as { inkling: unknown }).inkling = { world: game, loop, renderer, pack, openKeys: () => openKeys() };
  }
}

main().catch((error: unknown) => {
  console.error(error);
});
