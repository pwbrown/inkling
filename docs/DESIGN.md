# Inkling: Design

> Direction: **Inkwell** (hand-drawn notebook look) + **Spellbook-style learning** (keys are learned like runes and mastered over time).
> Name: **Inkling** (chosen 2026-11-12). See [§9 Name](#9-name).
> Status: Draft v0.1 (2026-11-12). Companion to [REQUIREMENTS.md](REQUIREMENTS.md).

---

## 1. Pillars

1. **The world is a page.** Everything lives in a hand-drawn notebook, because text *is* the world.
2. **Learning letters is the progression.** Keys are learned, practiced and mastered like a calligrapher's alphabet.
3. **Cozy, with a pulse.** It's charming and low-stakes in tone, but the waves still build real tension.
4. **Legibility first.** Decoration never gets in the way of reading the text you have to type.

---

## 2. Setting & Player

- **The page:** a ruled notebook page on cream paper. The red **margin line** on the left is the line you defend.
- **The player, "the Nib":** a small fountain-pen nib character that sits in the left margin. It leans toward the target it's locked onto.
- **Health, the ink reservoir:** an ink gauge shown as a small inkwell in the corner. Every blot that reaches the margin drains ink, and the game is over when the well runs dry. *(This settles the "health vs lives" question in REQUIREMENTS §13 unless we change it.)*

---

## 3. Campaign Structure

| Requirements term | In-world name | Notes |
|---|---|---|
| Campaign | **Notebook** | **Apprentice** (a 10-chapter course that teaches keys, with stars and a finish) or **Practice** (your own keys, endless) |
| Level | **Chapter** | Shown as a notebook tab. Finishing one refills 30% of the ink well. |
| Wave | **Page** | Single target type per page |
| Summary screen | **Graded page** | See §6 |
| Boss | **The Spill** | Opens the last page of each Apprentice chapter: three lives, splits into small Blotlings (milestone 13) |

---

## 4. The Type Case (Key Selection + Rune-style Learning)

This is where the Spellbook mechanic comes in. The key-selection screen is a **letterpress type case**: a wooden drawer with a slot for each character. Each key is a metal **sort**.

- **Picking keys:** you click sorts to add them to your case, or click a drawer section to toggle a whole region (letters, digits, symbols, home row and so on). It also has presets and custom presets.
- **Mastery:** each sort fills with ink as you get better at it, based on that key's local accuracy and speed stats.
  - **Unfamiliar:** an empty outline
  - **Practicing:** partly inked
  - **Mastered:** fully inked, with a gold-leaf edge
- **Two ways to play:**
  - **Free Case:** pick any keys you want (the full flexibility from the requirements).
  - **Apprentice path:** start with a small set, such as the home row. When the game sees you've mastered your current keys, it *suggests* the next sorts to learn ("Ready to learn **E** and **I**?"). This is the rune-learning progression.
- **Weak-key focus:** T2 drips and word choice lean toward keys you haven't mastered (REQUIREMENTS §6).

---

## 5. Targets

| Type | Name | Look | Behavior / interaction |
|---|---|---|---|
| **T1** word | **Blotlings** | Wobbly ink-blot creatures with little legs, the word written on their belly | When you lock on, the Nib draws a thin guide line to it. Each correct letter is "re-inked" in crisp calligraphy, and finishing the word blots it up into a splatter. |
| **T2** char | **Drips** | Small fast droplets, one glyph each | They come in swarms. Each pops with a tiny ink flick. |
| **T3** phrase | **Run-ons** | A centipede where each segment is one word | Typos *smear* the segment, and Backspace acts as an **eraser** to clean it. Clearing a segment detaches it. |
| **T4** correction | **Misprints** | A crooked rubber-stamp word with a visible text caret | Use arrow keys to move the caret, then Backspace or Delete and retype to fix it. When fixed, the stamp straightens and fades. |

**Personality:** every creature has a face. Eyes follow the Nib, and they blink. A creature looks worried near the margin, wide-eyed when you lock onto it, and happy for a moment with each correct key. Drips bob and squash, Blotlings wobble and scurry on little legs, Run-ons ripple like centipedes, and Misprints hop like stamps. Reduced motion stops the movement but keeps the faces.

**Tougher ink** (Typer Shark style): crimson creatures need two completions in a row and violet ones three, with dots showing what's left. Ghosts in invisible ink are faint and blurred until somewhere between a quarter and half way across the page (a random point per ghost). Chances grow by chapter and difficulty (`GAME_CONFIG.variants`).

**Errors:** a wrong key leaves a small smudge on the page. A messy page is a gentle, visible record of your accuracy. You'll also see it on the graded page.

---

## 6. UI & Screens

- **Title:** a closed notebook. Opening it shows the table of contents (Continue, New Notebook, Type Case, Settings).
- **Menus:** notebook tabs along the edge, with settings as **sticky notes**.
- **HUD:** the inkwell (health) in the top-left, the score written in pencil in the top-right, and the page number as a footer.
- **Graded page (summary):** a red-pen grade, WPM and accuracy written in the margin, the most-missed keys circled, and teacher-style notes ("Watch your **R**!"). It also shows which sorts gained mastery on this page.
- **Pause:** a bookmark ribbon drops down.

---

## 7. Art Direction

- **Palette:**
  - Cream paper, blue-black ink, a red pen for the margin and grading, and a yellow highlighter for the locked target.
  - A **night mode** with dark paper and pale ink is a natural extra theme.
- **Line style:** hand-drawn strokes with a subtle **line boil** (a 2–3 frame jitter) for a sketchbook feel. Reduced-motion mode turns it off.
- **Colorblind safety:** errors are never shown by red alone. They also get a strikethrough or smudge shape, and the lock uses a highlight plus an underline.
- **Fonts:** all bundled and offline, with OFL or similar licenses.
  - **Target text:** a highly legible font such as *Atkinson Hyperlegible* or a clear monospace. It is never a handwriting font.
  - **Headings and UI flavor:** a handwriting or brush display font.
  - **Calligraphy re-ink effect:** an animated stroke drawn *over* the legible text, never in place of it.
- **Art pipeline:** the hand-drawn look is forgiving. You can start with simple SVG blobs and noise displacement in PixiJS filters, then swap in drawn art later.

---

## 8. Audio

- **Keystrokes:** a soft pen scratch, with the pitch varied slightly.
- **Feedback:**
  - Completing a target makes an ink "plip" or squelch.
  - An error makes a dull pencil tap.
  - Losing ink makes a glug.
- **Ambience:** room tone and paper rustles, with light piano or pizzicato music that layers in more instruments as a page goes on.
- **Controls:** separate volume for music and effects, plus mute (REQUIREMENTS §10).

---

## 9. Name

**Inkling**: "a bit of ink" and "a small idea". It's short and easy to type.

**Availability notes (2026-11-12):**
- No typing game called *Inkling* turned up.
- Similar names already exist: *Inklings* (a 2016 Lemmings-style puzzle game on Steam), *Inkling Cats* (a roguelike) and *Inkslinger* (a typing game).
- Nintendo's *Splatoon* uses "Inklings" for its characters.
- Do a trademark check and look for store-name conflicts before any public or commercial release. A subtitle (e.g. *Inkling: Type Case*) could help tell it apart.

Other names considered:

| Name | Notes |
|---|---|
| **Blotter** | Short, easy to type, says exactly what you do |
| **Nib** | Very short and memorable. Also the player's name. |
| **Marginalia** | Literary and distinctive, but long to type |
| **Type Case** | Ties straight to the key-selection hook |
| **Inkwell** | The obvious choice, and probably the most likely to already be taken |

---

## 10. Open Design Questions

- [x] Final name: **Inkling**.
- [ ] Should the Apprentice path be the default for new players, with Free Case unlocked from the start? (Free Case is the default. Milestone 7 added mastery inking and next-key suggestions inside it, rather than a separate locked path.)
- [ ] Does the page get messier from errors permanently within a chapter, or reset every page?
- [x] Is the Spill boss part of the MVP or post-MVP? Added in milestone 13.
- [x] Ship night mode in the MVP? Yes, in milestone 7, alongside a high-contrast theme.
