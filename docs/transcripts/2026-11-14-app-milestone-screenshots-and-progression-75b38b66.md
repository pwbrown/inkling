# App milestone screenshots and progression

Claude Code session started 2026-11-14. 3 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> Can you recreate the app at each different milestone so far and grab screenshots from different parts so I can see the progression and then document that going forward. For funsies

<details><summary>5 tool calls</summary>

- **Shell:** List commits and milestone headings

  ```bash
  git log --reverse --format='%h %ad %s' --date=short | cat && grep -n -i 'milestone\|^## \|^### M' docs/REQUIREMENTS.md | head -60 && ls docs && cat package.json
  ```
- **Shell:** Read milestones table and check tooling

  ```bash
  sed -n 243,268p docs/REQUIREMENTS.md; ls; ls node_modules | grep -i playwright; ls ~/Library/Caches/ms-playwright 2>/dev/null; which npx node; node -v
  ```
- **Shell:** Check for Chrome and source layout

  ```bash
  ls /Applications | grep -i -E 'chrome|chromium|edge|brave'; cd /Users/[removed]/projects/inkling && ls src src/ui src/core; cat vite.config.ts | head -40
  ```
- **Shell:** Find commits changing lockfile and main.ts

  ```bash
  git log --reverse --format='%h %s' -- package-lock.json | cat; git log --reverse --format='%h %s' -- src/main.ts | cat
  ```
- **Shell:** Create worktrees per milestone and build each

  ```bash
  S=<temp file>
  mkdir -p $S/wt && cd /Users/[removed]/projects/inkling
  cat > $S/setup.sh <<'EOF'
  set -e
  S=<temp file>
  cd /Users/[removed]/projects/inkling
  for pair in m01:7e350bb m02:25186eb m03:e670c76 m04:5e85a0b m05:145776d m06:2047df6 m07:9168fc8 m08:a988927 m09:39d338a m10:ef38850 m11:6c024f7 m12:d1fafbf m13:3fe54b2 m14:bd874fa now:114804b; do
    n=${pair%%:*}; c=${pair##*:}
    [ -d $S/wt/$n ] || git
  … (525 more characters)
  ```

</details>

### 🤖 Claude

Builds of all 15 milestones are done; now writing a small headless-Chrome driver to capture screenshots.

<details><summary>10 tool calls</summary>

- **Shell:** Write server and CDP driver, take probe screenshots

  ```bash
  S=<temp file>
  cat > $S/serve.mjs <<'EOF'
  // Tiny static server: node serve.mjs <dir> <port>
  import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
  const [dir, port] = process.argv.slice(2);
  const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
  http.createServer((req, res) => {
    let p = path.join(dir, decodeURICo
  … (4751 more characters)
  ```
- **Shell:** Fix cleanup and shrink probe shots

  ```bash
  S=<temp file> cd $S
  sed -i '' 's/^ws.close(); chrome.kill(); fs.rmSync(prof, { recursive: true, force: true });/ws.close(); chrome.kill(); await sleep(800); try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}/' shoot.mjs; tail -1 shoot.mjs
  ls probe/*/; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4101/
  # contact sheet of probes, small
  mkdir -p sheet; for n in m01 m02 m03 m04 m05 m06 m07 m08 m09 m10 m11 m12 m13 m14 now; do sips -Z 640 probe/$n/start.png --out sheet/$n.pn
  … (28 more characters)
  ```
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Shell:** Look for debug hooks and menu key handling

  ```bash
  grep -rn "window\.\(__\|inkling\)\|globalThis\.\|import.meta.env.DEV" src | grep -v test | head; grep -n "keydown\|'Enter'\|case '" src/ui/menu.ts | head -40
  ```
- **Shell:** Inspect dev hooks across milestones

  ```bash
  sed -n 750,790p src/main.ts; for c in 25186eb e670c76 5e85a0b 145776d 2047df6 9168fc8 a988927 39d338a ef38850 6c024f7 d1fafbf 3fe54b2 bd874fa; do echo "== $c"; git show $c:src/main.ts | grep -n "DEV\|__ink\|window\.\w* =" | head -5; done
  ```
- **Shell:** Inspect dev hooks across milestones

  ```bash
  for c in 25186eb e670c76 5e85a0b 145776d 2047df6 9168fc8 a988927 39d338a ef38850 6c024f7 d1fafbf 3fe54b2 bd874fa; do echo "== $c"; git show "${c}:src/main.ts" | grep -n "DEV\|\.inkling = " | head -5; done; grep -n "targets\|class World\|  [a-z]*: .*\[\]" src/core/world.ts | head -30
  ```

</details>

### 🤖 Claude

Builds work; switching to dev-mode builds so I can read game state and auto-play pages for gameplay shots.

<details><summary>8 tool calls</summary>

- **Shell:** Check target shape and game var

  ```bash
  git show 25186eb:src/core/world.ts | grep -n "interface Target" -A12; grep -n "const game\b\|let game\b\|game = " src/main.ts | head -5; grep -n "interface Target " -A20 src/core/world.ts | head -30
  ```
- **Shell:** Rebuild each milestone in development mode

  ```bash
  pkill -f "scratchpad/serve.mjs" ; S=<temp file> cd $S/wt; for n in m01 m02 m03 m04 m05 m06 m07 m08 m09 m10 m11 m12 m13 m14 now; do (cd $n && npx vite build --mode development --outDir dist-dev --logLevel error >/dev/null 2>&1 && grep -l "inkling = " dist-dev/assets/*.js >/dev/null && echo "$n ok" || echo "$n nohook") ; done
  ```
- **Shell:** Check dev build output for the hook

  ```bash
  S=<temp file> cd $S/wt/now; ls dist-dev/assets | head; grep -o "\.inkling *= *{[^}]\{0,40\}" dist-dev/assets/*.js | head -3; grep -c "openVocab" dist-dev/assets/*.js
  ```
- **Shell:** Expose debug hook and rebuild production bundles

  ```bash
  S=<temp file> cd $S/wt; for n in m02 m03 m04 m05 m06 m07 m08 m09 m10 m11 m12 m13 m14 now; do (cd $n && rm -rf dist-dev && sed -i '' 's/if (import.meta.env.DEV) {/if (true) {/' src/main.ts && npx vite build --logLevel error >/dev/null 2>&1 && grep -q "openKeys\|createContentSource\|renderer" dist/assets/index-*.js && echo "$n ok" || echo "$n fail") ; done
  ```
- **Shell:** Check for PIL for montages

  ```bash
  S=<temp file> cd $S/sheet; python3 - <<'EOF' 2>&1 || echo nopil
  from PIL import Image
  EOF
  # make 2-col montage with sips not possible; use python if PIL present
  ```
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`

</details>

### 🤖 Claude

Driver works. Now scripting per-milestone tours (menus, key picker, gameplay with an auto-typer) and iterating on the shots.

<details><summary>3 tool calls</summary>

- **Shell:** Run screenshot tours for all milestones

  ```bash
  S=<temp file> cd $S
  cat > tours.mjs <<'EOF'
  // Per-milestone screenshot tours. node tours.mjs <name...>
  import fs from 'node:fs'; import { execFile } from 'node:child_process';
  const READ = `(()=>{const w=window.inkling&&window.inkling.world; if(!w||!w.targets) return ''; const ts=w.targets.filter(t=>t.typed<t.text.length && t.buffer===undefined); if(!ts.length) return ''; const cur=ts.find(t=>t.typed>0); const t=cur||ts.sort((a,b)=>a.x-b.x)[0]; return t.text[t.typed]})()`;
  const play = (ms) => ({ 
  … (3045 more characters)
  ```
- **Shell:** Build a contact sheet of early milestone shots

  ```bash
  S=<temp file> cd $S
  cat > sheet.mjs <<'EOF'
  import fs from 'node:fs';
  const groups = process.argv.slice(2);
  let h = '<body style="margin:0;font:14px sans-serif;background:#fff">';
  for (const g of groups) { h += `<div style="padding:4px"><b>${g}</b><br>`; for (const f of fs.readdirSync(`shots/${g}`).sort()) h += `<figure style="display:inline-block;margin:2px;width:310px"><img src="shots/${g}/${f}" width=310><figcaption>${f}</figcaption></figure>`; h += '</div>'; }
  fs.writeFileSync('sheet.html', h +
  … (320 more characters)
  ```
- **Read** `<temp file>`

</details>

### 🤖 Claude

Gameplay shots came out empty (the auto-typer clears creatures the instant they spawn) and accuracy reads oddly low — debugging that.

<details><summary>6 tool calls</summary>

- **Shell:** Inspect world state during play in M2

  ```bash
  S=<temp file> cd $S
  cat > dbg.json <<'EOF'
  [{"key":"Enter","wait":300},{"wait":3000,"eval":"JSON.stringify(window.inkling.world.targets.map(t=>[t.text,t.typed,Math.round(t.x)]))"},{"type":"x"},{"wait":200,"eval":"JSON.stringify(Object.keys(window.inkling.world))"},{"eval":"JSON.stringify(window.inkling.world.stats||window.inkling.world.page)"}]
  EOF
  node shoot.mjs http://127.0.0.1:4102/ dbgout dbg.json; grep -n "keydown\|keypress\|addEventListener" wt/m02/src/input/*.ts wt/m02/src/main.ts | head
  ```
- **Shell:** Check stats after autoplay

  ```bash
  S=<temp file> cd $S
  node -e '
  const READ=JSON.parse(require("fs").readFileSync("tours/m02.json"))[2].read;
  require("fs").writeFileSync("dbg2.json",JSON.stringify([{key:"Enter",wait:300},{typeTargets:8000,read:READ},{eval:"JSON.stringify(window.inkling.world.stats)"},{eval:"document.body.innerText.slice(0,300)"}]))'
  node shoot.mjs http://127.0.0.1:4102/ dbgout dbg2.json
  ```
- **Shell:** Limit auto-typer to on-screen targets and retest

  ```bash
  S=<temp file> cd $S
  python3 - <<'EOF'
  p='tours.mjs'; s=open(p).read()
  s=s.replace("const READ = `(()=>{const w=window.inkling&&window.inkling.world; if(!w||!w.targets) return ''; const ts=w.targets.filter(t=>t.typed<t.text.length && t.buffer===undefined);",
   "const READ = (maxX) => `(()=>{const w=window.inkling&&window.inkling.world; if(!w||!w.targets) return ''; const ts=w.targets.filter(t=>t.typed<t.text.length && t.buffer===undefined && t.x<${maxX});")
  s=s.replace("const play = (ms) => ({ typeTa
  … (709 more characters)
  ```
- **Read** `<temp file>`
- **Shell:** Rerun tours and build contact sheet

  ```bash
  S=<temp file> cd $S
  sed -i '' 's/play(30000)/play(50000, 1000)/g' tours.mjs && node tours.mjs 2>&1 | grep -i "missing\|error" ; node sheet.mjs m02 m03 m04 m05 m06 m07 m08 && node shoot-tall.mjs file://$S/sheet.html sheets sheetshot.json && sips -Z 1700 sheets/sheet.png >/dev/null
  ```
- **Read** `<temp file>`

</details>

### 🤖 Claude

Early milestones look good. Checking later milestones' shots.

<details><summary>3 tool calls</summary>

- **Shell:** Build contact sheets for later milestones

  ```bash
  S=<temp file> cd $S
  node sheet.mjs m07 m08 m09 m10 m11 && node shoot-tall.mjs file://$S/sheet.html sheets sheetshot.json && sips -Z 1700 sheets/sheet.png --out sheets/b.png >/dev/null; node sheet.mjs m12 m13 m14 now && node shoot-tall.mjs file://$S/sheet.html sheets sheetshot.json && sips -Z 1700 sheets/sheet.png --out sheets/c.png >/dev/null
  ```
- **Read** `<temp file>`
- **Read** `<temp file>`

</details>

### 🤖 Claude

M9+ didn't actually start a game (Enter didn't press "Start writing", and the Apprentice contents need a chapter click). Fixing the tours.

<details><summary>14 tool calls</summary>

- **Shell:** Fix tours for menus and add page 2 shots

  ```bash
  S=<temp file> cd $S
  python3 - <<'EOF'
  p='tours.mjs'; s=open(p).read()
  top="{ eval: \"document.querySelectorAll('*').forEach(e=>{if(e.scrollTop)e.scrollTop=0}); 1\" }"
  s=s.replace("{ clickText: 'How to play', after: 800, shot: '04-howto' }", "{ clickText: 'How to play', after: 800 }, "+top+", { shot: '04-howto' }")
  s=s.replace("{ clickText: 'Desk', after: 800, shot: '02-desk' }", "{ clickText: 'Desk', after: 800 }, "+top+", { shot: '02-desk' }")
  s=s.replace("T.m09 = menu([{ clickText: 'New notebook'
  … (1035 more characters)
  ```
- **Shell:** Contact sheet for M9 and M12

  ```bash
  S=<temp file> cd $S
  node sheet.mjs m09 m12 && node shoot-tall.mjs file://$S/sheet.html sheets sheetshot.json && sips -Z 1700 sheets/sheet.png --out sheets/d.png >/dev/null
  ```
- **Read** `<temp file>`
- **Shell:** Prefer buttons when clicking by text and retry M12

  ```bash
  S=<temp file> cd $S
  python3 - <<'EOF'
  p='shoot.mjs'; s=open(p).read()
  old="[...document.querySelectorAll('button,a,[role=button],li,label')].find(e=>e.offsetParent!==null&&e.textContent.trim().toLowerCase().includes(${JSON.stringify(s.clickText.toLowerCase())}))"
  new="(()=>{const q=${JSON.stringify(s.clickText.toLowerCase())}; const f=(sel)=>[...document.querySelectorAll(sel)].find(e=>e.offsetParent!==null&&!e.disabled&&e.textContent.trim().toLowerCase().includes(q)); return f('button,a,[role=butto
  … (263 more characters)
  ```
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Shell:** Add chapter intro step and rerun all tours

  ```bash
  S=<temp file> cd $S
  sed -i '' "s/{ clickText: 'Chapter 1', after: 600 }/{ clickText: 'Chapter 1', after: 900, shot: '05b-chapter' }, { key: 'Enter', wait: 500 }/" tours.mjs
  node tours.mjs 2>&1 | grep -i "missing"; node sheet.mjs m12 m13 m14 now && node shoot-tall.mjs file://$S/sheet.html sheets sheetshot.json && sips -Z 1700 sheets/sheet.png --out sheets/e.png >/dev/null
  ```
- **Read** `<temp file>`
- **Shell:** Shrink selected shots for review

  ```bash
  S=<temp file> cd $S; mkdir -p sm; for f in m03/04-page2 m08/05-page2 m11/08-page2 now/08-page2 now/07-later m10/06-play; do sips -Z 640 shots/$f.png --out sm/${f/\//_}.png >/dev/null; done; ls sm
  ```
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`
- **Read** `<temp file>`

</details>

### 🤖 Claude

Shots look good. Now curating a few per milestone and sizing them for the repo.

<details><summary>5 tool calls</summary>

- **Shell:** Compare image sizes for formats

  ```bash
  S=<temp file> cd $S; du -sh shots; ls -la shots/now | head -5; sips -Z 960 shots/now/01-menu.png --out /tmp/claude-501/t.png >/dev/null 2>&1 || sips -Z 960 shots/now/01-menu.png --out sm/t.png >/dev/null; ls -la sm/t.png /tmp/claude-501/t.png 2>/dev/null; sips -s format jpeg -s formatOptions 80 -Z 960 shots/now/06-play.png --out sm/t.jpg >/dev/null; ls -la sm/t.jpg; sips -Z 960 shots/now/06-play.png --out sm/t2.png >/dev/null; ls -la sm/t2.png
  ```
- **Shell:** Check tsconfig, lint config, scripts and README

  ```bash
  cat tsconfig.json eslint.config.js; ls scripts; head -30 scripts/export-transcript.ts; cat README.md | head -60; git stash list
  ```
- **Shell:** Shrink latest chapter intro and view latest commit

  ```bash
  S=<temp file> cd $S; sips -Z 800 shots/now/05b-chapter.png --out sm/a.png >/dev/null; cd /Users/[removed]/projects/inkling; git show 114804b --stat | head -30
  ```
- **Read** `<temp file>`
- **Shell:** Add Type Case and word list shots, rerun later tours

  ```bash
  S=<temp file> cd $S
  python3 - <<'EOF'
  p='tours.mjs'; s=open(p).read()
  s=s.replace("const later = (extra) => [{ shot: '01-menu' }, ...extra,",
   "const later = (extra) => [{ shot: '01-menu' }, ...extra, { clickText: 'Practice', after: 800, shot: '02p-practice' }, { clickText: 'Change keys', after: 900, shot: '02k-keys' }, { key: 'Escape', wait: 400 }, { key: 'Escape', wait: 400 }, { eval: \"document.querySelector('dialog[open]') ? 'dialog still open' : 'ok'\" },")
  s=s.replace("T.m12 = later([{ clickT
  … (418 more characters)
  ```

</details>

## 🧑 Sent while Claude was working

> especially highlight the differences between versions

<details><summary>1 tool call</summary>

- **Shell:** Rerun all tours in two clean batches

  ```bash
  S=<temp file> cd $S; pkill -f "Google Chrome.*ink-" ; node tours.mjs m01 m02 m03 m04 m05 m06 m07 m08 2>&1 | grep -i missing; node tours.mjs m09 m10 m11 m12 m13 m14 now 2>&1 | grep -i missing; echo done
  ```

</details>

### 🤖 Claude

No missing clicks. Pulling each milestone's commit notes so the "what changed" text is accurate.

<details><summary>3 tool calls</summary>

- **Shell:** Read milestone commit messages

  ```bash
  for c in 7e350bb 25186eb e670c76 5e85a0b 145776d 2047df6 9168fc8 a988927 39d338a ef38850 6c024f7 d1fafbf 3fe54b2 1b30fbd bd874fa 708b40c 631fd48 250bb4b 8541eee 114804b; do echo "=== $c"; git log -1 --format='%s%n%b' $c | grep -v "Co-Authored\|^$\|ranscript" | head -14; done
  ```
- **Shell:** Inspect target kinds and variant fields

  ```bash
  sed -n 1,44p src/core/world.ts | grep -n "Kind\|kind" ; sed -n 64,110p src/core/world.ts; git show 6c024f7:src/core/world.ts | grep -n "variant\|ghost\|lives" | head
  ```
- **Shell:** Find target kinds and world dimensions

  ```bash
  grep -n "export type TargetKind" -A3 src/core/world.ts src/core/*.ts | head; git show a988927:src/core/world.ts | grep -n "TargetKind =" ; grep -n "WORLD_WIDTH =\|WORLD_HEIGHT =\|LANE" src/core/world.ts src/core/config.ts | head
  ```

</details>

### 🤖 Claude

Staging a "creature lineup" scene via the debug hook so variants, Run-ons and Misprints appear side by side in the versions that have them.

<details><summary>4 tool calls</summary>

- **Shell:** Stage a creature lineup in M11 and latest

  ```bash
  S=<temp file> cd $S
  cat > stage.js <<'EOF'
  (()=>{const w=window.inkling.world; const base=w.targets[0]; if(!base) return 'none';
  const lanes=[...new Set(w.targets.map(t=>t.lane+':'+Math.round(t.y)))];
  const ys=(l)=>60+l*48;
  const mk=(o)=>({...base, typed:0, buffer:undefined, cursor:undefined, lives:1, maxLives:undefined, ghost:false, boss:false, speed:4, ...o, y:ys(o.lane), id:w.nextId++, prevX:o.x});
  const items=[
   {kind:'drip',text:'f',x:520,lane:2},
   {kind:'blotling',text:'quill',x:760,lane:4},

  … (1017 more characters)
  ```
- **Read** `<temp file>`
- **Shell:** Stage lineups across M8 to latest

  ```bash
  S=<temp file> cd $S
  sed -i '' 's/const ys=(l)=>60+l\*48;/const ys=(l)=>120+l*48;/; s/w.targets=items.map(mk); w.lockedId=null;/if(w.page\&\&typeof w.page.spawned==="number") w.page.spawned+=items.length-w.targets.length; w.targets=items.map(mk); w.lockedId=null;/' stage.js; grep -c "120+l" stage.js
  node -e '
  const fs=require("fs");const st=fs.readFileSync("stage.js","utf8");
  const tail=[{eval:st},{wait:700,shot:"lineup"}];
  const A=[{key:"Enter",wait:4000},...tail], B=[{clickText:"New notebook",afte
  … (1085 more characters)
  ```
- **Read** `<temp file>`

</details>

### 🤖 Claude

Lineup works nicely — nudging the bottom stamp up off the footer and re-shooting.

<details><summary>2 tool calls</summary>

- **Shell:** Adjust lanes and reshoot lineups

  ```bash
  S=<temp file> cd $S
  sed -i '' 's/lane:2}/lane:0}/; s/x:760,lane:4}/x:760,lane:2}/; s/lane:6,lives:2/lane:4,lives:2/; s/lane:8,lives:3/lane:6,lives:3/; s/x:860,lane:10}/x:860,lane:8}/; s/x:520,lane:12}/x:520,lane:10}/' stage.js; grep -o "lane:[0-9]*" stage.js | tr '\n' ' '
  node -e '
  const fs=require("fs");const st=fs.readFileSync("stage.js","utf8");
  for(const n of ["m08","m09","m10","m11","m12","m13","m14","now"]){const s=JSON.parse(fs.readFileSync(`stage-${n}.json`));s[s.length-2].eval=st;fs.writeF
  … (286 more characters)
  ```
- **Read** `<temp file>`

</details>

### 🤖 Claude

Lineup is clean. Before writing captions, checking the shots I plan to compare so the text matches what's actually on screen.

<details><summary>2 tool calls</summary>

- **Shell:** Contact sheet of comparison candidates

  ```bash
  S=<temp file> cd $S
  node -e 'const fs=require("fs");let h="<body style=\"margin:0;font:13px sans-serif\">";for(const f of ["m07/02-keys","m10/02-keys","now/02k-keys","m13/07-later","m14/02-desk","now/09-pause","m08/02d-wordlists","m10/06-play","now/03-settings"])h+=`<figure style="display:inline-block;margin:2px;width:620px"><img src="shots/${f}.png" width=620><figcaption>${f}</figcaption></figure>`;fs.writeFileSync("sheet.html",h)'
  node shoot-tall.mjs file://$S/sheet.html sheets sheetshot.json >/d
  … (70 more characters)
  ```
- **Read** `<temp file>`

</details>

### 🤖 Claude

Everything checks out. Creating the branch and copying the curated shots into the repo.

<details><summary>1 tool call</summary>

- **Shell:** Create branch and copy curated screenshots

  ```bash
  S=<temp file> cd /Users/[removed]/projects/inkling && git switch -c chore/progression-gallery && D=docs/progression && mkdir -p $D
  while read src dst; do mkdir -p $D/$(dirname $dst); cp $S/$src $D/$dst; done <<'EOF'
  shots/m01/01-start.png m01/play.png
  shots/m02/01-start.png m02/start.png
  shots/m02/02-play.png m02/play.png
  shots/m02/03-later.png m02/page-done.png
  shots/m03/04-page2.png m03/play.png
  shots/m04/01-start.png m04/start.png
  shots/m05/01-start.png m05/start.png
  shots/m05/02-keys.png m05/
  … (1342 more characters)
  ```

</details>

### 🤖 Claude

Now the reusable script so future milestones get the same shots with one command.

<details><summary>4 tool calls</summary>

- **Wrote** `scripts/snapshots.ts`
- **Shell:** Add npm script and run snapshots for latest

  ```bash
  npm pkg set scripts.snapshots="node scripts/snapshots.ts" && npm run snapshots -- latest 2>&1 | tail -20; ls docs/progression/latest
  ```
- **Shell:** Contact sheet of the script's output

  ```bash
  cd /Users/[removed]/projects/inkling/docs/progression/latest && S=<temp file> && cd $S && node -e 'const fs=require("fs");const d="/Users/[removed]/projects/inkling/docs/progression/latest";let h="<body style=\"margin:0;font:13px sans-serif\">";for(const f of fs.readdirSync(d))h+=`<figure style="display:inline-block;margin:2px;width:400px"><img src="${d}/${f}" width=400><figcaption>${f}</figcaption></figure>`;fs.writeFileSync("sheet.html",h)' && node shoot-tall.mjs file://$S/sheet.html sheets sh
  … (86 more characters)
  ```
- **Read** `<temp file>`

</details>

### 🤖 Claude

The script reproduces the full tour on its own. Writing the gallery page, leading with side-by-side comparisons of the same screen across versions.

<details><summary>1 tool call</summary>

- **Wrote** `docs/progression/README.md`

</details>

### 🤖 Claude

Two captions need fixing: the script paused in Practice mode, which hides "Practice these keys", and one caption overstated the latest page card. Moving the pause shot into the Apprentice chapter.

<details><summary>6 tool calls</summary>

- **Edited** `scripts/snapshots.ts`
- **Edited** `docs/progression/README.md`
- **Edited** `docs/progression/README.md`
- **Shell:** Rerun snapshots for latest

  ```bash
  npm run snapshots -- latest 2>&1 | grep -v "^$" | tail -4 && sips -Z 800 docs/progression/latest/pause.png --out <temp file> >/dev/null && sips -Z 800 docs/progression/latest/page-done.png --out <temp file> >/dev/null
  ```
- **Read** `<temp file>`
- **Read** `<temp file>`

</details>

### 🤖 Claude

Both fixed. Now linking it from the README and adding the convention to CLAUDE.md, then pruning unused shots.

<details><summary>4 tool calls</summary>

- **Shell:** Prune unused shots and check image links

  ```bash
  for f in docs/progression/latest/*.png docs/progression/m*/*.png; do rel=${f#docs/progression/}; grep -q "$rel" docs/progression/README.md || { echo "unused: $rel"; rm "$f"; }; done; grep -o 'src="[^"]*"' docs/progression/README.md | sed 's/src="//;s/"//' | sort -u | while read p; do [ -f docs/progression/$p ] || echo "MISSING $p"; done; du -sh docs/progression; grep -n "Design: \[docs/DESIGN.md\]" README.md; grep -n "## Before calling work done" -A4 CLAUDE.md
  ```
- **Edited** `README.md`
- **Edited** `CLAUDE.md`
- **Shell:** Run typecheck, lint, tests and build

  ```bash
  npm run check 2>&1 | tail -15 && npm run build 2>&1 | tail -4
  ```

</details>

### 🤖 Claude

Check and build pass. Cleaning up the temporary worktrees and servers.

<details><summary>1 tool call</summary>

- **Shell:** Remove scratch worktrees and stop servers

  ```bash
  pkill -f "scratchpad/serve.mjs"; cd /Users/[removed]/projects/inkling && for d in $(git worktree list --porcelain | awk '/^worktree .*scratchpad\/wt\//{print $2}'); do git worktree remove --force "$d"; done; git worktree prune; git worktree list; git status --short
  ```

</details>

### 🤖 Claude

I rebuilt Inkling at every milestone from its own commit (M1 through M14, plus the current build) and played each one in headless Chrome to capture screenshots. The result is [docs/progression/README.md](docs/progression/README.md).

**Side by side.** Following your follow-up message, the page opens by putting the same screen next to itself across versions, with a caption saying what changed:
- **Creatures:** a placeholder blob (M1), then letter drips (M2), word Blotlings (M3), flat Run-ons and Misprints (M8), creatures with faces (M11), and spiky crimson and crowned violet ones (M14).
- **Font:** the system font in M9 against Atkinson Hyperlegible in M10.
- **First screen:** the "Press Enter" card, then the difficulty picker, then the main menu as it gained Apprentice, Desk, players and the new tagline.
- **Type Case:** the wooden keyboard, then mastery bars, then today's typewriter.
- **End of page:** plain stats, then a red-pen grade, then stars, then ink and level-ups.
- **Chapter card:** the 10-chapter home-row card against today's 27-chapter card with the hands guide.
- **Settings and pause menus.**

**Milestone by milestone.** After the comparisons, each milestone has a section with one or two shots and what it added or changed.

**How the shots were made:**
- A small auto-typer plays the pages, so every grade is an A+.
- The "lineup" shots are staged. They swap the creatures on screen for one of every kind so looks can be compared, even in versions where crimson and violet creatures only appear chapters later. The page says this.
- The repo now holds about 2.3 MB of PNGs. I kept only the ones the page uses.

**From now on:**
- `npm run snapshots -- m15` starts the dev server and headless Chrome, plays through the menus, the Type Case, a staged lineup, the pause menu, a chapter card and a full page, and writes the shots to `docs/progression/m15/`. It needs Chrome and Node 22 or later.
- I added a line to `CLAUDE.md` saying to run it at the end of each milestone and add the result to the gallery. The README links to the gallery.

`npm run check` and `npm run build` pass. Everything is on `chore/progression-gallery` and nothing is committed; the temporary worktrees are removed.

## 🧑 Prompt

> Commit the working tree changes with a sensible message.

<details><summary>1 tool call</summary>

- **Shell:** Export session transcripts

  ```bash
  npm run transcript 2>&1 | tail -5; git status --short docs/transcripts
  ```

</details>
