# Privacy

Inkling collects **nothing** about you.

- **No analytics, tracking, ads, crash reporting or third-party scripts.** The game's code only talks to the site it was loaded from, plus the optional word download described below.
- **Your data stays in your browser.** Your chosen keys, presets, progress, best scores and per-key typing stats are stored on your device (IndexedDB) and never sent anywhere.
- **You control it.** In the game, open **Save data** (press **B** on the new-notebook screen) to export a backup file, import one, or erase everything. Clearing your browser's site data for Inkling also erases it.
- **Offline.** After the first visit, the game runs from your browser's cache and doesn't need a connection.

## The website host

When the game is served from a website (for example GitHub Pages), that host receives the normal information any web request includes, such as your IP address and browser type, and may keep server logs under its own privacy policy. Inkling has no access to those logs and adds nothing to them. For GitHub Pages, see [GitHub's privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).

## Word lists (optional download)

Pressing **W** opens **Word lists**, where you can download words related to a topic. Only when you click **Download words**, Inkling sends the topic you typed, and nothing else, to the free [Datamuse API](https://www.datamuse.com/api/) at `api.datamuse.com`. The request carries no cookies, no referrer and no identifiers. Datamuse receives the request like any web server would (including your IP address) under its own terms. The downloaded words are saved on your device and work offline.

This is the only network request the game makes beyond loading itself, and it never happens unless you ask.
