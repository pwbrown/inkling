# Game release system with versioning

Claude Code session started 2026-11-16. 2 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> I want to develop a release system for this game with git tags, semantic versions and release notes within the game itself. The release notes in the game should only really include details about features that change the game for the player and everything else can just be labeled as bug fixes. I want you to help me decide the transition between major, minor, and patch versions as it makes sense to you, and maybe even go back and tag and document previous milestones. It would be nice if the release notes popped up on the browser if the player was upgraded to a newer version since they last time they played. Also the version should be displayed somewhere. Maybe on the about page, and the release notes should be brief and accessible.

<details><summary>5 tool calls</summary>

- **Shell:** Survey repo history, layout and requirements

  ```bash
  git log --oneline | cat && git tag && cat package.json && ls src src/* docs && grep -n "^#" docs/REQUIREMENTS.md | head -80
  ```
- **Shell:** Read milestones, progression notes and commit dates

  ```bash
  sed -n 245,290p docs/REQUIREMENTS.md && cat docs/progression/README.md | head -150 && git log --format='%h %ad %s' --date=short | cat
  ```
- **Shell:** Check save versions over history

  ```bash
  grep -n "SAVE_VERSION\|version\|function migrate\|case [0-9]" src/storage/schema.ts | head -60; git log --format='%h %s' -S'SAVE_VERSION = ' -- src/storage/schema.ts | cat; for c in $(git log --format=%h -- src/storage/schema.ts); do echo "$c $(git show $c:src/storage/schema.ts 2>/dev/null | grep -o 'SAVE_VERSION = [0-9]*')"; done
  ```
- **Shell:** Read settings, about dialog refs, vite config and i18n

  ```bash
  cat src/settings.ts | head -80 && wc -l src/main.ts src/ui/*.ts src/i18n/*.ts && grep -n "about\|About" src/ui/*.ts src/main.ts | head -40 && cat vite.config.ts && cat src/i18n/index.ts && sed -n 1,40p src/i18n/en.ts
  ```
- **Shell:** Read menu structure and about page

  ```bash
  sed -n 1,130p src/ui/menu.ts && sed -n 180,300p src/ui/menu.ts && sed -n 730,824p src/ui/menu.ts && grep -n "about\.\|menu\." src/i18n/en.ts | head -60
  ```

</details>

### 🤖 Claude

Mapping out the codebase; next I'll design the version scheme and build the "What's new" popup.

<details><summary>4 tool calls</summary>

- **Shell:** Read dialog pattern and main boot flow

  ```bash
  cat src/ui/briefingDialog.ts src/ui/dom.ts && grep -n "menu.show\|new Menu\|async function\|loadSettings\|showBriefing\|briefing\|^async\|^function\|init(" src/main.ts | head -50 && cat src/ui/briefing.css | head -60 && ls scripts .github/workflows && cat .github/workflows/deploy.yml
  ```
- **Shell:** Read main startup and PWA update code

  ```bash
  sed -n 60,130p src/main.ts && sed -n 600,640p src/main.ts && cat src/pwa.ts && grep -n "players.list\|hasSave\|isNew\|loadProfiles\|loadAll" src/main.ts | head -20
  ```
- **Shell:** Check menu key handling and dialog opening

  ```bash
  sed -n 130,175p src/ui/menu.ts && grep -n "dialogOpen" src/main.ts | head -20 && grep -n "onSettings\|function openSettings\|const openSettings" -A12 src/main.ts | head -40 && ls src/*.d.ts src/vite-env* 2>/dev/null; cat tsconfig.json; grep -rn "ink:" src/storage/schema.ts | head
  ```
- **Shell:** Check script imports, en.ts tail and css classes

  ```bash
  grep -n "^import" scripts/*.ts | head; head -5 src/i18n/en.ts; tail -15 src/i18n/en.ts; grep -n "tutorial\.\|'unlock\." src/i18n/en.ts | head -5; grep -n "^\.tc-secondary\|^\.tc-intro\|^\.tc-actions\|^\.ul-panel\|details\|summary" src/ui/*.css | head -20; grep -n "layout" src/i18n/en.ts | head -5
  ```

</details>

### 🤖 Claude

Now writing the core release data and logic.

<details><summary>2 tool calls</summary>

- **Wrote** `src/core/releases.ts`
- **Shell:** Check creature names and patch commit details

  ```bash
  grep -n -i "scrawler" src/i18n/en.ts | head -5; grep -n "ability\.\(eraser\|blottingPaper\)\|power" src/i18n/en.ts | head -8; git show --stat 114804b 250bb4b 708b40c 1b30fbd | grep -v "^ src\|^ docs" | head -60
  ```

</details>

### 🤖 Claude

Now the strings.

<details><summary>1 tool call</summary>

- **Shell:** Add release note and What's new strings

  ```bash
  python3 - <<'EOF'
  p='src/i18n/en.ts'
  s=open(p).read()
  add = """
    'about.version': 'Version {version}',
    'about.whatsNew': 'What’s new',
    'about.whatsNewDetail': 'Notes for every version of Inky Keys.',
    'whatsNew.title': 'What’s new in Inky Keys',
    'whatsNew.titleAll': 'What’s new',
    'whatsNew.version': 'Version {version}',
    'whatsNew.fixes': 'Bug fixes and small improvements.',
    'whatsNew.earlier': 'Earlier versions',
    'whatsNew.ok': 'Got it',
    'release.2.6.0.name': 'The game has a new name: Inky Keys. Blotlings are now called Scrawlers.',
    'release.2.6.0.icon': 'A new app icon.',

  … (3520 more characters)
  ```

</details>

### 🤖 Claude

Now the version constant, seen-version storage, and Vite define.

<details><summary>2 tool calls</summary>

- **Shell:** Add version module, define and package version

  ```bash
  cat > src/version.ts <<'EOF'
  /**
   * The running game's version (from package.json, set at build time) and the
   * version this browser last ran, so players see what's new after an update.
   * The last-seen version is per browser, not per player, so it lives in
   * localStorage beside the settings rather than in the save.
   */
  import { isVersion } from './core/releases';

  declare const __APP_VERSION__: string;

  export const APP_VERSION: string = __APP_VERSION__;

  // Keeps the game's first name (Inkling), like the settings key.
  const STORAGE_KEY = 'inkling.lastVersion';

  /** The version this browser
  … (1672 more characters)
  ```
- **Shell:** Bump version in package-lock

  ```bash
  head -12 package-lock.json && python3 - <<'EOF'
  p='package-lock.json'
  s=open(p).read()
  s=s.replace('"name": "inky-keys",\n  "version": "0.1.0"','"name": "inky-keys",\n  "version": "2.6.0"',1)
  s=s.replace('"name": "inky-keys",\n      "version": "0.1.0"','"name": "inky-keys",\n      "version": "2.6.0"',1)
  open(p,'w').write(s)
  EOF
  git diff --stat package-lock.json
  ```

</details>

### 🤖 Claude

Now the dialog UI.

<details><summary>3 tool calls</summary>

- **Shell:** Write dialog and inspect existing dialog styles

  ```bash
  cat > src/ui/whatsNewDialog.ts <<'EOF'
  /**
   * "What's new": short release notes (core/releases.ts). Shown once after the
   * game updates, and from the About page. A DOM dialog, so screen readers
   * read it as headings and lists. Esc or the button closes it.
   */
  import './dialog.css';
  import './unlock.css';
  import './whatsNew.css';
  import type { Release } from '../core/releases';
  import { getLocale, t } from '../i18n';
  import { h } from './dom';

  export interface WhatsNewDialogOptions {
    /** Releases to show in full, newest first. */
    releases: readonly Release[];
    /** Older releases, folded
  … (3191 more characters)
  ```
- **Shell:** Write What's new styles and check focus styling

  ```bash
  cat > src/ui/whatsNew.css <<'EOF'
  /* "What's new" release notes (whatsNewDialog.ts). Shares tokens with dialog.css. */

  .wn-panel {
    width: min(560px, 100%);
    text-align: left;
  }

  .wn-panel h2 {
    text-align: center;
  }

  .wn-body {
    display: grid;
    gap: 16px;
    line-height: 1.45;
  }

  .wn-release h3,
  .wn-release h4 {
    margin: 0 0 4px;
    font-size: 1.05rem;
    letter-spacing: normal;
    text-transform: none;
    color: var(--tc-ink);
  }

  .wn-date {
    font-weight: 400;
    color: var(--tc-ink-light);
  }

  .wn-notes {
    margin: 0;
    padding-left: 1.3em;
    display: grid;
    gap: 4px;
  }

  .wn-earlier {
    bo
  … (503 more characters)
  ```
- **Shell:** Trim redundant CSS rules

  ```bash
  python3 - <<'EOF'
  p='src/ui/whatsNew.css'
  s=open(p).read()
  s=s.replace(""".wn-earlier[open] {
    gap: 14px;
  }

  ""","").replace(""".wn-earlier summary:focus-visible {
    outline: 3px solid var(--tc-highlight);
    outline-offset: 2px;
  }

  ""","").replace("""  padding-top: 12px;
    display: grid;
    gap: 14px;
  }""","""  padding-top: 12px;
  }""")
  open(p,'w').write(s)
  EOF
  cat src/ui/whatsNew.css | tail -20
  ```

</details>

### 🤖 Claude

Now wire the About page.

<details><summary>8 tool calls</summary>

- **Shell:** Add version and What's new to About page

  ```bash
  python3 - <<'EOF'
  p='src/ui/menu.ts'
  s=open(p).read()
  s=s.replace("""  onDeletePlayer(id: string): void;
  }""","""  onDeletePlayer(id: string): void;
    /** e.g. "2.6.0". */
    appVersion(): string;
    /** Open the release notes. */
    onWhatsNew(): void;
  }""",1)
  s=s.replace("""      h('h2', { id: 'menu-title' }, [t('about.title')]),
        h('p', { className: 'tc-intro' }, [t('about.what')]),""","""      h('h2', { id: 'menu-title' }, [t('about.title')]),
        h('p', { className: 'menu-version' }, [t('about.version', { version: this.hooks.appVersion() })]),
        h('p', { className: 'tc-intro' }, [
  … (393 more characters)
  ```
- **Shell:** Style version line and view main menu wiring

  ```bash
  python3 - <<'EOF'
  p='src/ui/menu.css'
  s=open(p).read()
  s=s.replace(""".menu-list {
    display: grid;""",""".menu-version {
    margin: -10px 0 0;
    font-weight: 700;
    color: var(--tc-ink-light);
  }

  .menu-list {
    display: grid;""",1)
  open(p,'w').write(s)
  EOF
  sed -n 440,470p src/main.ts; grep -n "^import" src/main.ts | tail -8
  ```
- **Shell:** Wire What's new into main startup and menu hooks

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  s=s.replace("import { openWordLists } from './ui/wordLists';\n","""import { openWordLists } from './ui/wordLists';
  import { openWhatsNewDialog } from './ui/whatsNewDialog';
  import { RELEASES, compareVersions, releasesToAnnounce, MAX_NEW_RELEASES_SHOWN, type Release } from './core/releases';
  import { APP_VERSION, loadSeenVersion, saveSeenVersion } from './version';
  """,1)
  s=s.replace("""  const savePlayer = async (id: string | null,""","""  /** Release notes: after an update, or from the About page. */
    const openWhatsNew = (releases: readonly
  … (1417 more characters)
  ```
- **Shell:** Check where the boot block landed

  ```bash
  sed -n 455,482p src/main.ts; grep -n "void refreshPlayerDetails();" src/main.ts
  ```
- **Shell:** Move the boot block to after menu creation

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  block="""
    // After an update, say what's new, once. Only remember the version if it
    // stuck, or blocked storage would show the notes on every visit.
    {
      const returning = store.data.profile.ink > 0 || players.list.players.length > 1;
      const fresh = releasesToAnnounce(loadSeenVersion(), APP_VERSION, returning);
      if (saveSeenVersion(APP_VERSION) && fresh.length > 0) {
        openWhatsNew(fresh.slice(0, MAX_NEW_RELEASES_SHOWN), fresh.slice(MAX_NEW_RELEASES_SHOWN), true);
      }
    }
  """
  assert block in s
  s=s.replace(block,"",1)
  anchor
  … (205 more characters)
  ```
- **Shell:** Find when the menu is first shown

  ```bash
  grep -n "syncMenu()" src/main.ts | head; sed -n 690,720p src/main.ts | grep -n "syncMenu\|loop" 
  ```
- **Shell:** List all syncMenu references

  ```bash
  grep -n "syncMenu" src/main.ts
  ```
- **Shell:** Read end of main boot sequence

  ```bash
  sed -n 905,930p src/main.ts
  ```

</details>

### 🤖 Claude

Moving the announcement after the first menu render so focus lands in the dialog.

<details><summary>2 tool calls</summary>

- **Shell:** Relocate update announcement after menu render

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  block="""
    // After an update, say what's new, once. Only remember the version if it
    // stuck, or blocked storage would show the notes on every visit.
    {
      const returning = store.data.profile.ink > 0 || players.list.players.length > 1;
      const fresh = releasesToAnnounce(loadSeenVersion(), APP_VERSION, returning);
      if (saveSeenVersion(APP_VERSION) && fresh.length > 0) {
        openWhatsNew(fresh.slice(0, MAX_NEW_RELEASES_SHOWN), fresh.slice(MAX_NEW_RELEASES_SHOWN), true);
      }
    }
  """
  s=s.replace(block,"",1)
  anchor="    renderer.syn
  … (220 more characters)
  ```
- **Shell:** Add tests and run typecheck, lint, tests

  ```bash
  python3 - <<'EOF'
  p='src/main.ts'
  s=open(p).read()
  s=s.replace("  syncMenu();\n  // After an update","  syncMenu();\n\n  // After an update",1)
  open(p,'w').write(s)
  EOF
  cat > src/core/releases.test.ts <<'EOF'
  import { readFileSync } from 'node:fs';
  import { describe, expect, it } from 'vitest';
  import { en } from '../i18n/en';
  import { RELEASES, compareVersions, isVersion, releasesToAnnounce, type Release } from './releases';

  const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8')) as { version: string };

  describe('RELEASES', () => {
    it('starts with the 
  … (4243 more characters)
  ```

</details>

### 🤖 Claude

Tests pass. Now the tagging script.

<details><summary>1 tool call</summary>

- **Shell:** Write tag script and test its guards

  ```bash
  sed -i '' "s/notes: \[\] , fixes/notes: [], fixes/" src/core/releases.test.ts && sed -n 1,21p scripts/snapshots.ts && cat > scripts/tag-release.ts <<'EOF'
  /**
   * Tag a release: an annotated git tag `v<version>` whose message is the
   * release's player notes from src/core/releases.ts. See docs/RELEASING.md.
   *
   *   npm run release:tag                      # tag HEAD with package.json's version
   *   npm run release:tag -- 1.2.0 39d338a     # tag an older commit (backfilling)
   *
   * The tag is dated like its commit, so backfilled tags sort by when the
   * release really happened. It never pushes; i
  … (1959 more characters)
  ```

</details>

### 🤖 Claude

Guards work. Now backfilling the historical tags (local only, nothing pushed).

<details><summary>1 tool call</summary>

- **Shell:** Create annotated tags for past releases

  ```bash
  while read v c; do node scripts/tag-release.ts $v $c | head -1; done <<'EOF'
  0.1.0 7e350bb
  0.2.0 25186eb
  0.3.0 e670c76
  0.4.0 5e85a0b
  0.5.0 145776d
  0.6.0 2047df6
  1.0.0 9168fc8
  1.1.0 a988927
  1.2.0 39d338a
  1.3.0 ef38850
  1.4.0 6c024f7
  2.0.0 d1fafbf
  2.1.0 3fe54b2
  2.1.1 1b30fbd
  2.2.0 bd874fa
  2.2.1 708b40c
  2.3.0 114804b
  2.4.0 c34334c
  2.5.0 f88d488
  EOF
  git tag -n1 --sort=creatordate | cat; git show v2.4.0 --no-patch | head -14
  ```

</details>

### 🤖 Claude

Now the docs, CLAUDE.md, and a small workflow that turns pushed tags into GitHub Releases.

<details><summary>1 tool call</summary>

- **Shell:** Write release docs, workflow and CLAUDE.md note

  ```bash
  cat > docs/RELEASING.md <<'EOF'
  # Releasing Inky Keys

  Every release has a [semantic version](https://semver.org/), a git tag `v<version>`, and a few lines of notes that players see in the game.

  ## Picking the version

  Inky Keys has no API, so "breaking" means breaking for a **player**: what someone coming back to the game will notice.

  | Bump | When | Examples |
  |---|---|---|
  | **Major** (`2.0.0`) | The shape of the game changes: a new way to play becomes the main one, or saved progress can't carry over. Rare. | The Apprentice course replacing the endless notebook (2.0.0). |
  | **Minor** (`2.
  … (4478 more characters)
  ```

</details>

### 🤖 Claude

Now build and check it in the browser.

<details><summary>3 tool calls</summary>

- **Shell:** Run checks, build, and read launch config

  ```bash
  npm run check 2>&1 | tail -5 && npm run build 2>&1 | tail -4 && cat .claude/launch.json
  ```
- **preview_start** `{"name":"inky-keys-dev"}`
- **javascript_tool** `{"action":"javascript_exec","text":"await new Promise(r => setTimeout(r, 1500)); ({ seen: localStorage.getItem('inkling.lastVersion'), dialog: !!document.querySelector('.whats-new') })"}`

</details>

### 🤖 Claude

New player: no popup, version recorded. Now simulating a returning player last on 2.3.0.

<details><summary>2 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"localStorage.setItem('inkling.lastVersion', '2.3.0'); location.reload();"}`
- **computer** `{"action":"screenshot"}`

</details>

### 🤖 Claude

Looks right. Checking focus, Esc, and the About page.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"javascript_tool","input":{"action":"javascript_exec","text":"document.activeElement.dataset.id"}},{"name":"computer","input":{"action":"key","text":"Escape","action_summary":"Closes the What's new card"}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"({di
… (307 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"({dialogs: document.querySelectorAll('.whats-new').length, screen: document.querySelector('.dialog.menu')?.dataset.screen, focus: document.activeElement?.dataset?.id, seen: localStorage.getItem('inkling.lastVersion')})"}`

</details>

### 🤖 Claude

Stale screenshot; the DOM shows About is open. Taking a fresh one.

<details><summary>5 tool calls</summary>

- **computer** `{"action":"screenshot"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"n","action_summary":"Opens What's new from About"}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"document.querySelector('.wn-earlier').open = true; document.querySelector('.wn-panel').scrollTop = 300; 'ok'"}},{"n
… (50 more characters)`
- **javascript_tool** `{"action":"javascript_exec","text":"await new Promise(r=>setTimeout(r,500)); const d=document.querySelector('.whats-new'); ({open: !!d, title: d?.querySelector('h2')?.textContent, sections: d?.querySelectorAll('.wn-release').length, earlierOpen: d?.querySelector('details')?.open, focus: document.act
… (27 more characters)`
- **computer** `{"action":"screenshot"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Escape","action_summary":"Closes the What's new card"}},{"name":"javascript_tool","input":{"action":"javascript_exec","text":"({open: !!document.querySelector('.whats-new'), screen: document.querySelector('.dialog.menu')?.dataset.screen,
… (111 more characters)`

</details>

### 🤖 Claude

Everything checks out (focus going back to "Back" is right: the N shortcut doesn't move focus). Putting the work on a branch per the project's conventions.

<details><summary>1 tool call</summary>

- **Shell:** Move uncommitted work onto a feature branch

  ```bash
  git switch -c feat/releases && git status --short | wc -l
  ```

</details>

### 🤖 Claude

I've built the release system, and the game is now at **2.6.0**. Players see a short "What's new" card after an update, and the About page shows the version and every release's notes. I also tagged each past milestone in git. Typecheck, lint, tests and the build all pass, and I checked it in the browser. Nothing is committed yet: the work is on a new branch, `feat/releases`, because `main` shouldn't be worked on directly.

## How I chose the numbers
There's no API to break, so "breaking" here means breaking for a returning player:
- **Major:** the game changes shape, like a new main way to play or progress that can't carry over. That has happened once: 2.0.0, when the Apprentice course took over from the endless notebook.
- **Minor:** something new a player can see or do. Every milestone is at least a minor.
- **Patch:** only fixes and tuning.
- **Before 1.0:** milestones 1 to 6 are 0.1 to 0.6. 1.0.0 is M7, where the first plan was finished.

The history now has 19 tags, v0.1.0 to v2.5.0. The playtest fixes became 2.1.1 and 2.2.1. The word filter, hands guide and typewriter Type Case became 2.3.0. M15 and M16 are 2.4.0 and 2.5.0. Each tag is dated like its commit, and its message is that release's notes. The full table is in [docs/RELEASING.md](docs/RELEASING.md). The rename, new domain and icons, plus this work, make up **2.6.0**.

## What players see
- **After an update:** a "What's new" card lists every release since the version that browser last ran. It shows up to three in full and folds older ones under "Earlier versions".
  - Brand-new players see nothing.
  - Players from before versions were tracked see only the current release.
  - The last version seen is stored per browser in `localStorage`, so there's no save-format change. If storage is blocked, the card stays hidden rather than showing on every visit.
- **On the About page:** "Version 2.6.0" under the heading, and a **What's new** button (shortcut N) that shows every release.
- **The notes themselves:** one short line each, at most four per release, written for kids. Anything that isn't a player-facing change becomes "Bug fixes and small improvements." Tests enforce the line length and the per-release limit.

## How releases work from now on
1. Add the release's notes and bump the version. A test fails if the version and the notes disagree.
2. After merging to `main`, run `npm run release:tag`. It refuses to run on a dirty tree, a version mismatch, or a branch other than `main`.
3. Push the tag. A new workflow, [release.yml](.github/workflows/release.yml), turns it into a GitHub Release with the same notes.

I added a line about this to `CLAUDE.md`.

## Before you commit or push
- **Pushing:** the 19 old tags exist only on this machine. Pushing them all at once (`git push origin --tags`) would create 19 GitHub Releases. If you'd rather not, push only the new tag once it exists.
- **Tagging 2.6.0:** that tag doesn't exist yet. It should be made after this branch is merged.
- **Wording:** please read through the notes in [en.ts](src/i18n/en.ts) (the `release.*` entries). I wrote them from the commit history, so a few may not match how you'd describe things.

Committing will also export the transcript, as the project requires.

## 🧑 Prompt

> Commit the working tree changes with a sensible message.

<details><summary>1 tool call</summary>

- **Shell:** Export the session transcript

  ```bash
  npm run transcript 2>&1 | tail -5 && git status --short docs/transcripts
  ```

</details>
