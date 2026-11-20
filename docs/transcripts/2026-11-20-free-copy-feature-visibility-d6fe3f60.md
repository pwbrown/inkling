# Free copy feature visibility

Claude Code session started 2026-11-20. 2 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> Can you make sure the free copy feature shows up in the how to play section, the static page, and just any other place that makes sense.

<details><summary>2 tool calls</summary>

- **Shell:** Create branch and find Fair Copy references

  ```bash
  git checkout -b feat/fair-copy-docs && grep -rniI "fair copy\|fairCopy\|faircopy" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=transcripts -l . ; echo ---; ls site site/*; echo ---; grep -rn "howTo\|how_to\|howToPlay" src --include=*.ts -l
  ```
- **Shell:** Look at Fair Copy and how-to-play strings

  ```bash
  grep -n -i "fairCopy\|fair copy" src/i18n/en.ts | head -60; echo ---; grep -n -i "howto\|how to play\|help\." src/i18n/en.ts | head -60; echo ---; grep -rln -i "howTo\|help" src/ui | head
  ```

</details>

## 🧑 Sent while Claude was working

> ship it when you're done

<details><summary>3 tool calls</summary>

- **Shell:** Read How to Play strings, menu code, release docs

  ```bash
  sed -n 640,732p src/i18n/en.ts; echo ---; grep -n "how\.\|showHow" src/ui/menu.ts | head -40; cat docs/RELEASING.md | head -60
  ```
- **Shell:** Read How to Play code, static page, other mentions

  ```bash
  sed -n 640,740p src/ui/menu.ts; grep -n "fairCopy" src/ui/menu.ts src/ui/icons.ts | head; echo ---; cat site/en/how-to-play.html; echo ---; grep -n -i "free write\|apprentice\|mode" site/en/parents-and-teachers.html README.md index.html | head -40
  ```
- **Shell:** Read CSS, README, parents page, noscript

  ```bash
  grep -n "how-tiles" src/ui/*.css; sed -n 25,60p README.md; sed -n 1,45p site/en/parents-and-teachers.html; grep -n -i "noscript" -A12 index.html | head -30; grep -n "daily\|Daily" src/ui/menu.ts | head -5; grep -n "passages\|PASSAGES" src/core/fairCopy.ts | head; ls src/content | head -30
  ```

</details>

### 🤖 Claude

Adding Fair Copy to the in-game How to play, the static pages and the README now.

<details><summary>6 tool calls</summary>

- **Shell:** Check tile CSS, README sections, passages

  ```bash
  sed -n 970,1000p src/ui/menu.css; grep -n -i "daily page\|### " README.md | head -30; sed -n 20,52p src/core/fairCopy.ts; grep -n "'menu.daily\|menu.practice'\|menu.apprentice'" src/i18n/en.ts
  ```
- **Shell:** Add Fair Copy tile to in-game How to play

  ```bash
  python3 - <<'EOF'
  import re,pathlib
  p=pathlib.Path('src/i18n/en.ts'); s=p.read_text()
  s=s.replace("'how.modesTitle': 'Free Write and Apprentice',","'how.modesTitle': 'Ways to play',")
  s=s.replace("  'how.power.paperweight'","  'how.mode.fairCopy': 'A typing-speed test: copy out a passage from a classic book, or type for 30 or 60 seconds. Leave no mistakes in.',\n  'how.power.paperweight'",1)
  p.write_text(s)
  p=pathlib.Path('src/ui/menu.ts'); s=p.read_text()
  old="""        h('ul', { className: 'how-tiles how-tiles-2' }, [
            iconTile('freeWrite', t('menu.practice'), t('how.mode.freeWrite'
  … (497 more characters)
  ```
- **Shell:** Update static pages, README, and index description

  ```bash
  python3 - <<'EOF'
  import pathlib
  def rep(path, old, new):
      p=pathlib.Path(path); s=p.read_text(); assert old in s, (path, old); p.write_text(s.replace(old,new,1))
  rep('src/ui/menu.css', """.how-tiles-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  """, "")
  f='site/en/how-to-play.html'
  rep(f, "Modes, keys, powers, bosses and tips.", "Modes, the Fair Copy speed test, keys, powers, bosses and tips.")
  rep(f, "<h2>Two ways to play</h2>", "<h2>Ways to play</h2>")
  rep(f, """  friends and family. Only your first go counts, and streaks build day by day.
  </p>
  """, """  friends and family. Only your f
  … (2273 more characters)
  ```
- **Shell:** Fix README reference and view releases format

  ```bash
  sed -i '' 's/and the numbers in `GAME_CONFIG`\./and the numbers in `GAME_CONFIG.fairCopy`./' README.md && sed -n 1,40p src/core/releases.ts && grep -n "fixes: true" src/core/releases.ts | head -3
  ```
- **Shell:** Add release entry, bump version, run check and build

  ```bash
  python3 - <<'EOF'
  import pathlib
  p=pathlib.Path('src/core/releases.ts'); s=p.read_text()
  s=s.replace("""export const RELEASES: readonly Release[] = [
  ""","""export const RELEASES: readonly Release[] = [
    {
      version: '2.26.1',
      date: '2026-11-20',
      notes: ['release.2.26.1.howTo'],
    },
  """,1); p.write_text(s)
  p=pathlib.Path('src/i18n/en.ts'); s=p.read_text()
  s=s.replace("  'release.2.26.0.bookworm'","  'release.2.26.1.howTo': 'How to play now explains Fair Copy, the typing-speed test.',\n  'release.2.26.0.bookworm'",1); p.write_text(s)
  EOF
  npm version 2.26.1 --no-git-tag-version >/dev
  … (70 more characters)
  ```
- **Shell:** Show the failing site page test

  ```bash
  npx vitest run 2>&1 | grep -B25 "toMatch(/<h1>/)" | head -40
  ```

</details>

### 🤖 Claude

Description ran 10 chars over the search limit; shortening it and re-running checks.

<details><summary>1 tool call</summary>

- **Shell:** Shorten description, rerun check and build

  ```bash
  sed -i '' 's/Modes, the Fair Copy speed test, keys, powers, bosses and tips\./Modes, Fair Copy, keys, powers, bosses and tips./' site/en/how-to-play.html && npm run check 2>&1 | grep -E "Tests |error" ; npm run build 2>&1 | grep -iE "error|built in" | head
  ```

</details>

### 🤖 Claude

Checks pass. Now checking the How to play screen in the browser.

<details><summary>5 tool calls</summary>

- **Shell:** Read dev server launch config

  ```bash
  cat .claude/launch.json 2>/dev/null
  ```
- **preview_start** `{"name":"inky-keys-dev"}`
- **find** `{"query":"How to play"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_33","action_summary":"Opens How to play"}},{"name":"find","input":{"query":"Ways to play"}},{"name":"computer","input":{"action":"screenshot","scale":0.6}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"scroll_to","ref":"ref_56"}},{"name":"computer","input":{"action":"screenshot"}}]}`

</details>

### 🤖 Claude

Trimming the Fair Copy tile text so it matches the length of the others, then shipping.

<details><summary>2 tool calls</summary>

- **Shell:** Trim tile text, recheck, confirm static pages built

  ```bash
  sed -i '' "s/ or type for 30 or 60 seconds. Leave no mistakes in.',/ or type for 30 or 60 seconds.',/" src/i18n/en.ts && grep -n "how.mode.fairCopy" src/i18n/en.ts && npm run check 2>&1 | grep -E "Tests " && npm run build 2>&1 | grep -iE "error|built in" && grep -c "Fair Copy" dist/how-to-play/index.html dist/parents-and-teachers/index.html
  ```
- **computer** `{"action":"screenshot","scale":0.6}`

</details>

### 🤖 Claude

Layout verified. Now committing, merging and tagging.

<details><summary>1 tool call</summary>

- **Shell:** Export transcript and show changed files

  ```bash
  npm run transcript 2>&1 | tail -3; git status --short | head -20
  ```

</details>
