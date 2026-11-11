# Geodesic night build

## Step 0 ? baseline and verification

- Baseline already committed as c5c5a64; origin/main is configured and pushed.
- Read AGENTS.md, CODEX_PROMPT.md and the single game file before edits.
- Added Node physics extraction tests; historical values pass, Lambert endpoints agree within 1 km, optimizer passes 3/4 fixed seeds (7, 31, 101; seed 2026 remains unsafe).
- Browser smoke covers all five missions and Voyager 2, including Jupiter auto-tune and PNG generation. Playwright is a dev-only dependency under tests/.

## Section map (starting state)

| Section | Lines | Main functions |
| --- | --- | --- |
| 1. ASTRODYNAMICS ENGINE | 202?296 | ephemPos, ephemVel, stC, stS, lambert, propagate, captureDv, evalRoute, hohmann, hohT, tofRange, routeScore, tuneDE, polish |
| 2. MISSION DATA (simplified engineering models, real physics laws) | 297?396 | routeInfo, compute |
| 3. SOUND (synthesized with Web Audio, no files) | 397?420 |  |
| 4. RENDERER + TOON LOOK (cel shading with ink outlines) | 421?465 | OUT, smoothGeo, toonMat, mk, ctex, sprite, planetTex |
| 5. EARTH SCENE: desert spaceport at golden hour | 466?521 |  |
| 6. BUILDERS: spacecraft and rockets assembled from the player's choices | 522?614 | buildCraft, buildRocket, rebuildModels, emit, stepParticles, puff, burst, stepFireball |
| 7. SPACE SCENE: real solar system (JPL elements) or Earth-Moon system | 615?707 | buildGrid, labelSprite, planetMesh, clearDyn, setWells, setupHelio, drawRoute, placeHelio, helioState, kepler, setupMoon, moonCraft, placeMoon |
| 8. CAMERA RIG (drag rotate, scroll zoom, smooth) | 708?722 | fit, placeCam |
| 9. GAME STATE + DESIGN UI | 723?817 | setPhase, defaults, jdBounds, evalCfgRoute, initDirectRoute, updateKPIs, group, renderPanel, onDesign, designChecks, updateDesignUI, startMission, startDesign, goBrief |
| 10. ROUTE PLANNER (the core): flybys, dates, launch-window map, auto-tune | 818?917 | startLegend, startRoute, legDefault, renderRoutePanel, routeChanged, refreshRoute, drawPork, renderFlybys, fuelStats, renderSummary, navButtons, wireNav, autoTune |
| 11. LAUNCH (success or a dramatic failure) | 918?957 | resetLaunchScene, doLaunch, legendResult, banner, updateLaunch, updateFail, endLaunch |
| 12. CRUISE: replay the real trajectory, flyby cinematics, events | 958?1055 | startHelioCruise, startMoonCruise, buildSpeeds, setView, hudRows, updateViewFX, updateCruise, updateMoonCruise, crashFlyby, arrive, updateOps, pickEvents, openEvent |
| 13. REPORT + SHAREABLE MISSION PATCH | 1056?1120 | showReport, makePatch |
| 14. FLIGHT SCHOOL (guided tutorial) | 1121?1144 | tutShow, tutEvent |
| 15. LOOP | 1145?1165 | frame |

## Phase status

- Step 0: done; Node and browser checks pass.
- Phase 1: partial; 1.1 complete, 1.2 overlay implemented, aiming and ghost race next.
- Phase 2: not started.
- Phase 3: not started.
- Phase 4: not started.
- Phase 5: not started.
- Phase 6: not started.

## Decisions and known limits

- Preserve the existing planar patched-conic engine and all existing flow.
- Historical flybys may include a powered speed mismatch: split view must distinguish ideal unpowered deflection from actual Lambert leg speeds.
- Planet mass for momentum exchange will use GM / Newtonian G, with sources identified in game.
- No performance claim until measured in a real browser.

Step 0 complete: node tests/astro.test.mjs and node tests/smoke.mjs passed. Browser used installed Chrome; zero console/page errors. All missions reached reports, including the default Neptune design's expected payload failure. Next: Phase 1 cinematic and aiming.

## Phase 1.1 - planet-frame cinematic

- Implemented planet-centred scene, rotating toon planet, local gravity well, true relative radius, automatic return and Skip.
- Hyperbolic anomaly solves Kepler time over a seven-second replay (two seconds for reduced motion); camera follows the encounter without changing physical path scale.
- Replaced mean-speed flyby radius inversion with a common-periapsis powered conic solve. This keeps actual incoming/outgoing Lambert vectors aligned even when their planet-frame speeds differ.
- Tests: historical regressions and 3/4 optimizer seeds pass; added conic periapsis and incoming/outgoing asymptote checks. Full browser smoke passes with zero errors.
- Preliminary split overlay distinguishes ideal unpowered speed conservation from route powered corrections. Planet momentum uses wet mass and GM/G; fuller source listing follows in Phase 5.
- Limitation: planar patched conics; craft and glow are enlarged for visibility. Hardware 60 fps is unverified; headless software rendering is a functional check.
- Next: finalize split diagram, then aiming.
