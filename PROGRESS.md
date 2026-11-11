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

## Phase 1.2 and 1.3 - speed exchange and aiming
- Split vector view now shows equal-speed unpowered deflection and actual powered Sun-frame sums, with wet-mass momentum exchange and NASA/JPL links.
- Aiming opens three days before each encounter; touch drag and keyboard range control signed b in a labelled planar B-plane slice.
- Live Kepler propagation shows the uncorrected departure, next-body miss and Lambert rejoin delta-v. Lateral adjustments accumulate impulse cost; confirmation also deducts rejoin correction using mods.dvUse.
- Default planned aim costs zero; unsafe periapsis crashes. The cinematic follows the chosen conic, then rejoins the planned transfer using the charged correction. Report records per-flyby accuracy, miss and cost.
- Tests: historical/conic/aiming regressions pass; browser smoke passes with no errors. Added interactive browser assertions for changed aim and cinematic Skip.
- Decision: rejoin corrections preserve the remaining planned mission; this is stated in the aim panel. Full 3D B-plane targeting is outside the existing planar model.
- Next: historical ghost race.

## Phase 1.4 - historical ghost race
- Legendary missions show a translucent spacecraft on the historical trajectory, evaluated at equal elapsed mission time. HUD reports ahead/behind days at equal normalized route progress.
- Phase 1 complete. Tests: physics regressions and interactive all-mission smoke pass; zero browser errors, aim-preview changes checked, cinematic Skip checked. Screenshots saved under tests/ (ignored).
- Known limitation: the race uses route progress, rather than geometric proximity, to compare differing launch dates. Next: Phase 2.1 chase camera.

## Phase 2.1 - chase camera
- C/button toggles map and a physical-scale chase scene (one unit = 1,000 km); planet radii and distances use the same scale, giving correct angular growth. Craft is enlarged and labelled.
- Solar panel normals track the Sun; dish tracks ephemeris Earth. A point light at the physical Sun gives each planet the correct illumination direction.
- Screenshot review caught an existing report modal remaining over a subsequent Legendary run; startRoute now closes it and smoke asserts that it is hidden during the cinematic.
- Tests: full physics regressions plus all-mission interactive smoke; map and chase share the same trajectory. Next: visible burns.

## Phase 2.2 - visible burns
- Shared bounded plume and BURN HUD cover lateral aim changes, post-flyby rejoin, powered periapsis burns, anomaly TCMs and capture. Exhaust extends opposite the acceleration vector; duration grows with delta-v.
- Tests: physics and all-mission smoke pass; browser explicitly enters chase view and checks the 0.420 km/s burn HUD, with zero errors.
- Known limit: finite burn duration is visual; trajectory impulses remain instantaneous patched conics. Next: eclipses and conjunction.

## Phase 2.3 - eclipse and conjunction geometry
- Shadow cylinders detect planet eclipses in SI coordinates, including planet-frame flybys; solar power display drops to zero and a game-model battery drains. RTG power is unaffected.
- Earth-centred Sun/spacecraft angle below two degrees produces a blackout banner and zero instantaneous downlink. Operations availability feeds the engineering data fraction and final science; transitions appear in the report.
- Tests: shadow front/behind/off-axis and conjunction/opposition unit cases pass, full physics and all-mission smoke pass with zero errors.
- Assumptions: cylindrical shadows, no penumbra, two-degree radio threshold and battery endurance are game models; planar ephemeris. Next: capture orbit and aerobraking.

## Phase 2.4 - eccentric capture and Mars aerobraking
- Capture draws the model eccentricity and uses Kepler anomaly timing. Orbit scale is consistent locally and the camera frames apoapsis.
- Mars offers keeping capture orbit, chemical lowering or 1-12 gentle/deep atmospheric dips. Final eccentricity sets the new orbit; vis-viva gives delta-v avoided versus an engine reaching the same orbit. Chemical lowering spends reserve; aerodynamic savings earn a labelled game-model science efficiency bonus. Excess heat damages an instrument.
- Tests: historical regressions and all-mission interactive smoke pass; zero console errors. Reduced-motion remains supported for flyby cinema.
- Assumptions: dip efficacy and heat budget are game models; aerobraking occurs after capture, never removes capture delta-v. Next: Phase 3 landing types.

## Phase 3.1 and 3.2 - surface mission design and NASA sites
- Design supports orbiter/lander/rover with added hardware mass, price, descent delta-v and site science bonuses.
- NASA-linked facts cover Jezero, Gale, Utopia, Shackleton rim and Mare Tranquillitatis. Risk and bonus values are explicitly game models.
- Decision: landers and rovers are limited to Moon/Mars; a gas giant has no solid surface. Other missions retain orbiters and moon tours arrive in Phase 4.
- Tests: physics and all-mission smoke pass with zero errors. Landing dispatch and interactive EDL are the next feature; current type choices affect engineering and science only.

## Phase 3.3 and 3.4 - EDL and surface operations
- Added Mars drag integration with rho0=0.020 kg/m3, H=11.1 km, g=3.71 m/s2; Moon uses vacuum and 1.62 m/s2. Physics substeps remain stable under time warp.
- Players time parachute deployment and ignition, or enable guidance. Fuel impulse is limited; heat and touchdown speed determine soft/hard/crash outcomes and science damage.
- Successful landers/rovers enter a toon terrain diorama, compressed day/night cycle, rover drive path and science ticker. Failed landing reports correctly award zero stars/science.
- Tests: guided Mars touchdown 1.40 m/s, Moon 1.04 m/s; historical regressions and all-mission smoke pass. Smoke now flies a Moon lander and Mars rover to report and rejects impacts. Zero browser errors.
- Assumptions: 1D vertical descent, drag coefficient/area, initial entry state, guidance, heat and terrain are game models; no claim of mission-grade EDL. Atmosphere source: NASA/JPL Mars Telecommunications document (descanso.jpl.nasa.gov/propagation/mars/MarsPub020318.pdf). Next: team roles.

## Phase 4.1 - hot-seat crew roles
- Brief supports 1-4 players. Mission Lead, Propulsion, Science and Power/Comms are assigned round-robin; role handoff changes editable panels, while resource bars remain shared.
- Hardware and route changes invalidate sign-offs. All four roles must approve launch (one-player mode can sign all roles together). Report records role owner, decisions and approval.
- Tests: browser checks four-player Science cannot see launcher choices and unsigned launch stays in Design; all missions, physics and EDL checks pass with zero errors.
- Decision: local hot-seat roles are a device handoff, with no identity or network authentication. Next: development schedule.

## Phase 4.2 - development and launch dates
- Added a Development step with mission start date and Standard/Accelerated/Crunch schedules. Mass and instrument complexity determine duration; acceleration adds cost.
- Route bounds and launch checks enforce readiness date. Porkchop dates before readiness are grey and cannot be selected. Report shows development duration and readiness.
- Tests: physics/EDL and all-mission smoke pass with zero errors. Game schedule costs/durations are assumptions. Legendary missions retain historical dates and bypass development.
- Next: command light time and autonomy.

## Phase 4.3 - signal delay and autonomy
- Design adds ground control, safe-mode autonomy and science autonomy with mass/cost tradeoffs.
- Orbit/surface operations now require an anomaly command. Effects apply only after ephemeris Earth-target one-way light time (Moon uses lunar range), compressed to a few screen seconds and displayed truthfully.
- Autonomy reduces delay-related observing loss. Pending commands cannot be bypassed with Continue; report records actual delay and autonomy choice.
- Tests: full physics/EDL and browser smoke pass, including delayed operations commands and reports, with zero errors. Next: optional moon tours.

## Phase 4.4 - optional moon tours
- Added a planet-centred tour planner at Jupiter/Saturn with sequence chips, leg timing, auto-tune, transfer preview and replay. Available moons: Io, Europa, Ganymede, Callisto, Titan and Enceladus.
- Real GM/radius and mean orbital radii come from JPL; circular coplanar orbits and phase zero are explicitly labelled assumptions. Lambert and Kepler propagation reuse the main engine; moon flybys compute safe periapsis and powered mismatch. Tour delta-v spends reserve, science and final capture orbit update.
- Tests: model test finds a feasible Saturn tour and verifies endpoint propagation; browser auto-tunes and flies that tour to report. Full regressions and all-mission smoke pass with zero errors.
- Default Jovian tour uses outer Ganymede/Callisto; adding all four moons may require difficult alignments. Next: persistent career and tech.

## Phase 4.5 - career, reputation and tech
- Added persistent Moon-Mars-Jupiter-Saturn-Neptune career unlocks. Best stars determine reputation without repeat farming; reputation raises budgets and unlocks autonomy, a 6 m dish, aerobraking and ion TCM. Free play retains every mission/tech.
- Every localStorage access is guarded; malformed saves are sanitized. Career can be continued from the brief.
- Ion TCM uses 3000 s Isp, 50 mN, 2500 W and requires sufficient flight time. Only the 100 m/s cruise correction allowance uses ion; impulsive capture/flyby/landing remain chemical. This avoids treating low thrust as an instantaneous capture burn.
- Tests: engineering/development/tour tests, physics/EDL regressions and all-mission browser smoke pass, zero errors. Added career-lock UI assertion for the next cumulative smoke.
- Phase 4 implemented; tech budgets, unlock thresholds and ion hardware are game models. Next: NASA data snapshots and assets.

## Phase 5.1 - DONKI loader and honest fallback
- Requested API URL returned 404. NASA documentation confirms the September 2026 DONKI migration; the replacement CCMC endpoint was unreachable here, and legacy endpoint timed out.
- Saved query URLs, UTC fetch timestamp, failure reason and an empty events list to data/donki-flares.json. No flare records were fabricated.
- Added a validating snapshot loader and reload function. Available records label event class/date as historical context; local radiation and damage remain simulated. Empty/unavailable data uses a clearly labelled simulated particle storm.
- Tests: models, full regressions and all-mission smoke pass with zero errors, including career UI lock. TODO: fetch a real curated DONKI snapshot when the service is reachable. Next: NASA models.
