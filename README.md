# Paper Round

A morning delivery run, one street at a time. You ride at a steady speed and only
steer — the skill is in *when* you let the paper go.

Project instructions, decisions and the feature backlog live in
[claude.md](claude.md). Read that before changing anything.

## Running it

Two ways, both supported, both the same game:

```bash
# 1. The built single file — no server, no dependencies. Just open it.
npm run build          # regenerates paper-round.html from src/
#    then double-click paper-round.html

# 2. The modules directly, for development.
npm start              # http://localhost:5173
#    or, with no npm at all:  python -m http.server 8000
```

`src/` is the source of truth. `paper-round.html` is generated — never edit it
by hand, and re-run `npm run build` before committing.

ES modules will not load over `file://`, which is why the build exists: it keeps
the zero-dependency, no-server, open-it-from-disk property that this project
cares about, without giving up a navigable source tree.

## Controls

| Action        | Touch                    | Keyboard              |
| ------------- | ------------------------ | --------------------- |
| Change lane   | swipe left / right       | `←` `→`               |
| Throw left    | tap the left half        | `Q` `A` `Z`           |
| Throw right   | tap the right half       | `E` `D` `M`           |
| Mute          | —                        | `P`                   |
| Start / next  | tap anywhere             | `Space` `Enter`       |

Only houses with a pin above them want a paper. Each side has a timing gauge:
throw when the head enters the green band, and the bright core in the middle of
that band is a **PERFECT**.

## Tests

```bash
npm test
```

Both suites boot the real game headlessly against a stubbed canvas
(`test/stub-dom.js`) and play it — steering, throwing, landing a paper on a
house, riding a street to its end. They assert behaviour, not pixels; they catch
a module that stopped wiring up, they do not review the art.

- `test/smoke.test.js` runs the ES modules in `src/`.
- `test/bot.test.js` is the playability bot claude.md §6 asks for. It plays
  levels 1–12 six times each and asserts the quota is always reachable, that
  early levels barely scratch a good rider, and that no level averages more
  than 1.5 crashes. This is the guard on "harder every level, but still
  playable" — if it fails, the generator is making unfair streets. Its driving
  logic lives in `test/bot-brain.js`.
- `test/bundle.test.js` rebuilds and runs the generated `paper-round.html`, so
  the single-file output cannot drift away from the modules.

The stubbed context also rejects non-finite draw coordinates. A NaN out of the
projection maths draws nothing at all in a real browser and reads as broken
art rather than as an error, so it is worth failing loudly on.

Per [claude.md](claude.md) §6, visual work still has to be *looked at*. These
tests do not replace rendering a frame and inspecting it.

## Build

`build.js` is plain Node with no packages. It walks the import graph from
`src/main.js`, strips the `import`/`export` lines, concatenates the modules in
dependency order inside one IIFE, and inlines `src/styles.css`. That round-trips
cleanly because every module is nothing but top-level `var`/`function`
declarations.

The `__HOOK__` export at the end of `src/main.js` survives the build. Keep it —
[claude.md](claude.md) §6 depends on it, and so do both test suites.

## Layout

```
index.html            dev entry — loads the modules
paper-round.html      GENERATED single-file build
build.js              the bundler, zero dependencies
src/
  main.js             boot: build street 1, attach input, run the frame loop
  styles.css
  core/               no game knowledge, reusable
    canvas.js         the 400x700 design space and its 2D context
    projection.js     the camera: world (x, z) -> screen (x, y)
    palette.js        every colour in the game
    draw.js           rounded rects, polys, circles, text
    math.js           rnd, pick, clamp, shade
    audio.js          one oscillator per sound effect
  game/               rules and simulation, never touches the canvas
    state.js          the single mutable state object, S
    level.js          procedural street layout
    throwing.js       aim, timing tolerances, and grading a throw
    actions.js        steering and crashing
    update.js         one simulation step
    flow.js           title -> play -> cleared -> over
    input.js          pointer and keyboard bindings
    particles.js      pooled dust
  render/             draws S, never mutates it
    background.js     dawn sky, skyline, curved road, crossroads, haze
    houses.js         frontage and the delivery pin
    landmarks.js      temple, school, government office
    props.js          verge dressing, hawkers, dozing dogs, bunting
    obstacles.js      cows, autos, thelas, potholes, scooters, tempos
    crossings.js      dogs that bolt across the road — and telegraph first
    effects.js        bundles, dust, papers in flight
    rider.js          the scooter and its arms
    hud.js            score, lives, papers, timing gauges, turn sign
    screens.js        title, street cleared, round over
    scene.js          composites one frame
```

The dependency direction is one-way: `render/` and `game/` both depend on
`core/`, `render/` reads `game/`, and nothing in `game/` imports from `render/`.
There are no cycles — `build.js` would not be able to order the modules if there
were.

### Where the tuning lives

The numbers [claude.md](claude.md) §2 warns about are now in one file each:

- Projection and throw timing — `src/core/projection.js`
  (`HORIZON`, `CAMH`, `FOCAL_BASE`, `ROAD_HALF`, `LANES`, `HOUSE_X`, `FLIGHT`, `LEAD`)
- Throw tolerances and `landZ()` — `src/game/throwing.js`
  (`PERFECT_TOL`, `HIT_TOL`)
- Difficulty curve — `src/game/level.js`: `speedFor`, `targetsFor`,
  `gapTimeFor`, `twoLaneChance`, and the paper economy just below them. Change
  any of these and re-run `npm test`; the bot will say if you made a level
  unfair.
- Camera feel — the `camera()` function in `src/game/update.js`
- Engine note — `startEngine`/`setEngine` in `src/core/audio.js`
- Colours — `src/core/palette.js`

`landZ()` is still the single source of truth for where a paper lands. The
gauge (`render/hud.js`), the grading (`game/throwing.js`) and the drawn flight
path (`render/effects.js`) all import it rather than recomputing it, so they
cannot disagree.

### `S`, the state object

Every module reads and writes one shared object rather than passing state
around. That is how the prototype worked and the split kept it deliberately —
it is the simplest thing that works for a game this size, and it keeps the
`__HOOK__` seam honest. If it ever needs to change, `state.js` owns the shape.

### Two things worth knowing before you tune anything

**Obstacle spacing is a reaction time, not a distance.** `gapTimeFor(n)` returns
seconds and the generator multiplies it by that level's speed. As the ride gets
faster the gap in metres grows with it, so streets get denser without becoming
undodgeable. Tuning the gap in metres is exactly how levels 9 and up became
unplayable the first time this was tried.

**The road bends by offsetting its centre line.** `core/projection.js` holds a
lookup table of lateral offset per depth, built once per level. `sxAt()` adds
that offset, so houses, obstacles, dust and papers in flight all follow the bend
for free. Heading rises to a peak through a junction and returns to zero, which
keeps the world on a single z axis while the ride reads as turning a corner.

## History

The original single-file prototype is the baseline commit on `main`:

```bash
git show 4324d62:paper-round.html
```

`main` is the release line and sits at that baseline. All work lands on
`develop`.
