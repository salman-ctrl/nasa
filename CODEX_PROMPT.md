# Codex kickoff prompt — paste everything below the line into Codex

---

You are the lead engineer on **Geodesic: Mission Architect**, a browser game for the NASA Space Apps Challenge 2026 ("Space Mission Design Game"). Read `AGENTS.md` first and follow it strictly. Then read `index.html` end to end before changing anything: it is a working ~140 KB single-file Three.js game and most of what you need (physics engine, toon renderer, scenes, UI patterns, test hooks) already exists. **Everything stays in this one file** (see `AGENTS.md`).

You have the whole night. Work autonomously through the phases below, in order. Do not ask me questions; decide, implement, test, commit, log in `PROGRESS.md`, and move on. If you run out of time, a finished earlier phase is worth more than a half-finished later one.

## Current game (what already works — do not break it)
Flow: Brief → Design → Route → Launch → Cruise → Operations → Report.
- **Missions:** Moon (no route step), Mars, Jupiter, Saturn, Neptune. **Legendary routes:** Mariner 10, Voyager 2, New Horizons (historical dates, "beat the 1970s planners").
- **Design:** launcher, bus, power (solar/RTG), antenna, instruments, DSN passes, propellant margin, radiation vault. Live KPI strip + readiness checklist. `compute(cfg, mods)` is the whole engineering model.
- **Route planner (the core):** flyby sequence chips, launch-date and per-leg sliders, porkchop launch-window map, differential-evolution auto-tune, flyby cards (periapsis, bend angle, free speed, crash warning), propellant-saved meter vs best direct flight.
- **Launch:** toon spaceport, countdown, plume, smoke, booster separation, dramatic failure (fall + explosion) when the rocket is too weak.
- **Cruise:** real trajectory replay on JPL ephemeris, slow-motion flyby close-ups, Newton/Einstein toggle (force arrows vs spacetime grid + relativistic clock), 2 random anomaly events, flyby crash if periapsis is unsafe.
- **Operations + Report:** science ticker, stars, lessons, real mission comparison, downloadable mission patch PNG, flight-school tutorial, synthesized sound.

## Step 0 — Set up (do this first)
1. `git init` if needed and commit the untouched starting state.
2. Map the file: list every numbered section banner with its line range and main functions in `PROGRESS.md`, so later steps (and later sessions) can navigate quickly. Do not restructure into separate files.
3. Create `tests/astro.test.mjs` with the regression checks listed in `AGENTS.md`. Because the physics lives inside `index.html`, the test should extract the code between the `1. ASTRODYNAMICS ENGINE` banner and the `2. MISSION DATA` banner from `index.html`, evaluate it in Node (it uses no Three.js or DOM), and run the checks. Make them pass.
4. Create `tests/smoke.mjs` (Playwright if available; otherwise document the manual check) that loads `index.html` through a static server, plays Moon, Mars, Jupiter (with Earth→Mars→Earth→Jupiter + auto-tune) and Voyager 2 to the report via `window.__game`, and fails on any console error.
5. Commit. Write `PROGRESS.md`.

## Phase 1 — The slingshot becomes the star (highest priority)
**1.1 Planet-frame flyby cinematic.** When the spacecraft reaches a flyby, pause the heliocentric view and cut to a planet-centred close-up:
- Draw the true hyperbola from the patched-conic values: e = 1 + rp·v∞²/μ, turn angle δ = 2·asin(1/e), periapsis rp from the route model, incoming/outgoing asymptotes aligned with the actual v∞ in/out vectors.
- The planet is rendered at true relative scale to rp (e.g. Voyager 1 passes at 4.85 Jupiter radii — it must look like that). The planet rotates; the local spacetime-grid well is visible under it.
- The spacecraft flies the hyperbola with Kepler timing (fast at periapsis, slow far out), compressed to ~6–8 s of screen time.
- Exit automatically back to the heliocentric view. Skippable with a button.

**1.2 "The slingshot secret" split view.** During 1.1, show a two-panel overlay (2D canvas or SVG is fine):
- Left, **planet frame**: speed in = speed out, only the direction turns (show both numbers).
- Right, **Sun frame**: vector diagram v_out_sun = v_planet + v∞_out vs v_in_sun = v_planet + v∞_in, with the speed gain highlighted.
- One line of text explaining where the energy came from, plus how much the planet slowed down: Δv_planet = m_sc·Δv_sc / M_planet (use the spacecraft wet mass; show it in scientific notation, e.g. "Jupiter slowed by 3×10⁻²⁴ m/s").

**1.3 Real-time flyby aiming (skill mechanic).** A few (game) days before each flyby, pause and open an **aim panel**:
- Show the B-plane: a target dot (planned aim point) and the current aim point. Player drags the aim point (mouse/touch) to change impact parameter b and side. Relation: b = rp·√(1 + 2μ/(rp·v∞²)).
- Recompute the outgoing v∞ direction from the chosen b, propagate the next leg with `propagate()`, and draw the resulting path live. Show the predicted miss distance at the next body and the correction Δv needed (Lambert from post-flyby state to the next body at the planned date, minus the actual post-flyby velocity).
- Every aim change costs TCM propellant proportional to the lateral Δv; deduct from the margin (use the existing `mods.dvUse` system). Aiming inside `rMin` → crash. Leaving it as planned → zero cost.
- Report shows "aim accuracy" per flyby.

**1.4 Ghost race.** In Legendary mode, fly a translucent ghost of the historical spacecraft (using the historical route) alongside the player's. HUD shows "ahead/behind by N days".

Acceptance: Voyager 2 flybys look geometrically right (Jupiter ~10 R, Saturn ~2.7 R), the split view numbers equal the route-model numbers, the aim panel changes the outgoing path and its cost, tests + smoke pass, zero console errors.

## Phase 2 — Space that feels real
**2.1 Chase camera.** Key `C` / button toggles Map ↔ Chase. Chase camera follows behind the spacecraft. In chase view:
- Solar panels rotate to face the Sun; the high-gain antenna points at Earth (compute the real Earth direction from the ephemeris); planets in the distance are drawn with correct angular size growth as you approach.
- Directional light comes from the Sun's actual direction (terminator lines on planets are correct).
**2.2 Visible burns.** Every Δv event (TCM, powered flyby, capture burn, aim corrections) shows an engine plume pointing opposite to the burn direction, with duration proportional to Δv, plus a small HUD "BURN 0.42 km/s".
**2.3 Eclipses and solar conjunction.** Compute from geometry each frame:
- Eclipse: spacecraft in a planet's shadow cylinder → solar power drops to zero, battery icon drains (RTG missions unaffected).
- Solar conjunction: Sun–Earth–spacecraft angle < 2° → "Comms blackout" banner, no downlink for the duration. Log both in the report.
**2.4 Orbit insertion done properly.** Capture burn animation (retro plume) → highly elliptical capture orbit drawn (eCap from the model) → for Mars, optional **aerobraking**: a chosen number of atmosphere dips that shrink apoapsis, saving propellant but risking overheating (simple heat budget per dip; too many/too deep → instrument damage). The propellant saving feeds back into the score.

## Phase 3 — Landing ("7 minutes of terror")
**3.1 Mission type at Design:** Orbiter / Lander / Rover (rover only Moon & Mars). Lander/rover add mass, cost and a landing phase; they unlock surface science values.
**3.2 Landing site choice:** real NASA sites with short facts: Mars — Jezero Crater, Gale Crater, Utopia Planitia; Moon — Shackleton rim (south pole), Mare Tranquillitatis. Each site has a risk (rocks, slope, elevation) and a science bonus. Facts must be real; cite in Sources.
**3.3 EDL mini-game (Mars):** 2D side-view or 3D: entry with heat-shield glow and plasma, then player timing for parachute deploy and powered descent (or sky crane for heavy rovers). Physics: exponential atmosphere ρ(h) = ρ0·e^(−h/H) with Mars ρ0 ≈ 0.020 kg/m³, H ≈ 11.1 km; drag = ½ρv²·Cd·A; g = 3.71 m/s². Outcomes: soft landing / hard landing (damage) / crash. Moon: no atmosphere, powered descent only (g = 1.62 m/s²), fuel-limited.
**3.4 Surface operations scene:** small toon terrain diorama of the site with the lander/rover, day/night cycle, rover drive path; science ticks up.

## Phase 4 — Complete game systems (Relevance)
**4.1 Team mode 1–4 players (required by the brief).** Roles: Mission Lead (route, schedule), Propulsion (launcher, propellant, aiming), Science (instruments, landing site), Power & Comms (power, antenna, DSN passes). Hot-seat: each role sees its own panel, can only change its own items, and must press "Sign off". Shared constraint bars are visible to all. Launch requires all sign-offs. With 1 player, all roles belong to that player. Report shows per-role contributions.
**4.2 Development phase & schedule.** New step between Design and Route: choose a development schedule (Standard / Accelerated / Crunch). Development duration depends on mass and complexity; acceleration costs money; the earliest launch date in the route planner = mission start date + development time. If the schedule slips past a launch window, show it in the porkchop map (greyed out dates). This covers the brief's "Time" resource.
**4.3 Operations with real signal delay.** During operations, anomalies require commands; commands arrive after the real one-way light time (seconds at the Moon, ~4 h at Neptune, compressed for gameplay but displayed truthfully). Players choose onboard autonomy level at Design (more autonomy = more cost/mass, fewer delay-related losses).
**4.4 Moon tour at Jupiter/Saturn.** After capture, an optional tour planner reusing the route-planner mechanics inside the planet system: sequence flybys of Io, Europa, Ganymede, Callisto (Jupiter) or Titan, Enceladus (Saturn) using their real GM, radius and orbital radius (circular-orbit approximation, labelled). Each moon flyby gives science and changes the orbit.
**4.5 Career campaign.** Moon → Mars → Jupiter → Saturn → Neptune unlock chain. Stars give reputation; reputation raises budgets and unlocks tech: ion propulsion (Isp ~3000 s, needs lots of power, low thrust → longer transfers), bigger dish, aerobraking, autonomy. Save to localStorage (try/catch). Free-play stays available.

## Phase 5 — NASA data and honesty (Validity)
**5.1 Real solar flares from NASA DONKI.** Replace the generic flare event with real flares: fetch `https://api.nasa.gov/DONKI/FLR` (DEMO_KEY) for a past date range at build time if you have network, and save a curated snapshot to `data/donki-flares.json` with the query URL and fetch date. In-game, the event card shows the real flare class and date ("Based on the X1.0 flare of …"). If no network, keep the generic event, label it "simulated", and log a TODO. **Never invent flare records.**
**5.2 NASA 3D models in Legendary mode.** If network is available, download Voyager / Juno / Cassini / New Horizons GLB models from the official `nasa/NASA-3D-Resources` GitHub repository into `assets/models/`, credit them, and use them (scaled, toon-shaded via material override) in legendary missions. Otherwise keep procedural models and log a TODO.
**5.3 Sources & Assumptions panel.** A button on the brief screen and in the report: lists every data source with links (JPL SSD approximate planet positions Table 1, NASA Planetary Fact Sheets for GM/radius, mission dates from NASA mission pages, DONKI, 3D resources) and every game-model assumption (component costs, launcher capacity curve, science points, planar orbits, compressed visual scale, no deep-space maneuvers). Mark each line "NASA data" or "Game model".
**5.4 Validation screen.** In the Sources panel, a "Model check" table that runs the regression cases live in the browser (Voyager 1 Jupiter periapsis, New Horizons C3, etc.) and shows model value vs historical value.

## Phase 6 — Presentation polish
- Responsive layout down to 390 px wide (phone): panels become bottom sheets, touch drag for camera and aiming.
- Keyboard shortcuts with a `?` help overlay. Respect `prefers-reduced-motion` (shorter cinematics, no camera shake).
- Loading screen with progress while textures/models load.
- `README.md` with: one-paragraph pitch, how to run, feature list, data sources, model limitations, credits.
- Make sure `index.html` works when hosted on GitHub Pages (relative paths only).

## Definition of done for the night
- All phases you completed: tests pass, smoke test plays every mission + Voyager 2 to the report, zero console errors, 60 fps target respected.
- `PROGRESS.md` lists, per phase: done / partial / not started, how it was tested, known issues, and every assumption or data TODO.
- Final commit message: "Night build: <summary>".

Start now with Step 0.
