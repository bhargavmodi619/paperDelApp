# Paper Round — project instructions

Read this file fully before making any change.

This is a browser game: a motorbike newspaper-delivery run through a small
Indian town. Single HTML file, vanilla JS, canvas 2D, no dependencies, no
build step. It is a prototype being validated with real players before any
money is spent on it.

**Do not rename the game to "Paperboy".** That is Atari's trademark.

---

## 1. Current state

- One file: `paper-round.html`. Everything (HTML, CSS, JS) is inside it.
- Runs by opening the file directly in a browser. No server needed.
- Git repo initialised, work happening on the `develop` branch.

### How it plays

- Constant forward speed. The player only steers between **three lanes**.
- Swipe left/right, or arrow keys, to change lane. Lane change is a snap with
  an eased lean, not floaty steering.
- Houses line both sides of the street. Only houses carrying an **orange pin**
  are on the round.
- Tap the left or right half of the screen to throw a paper that side.
  Keyboard: `Q`/`A`/`Z` left, `E`/`D`/`M` right.
- **Timing matters.** The paper lands where the physics puts it. A vertical
  gauge on the relevant side shows a sliding head and a green band; throwing
  inside the band connects, the bright core is a perfect. Too early lands short
  of the compound wall, too late overshoots.
- Obstacles occupy lanes: cow, auto-rickshaw, thela cart, pothole, parked
  scooter, oncoming tempo. Hitting one costs a life.
- Paper bundles in lanes restock the basket.
- Deliver the quota before the street ends. Three crashes ends the round.
  A clean street (every pinned house) gives a life back.

---

## 2. Architecture

All in `paper-round.html`, in this order:

1. Canvas setup and DPR scaling
2. World constants
3. Palette
4. Drawing helpers (`rr`, `fillRR`, `poly`, `circle`, `label`)
5. Game state object `S`
6. `buildLevel(n)` — procedural street generation
7. Throw timing (`landZ`, `findTarget`, `toss`)
8. Audio (WebAudio blips)
9. `update(dt)`
10. Drawing functions (sky, ground, houses, props, obstacles, rider, HUD)
11. Screens (title, clear, over)
12. `render()`
13. Flow, input, main loop
14. `__HOOK__` export — **keep this, see section 6**

### Pseudo-3D projection

Everything is positioned in world units and projected per frame.

```
yAt(z)   = HORIZON + CAMH * FOCAL / z      // screen y of the ground at depth z
ppuAt(z) = FOCAL / z                        // pixels per world unit at depth z
sxAt(x,z,px) = DW/2 + (x - px) * ppuAt(z)   // screen x
```

Objects hold an absolute `z` along the street. `rel = o.z - S.trackPos` is the
distance ahead of the rider. The world is drawn far-to-near by sorting on
`rel` descending.

Key constants and why they are what they are:

| Constant | Value | Meaning |
|---|---|---|
| `HORIZON` | 250 | Horizon line in design space |
| `CAMH` | 1.6 | Camera height in world units |
| `FOCAL` | 330 | Deliberately wide, so the street reads wide |
| `ROAD_HALF` | 1.35 | Road edge at \|x\| = 1.35 |
| `LANES` | -0.8, 0, 0.8 | Lane centres |
| `HOUSE_X` | 2.7 | House centres, set back behind a verge |
| `FLIGHT` | 0.45 | Seconds a paper is in the air |
| `LEAD` | 1.6 | How far ahead of the rider it lands |
| `PERFECT_TOL` | 1.5 | World units for a perfect throw |
| `HIT_TOL` | 3.4 | World units for a connecting throw |

`landZ() = trackPos + speed*FLIGHT + LEAD` is where a paper thrown *now* will
land. The whole timing mechanic hangs off this one function — the gauge, the
grading, and the paper's rendered flight path all read from it, so they can
never disagree with each other. **Keep it that way.** If you change the feel of
throwing, change `FLIGHT` or `LEAD`, not the individual consumers.

### Object kinds in `S.objs`

- `house` — both sides. Flags: `target`, `done`, `claimed`, `tried`, `shop`
- `prop` — verge dressing: pole, tree, hoarding, handpump, chai, dog
- `obs` — lane obstacles, some with `vz` for movement
- `pickup` — paper bundles
- `bunting` — festival strings across the street

### Level generation rules that must not be broken

- Every obstacle group leaves **one free lane**, and that free lane is within
  one lane of the previous group's free lane, so a path always exists.
- Moving traffic (auto, tempo) is placed alone, never alongside another
  obstacle, so drifting cannot seal the street.
- Target houses are spread evenly along the street, never in the first 26
  units or the last 8.

---

## 3. Required change: responsive aspect ratio

**This is the highest-priority task.** Right now the design space is a fixed
400x700 with a hard `aspect-ratio: 400/700` on the canvas. On anything that
isn't roughly 4:7 it letterboxes badly. It must work properly on:

- **Standard phones** — tall, roughly 9:19.5 to 9:16
- **Foldables, unfolded** — close to square, roughly 1:1 to 5:6
  (Galaxy Z Fold, Pixel Fold and similar)
- **Foldables, folded** — very tall and narrow cover screens
- **Tablets and desktop browsers** — it is a web game first

### Approach

1. Stop treating 400x700 as fixed. Keep **design height** at 700 and derive
   design width from the real viewport aspect, clamped:
   `DW = clamp(round(700 * viewportAspect), 380, 980)`
2. Recompute on every resize: `DW`, canvas backing size, and anything cached
   off dimensions.
3. `FOCAL` and `HORIZON` must adapt. On a wider viewport the same `FOCAL`
   shows more road and the street feels emptier; scale `FOCAL` with `DW` so
   the road occupies a consistent share of the width. Clamp so ultra-wide
   doesn't produce a fisheye.
4. Anchor the HUD to edges, not to hardcoded x values. Score top-left, delivery
   count top-right, aim gauges inset from each edge by a fraction of `DW`.
5. The rider, handlebar and basket are drawn from screen centre and bottom —
   scale them off `DH` so they stay proportionate, and make sure the basket
   never eats more than about a quarter of the visible height.
6. Respect safe areas: `env(safe-area-inset-*)` for notches and the gesture bar.

### Fold and unfold must not break a run

A foldable changes aspect **mid-game**. On resize:

- Preserve all game state — `trackPos`, `lane`, `px`, `papers`, `delivered`,
  lives, score. Never rebuild the level.
- Recreate cached gradients and any dimension-derived values.
- Pause for a frame if needed, but never drop the player into a crash because
  geometry shifted under them.

### How to verify

Test at these viewports before calling it done: 360x780, 412x915, 344x882
(cover screen), 673x841 and 884x1104 (unfolded), 768x1024, 1280x800. Resize
live, mid-run, and confirm nothing jumps or resets.

---

## 4. Feature backlog, in priority order

1. **Responsive aspect ratio** (section 3)
2. **Crossing dog** — currently a static verge prop. Make it run across the
   road. Critical rule: it must **telegraph** a beat before it moves — appears
   on the verge, ears up, pauses, then bolts. Anything that crosses without
   warning is unfair.
3. **More crossing hazards** using the same telegraph rule: kid chasing a ball,
   goat herd drifting sideways, auto pulling out of a side lane, reversing
   tempo, puddle that splashes and briefly blanks the screen without costing
   a life.
4. **Crash spin-out** — currently just a shake and a lost life. Should be a
   camera roll and a recovery beat.
5. **Parallax** — skyline, mid-buildings and verge should scroll at different
   rates.
6. **Particle system** — dust, exhaust, confetti on level clear. Replace the
   ad-hoc `S.dust` array.
7. **Audio** — engine loop pitched to speed, horn, throw whoosh, thump on the
   gate, temple bell on a perfect. Light tabla loop. Royalty-free only, keep
   the licence files in the repo.
8. **Analytics** — see section 5.
9. **Persistence** — high score and level reached via `localStorage`. This is a
   normal website, `localStorage` is fine here.

---

## 5. Deployment and measurement

Hosting is **Cloudflare Pages**, free tier. Chosen deliberately: unlimited
bandwidth, no card, and commercial use is allowed, so ads later won't breach
terms. Vercel's free Hobby plan forbids commercial use including ads, so do
not suggest it.

- Static deploy, no server functions. Build command empty, output directory
  root.
- Add `<meta name="robots" content="noindex,nofollow">` and a `robots.txt`
  disallow. The link is unlisted while testing.
- Cloudflare Web Analytics for traffic.

### Events worth instrumenting

The one question this prototype exists to answer is whether players reach
level 2. Track:

- Level started, level cleared, level failed
- Retries per level
- Session length, and the exact point of quitting
- Throws attempted vs connected, split by perfect/hit/early/late
- Crashes by obstacle type

Keep it lightweight — a tiny custom beacon is fine, don't pull in a heavy SDK.

---

## 6. How to verify visual work — important

You cannot see the game by reasoning about the code. Earlier iterations of
this project shipped broken art twice because nobody looked at it. Render
frames and inspect them.

A working harness exists in principle: install `canvas` (node-canvas) in a
scratch folder, stub `document.getElementById` to return a real canvas, stub
`window` as undefined and `requestAnimationFrame` as undefined so the file
doesn't try to start its own loop, then:

```js
global.__HOOK__ = (api) => { G = api; };
eval(scriptSourceExtractedFromTheHtml);
G.startGame();
for (let i = 0; i < 600; i++) G.update(1/60);
G.render();
fs.writeFileSync('frame.png', canvas.toBuffer());
```

**The `__HOOK__` block at the bottom of the file exists for this. Do not
remove it.** It exports `S`, `update`, `render`, `buildLevel`, `startGame`,
`toss`, `setLane`, `findTarget`, `landZ`.

Also run a headless bot: drive lane changes to avoid obstacles, throw when
`Math.abs(target.z - landZ()) < 1.0`, and confirm every level from 1 to 10 is
clearable. If a bot with perfect timing cannot clear a level, the generator is
producing unfair streets.

---

## 7. Working agreements

- Work on `develop`. Commit in small, described steps.
- Keep it a single file until it passes roughly 1500 lines, then split into
  modules with a minimal bundler — not before. The zero-dependency property is
  worth protecting.
- No framework. No build step for as long as possible.
- Performance matters: this must hold 60fps on a cheap Android phone. Cache
  gradients instead of creating them per frame, cap DPR at 2, avoid allocating
  objects inside the loop, pool particles.
- After any change to geometry, projection or level generation, re-run the
  frame render and the bot before saying it works.
- If a change makes the game easier or harder, say so explicitly — difficulty
  has been tuned by hand and is easy to wreck by accident.

---

## 8. Things already decided, don't relitigate

- Three lanes, constant speed, steering only. No jump, no brake.
- Timing-based throwing, not auto-lock.
- Flat vector art. An earlier pixel-art version was rejected.
- Small-town India setting, matching the reference footage: shuttered shops
  with painted boards, festival bunting, chai stall, thela, stray dogs, hand
  pumps, hoardings, rooftop water tanks, temple and mosque on the skyline.
- Levels with a delivery quota, not an endless runner.
- Monetization, if it ever happens, is AdMob in an Android wrapper plus a
  remove-ads purchase. Not AdSense — AdSense does not serve in apps.