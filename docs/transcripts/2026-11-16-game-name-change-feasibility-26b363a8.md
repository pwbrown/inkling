# Game name change feasibility

Claude Code session started 2026-11-16. 16 prompts.

Exported with `npm run transcript`. Tool output, hidden reasoning and system prompts are left out; commands are cut short when long. Private details (email, home folder) are removed.

---

## 🧑 Prompt

> How obsurd would it be to consider changing the name of the game at this point?

<details><summary>1 tool call</summary>

- **Shell:** Count where the game name appears in the repo

  ```bash
  cd /Users/[removed]/projects/inkling; echo "files: $(git grep -il inkling -- . ':!docs/transcripts' | wc -l)"; echo "hits: $(git grep -io inkling -- . ':!docs/transcripts' | wc -l)"; git grep -il inkling -- . ':!docs/transcripts' | head -40; echo; grep -rn "inkling" src/storage/*.ts | head; git remote -v | head -2; git stash list | head -3
  ```

</details>

### 🤖 Claude

Not absurd at all. Now is about the cheapest time it will ever be. Here's what it would actually involve:

**The code side is small.** "Inkling" shows up 116 times across 33 files. Most are in docs, the README, i18n strings, `package.json`, `index.html`, the PWA manifest in `vite.config.ts`, the issue templates and scripts. That's an afternoon of find-and-replace plus a check.

**Three things need care:**

1. **Save identifiers.** [store.ts:7](src/storage/store.ts:7) names the IndexedDB database `'inkling'`, and exported save files are stamped `app: 'inkling'` ([schema.ts:375](src/storage/schema.ts:375)). I'd leave both as they are. They're never shown to players, and changing them would hide existing saves or make old export files fail to import. Alternatively, import could accept both names.
2. **The URL.** If you rename the GitHub repo, the Pages URL (`/inkling/`) changes too. Saves and PWA installs are tied to the address, so players at the old URL wouldn't see their progress at the new one (export and import still works). GitHub redirects the repo itself, but not the Pages site.
3. **The parked domain.** You stashed the `inklingtyping.com` move and are waiting on DNS. If you're going to rename, do it before that lands. Otherwise you'd be moving domains twice, and the second move costs players their saves again.

**What I'd leave alone:** the `docs/transcripts/` history and old progression snapshots. They're a record of how the game was built, and the old name in them is fine.

**One reason that might favour renaming:** Nintendo's Splatoon characters are called "Inklings". That's a fairly well-known game term, which hurts search results and could become a trademark question if the project grows.

If you have a new name in mind, I'd do it on a `chore/rename` branch before going ahead with the domain.

## 🧑 Prompt

> suggest some new names because I also heard there was an exiting model named inkling

<details><summary>2 tool calls</summary>

- **Shell:** Skim the design doc for the game's theme

  ```bash
  cd /Users/[removed]/projects/inkling; head -60 docs/DESIGN.md; grep -n -i -m15 "theme\|ink\|character\|creature\|story" docs/REQUIREMENTS.md | head -25
  ```
- **Shell:** Read the design doc's naming section

  ```bash
  cd /Users/[removed]/projects/inkling; sed -n '/^## 9/,/^## 10/p' docs/DESIGN.md
  ```

</details>

### 🤖 Claude

Good reason to look again. The Splatoon overlap was already flagged in the design doc, and sharing a name with an AI model would make search even harder. Here are some options that come out of the game's own world (notebook page, the Nib, Blotlings, the margin, the type case):

**My top picks**

- **Blotlings**: named after the enemies, the way *Lemmings* is. It's a made-up word, so it's easy to search and probably easy to own. It's playful, which suits a cozy game.
- **Mind the Margin**: says what you actually do, which is defend the red margin line. It's a friendly phrase that reads like a typing lesson.
- **Out of Sorts**: a letterpress pun. A "sort" is the metal letter in your type case, and the phrase means a bit frazzled. It has character, but at three words it's a little long to type.
- **Nib**: short and memorable, and it's already the player's name. The catch is that a three-letter common word is nearly impossible to search for.

**Also worth a look**

- **Blotstorm**: punchier and more action-flavoured
- **Nib & Blot**: hero and enemy together, with a storybook feel
- **Inkspill**: draws on The Spill boss, and is easy to say
- **Margin Ink**: calmer, and close to the current name
- **Smudge**: one word, cute, though probably used already

From the earlier list in the design doc, I'd now drop **Blotter** (it's also police-log and drug slang) and **Inkwell** (almost certainly taken). Also avoid **Inkslinger**, which is already a typing game, and **Inkdrop**, which is a notes app.

I'd lean towards **Blotlings**. It's distinctive, easy to search for, and fits the art you already have. It also lets "Inkling" live on as the old name in the build history.

I haven't checked any of these for conflicts yet, and I haven't confirmed the AI model you mentioned. I can run web searches on your shortlist to look for existing games, apps, trademarks and domains (for example blotlings.com) before you commit.

## 🧑 Prompt

> check Blotlings and Mind the Margin for conflicts

<details><summary>6 tool calls</summary>

- **Web search:** "Blotlings" game
- **Web search:** "Blotlings"
- **Web search:** "Mind the Margin" game
- **Web search:** "Mind the Margin" app OR book OR podcast OR trademark
- **Web search:** Inkling AI model
- **Shell:** Check whether candidate domains are registered

  ```bash
  for d in mindthemargin.com mindthemargingame.com blotlings.com; do printf "%s: " $d; whois $d 2>/dev/null | grep -iE -m1 "No match|not found|Registry Expiry|Creation Date" || echo "unknown"; done
  ```

</details>

### 🤖 Claude

**Mind the Margin is clear, but Blotlings is not.** You were also right about the model: Inkling is Thinking Machines Lab's first AI model, released in July 2026 and widely covered.

**Blotlings: ruled out**
- "Blotlings" is already the name of the ink-blot enemies in Disney's *Epic Mickey* games (2010 onwards). They're the Shadow Blot's minions and have their own fan wiki pages. A Disney-owned name for ink-blot creatures is about the worst overlap an ink-blot game could have.
- That also affects the game itself, not just the title. The enemies in `docs/DESIGN.md` §5 and the i18n strings are called Blotlings. It's less risky as an enemy name than as the game's title, but it's worth renaming at the same time.
- Someone registered blotlings.com on 12 November 2026, three days ago.

**Mind the Margin: no conflicts found**
- I found no video game, board game, app or book with that name, and the search didn't turn up any trademark.
- The phrase is used in business and finance: a Substack newsletter, a Mercer Capital article and an MSP event. That's a different field, though it will compete with your game in search results.
- mindthemargin.com is taken (registered February 2026). **mindthemargingame.com is free.**

**Not covered:** I didn't search the USPTO or EUIPO trademark databases, or the app stores. Before a public launch, a quick search at [tmsearch.uspto.gov](https://tmsearch.uspto.gov) for "Mind the Margin" in class 9 (software and games) and class 41 (entertainment) would cover that.

Sources:
- [Blotlings – Epic Mickey Wiki](https://epicmickey.fandom.com/wiki/Blotlings)
- [Blotlings – Disney Wiki](https://disney.fandom.com/wiki/Blotlings)
- [Mind The Margin (Substack)](https://mindthemargin.substack.com/)
- [Mind the Margin – Mercer Capital](https://mercercapital.com/mind-the-margin/)
- [Introducing Inkling – Thinking Machines](https://thinkingmachines.ai/news/introducing-inkling/)
- [Axios: Thinking Machines debuts first AI model](https://axios.com/2026/07/15/mira-murati-thinking-machines-open-weight-model-inkling)

## 🧑 Prompt

> Yes, suggest names

### 🤖 Claude

Here are some names for the ink-blot enemies. None of them repeat the names Epic Mickey uses for its blot creatures (Blotlings, Spatters, Sweepers, Spladooshes, Slobbers, Seers, Dropwings) or Nitrome's *Scribble* Blots.

**Top picks**

- **Splotches**: plain English and easy for kids to read. Nobody can own a common word, so the risk is low. "A Splotch reached the margin!" reads well.
- **Scrawlers**: creatures made of messy handwriting. This fits your mechanic best, because typing their word re-inks a scrawl into crisp calligraphy. You're literally tidying them up.
- **Smudgekins**: keeps the cute "little creature" feel of Blotlings without the "-ling" ending. It's playful and suits a cozy game.

**Also good**

- **Inkmites**: tiny and bug-like. Works well for the small pieces the Spill splits into.
- **Splodges**: a more British, rounder-sounding version of Splotches.
- **Dribblets**: very cute, but close to your existing **Drips**, so the two target types might blur together.
- **Squiggles**: friendly, but it suggests lines more than blobs.

**What I'd do:** call the word creatures **Scrawlers** and keep **Drips** for the single-letter swarm. When the Spill splits, it could break into **Inkmites** (or "little Scrawlers"). That gives you a family: the Spill makes the mess, Scrawlers and Drips run at the margin, and the Nib cleans them up.

Neither Scrawlers nor Splotches has been checked for conflicts yet. I can run the same searches on them, then put the whole rename (game title plus enemies) together on a `chore/rename` branch.

## 🧑 Prompt

> check Scrawlers and Splotches for conflicts

<details><summary>4 tool calls</summary>

- **Web search:** "Scrawlers" game enemies OR creatures
- **Web search:** "Scrawlers" video game
- **Web search:** "Splotches" game enemies OR characters
- **Web search:** "Splotch" OR "Splotches" video game ink creatures

</details>

### 🤖 Claude

Neither name clashes with another game's enemies. Each has a nearby title, but nothing like the Epic Mickey Blotlings problem.

**Scrawlers: usable**
- The nearest match is **Dungeon Scrawlers**, a Dungeons & Dragons board game from WizKids (2021). It's a real-time maze race played with a marker. "Scrawlers" is part of its title, not the name of creatures, and it's a board game rather than a video game.
- There's no video game called *Scrawlers*, and no creatures by that name anywhere.
- One risk: a Wizards of the Coast product owns the phrase "Dungeon Scrawlers". As an enemy name inside a typing game, plain "Scrawlers" is very unlikely to matter. I'd avoid it as a game title.

**Splotches: usable, slightly crowded**
- **Splotches!** is a small itch.io maze puzzle by Evan Charfauros. In it, splotches are coloured dots, not enemies.
- **Splotcho** (CrazyGames) is a different game, but it does have "silly ink worms and blobs" as enemies. That's close in look, though it's a different name.
- Other nearby names are **Splorch** (Super Mario 3D World fireballs) and **Splot** (a slime platformer from Frozenbyte). Neither is a direct clash.
- "Splotch" is a common word, so nobody can really own it as an enemy name.

**My pick is still Scrawlers.** It's the more distinctive of the two. It fits the re-inking mechanic and pairs well with *Mind the Margin*. The other games in the ink-blob space (Splotcho, Splot, Blot!, Splatoon) all crowd around "splotch" and "splat", not "scrawl".

As before, I haven't checked any trademark databases. That's only worth doing for the game title (*Mind the Margin*), not the enemy names.

Sources:
- [Dungeon Scrawlers – The Family Gamers](https://www.thefamilygamers.com/dungeon-scrawlers/)
- [Dungeon Scrawlers: Heroes of Undermountain – Forgotten Realms Wiki](https://forgottenrealms.fandom.com/wiki/Dungeon_Scrawlers:_Heroes_of_Undermountain)
- [Dungeon Scrawlers – Dice Tower](https://dicetower.com/board-game/328478)
- [Splotches! by Evan Charfauros – itch.io](https://evancharfauros.itch.io/splotches)
- [Splotcho – CrazyGames](https://www.crazygames.com/game/splotcho)
- [Splorch – Super Mario Wiki](https://www.mariowiki.com/Splorch)
- [Frozenbyte unveils Splot – Gamezebo](https://www.gamezebo.com/upcoming/frozenbyte-unveils-splot-a-squishy-slimy-platformer/)
- [Blot! – itch.io](https://carolmonty.itch.io/blot)

## 🧑 Prompt

> I'm not settled on the name mind the margins but I like all the other decisions

### 🤖 Claude

Fine to keep looking for a title. The enemy names (**Scrawlers**, **Drips**, **Inkmites** for the Spill's pieces) don't depend on the title, so they can go in now.

Some more title ideas that fit the Nib, the Scrawlers and the notebook page:

- **Blot Out**: an action phrase that means to erase, and blotting up enemies is what you do. It's short and easy to type. My favourite of these.
- **Nibwork**: a made-up word, so it should be easy to search for and to own. It puts your hero at the front.
- **Inkwright**: craftsman-sounding, like playwright or wheelwright. It suits the calligraphy and mastery side of the game.
- **Margin Notes**: a gentler take on the margin idea. It has a cozy, scholarly feel, but it's a common phrase.
- **The Nib**: simple and character-led. A subtitle like *The Nib: A Typing Adventure* would help with search.

Two names to avoid, from memory rather than a search: **Scrawl** is a Big Potato party drawing game, and **Inkbound** is a 2023 roguelike.

I haven't checked any of these yet. When a couple stand out, I can run the same conflict and domain checks on them.

### 🤖 Claude

Nothing in the code has changed yet. If you go ahead with the enemies now, I'll rename Blotlings to Scrawlers (and the Spill's small pieces to Inkmites) on a branch. The game title would stay as it is until you pick one.

## 🧑 Prompt

> Wait for title

<details><summary>2 tool calls</summary>

- **Wrote** `/Users/[removed]/.claude/projects/-Users-[removed]-projects-inkling/memory/rename-pending.md`
- **Shell:** Add the rename note to the memory index

  ```bash
  echo '- [Rename pending](rename-pending.md) — leaving "Inkling"; enemies → Scrawlers/Inkmites agreed, title still open' >> /Users/[removed]/.claude/projects/-Users-[removed]-projects-inkling/memory/MEMORY.md
  ```

</details>

### 🤖 Claude

The rename is on hold until you pick a title, and no code has changed. I saved the agreed enemy names (Scrawlers, Drips, Inkmites) and the title shortlist to memory, so a later session will pick this up.

When you settle on a title, tell me and I'll check it for conflicts first. Then I'll make all the changes on one `chore/rename` branch, before the domain move. Existing player saves will keep working.

## 🧑 Prompt

> could we focus on a name that includes something that makes it more obviously related to typing or a keyboard

### 🤖 Claude

Good idea. A name that says "typing" up front helps players find it and tells them right away what kind of game it is. Here are options that mix the keyboard with the ink-and-notebook world:

**Top picks**

- **Typewright**: a cross between "typewriter" and a craftsman word like "playwright". It suggests mastering the keys, it nods to your typewriter keyboard, and it's one word that's easy to type.
- **Ink & Keys**: says both halves of the game plainly. Easy to remember, and it would make a nice logo.
- **Typo Patrol**: "typo" is a typing word everyone knows, and "patrol" fits defending the margin. Playful and kid-friendly.
- **Home Row Heroes**: the home row is the first thing the Apprentice teaches, and it works on QWERTY, Dvorak and Colemak alike. A bit long, but it says "learn to type" at once.

**Also good**

- **Nib & Key**: the hero plus the keyboard, with a storybook feel
- **Keystroke Ink**: says what you do, but it's less charming
- **Type Blot**: short and descriptive, if a little plain

**Worth avoiding** (from memory, not yet checked):

- Anything with **QWERTY** in it, since the game now supports Dvorak and Colemak
- **TypeWell**: an existing speech-to-text service
- **Homerow** on its own: a Mac keyboard-navigation app
- **Inkey**: too close to the skincare brand The INKEY List
- **Typoman** and **Inkslinger**: existing games, the second one a typing game

My favourite is **Typewright**, with **Ink & Keys** close behind. Tell me which ones you like and I'll check them for conflicts and free domains.

## 🧑 Prompt

> give me some more suggestions

### 🤖 Claude

Here's another batch, grouped by flavour.

**Ink and keystroke wordplay**
- **Inkstroke**: an ink stroke from a pen and a keystroke on a keyboard in one word. Short and easy to type. My favourite of this batch.
- **Keyquill**: a keyboard and a quill pen together. A little whimsical.
- **Keyspill**: keys plus the Spill, your boss. Says "typing" and "mess" at once.

**Touch-typing words**
- **Ten Inky Fingers**: touch typing uses all ten fingers, and it ties in with your hands guide. Warm and kid-friendly.
- **Touch & Ink**: a play on "touch typing". Calm and simple.
- **Fingers & Fountain Pens**: storybook-ish, but long.

**Typewriter words** (you already have the typewriter keyboard)
- **Carriage Return**: the typewriter lever that starts a new line. Typists will get it straight away, and it fits a game built on pages.
- **Clatterpage**: the clatter of typewriter keys on a notebook page. Made-up, so it should be searchable.
- **Clickety Ink**: playful and sound-based. Good for younger players.

**Defending the page**
- **Keyguard**: guarding the page with your keys. Simple, though the word is also used for the plastic covers that stop wrong key presses.
- **Letterkeep**: keeping your letters safe from the Scrawlers. Gentle and a bit fantasy.

**One to skip:** *Ink Ribbon* sounds perfect, since typewriter ribbons are literally inked, but ink ribbons are the famous save item in *Resident Evil*.

My favourites across both batches are **Inkstroke**, **Typewright**, **Ten Inky Fingers** and **Carriage Return**. None have been checked yet. Pick a few and I'll look for conflicts and free domains.

## 🧑 Prompt

> check Inkstroke and Typewright for conflicts

<details><summary>5 tool calls</summary>

- **Web search:** "Inkstroke" game OR app
- **Web search:** "Inkstroke"
- **Web search:** "Typewright" game OR app OR software
- **Web search:** "Typewright"
- **Shell:** Check whether candidate domains are registered

  ```bash
  for d in inkstroke.com inkstroke.app inkstrokegame.com typewright.com typewright.app typewrightgame.com; do printf "%s: " $d; whois $d 2>/dev/null | grep -iE -m1 "No match|not found|Domain not found|Registry Expiry|Creation Date" || echo "unknown"; done
  ```

</details>

### 🤖 Claude

Neither name is clear. Both are already used by projects very close to yours, so I'd drop them.

**Inkstroke: crowded, and in your exact niche**
- **Three ink-themed games** already use it:
  - *Inkstroke: Table Tennis*, an ink-painted ping-pong game on iOS
  - *Inkstroke*, a one-button rhythm game in Vietnamese ink on itch.io
  - *INKSTROKE*, a $4.99 ink-wash action roguelite by bigtailcat on itch.io
- **A browser typing-speed test** on GitHub is called *Inkstroke* too, so it's taken for typing as well.
- "InkStroke" is also a standard class name in Microsoft, Google and Wacom pen software, which floods search results.
- Domains: inkstroke.com was registered in 2009. **inkstrokegame.com is free.**

**Typewright: crowded, and even closer to your game**
- **Typewright – Typewriter** is an iOS and Mac typewriter simulator that works entirely offline. Same typewriter look, same offline approach.
- **A GitHub typing trainer called *typewright*** has drills aimed at your weakest keys and saves progress locally in the browser. That's almost your weak-key focus feature.
- Several developer tools also use the name (two Typst editors, an AI coding tool at typewright.dev), as does TypeWright, an academic tool for correcting text scanned from old books.
- Domains: typewright.com was registered in 2002. **typewrightgame.com is free.**

Neither has a trademark that I found, and the GitHub projects are small. But a typing game named Inkstroke or Typewright would share search results with direct look-alikes. Compound words that mix "ink" and "type" are clearly popular, so names like these are likely to run into the same problem.

Longer phrases and less obvious words are more likely to be free. Of the earlier ideas, I'd check **Ten Inky Fingers**, **Carriage Return** and **Clatterpage** next.

Sources:
- [Inkstroke: Table Tennis – App Store](https://apps.apple.com/us/app/inkstroke-table-tennis/id6795942890)
- [Inkstroke rhythm game – itch.io](https://itch.io/t/7246396/inkstroke-a-one-button-rhythm-game-painted-in-vietnamese-ink-bosses-a-carp-that-becomes-a-dragon)
- [INKSTROKE by bigtailcat – itch.io](https://bigtailcat.itch.io/inkstroke/devlog/1740061/inkstroke-is-out-play-the-free-demo)
- [karthiiiidev/inkstroke typing test – GitHub](https://github.com/karthiiiidev/inkstroke)
- [InkStroke class – Microsoft Learn](https://learn.microsoft.com/pl-pl/uwp/api/windows.ui.input.inking.inkstroke)
- [Typewright – Typewriter – App Store](https://apps.apple.com/ye/app/typewright-typewriter/id6795233403)
- [puneethacharya71/typewright typing test – GitHub](https://github.com/puneethacharya71/typewright)
- [BierDav/typewright Typst editor – GitHub](https://github.com/BierDav/typewright)
- [MHU92/typewright – GitHub](https://github.com/MHU92/typewright)
- [TypeWright – typewright.dev](https://typewright.dev/)
- [TypeWright OCR correction tool – eMOP](https://emop.tamu.edu/node/118)

## 🧑 Prompt

> Yes, check those

<details><summary>5 tool calls</summary>

- **Web search:** "Ten Inky Fingers"
- **Web search:** "Carriage Return" game
- **Web search:** "Carriage Return" typing game OR app OR book
- **Web search:** "Clatterpage"
- **Shell:** Check whether candidate domains are registered

  ```bash
  for d in teninkyfingers.com carriagereturn.com carriagereturngame.com clatterpage.com; do printf "%s: " $d; whois $d 2>/dev/null | grep -iE -m1 "No match|not found|Registry Expiry|Creation Date" || echo "unknown"; done
  ```

</details>

### 🤖 Claude

**Clatterpage is the only one of the three that's completely clear.**

**Clatterpage: clear**
- No results at all for the exact word. The nearest are unrelated things called "Clatter": a 2018 strategy game on Steam, a music duo, a café, and Clatter Press, a print studio.
- **clatterpage.com is free.**
- It's a made-up word, so you could own it in search results. Since it's built from "clatter" and "page", it suggests typing and the notebook, though less directly than the other two.

**Ten Inky Fingers: phrase free, but a near clash**
- Nobody uses the exact phrase.
- But **Inky Fingers** is an idle game released on Steam on 13 August 2026: you click a pen for ink and hire workers. That's a recent ink-themed game with nearly the same name. "Inky Fingers" is also the title of a well-known 2022 book on early printing by Anthony Grafton (Harvard University Press), plus a fountain-pen notebook and two plant varieties.
- **teninkyfingers.com is free.**

**Carriage Return: usable, but weaker**
- Two small games already use it: *Carriage Returns*, a 2014 horror text adventure, and *Carriage Return*, a 2019 physical game jam entry on itch.io. There was also an arcade in the old PlayStation Home.
- There's no typing game by that name.
- It's also a common computing term, so search results would mostly be programming help.
- carriagereturn.com has been taken since 2009. **carriagereturngame.com is free.**

**My take:** of all the names checked so far, **Clatterpage** is the most open and the easiest to own, with *Mind the Margin* as the clear fallback. *Ten Inky Fingers* is the most charming, but sitting right next to a new Steam game called *Inky Fingers* is the same problem we're trying to escape.

None of these have been checked against trademark databases. If you pick Clatterpage, it's worth a quick look at [tmsearch.uspto.gov](https://tmsearch.uspto.gov) and buying the domain before you announce it.

Sources:
- [Inky Fingers – Steam](https://store.steampowered.com/app/4873500/Inky_Fingers/)
- [Inky Fingers – Harvard University Press](https://www.hup.harvard.edu/books/9780674271210)
- [Inky Fingers Currently Inked Notebook – The Pen Addict](https://www.penaddict.com/blog/2017/6/9/inky-fingers-currently-inked-notebook-a-review)
- [Carriage Returns – IFDB](https://ifdb.org/viewgame?id=iksbtn1l4wpryu7)
- [Carriage Return by Katelyn Gigante – itch.io](https://silasary.itch.io/carriage-return)
- [PlayStation Home: Arcade Music – Carriage Return – YouTube](https://www.youtube.com/watch?v=igcDWQO2134)
- [Carriage return – Wikipedia](https://en.wikipedia.org/wiki/Carriage_return)
- [Clatter on Steam](https://store.steampowered.com/app/602770/Clatter/)
- [Clatter Press – LinkedIn](https://www.linkedin.com/company/clatterpress)

## 🧑 Prompt

> give me some more suggestions

### 🤖 Claude

Here's another batch. The checks so far suggest that two-part "ink" and "type" mash-ups are crowded, while made-up words and longer phrases tend to be free. So I've leaned that way, and every name says typing or keyboard.

**Made-up words** (like Clatterpage, so likely to be free and easy to own)
- **Letterclack**: letters plus the clack of keys. Says typing straight away.
- **Keyclatter**: the sound of fast typing. Lively and a little chaotic, like a busy page.
- **Inkclack**: short, and joins your two worlds. The "ink" part might be crowded.
- **Clackety Nib**: the sound of typing plus your hero. Playful and kid-friendly.

**Phrases** (longer, but clear and harder to clash with)
- **The Typist's Apprentice**: a twist on "The Sorcerer's Apprentice", which suits your rune-style learning and the Apprentice mode. The original is a centuries-old poem, so the phrase is free to use.
- **Keys & Inkwells**: the keyboard and the notebook world in one, with a cozy feel.
- **Page Patrol**: defending the page by typing. Short and kid-friendly. It says "typing" less directly, though.
- **Home Row Ink**: names the touch-typing basics right in the title.

**Cute and short**
- **Inky Keys**: simple and friendly. It looks like a typing game for kids at a glance.
- **Tap-Tap Nib**: the sound of typing plus your hero. Very cozy.
- **Quill & Clack**: an old pen and a typewriter together. Has a nice ring to it.

**My favourites from this batch:** **The Typist's Apprentice** (the strongest story fit), **Letterclack** (most likely to be free) and **Inky Keys** (clearest for young players).

So far your clear options are **Clatterpage** and **Mind the Margin**. Pick any from this list and I'll check them for conflicts and free domains the same way.

## 🧑 Prompt

> check The Typist's Apprentice and Letterclack for conflicts

<details><summary>5 tool calls</summary>

- **Web search:** "The Typist's Apprentice"
- **Web search:** "Typist's Apprentice" game OR book OR app
- **Web search:** "Letterclack"
- **Web search:** "Letter Clack" OR "LetterClack" game OR app OR keyboard
- **Shell:** Check whether candidate domains are registered

  ```bash
  for d in typistsapprentice.com thetypistsapprentice.com letterclack.com letterclackgame.com; do printf "%s: " $d; whois $d 2>/dev/null | grep -iE -m1 "No match|not found|Registry Expiry|Creation Date" || echo "unknown"; done
  ```

</details>

### 🤖 Claude

**Both are clear, and so are their .com domains.** These are the best results so far.

**The Typist's Apprentice: clear**
- Nothing uses the exact title: no game, book, app or show.
- The nearest are *The Typesetter's Apprentice*, an artist's short-story collection, and books and TV shows simply called *The Typist*. All are different enough not to matter.
- The typing games that came up (Typist, TapTyping, Epistory, CozyTyper) all have different names.
- **typistsapprentice.com and thetypistsapprentice.com are both free.**
- One thing to watch: people often get the apostrophe wrong ("Typists Apprentice", "Typist Apprentice"). Owning both domain spellings covers that. In-game it could shorten to just *Apprentice*, which you already use for the course.

**Letterclack: clear**
- No results at all for the word.
- The nearest names are **LetterClash**, a browser word-battle game on CrazyGames, and **ClickClack – Typing Trainer**, an iOS app. LetterClash is one letter off, which could cause the odd mix-up in search.
- **letterclack.com is free.**

**Where things stand now**

| Name | Conflicts | Domain |
|---|---|---|
| **The Typist's Apprentice** | None | .com free |
| **Letterclack** | Near LetterClash | .com free |
| **Clatterpage** | None | .com free |
| **Mind the Margin** | Finance uses only | -game.com free |

**My pick is The Typist's Apprentice.** It's the only one that tells a story. It says "typing game" outright, matches your Apprentice mode and rune-style key learning, and fits a cozy notebook world. Letterclack is the best short option if you'd rather have one punchy word.

As before, I haven't checked trademark databases. Once you've decided, search [tmsearch.uspto.gov](https://tmsearch.uspto.gov) and buy the domain soon. A free domain can be taken quickly.

Sources:
- [The Typesetter's Apprentice – Baker Artist](https://bakerartist.org/file/typesetters-apprentice)
- [The Typist by Michael Knight – Goodreads](https://www.goodreads.com/book/show/8879152-the-typist)
- [The Typist – Grove Atlantic](https://groveatlantic.com/book/the-typist/)
- [The Typist (TV series) – Variety](https://variety.com/2018/tv/news/canneseries-the-typist-nina-grosse-german-tv-revolution-1202746628/)
- [Typist – App Store](https://apps.apple.com/us/app/typist/id415166115?mt=12)
- [TapTyping – App Store](https://apps.apple.com/us/app/-/id376526006)
- [Epistory – Steam](https://store.steampowered.com/app/398850/Epistory__Typing_Chronicles/)
- [LetterClash – CrazyGames](https://www.crazygames.com/game/letterclash)
- [ClickClack – Typing Trainer – App Store](https://apps.apple.com/us/app/-/id6740695697)
- [Clack – Keyboard ASMR – App Store](https://apps.apple.com/us/app/id6771397917)

## 🧑 Prompt

> actually look into inky keys as well

<details><summary>4 tool calls</summary>

- **Web search:** "Inky Keys"
- **Web search:** "Inky Keys" game OR typing OR app
- **Web search:** "InkyKeys" OR "Inkykeys"
- **Shell:** Check whether candidate domains are registered

  ```bash
  for d in inkykeys.com inkykeysgame.com; do printf "%s: " $d; whois $d 2>/dev/null | grep -iE -m1 "No match|not found|Registry Expiry|Creation Date" || echo "unknown"; done
  ```

</details>

### 🤖 Claude

**Inky Keys is clear, and inkykeys.com is free.**

- **No game, app or typing tool** is called "Inky Keys". The typing-game results (Keybara, traceKeys, ClickClack, Typr) all have different names.
- **The nearest names**, none of them games:
  - **Inky Key**, a tattoo artist in Florida (@inky.key on Instagram)
  - **INKY 75**, a mechanical keyboard from ELECFOX. Closest in spirit, since it's a keyboard product, but it's hardware with a number in its name.
  - **inkkeys**, an open-source DIY keypad with a small e-ink screen, from 2021. Spelled differently and only known to keyboard hobbyists.
  - **Inky**, an encrypted email app, and **Inky**, a Kraken crypto wallet that closed in 2026. Neither is called "Inky Keys".
- **Domains:** inkykeys.com and inkykeysgame.com are both free.

**The full shortlist:**

| Name | Conflicts | Domain |
|---|---|---|
| **The Typist's Apprentice** | None | .com free |
| **Inky Keys** | INKY 75 keyboard, inkkeys keypad (both hardware) | .com free |
| **Letterclack** | Near LetterClash | .com free |
| **Clatterpage** | None | .com free |
| **Mind the Margin** | Finance uses only | -game.com free |

**Comparing your top two:** *Inky Keys* is short, friendly and easy to type, and tells young players right away that it's a typing game. *The Typist's Apprentice* has more story and mood, and fits the Apprentice mode. If your main players are kids and beginners, Inky Keys is probably the better choice. If you want the game to feel like a cozy adventure, go with The Typist's Apprentice.

Same caveat as before: I haven't checked any trademark databases.

Sources:
- [Inky Key – Instagram](https://www.instagram.com/inky.key/)
- [INKY 75 keyboard – ELECFOX](https://www.elecfox.co/products/1)
- [Inkkeys e-ink macropad – Keyboard Builders' Digest](https://kbd.news/Inkkeys-an-e-ink-macropad-263.html)
- [gkaffka/inkkeys – GitHub](https://github.com/gkaffka/inkkeys)
- [How Inky Stores Encryption Keys – Medium](https://medium.com/ink-different/how-inky-stores-encryption-keys-safely-c3715756b224)
- [Sunset of Inky – Kraken](https://support.kraken.com/articles/sunset-of-inky)
- [Keybara – itch.io](https://martyhendrickskeybara.itch.io/keybara)
- [ClickClack – Typing Trainer – App Store](https://apps.apple.com/app/id6740695697)

## 🧑 Prompt

> Ok I just bought inkykeys.com. Check the trademark databases and then if it all looks good let's start changing the name of the game, and the characters

<details><summary>5 tool calls</summary>

- **preview_start** `{"url":"https://tmsearch.uspto.gov/search/search-information"}`
- **find** `{"query":"search"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_96","action_summary":"Focuses the trademark search box"}},{"name":"computer","input":{"action":"type","text":"inky keys","action_summary":"Types 'inky keys' into the trademark search box"}},{"name":"computer","input":{"action":
… (181 more characters)`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"https://tmsearch.uspto.gov/search/search-information"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"find","input":{"query":"Search trademarks"}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_96","action_summary":"Focuses the trademark search box"}},{"name":"computer","input":{"action":"type","text":"\"inky keys\"","action_summary":"Types the exact phrase into the trademark search box"}},{"name":"computer","input":{
… (190 more characters)`

</details>

### 🤖 Claude

Still on the trademark check. The USPTO search gives 1,362 loose matches for "inky keys", so I'm going through them for anything that includes both words.

<details><summary>4 tool calls</summary>

- **javascript_tool** `{"action":"javascript_exec","text":"const t = document.querySelector('main').innerText; const marks = [...t.matchAll(/wordmark\\n(.+)\\nStatus\\n\\n(.+)\\n/g)].map(m=>m[1]+' | '+m[2]); ({count: marks.length, keyish: marks.filter(m=>/KEY/i.test(m)), live: marks.filter(m=>/LIVE/.test(m))})"}`
- **javascript_tool** `{"action":"javascript_exec","text":"const t = document.querySelector('main').innerText; [...t.matchAll(/wordmark\\n(.+)\\nStatus\\n\\n(LIVE.*)\\n\\nGoods & services\\n(.+)\\n(?:outbound\\n)?Class\\n(.+)\\nSerial\\n(.+)\\nOwners\\n(.+)/g)].map(m=>[m[1],m[2],m[4],m[3].slice(0,90),m[6]].join(' | '))"}`
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"https://tmsearch.uspto.gov/search/search-information"}},{"name":"computer","input":{"action":"wait","duration":2}},{"name":"computer","input":{"action":"left_click","coordinate":[551,206],"action_summary":"Focuses the trademark search box"}},{"name":"co
… (337 more characters)`
- **computer** `{"action":"screenshot","scale":0.5}`

</details>

### 🤖 Claude

Layout changed size, so the click missed. Retrying with the element ref.

<details><summary>2 tool calls</summary>

- **find** `{"query":"Search trademarks"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_96","action_summary":"Focuses the trademark search box"}},{"name":"computer","input":{"action":"type","text":"inkykeys","action_summary":"Types 'inkykeys' into the trademark search box"}},{"name":"computer","input":{"action":"k
… (179 more characters)`

</details>

### 🤖 Claude

USPTO is clear. Now checking the WIPO Global Brand Database, which covers the EU, UK and other countries.

<details><summary>3 tool calls</summary>

- **navigate** `{"url":"https://branddb.wipo.int/en/similarname/results?sort=score%20desc&strategy=concept&rows=30&asStructure=%7B%22_id%22:%22a%22,%22boolean%22:%22AND%22,%22bricks%22:%5B%7B%22_id%22:%22b%22,%22key%22:%22brandName%22,%22value%22:%22inky%20keys%22,%22strategy%22:%22Simple%22%7D%5D%7D"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":5}},{"name":"get_page_text","input":{"max_chars":5000}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"wait","duration":8}},{"name":"get_page_text","input":{"max_chars":8000}}]}`

</details>

### 🤖 Claude

The URL search didn't apply, so I'll type it into the search box instead.

<details><summary>2 tool calls</summary>

- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"https://branddb.wipo.int/en/similarname"}},{"name":"computer","input":{"action":"wait","duration":5}},{"name":"find","input":{"query":"textbox"}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_34","action_summary":"Focuses the brand name search box"}},{"name":"computer","input":{"action":"type","text":"inky keys","action_summary":"Types 'inky keys' into the brand name search box"}},{"name":"computer","input":{"action
… (185 more characters)`

</details>

### 🤖 Claude

Trademark check done: no "Inky Keys" or "inkykeys" mark at the USPTO or in WIPO's global database. Starting the rename now.

<details><summary>4 tool calls</summary>

- **Shell:** Create the rename branch and list every mention of the old name

  ```bash
  git status --short && git switch -c chore/rename && git grep -n -i inkling -- . ':!docs/transcripts' ':!package-lock.json' ':!src/content/en/words.json' ':!src/content/en/blocklist.json'
  ```
- **Shell:** List every mention of the enemy name

  ```bash
  git grep -n -i "blotling" -- . ':!docs/transcripts' | grep -v "^docs/progression" ; echo ---; git grep -c -i blotling -- docs/progression; echo ---; git grep -n -i -E "small blot|split" -- src/i18n/en.ts | head -20
  ```
- **Shell:** Find remaining name spots that need manual handling

  ```bash
  grep -rn "inkling-save\|Master Inkling\|INKLING_BASE" src scripts README.md .github vite.config.ts docs/REQUIREMENTS.md | grep -v transcripts; sed -n 286,296p src/core/config.ts; sed -n 1,25p docs/progression/README.md | head -12; grep -n "##" docs/progression/README.md | tail -5
  ```
- **Shell:** Apply the game and enemy renames across the repo

  ```bash
  set -e
  # Inkmites: the Spill's split pieces
  perl -0pi -e 's/splits into three small Blotlings/splits into three small Inkmites/' README.md
  perl -0pi -e 's/splits into small Blotlings \(milestone 13\)/splits into small Inkmites (milestone 13)/' docs/DESIGN.md
  perl -0pi -e 's/three quick little Blotlings/three quick little Inkmites/' src/i18n/en.ts
  perl -0pi -e 's/which splits into small\n   \* Blotlings when finally blotted\./which splits into small\n   * Inkmites (little Scrawlers) when finally blotted./' src/core/config.ts
  perl -0pi -e 's/it splits into small, quick Blotlings/it splits into I
  … (1279 more characters)
  ```

</details>

### 🤖 Claude

zsh didn't split the file list. Redoing those two steps with `xargs`.

<details><summary>1 tool call</summary>

- **Shell:** Apply the bulk renames with a working file list

  ```bash
  set -e
  git grep -lz "Blotling" -- . ':!docs/transcripts' ':!docs/progression' | xargs -0 perl -pi -e 's/\bBlotlings\b/Scrawlers/g; s/\bBlotling\b/Scrawler/g'
  git grep -lz "Inkling" -- . ':!docs/transcripts' ':!docs/progression' ':!docs/DESIGN.md' | xargs -0 perl -pi -e "s/\bInkling's\b/Inky Keys'/g; s/\bInkling\b/Inky Keys/g"
  git diff --stat | tail -1
  echo "--- remaining capitalised:"; git grep -n -E "Inkling|Blotling" -- . ':!docs/transcripts' ':!docs/progression'
  ```

</details>

### 🤖 Claude

Now the design doc by hand: the header, a rewritten §9 Name section, and a note that the code still calls Scrawlers `blotling`.

<details><summary>9 tool calls</summary>

- **Read** `docs/DESIGN.md`
- **Read** `docs/DESIGN.md`
- **Shell:** Show the lines after the targets table

  ```bash
  sed -n 62,66p docs/DESIGN.md
  ```
- **Edited** `docs/DESIGN.md`
- **Edited** `docs/DESIGN.md`
- **Shell:** Update the design doc header and open-questions line

  ```bash
  perl -pi -e 's/^# Inkling: Design/# Inky Keys: Design/; s/^> Name: \*\*Inkling\*\* \(chosen 2026-11-12\)/> Name: **Inky Keys** (chosen 2026-11-15, previously Inkling)/; s/^- \[x\] Final name: \*\*Inkling\*\*\./- [x] Final name: **Inky Keys** (renamed from Inkling on 2026-11-15)./' docs/DESIGN.md && grep -n "Inkling\|Inky Keys" docs/DESIGN.md | head; grep -n "inkling-type\|Inky Keys: Type Case\|distinctive public" docs/REQUIREMENTS.md
  ```
- **Shell:** Fix the requirements note and find the kept identifiers

  ```bash
  perl -pi -e 's/^- Use a distinctive public identifier .*$/- Public identifier: **Inky Keys**, at inkykeys.com (see DESIGN.md §9)./' docs/REQUIREMENTS.md && sed -n 238,241p docs/REQUIREMENTS.md
  # Comments by the kept internal identifiers
  grep -n "DB_NAME = \|STORAGE_KEY = \|app: 'inkling'" src/storage/store.ts src/settings.ts src/storage/schema.ts; sed -n 890,894p src/main.ts
  ```
- **Shell:** Comment why the old internal identifiers stay

  ```bash
  set -e
  perl -pi -e "s|^const DB_NAME = 'inkling';|// Still named after the game's first name (Inkling): renaming it would hide existing saves.\nconst DB_NAME = 'inkling';|" src/storage/store.ts
  perl -pi -e "s|^const STORAGE_KEY = 'inkling.settings';|// Keeps the game's first name (Inkling) so players don't lose their settings.\nconst STORAGE_KEY = 'inkling.settings';|" src/settings.ts
  perl -pi -e "s|^  app: 'inkling';|  /** The game's first name (Inkling), kept so every export, old or new, imports. */\n  app: 'inkling';|" src/storage/schema.ts
  perl -pi -e 's|^    // Handy for poking at state f
  … (297 more characters)
  ```
- **Shell:** Add a renaming note to the progression gallery

  ```bash
  perl -0pi -e 's/^# How Inkling grew\n\nScreenshots of Inkling at the end/# How Inky Keys grew\n\n> The game was called **Inkling**, and its word creatures **Blotlings**, until 2026-11-15. The screenshots and notes below keep the names each version used.\n\nScreenshots of Inky Keys at the end/' docs/progression/README.md && head -5 docs/progression/README.md && git grep -n "A drip, a Scrawler\|a Blotling, a crimson" docs/progression/README.md
  ```

</details>

### 🤖 Claude

The renames are in place. Next I'm checking that the menu logo fits the longer name, then running the checks and the build.

<details><summary>5 tool calls</summary>

- **Shell:** Show the menu logo SVG and its styles

  ```bash
  sed -n 100,115p src/ui/menu.ts; grep -n "logo-word\|menu-logo" src/ui/*.css src/*.css 2>/dev/null | head
  ```
- **Shell:** Show the logo styles

  ```bash
  sed -n 35,64p src/ui/menu.css
  ```
- **Shell:** Run typecheck, lint and tests

  ```bash
  npm run check 2>&1 | tail -15
  ```
- **preview_start** `{"name":"inky-keys-dev"}`
- **javascript_tool** `{"action":"javascript_exec","tabId":"tab-1","text":"await new Promise(r=>setTimeout(r,1500)); const t=document.querySelector('.logo-word'); const b=t?.getBBox(); ({title: document.title, bbox: b && {x:b.x, w:b.width, right:b.x+b.width}})"}`

</details>

### 🤖 Claude

The wordmark runs past the logo's edge (375 against a 360 wide box). Widening the box to fit.

<details><summary>2 tool calls</summary>

- **Shell:** Widen the logo to fit the longer name

  ```bash
  perl -pi -e 's/viewBox="0 0 360 96" role="img" aria-label="Inky Keys"/viewBox="0 0 390 96" role="img" aria-label="Inky Keys"/; s/d="M84 82 C150 74 250 90 330 78"/d="M84 82 C160 74 270 90 366 78"/' src/ui/menu.ts && perl -0pi -e 's/\.menu-logo \{\n  width: min\(340px, 85%\);/.menu-logo {\n  width: min(368px, 90%);/' src/ui/menu.css && git diff --stat src/ui/menu.css src/ui/menu.ts | tail -1
  ```
- **browser_batch** `{"actions":[{"name":"navigate","input":{"url":"http://localhost:5173/","tabId":"tab-1"}},{"name":"computer","input":{"action":"wait","duration":2,"tabId":"tab-1"}},{"name":"computer","input":{"action":"screenshot","tabId":"tab-1","scale":0.6}}]}`

</details>

### 🤖 Claude

The logo fits. Next: the How to play screen, About, and a phone-width check.

<details><summary>3 tool calls</summary>

- **find** `{"query":"How to play","tabId":"tab-1"}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"left_click","ref":"ref_29","tabId":"tab-1","action_summary":"Opens the How to play screen"}},{"name":"computer","input":{"action":"wait","duration":1,"tabId":"tab-1"}},{"name":"get_page_text","input":{"tabId":"tab-1","max_chars":2500}}]}`
- **browser_batch** `{"actions":[{"name":"computer","input":{"action":"key","text":"Escape","tabId":"tab-1","action_summary":"Closes the How to play screen"}},{"name":"resize_window","input":{"preset":"mobile","tabId":"tab-1"}},{"name":"navigate","input":{"url":"http://localhost:5173/","tabId":"tab-1"}},{"name":"compute
… (304 more characters)`

</details>

### 🤖 Claude

That crop only caught the left half. I'll measure at phone width instead.

<details><summary>1 tool call</summary>

- **browser_batch** `{"actions":[{"name":"resize_window","input":{"preset":"mobile","tabId":"tab-1"}},{"name":"navigate","input":{"url":"http://localhost:5173/","tabId":"tab-1"}},{"name":"javascript_tool","input":{"action":"javascript_exec","tabId":"tab-1","text":"await new Promise(r=>setTimeout(r,1500)); const s=docume
… (505 more characters)`

</details>

### 🤖 Claude

Fits at phone width with no sideways scroll. Running the full check and the production build.

<details><summary>1 tool call</summary>

- **Shell:** Run checks and the production build

  ```bash
  npm run check 2>&1 | grep -E "Tests|error|✖" ; npm run build 2>&1 | tail -6; grep -o '"name":"[^"]*","short_name":"[^"]*"' dist/manifest.webmanifest
  ```

</details>

### 🤖 Claude

Everything passes. Last step: updating my memory notes, since the old domain plan now points to inkykeys.com.

<details><summary>4 tool calls</summary>

- **Shell:** Read the domain memory note and the parked stash

  ```bash
  cat /Users/[removed]/.claude/projects/-Users-[removed]-projects-inkling/memory/custom-domain-pending.md; cd /Users/[removed]/projects/inkling && git stash show --stat stash@{0}
  ```
- **Wrote** `/Users/[removed]/.claude/projects/-Users-[removed]-projects-inkling/memory/custom-domain-pending.md`
- **Wrote** `/Users/[removed]/.claude/projects/-Users-[removed]-projects-inkling/memory/rename-pending.md`
- **Shell:** Update the memory index lines

  ```bash
  cd /Users/[removed]/.claude/projects/-Users-[removed]-projects-inkling/memory && perl -pi -e 's/^- \[Custom domain pending\].*$/- [Custom domain pending](custom-domain-pending.md) — inkykeys.com bought; DNS\/Pages setup pending; old inklingtyping.com stash is stale/; s/^- \[Rename pending\].*$/- [Rename pending](rename-pending.md) — Inky Keys rename on chore\/rename; repo\/Pages URL rename still open/' MEMORY.md && cat MEMORY.md
  ```

</details>

### 🤖 Claude

The game is now **Inky Keys** on the `chore/rename` branch, nothing is committed yet, and the trademark search found no conflict. Blotlings are now **Scrawlers**, and the Spill splits into **Inkmites**. The typecheck, lint, all 331 tests and the production build pass, and the menu looks right in the browser at desktop and phone width.

**Trademark check:**
- **US trademark office (USPTO):** no mark for "Inky Keys" or "inkykeys".
- **WIPO Global Brand Database** (covers the EU, UK and many other countries): the closest results were old, expired "INKY" marks.
- **Closest live marks:** several plain "INKY" marks for software, all for unrelated things: Kaseya's email security, Kraken's crypto wallet (still pending) and an *Inky Trivia* app. Different products and a two-word name make a clash unlikely. This was a quick search, though, not a lawyer's clearance, so it's worth one before any paid release.

**What changed:**
- **Everything players see now says Inky Keys:** page title, app name when installed, menu logo, About, How to play, tutorials and save-screen messages. Save exports are now named `inky-keys-save-….json`.
- **The longer name didn't fit the menu logo,** so I widened it. It fits at phone width too.
- **The top rank was "Master Inkling".** I made it **"Master of Keys"**; easy to change if you'd prefer something else.
- **Docs:** README, PRIVACY, CREDITS, CLAUDE.md and the GitHub issue templates are updated. [DESIGN.md](docs/DESIGN.md) §9 now records why the game was renamed and every name we checked. The progression gallery keeps the old names, with a note at the top.
- **Settings:** the build setting `INKLING_BASE` is now `INKY_KEYS_BASE`, the package name is `inky-keys`, and the dev server config is `inky-keys-dev`.

**What I kept on purpose:** a few names hidden inside the code still say `inkling` or `blotling`. Renaming them would cut players off from their saves and settings, or break the screenshots of older milestones. Each now has a short comment explaining why.

**Still to do:**
- **The GitHub repo and the live site are still `pwbrown/inkling`,** and the in-game links point there. If you rename the repo, the current site address changes and players there lose their saved progress. Doing it at the same time as the move to inkykeys.com means they only lose it once.
- **The old domain stash is out of date:** it's for inklingtyping.com and uses the old setting name. When your DNS is ready I'll redo those changes for inkykeys.com rather than reuse it.
- **When you commit,** I'll run `npm run transcript` first, as CLAUDE.md asks.

## 🧑 Prompt

> Commit the working tree changes with a sensible message.

<details><summary>1 tool call</summary>

- **Shell:** Export the session transcripts into the docs

  ```bash
  npm run transcript 2>&1 | tail -5 && git status --short docs/transcripts | head
  ```

</details>
