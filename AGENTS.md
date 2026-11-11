# AGENTS.md — Geodesic: Mission Architect

Rules for any coding agent working in this folder. Read this file fully before touching code.

## What this project is
A browser game for the NASA Space Apps Challenge 2026, challenge **"Space Mission Design Game"**:
"create an interactive game that allows participants to design, manage, and simulate a complete space mission while making engineering decisions, managing limited resources, and evaluating how each choice shapes the success of their mission."
The full brief also asks for **1 to 4 players with distinct team roles**, clear display of budget / mass / power / data / communications / time, short tutorials, and multiple scenarios.

Our differentiator: **real orbital mechanics**. Players plan gravity-assist (slingshot) routes on real planet positions, and every flyby saves propellant. Do not dilute this. Every new feature should either make the slingshot more visible, more playable, or more scientifically honest.

Judging criteria: **Impact, Creativity, Validity (scientifically correct?), Relevance (answers the challenge?), Presentation.**

## Files
- `index.html` — the whole game, in English. **It is the only game file. Keep all HTML, CSS and JavaScript inside it.** Do not split code into separate JS/CSS files and do not create other language versions. It is served by a static server (e.g. VS Code Live Server at `http://127.0.0.1:5500/index.html`).
- Allowed extra folders: `tests/` (dev-only test scripts), `data/` (fetched NASA data snapshots as JSON), `assets/` (downloaded NASA 3D models). The game must still run if `data/` or `assets/` are missing (fall back gracefully).
- Progress log goes in `PROGRESS.md`.
- Because the file is large, navigate it by the numbered section banners (`/* ===== N. SECTION ===== */`). Add new sections with the same banner style and keep them in a logical order. Make targeted edits; never rewrite the whole file in one go.

## Tech constraints
- Three.js r170 via the existing import map (`https://cdn.jsdelivr.net/npm/three@0.170.0/...`). You may add official Three.js addons from the same version (e.g. `three/addons/loaders/GLTFLoader.js`) by extending the import map.
- Tailwind via the existing CDN script. Plain JS, no framework, no TypeScript, no npm runtime dependencies in the game.
- Dev-only tools (Node test scripts, Playwright) are fine in `tests/`, but the game must not depend on them.
- Keep 60 fps on a mid-range laptop: reuse geometries/materials, avoid per-frame allocations in hot loops, cap particle counts, dispose what you remove.
- Wrap any `localStorage` use in try/catch.

## Visual style (keep it consistent)
Stylised, illustrated sci-fi: cel/toon shading (`MeshToonMaterial` + the 3-step `GRAD` texture), ink outlines via the existing `mk()` helper, warm paper UI palette (`paper #fbf6ec`, `ink #2b2622`, `accent #1f6f6a`, `flame #e2772e`), deep blue/purple space with the spacetime grid. "Realistic" here means **physically correct motion, lighting direction, scale cues and timing**, not photorealistic textures.

## Science rules (non-negotiable)
- Physics engine lives in section "1. ASTRODYNAMICS ENGINE": JPL approximate ephemeris (Table 1, 1800–2050), universal-variable Lambert solver, Kepler propagation, patched-conic flybys. SI units inside physics code; convert only in UI.
- **Never fabricate data.** Anything presented as NASA/JPL data must come from a real NASA/JPL source, with the source named in the in-game Sources panel. If you cannot fetch a dataset (no network), implement the loader with a clearly labelled fallback and record it in `PROGRESS.md` as TODO. Do not invent "real" flare dates, mission facts, or numbers.
- Game-balance values (component costs, launcher capacity curve, science points) are allowed but must be labelled "game model" in the Sources panel.
- These regression results must keep passing (run `node tests/astro.test.mjs`):
  - Voyager 1 (launch 1977-09-05, Jupiter 1979-03-05, Saturn 1980-11-12): Jupiter flyby periapsis ≈ 4.85 Jupiter radii (±0.3).
  - New Horizons (2006-01-19, Jupiter 2007-02-28, Pluto 2015-07-14): launch C3 ≈ 158 km²/s² (±5); Jupiter periapsis ≈ 33.6 R (±2).
  - Voyager 2 (1977-08-20, 1979-07-09, 1981-08-26, 1986-01-24, 1989-08-25): no flyby flagged as crash; Saturn periapsis ≈ 2.7 R (±0.3).
  - `propagate(r1, lambert(...).v1, dt)` reaches r2 within 1 km.
  - Auto-tune for Earth→Mars→Earth→Jupiter (2026–2040, capture) finds total Δv-from-LEO ≤ 6.0 km/s with no crash, in ≥ 3 of 4 seeds.

## Working rules
- Work in small, verifiable steps. After each feature: run tests, load the page headless (or in the browser) and check the console has **zero errors**, then `git commit` with a clear message.
- Keep `window.__game` test hooks working and extend them for new features (so features can be driven headless).
- Do not stop to ask questions. Make the most reasonable decision, implement it, and write the decision in `PROGRESS.md`.
- Never delete working features. If you must replace one, the replacement must cover everything the old one did.
- Update `PROGRESS.md` after every feature: what was done, how it was tested, known issues, next step. If a session ends mid-way, the next session continues from `PROGRESS.md`.
- All UI text in English, short and plain (players are students). Explain physics in one sentence, not a paragraph.
