# TODO

The live list. The long-form backlog with rationale is [claude.md](claude.md) §4.

## Next

- [ ] **§3 Responsive aspect ratio** — the game is a fixed 400×700; phones get
      black bars, foldables/tablets/desktop get a small game in the middle.
      Highest priority in claude.md. Doing this while feedback comes in.
- [ ] **Read the numbers** after the first few testers:
      `CF_ACCOUNT_ID=… CF_API_TOKEN=… node tools/stats.js`
      The one line that matters is level 2 "reached".
- [ ] **Update claude.md §5** — it still says Pages / empty build command /
      output root. Reality: Workers, `node build.js`, `dist/`, plus one edge
      function for the beacon. (Owner's file — not edited by the assistant.)

## Before sharing beyond friends

- [ ] Custom domain (buy via Cloudflare → Worker → Settings → Domains & Routes).
      Then change `url` in `site.json`.
- [ ] Rename the account subdomain if wanted (dashboard → Account details → pencil).

## Bugs

- [x] Game kept running with sound after the phone locked — now pauses on
      `visibilitychange`/`pagehide`/`blur`, suspends the audio context, and
      shows PAUSED until the next tap so nobody resumes into a crash.

## Later (see claude.md §4 for detail)

- [ ] More telegraphed crossing hazards: kid with a ball, goat herd, auto pulling out
- [ ] Crash spin-out: camera roll and a recovery beat, not just a shake
- [ ] Parallax on the skyline / mid-buildings / verge
- [ ] Horn, throw whoosh, thump on the gate, temple bell on a perfect
- [ ] High score + level reached in `localStorage`
- [ ] Confetti on a clean street
