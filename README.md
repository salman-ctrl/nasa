# Geodesic: Mission Architect

Design a spacecraft, align real planets, and borrow orbital energy through gravity assists. Geodesic is a single-file browser game for the NASA Space Apps Challenge 2026 Space Mission Design Game: students balance mass, power, communications, money and time, then fly the consequences of their engineering decisions. Its core is a JPL-element ephemeris, universal-variable Lambert solver, Kepler propagation and patched-conic encounters.

## Run

Serve this folder with VS Code Live Server, or run `python -m http.server 5500` and open `http://127.0.0.1:5500/index.html`. WebGL and network access to the Three.js, Tailwind and font CDNs are required on first load. There is no npm dependency in the game.

All HTML, CSS and game JavaScript remain in `index.html`. Optional NASA models live in `assets/models/`; data provenance and snapshots live in `data/`. Procedural spacecraft and simulated weather keep the game playable without those folders. Optional missing files can produce browser network diagnostics, but do not stop gameplay.

For GitHub Pages, serve the repository root on the `main` branch. Local asset/data URLs are relative and support a project subpath. Pushing source does not enable Pages hosting automatically.

## Play

- Choose free play or a saved career, and one to four hot-seat players.
- Design an orbiter, or a Moon/Mars lander or rover; choose hardware, instruments, autonomy and a sourced landing site.
- Choose a development schedule. Plan a direct or flyby route after the spacecraft's readiness date, inspect launch windows, and auto-tune dates.
- Have all four mission roles sign off, then launch. Aim each flyby on the planar B-plane slice and compare the planet and Sun velocity frames during the close-up.
- Manage anomalies, eclipse power loss and conjunction blackouts. Watch visible burns, compare a historical ghost in Legendary mode, or switch to physical-scale chase view.
- At arrival, replay capture, optionally aerobrake at Mars or plan a Jupiter/Saturn moon tour. Land with parachute/ignition timing or guidance; collect surface science with a lander or rover.
- Send operations commands across the displayed real light time. Review science, engineering consequences and live model checks, and download a mission patch.

Career best stars unlock Moon → Mars → Jupiter → Saturn → Neptune, budget bonuses, a larger dish, autonomy, aerobraking and ion cruise corrections. Storage is optional; blocked or malformed local storage does not prevent free play.

Press **?** for shortcuts. **C** switches Map/Chase; **N/E** select gravity views; **Space** pauses cruise; **S** skips a flyby; **M** toggles sound; **T** auto-tunes. Drag to orbit, scroll or use two-finger touch zoom. At phone widths, use the Parts/Plan, Review/Summary and Crew bottom-sheet tabs. Reduced-motion preferences shorten flyby scenes and disable shake, animated UI and automatic camera orbit.

## Verification

Install development tools with `npm install --prefix tests`, then run:

```sh
node tests/astro.test.mjs
node tests/models.test.mjs
node tests/smoke.mjs
```

Smoke uses installed Chrome by default. Set `PW_CHANNEL=chromium` after installing Playwright's Chromium if needed. Optional environment flags: `TEST_MOBILE=1`, `TEST_REFERENCE=1`, `TEST_REDUCED=1`, `TEST_AERO=1`, `TEST_BASE_PATH=/geodesic`, and `SMOKE_MISSIONS=voyager2` for a shorter targeted run. Screenshots under `tests/` are ignored by Git.

Historical checks cover Voyager 1 Jupiter periapsis, New Horizons launch C3/Jupiter periapsis, Voyager 2 safety/Saturn periapsis, and Lambert propagation residuals below 1 km. Four fixed optimizer seeds must produce at least three safe Jupiter capture routes below 6 km/s. Additional checks cover conic geometry, aiming, EDL, engineering, development and moon tours. Browser smoke drives all missions and Voyager 2 through reports with zero console or page errors; a separate overloaded lunar vehicle exercises launch failure.

## Data and credits

The in-game **Sources & Assumptions** panel links individual mission and landing-site references and separates NASA data from game values.

- [JPL approximate positions, Table 1](https://ssd.jpl.nasa.gov/planets/approx_pos.html), [planet physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html), and [NASA planetary fact sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/).
- [NASA gravity-assist primer](https://science.nasa.gov/learn/basics-of-space-flight/primer/), NASA Voyager, New Horizons, Mariner 10, Juno, Cassini, MRO and LRO mission pages.
- [JPL satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/) and [mean orbital elements](https://ssd.jpl.nasa.gov/sats/elem/).
- [NASA/JPL Mars atmosphere reference](https://descanso.jpl.nasa.gov/propagation/mars/MarsPub020318.pdf).
- [NASA CCMC DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/). The requested API returned 404; the migrated service was unreachable during this build. `data/donki-flares.json` records the failed query, time and reason, with **zero invented records**. Weather remains explicitly simulated until a real snapshot is available.
- [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources): Voyager Probe (A), Juno (A), Cassini Assembly. Credit NASA and the collection's contributing authors, including NASA/JPL-Caltech. Original geometry is retained with illustrative toon materials. Voyager is used in its Legendary mission; all three are inspectable from Sources. No New Horizons GLB was present in the inspected repository; its printable STL parts were not substituted for an assembled spacecraft, and the procedural model remains.
- Three.js r170 and official GLTF/Draco addons; Tailwind CSS; Plus Jakarta Sans and JetBrains Mono from Google Fonts. Sound and illustrated textures are generated in the game. NASA asset use does not imply NASA endorsement.

## Model limits

This is an educational game, not flight-navigation software. Planet positions are projected into the ecliptic and Table 1 is intended for 1800–2050; routes outside that range are labelled extrapolations. Transfers are two-body Lambert arcs without deep-space manoeuvre searches, multi-revolution optimisation or full N-body dynamics. Powered flybys join conics at a common periapsis. Aiming is a planar B-plane slice, with a charged correction that rejoins the planned leg.

Map scale is compressed; chase/flyby geometry preserves local planet/path scale while spacecraft are enlarged. Chase uses the articulated engineering craft so panels and antenna can track their targets; the NASA Voyager geometry appears in map and flyby views. The spacetime grid is an illustration and clock offsets use a weak-field approximation. Moon tours use circular orbits with assumed phase zero, not moon ephemerides. EDL is vertical, with a simple exponential atmosphere; aerobraking efficacy, thermal damage, battery endurance, hardware/resource values and campaign rewards are game models. Ion propulsion applies only to cruise corrections with a finite-thrust time constraint; capture and powered flyby impulses remain chemical.

The scene targets 60 fps with bounded particles, geometry reuse, cached NASA models and disposal on scene changes. Headless software-rendered checks verify functionality; performance on a representative mid-range laptop still needs direct measurement. See `PROGRESS.md` for the detailed phase log and remaining data availability tasks.
