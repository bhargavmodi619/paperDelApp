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
- `test/bundle.test.js` rebuilds and runs the generated `paper-round.html`, so
  the single-file output cannot drift away from the modules.

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
  render/             draws S, never mutates it
    background.js     sky, skyline, road
    houses.js         frontage and the delivery pin
    props.js          verge dressing and bunting
    obstacles.js      cows, autos, thelas, potholes, scooters, tempos
    effects.js        bundles, dust, papers in flight
    rider.js          the bike and its arms
    hud.js            score, lives, papers, and the timing gauges
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
  (`HORIZON`, `CAMH`, `FOCAL`, `ROAD_HALF`, `LANES`, `HOUSE_X`, `FLIGHT`, `LEAD`)
- Throw tolerances and `landZ()` — `src/game/throwing.js`
  (`PERFECT_TOL`, `HIT_TOL`)
- Street generation and difficulty curve — `src/game/level.js`
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

## History

The original single-file prototype is the baseline commit on `main`:

```bash
git show 4324d62:paper-round.html
```

`main` is the release line and sits at that baseline. All work lands on
`develop`.
