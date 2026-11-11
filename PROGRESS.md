# Geodesic night build

## Step 0 - baseline and verification

- Baseline already committed as c5c5a64; origin/main is configured and pushed.
- Read AGENTS.md, CODEX_PROMPT.md and the single game file before edits.
- Added Node physics extraction tests; historical values pass, Lambert endpoints agree within 1 km, optimizer passes 3/4 fixed seeds (7, 31, 101; seed 2026 remains unsafe).
- Browser smoke covers all five missions and Voyager 2, including Jupiter auto-tune and PNG generation. Playwright is a dev-only dependency under tests/.

## Section map (starting state)

| Section | Lines | Main functions |
| --- | --- | --- |
| 1. ASTRODYNAMICS ENGINE | 202-296 | ephemPos, ephemVel, stC, stS, lambert, propagate, captureDv, evalRoute, hohmann, hohT, tofRange, routeScore, tuneDE, polish |
| 2. MISSION DATA (simplified engineering models, real physics laws) | 297-396 | routeInfo, compute |
| 3. SOUND (synthesized with Web Audio, no files) | 397-420 |  |
| 4. RENDERER + TOON LOOK (cel shading with ink outlines) | 421-465 | OUT, smoothGeo, toonMat, mk, ctex, sprite, planetTex |
| 5. EARTH SCENE: desert spaceport at golden hour | 466-521 |  |
| 6. BUILDERS: spacecraft and rockets assembled from the player's choices | 522-614 | buildCraft, buildRocket, rebuildModels, emit, stepParticles, puff, burst, stepFireball |
| 7. SPACE SCENE: real solar system (JPL elements) or Earth-Moon system | 615-707 | buildGrid, labelSprite, planetMesh, clearDyn, setWells, setupHelio, drawRoute, placeHelio, helioState, kepler, setupMoon, moonCraft, placeMoon |
| 8. CAMERA RIG (drag rotate, scroll zoom, smooth) | 708-722 | fit, placeCam |
| 9. GAME STATE + DESIGN UI | 723-817 | setPhase, defaults, jdBounds, evalCfgRoute, initDirectRoute, updateKPIs, group, renderPanel, onDesign, designChecks, updateDesignUI, startMission, startDesign, goBrief |
| 10. ROUTE PLANNER (the core): flybys, dates, launch-window map, auto-tune | 818-917 | startLegend, startRoute, legDefault, renderRoutePanel, routeChanged, refreshRoute, drawPork, renderFlybys, fuelStats, renderSummary, navButtons, wireNav, autoTune |
| 11. LAUNCH (success or a dramatic failure) | 918-957 | resetLaunchScene, doLaunch, legendResult, banner, updateLaunch, updateFail, endLaunch |
| 12. CRUISE: replay the real trajectory, flyby cinematics, events | 958-1055 | startHelioCruise, startMoonCruise, buildSpeeds, setView, hudRows, updateViewFX, updateCruise, updateMoonCruise, crashFlyby, arrive, updateOps, pickEvents, openEvent |
| 13. REPORT + SHAREABLE MISSION PATCH | 1056-1120 | showReport, makePatch |
| 14. FLIGHT SCHOOL (guided tutorial) | 1121-1144 | tutShow, tutEvent |
| 15. LOOP | 1145-1165 | frame |

## Phase status

- Step 0: done; Node and browser checks pass.
- Phase 1: done - conic cinema, split vectors, aiming, historical ghost.
- Phase 2: done - chase, burns, eclipse/conjunction, capture/aerobraking.
- Phase 3: done - mission types, sites, EDL and surface operations.
- Phase 4: done - roles, schedule, delayed commands, moon tours and career.
- Phase 5: done with documented DONKI/New Horizons availability fallbacks.
- Phase 6: done - phone sheets, touch/keyboard, loading, reduced motion and README.

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

## Phase 5.2 - official NASA spacecraft assets
- Downloaded Voyager, Juno and Cassini GLBs from nasa/NASA-3D-Resources with provenance in data/nasa-models.json. Voyager 2 Legendary mode now loads the real asset and overrides materials with the existing toon gradient.
- Added official r170 GLTF/Draco addons, geometry budget, normalized scale, cache and procedural fallback. Shared model geometry survives scene disposal.
- Tests: full physics/models and all-mission smoke pass; an additional Voyager-only run asserts the NASA asset actually loads, flies aiming/cinematics and reaches report with zero errors.
- Availability TODO: New Horizons has STL printing parts but no GLB in the inspected official repository; procedural model retained. Juno/Cassini assets are available for the Sources reference viewer next. Missing asset folders retain gameplay via procedural fallbacks.

## Phase 5.3 - Sources and Assumptions
- Added brief/report access to linked NASA/JPL mission, planet, moon, atmosphere, geology, flare and model sources. Separate Game model lines cover all hardware/resource values and scientific approximations.
- Added NASA Voyager/Juno/Cassini reference viewer with original-geometry credits and toon overrides. Source modal stacking and return to brief/report are tested.
- Route summary warns when dates extrapolate the JPL Table 1 validity range.
- Tests: full model/physics/all-mission smoke passes; targeted source UI plus actual Juno/Cassini decode/view/close and Voyager flight pass with zero errors. Next: live validation table.

## Phase 5.4 - live model validation
- Sources now runs six historical/solver checks in the browser and displays model values, reference values, tolerances and PASS/FAIL.
- Optional four-seed optimizer check runs the same safe Jupiter-capture acceptance target as Node, with visible per-seed results.
- Tests: all six live browser rows pass; models, EDL, historical regressions and all-mission smoke pass with zero errors.
- Phase 5 complete using the authorized DONKI/New Horizons availability fallbacks above. Next: phone layout, shortcuts, loading and README.

## Phase 6 - responsive controls and loading
- At 390 px, Parts/Plan, Review/Summary and Crew become selectable bottom sheets. Touch aiming/camera gestures remain available and panels no longer overlap.
- Added visible keyboard focus, responsive flyby/HUD panels, initial flight-systems loading screen and model download progress. Reduced-motion CSS disables animations/transitions; flyby duration is shortened and camera shake suppressed.
- Tests: full models/physics/all-mission smoke passes; dedicated 390x844 browser run switches all three sheets, verifies no horizontal overflow, captures a screenshot and flies Voyager 2 with zero errors.
- Next: keyboard help, README, final audit and final night-build commit.

## Phase 6 - keyboard controls and optimizer audit
- Added ? help with focus return, Escape, C, N/E, Space pause, S skip, M sound and T auto-tune. Added two-finger touch zoom alongside one-finger rotation.
- Audit fixed optimizer candidate ranking: it now scores rounded playable dates and prefers safe candidates. Jupiter smoke uses a repeatable seed and rejects unsafe routes.
- Tests: all physics/EDL/engineering checks and full mission smoke pass. Combined mobile/reference suite passes, including actual career award persistence across reload, next-mission unlock, NASA assets, moon tour, aiming and Skip; zero browser errors.
- Next: README, final source-map refresh and final verification under a GitHub Pages-style subpath.

## Final audit and verification

- Added README with run/test instructions, gameplay, sources, credits, Pages hosting and explicit model limits.
- Final polish corrects powered deceleration/rejoin plume vectors, animates aerobraking eccentricity one dip at a time and gives surface vehicles visible wheels/landing legs.
- Scene cleanup now disposes removed geometry, materials and owned label textures while preserving shared outline/grid/NASA resources. Particle and model vertex limits remain bounded.
- Current automated checks: historical and conic geometry; three safe optimizer seeds out of four; <1 km Lambert residuals; aiming changes and crash aim; guided Moon/Mars soft landings; engineering/autonomy/schedule; feasible local moon tour.
- Browser coverage: all missions and Voyager 2 to reports, four-role launch gate, development selection, career save/reload/unlock, source/model table, NASA models, aiming changes, skip, chase/burn, Saturn tour, phone sheets and no horizontal overflow.
- Final expanded smoke also exercises Mars aerobraking, reduced motion and a /geodesic project subpath. Result recorded below after completion.
- Remaining external availability tasks: obtain real DONKI records when the migrated service responds; obtain an official assembled New Horizons GLB if one becomes available. Current fallbacks are labelled and playable.
- Performance limitation: 60 fps remains a hardware target; headless SwiftShader is not representative of a mid-range laptop GPU. No hardware frame-rate claim is made.

## Current section map

| Section | Lines | Main functions |
| --- | --- | --- |
| 1. ASTRODYNAMICS ENGINE | 257-411 | ephemPos, ephemVel, stC, stS, lambert, propagate, captureDv, evalRoute, hohmann, hohT, tofRange, routeScore, tuneDE, polish, flybyConic, conicPoint, aimSolution, shadowCylinder, conjunctionAngle, captureOrbitPoint, fuelLoad, fuelMass, availableImpulse, spendImpulse, makeLaunchStages, stepLaunchStages, captureState, partialVelocity, assessEncounter, stepEDL, moonState, evalMoonTour |
| 2. MISSION DATA (simplified engineering models, real physics laws) | 412-527 | development, routeInfo, compute |
| 3. SOUND (synthesized with Web Audio, no files) | 528-551 |  |
| 4. RENDERER + TOON LOOK (cel shading with ink outlines) | 552-596 | OUT, smoothGeo, toonMat, mk, ctex, sprite, planetTex |
| 5. EARTH SCENE: desert spaceport at golden hour | 597-652 |  |
| 6. BUILDERS: spacecraft and rockets assembled from the player's choices | 653-755 | disposeTree, loadNasaModel, buildCraft, buildRocket, rebuildModels, emit, stepParticles, puff, burst, stepFireball |
| 7. SPACE SCENE: real solar system (JPL elements) or Earth-Moon system | 756-849 | buildGrid, labelSprite, planetMesh, clearDyn, setWells, setupHelio, drawRoute, placeHelio, helioState, kepler, setupMoon, moonCraft, placeMoon |
| 8. CAMERA RIG (drag rotate, scroll zoom, smooth) | 850-868 | fit, placeCam |
| 9. GAME STATE + DESIGN UI | 869-989 | careerUnlocked, techUnlocked, awardCareer, renderCareer, resetTeam, openDevelopment, renderDevelopment, recordRole, renderTeam, setPhase, defaults, jdBounds, evalCfgRoute, initDirectRoute, updateKPIs, group, renderPanel, onDesign, designChecks, updateDesignUI, startMission, startDesign, goBrief |
| 10. ROUTE PLANNER (the core): flybys, dates, launch-window map, auto-tune | 990-1090 | startLegend, startRoute, legDefault, renderRoutePanel, routeChanged, refreshRoute, drawPork, renderFlybys, fuelStats, renderSummary, navButtons, wireNav, autoTune |
| 11. LAUNCH (success or a dramatic failure) | 1091-1123 | resetLaunchScene, doLaunch, legendResult, banner, placeLaunchVehicle, updateLaunch, updateFail, endLaunch |
| 12. CRUISE: replay the real trajectory, flyby cinematics, events | 1124-1129 |  |
| 12.0. LIVE PROPELLANT LEDGER | 1130-1168 | impactSound, fuelMoment, initFuel, fuelBusy, burnEntry, requestBurn, deliverFuel, updateFuel, fuelRequirements, updateFuelHud, renderBurnReport, attitudeImpulseForMass, consumeAttitudeMass, requestAttitudeMass, updateAttitude, cancelPendingBurns, startAttitudeLoss, clearFailureView, prepareCaptureView, closeCaptureView, startCaptureEscape, resolveCorrection, updateSpaceFailure |
| 12.1. PLANET-FRAME FLYBY CINEMATIC | 1169-1255 | triggerBurn, updateBurn, updateEnvironment, setupCaptureOrbit, drawCaptureOrbit, aeroPlan, aeroReadout, openAerobraking, finishAerobraking, toggleCamera, updateChase, startCinematic, drawFlyVectors, updateCinematic, requestPoweredFlyby, requestRejoin, endCinematic |
| 12.2. B-PLANE AIMING (PLANAR SLICE) | 1256-1284 | openAim, changeAim, drawAim, confirmAim |
| 12.3. ENTRY, DESCENT AND SURFACE OPERATIONS | 1285-1308 | startLanding, deployChute, updateLanding, startSurface, updateSurface |
| 12.4. OPTIONAL PLANETARY MOON TOUR | 1309-1434 | openMoonTour, renderMoonTour, tuneMoonTour, drawMoonTour, flyMoonTour, updateMoonTour, skipMoonTour, startHelioCruise, startMoonCruise, buildSpeeds, setView, hudRows, updateViewFX, ensureCruiseBurn, updateCruise, updateMoonCruise, crashFlyby, arrive, resolveCapture, completeArrival, updateOps, loadFlareSnapshot, reloadFlareSnapshot, pickEvents, openEvent, commandDelay |
| 13. REPORT + SHAREABLE MISSION PATCH | 1435-1500 | showReport, makePatch |
| 13.1. SOURCES, ASSUMPTIONS AND NASA REFERENCE VIEWER | 1501-1540 | openSources |
| 13.2. LIVE MODEL CHECKS | 1541-1551 | runModelChecks, renderModelChecks, previewReference |
| 14. FLIGHT SCHOOL (guided tutorial) | 1552-1574 | tutShow, tutEvent |
| 14.1. KEYBOARD HELP AND ACCESSIBLE CONTROLS | 1575-1587 | showShortcuts, closeShortcuts |
| 15. LOOP | 1588-1608 | frame |

Final expanded smoke PASS: all five missions completed flight/operations to reports, Voyager 2 NASA model/aiming/cinematic/chase passed, Saturn tour and Mars aerobraking passed, career persisted across reload, all 390 px sheets and reference viewers worked under /geodesic with reduced motion, and a separate overloaded lunar launch failed as expected. Zero console/page errors. Final targeted Voyager/chase recheck also passed. README and phase status are current; all authorized implementation phases are complete with the two documented data availability fallbacks and hardware frame-rate measurement outstanding.

Final model decision: chase uses the articulated engineering spacecraft so Sun/Earth pointing remains functional; NASA Voyager geometry is retained in map/flyby views and all downloaded models in the reference viewer.

## Live propellant - Part 1: shared tanks and gauge
- Added separate chemical, xenon and attitude loads. Main burns consume mass with the rocket equation using current total spacecraft mass; finite delivery is independent of frame partition.
- Persistent kg/loaded-percent tank gauge covers ascent, cruise, capture, aerobraking decisions, descent and operations. Low warning compares chemical fuel with outstanding planned burns.
- Connected cruise TCM, aim/rejoin, powered flybys (including Skip), capture, orbit lowering, moon-tour and anomaly burns; descent draws from the same chemical tank instead of a fresh impulse allowance.
- Burn rows retain planned/delivered delta-v, kilograms and depletion moment. Physical failure routing and attitude consumption follow in Parts 3-4; stage propellant follows in Part 2.
- Sources label tank allocations and compressed burn durations as game models; rocket equation links NASA Glenn.
- Tests: fuel conservation, partition independence, empty-tank bounds and separate xenon pass; engineering, historical regressions and all-mission browser smoke pass with zero errors.

## Live propellant - Part 2: launch stages
- Added equivalent booster/core tanks with separate kg/% bars. Stage mass flow scales with payload demand/capacity ratio; computed burnout time and altitude replace the fixed five-second failure trigger.
- Ascent integrates rocket-equation impulse on current vehicle/stage mass and altitude-dependent Earth gravity. Exhaustion stops thrust; failed vehicles retain their velocity and follow ballistic motion until impact. Only impact explodes.
- Stage dry/fuel loads, overload governor and compressed replay are explicit game models, not specifications of named rockets. Report logs stage delivered impulse and burnout time/altitude.
- Tests: heavier overload unit case burns out at 45 s versus 90 s, lower in altitude; ballistic impact passes. New browser tests check animated kg depletion against rocket-equation mass loss, low warning, overload cutoff/impact and report moment. Full engineering/astro and existing all-mission smoke pass. Zero console/page errors.
- Next: physically resolve partial capture and correction burns, then landing/attitude failures.

## Live propellant - Part 3: physical capture and correction failures
- Partial capture now uses delivered impulse and vis-viva specific energy. Bound shortfalls keep the computed eccentric orbit; unbound cases coast on a planet-frame hyperbola, recede with an illustrative tracking fade and report Lost to deep space plus m/s shortfall. No fuel-triggered explosion.
- A partially delivered aiming impulse changes the actual aim factor. Powered flyby/rejoin delivery then determines the actual outgoing velocity. Short rejoin corrections are propagated to the moving next planet; closest approach with patched-conic focusing decides impact versus miss. Only an intersection triggers an impact flash/explosion.
- Skip cannot bypass powered flyby or rejoin fuel. Optional moon tours cannot award science after an undelivered manoeuvre; incomplete orbit lowering retains the actually achieved bound orbit.
- Tests: positive/bound-short/unbound capture energy; partial velocity interpolation; a propagated intercept and a miss. Browser cases exercise capture exhaustion with partial delivery, aim/rejoin shortfall and explicit correction shortfall, alongside gauge and overload cases. Zero console/page errors.
- Existing engineering/astro/all-mission smoke passes. Its deliberate Voyager aim oscillation now correctly spends fuel and can miss Saturn rather than silently refilling the tank. Next: shared-fuel landing cutoff and attitude-control exhaustion.

## Live propellant - Part 4: landing and attitude-control depletion
- Descent integrates delivered thrust impulse from the live tank at each physics substep. Depletion cuts the engine above ground, disables automatic re-ignition, and continues real lunar/Martian gravity (and Mars drag). Only touchdown above the crash/heat threshold triggers the impact animation and explosion.
- A separate 60 s equivalent-Isp attitude reserve pays for pointing/desaturation, aim slews, burn pointing and reaction-wheel backup. Empty reserve cancels thrust commands, produces slow tumble, loses Earth pointing, sets downlink to zero and reports Loss of attitude control. It never explodes simply from depletion.
- Attitude entries are equivalent scalar control impulse, not net translational delta-v. Fuel loads and low warnings distinguish chemical, xenon and attitude tanks; xenon is now sized for its correction on full initial wet mass.
- Dynamic burn shortfalls remain in the outstanding plan, keeping low-fuel warnings honest. Depletion is recorded even when a tank empties exactly at burn completion.
- Added impact-effect telemetry to test that explosions happen only at actual impact. Browser suite verifies all five requested failure paths plus a separate propagated collision, with zero errors. Landing test delivers some thrust before running dry; capture/attitude/miss tests assert no explosion.
- Unit tests verify independent attitude storage and lunar empty-tank free fall. Full existing models/astro and expanded mobile/reduced-motion/aerobraking smoke pass. Next: final documentation and regression audit.

## Live propellant - Part 5: final regression and documentation audit

- README now documents live tanks, equivalent launch stages, partial burns, physically distinct failure outcomes, separate attitude control and the new test commands.
- Capture execution has a planet-centred periapsis close-up with a retrograde plume and live gauge; successful insertion returns to the actually computed orbit. The failed-capture movie keeps a coasting hyperbola.
- A nominal planetary cruise correction removes a labelled simulated navigation offset; under-delivery propagates the residual error. Mars orbit lowering now starts from the actual captured eccentricity, including a partially delivered capture.
- Verified lunar GM against the JPL satellite physical-parameter table (4902.800 km3/s2), replacing the initial approximate literal with an SI engine constant. Planet momentum exchange now uses current wet mass; lunar HUD propellant is live; report launch mass remains the original loaded mass even after hardware damage.
- All eight fuel-browser scenarios pass: live kg animation, overloaded stage burnout, partial capture escape, aim/rejoin starvation, correction miss, descent exhaustion, attitude loss and actual correction impact. Tests verify no explosion for coasting/attitude/miss, and one impact effect at collision.
- Unit checks cover rocket-equation conservation/frame partitioning, tank separation, xenon at launch wet mass, overload timing/altitude, free fall and partial capture/correction geometry. Existing historical and engineering tests remain passing.
- Final expanded mission smoke runs all missions plus Voyager 2, mobile layout, reduced motion and aerobraking under a project subpath. Final completion result is recorded below after the run.
- Scientific assumptions are explicit in Sources: game stage sizing/overload governor, separate tank budgets, equivalent attitude impulse, compressed visual burn time and tracking fade, planar patched-conic encounter assessment. No invented NASA datasets or stage specifications were added.

Live propellant final verification PASS: node tests/fuel.test.mjs, node tests/models.test.mjs, node tests/astro.test.mjs, node tests/fuel-browser.test.mjs, and expanded tests/smoke.mjs with TEST_AERO, TEST_MOBILE, TEST_REDUCED and /geodesic project subpath. All required failure cases and existing tests pass; zero console/page errors. Each implementation part was committed and pushed. No work remains for this feature.

## Real-player bug fixes - Group 1: launch and elapsed time (1-7, 19)
- Launch camera targets follow the rocket immediately; only yaw/pitch/distance are smoothed, and distance widens with altitude. Added read-only projected-bound telemetry and checks on every rendered ascent/fall frame.
- Status advances through liftoff, approximate max-Q region, booster separation, core cutoff and failure. Exhaust particles are spaced along distance travelled. Sky Moon uses the same grey texture and approximately half-degree angular diameter; decorative purple ring removed.
- Explicit equivalent game stage loads retain fixed mass flow/burn time for every payload. Overload reduces delivered impulse; it does not speed up fuel consumption. Pitch approaches horizontal gradually. Stages integrate on fixed 0.05 s physics steps; Sources clearly labels the approximation.
- Launch burn ledger now uses direct kg formatting and distinguishes nominal burnout from exhaustion. Planned nominal impulse is derived from the same staged mass model.
- Removed the 0.05 s render-delta clamp: ordinary slow frames now advance real elapsed time, with a 0.25 s guard only for large gaps.
- Verification at ts(1), using actual UI buttons: Moon orbiter completed Launch-Cruise-Capture-Operations-Report in about 46 s, zero errors, rocket in frame on all 529 sampled launch frames. Overloaded Moon vehicle reached ballistic impact/report with 691 in-frame launch/fall samples and zero errors. Screenshots saved in tests/shots/. Astro/fuel regressions pass; overload unit test now requires unchanged burn time and lower delivered impulse.
- Next: report outcome bars, reaction-wheel accounting, modal layering and solo report wording.

## Real-player bug fixes - Group 2: outcome/report/fuel UI (8-11)
- Failed landing, collision and lost-spacecraft outcomes now zero the science/instruments/lifetime report bars instead of displaying nominal subsystem percentages.
- Reaction-wheel recovery charges only the separate attitude tank. Removed the old 3% main-tank charge and changed option/result text to match the 12% attitude-reserve ledger entry.
- Fuel HUD is below modal backdrops. Solo reports omit four-role contribution boilerplate; multi-player reports retain it.
- Verification at ts(1), actual UI: unassisted Moon lander reached an impact report with all three bars at 0%; Moon orbiter completed a normal mission. Modal stacking, absence of a main-tank wheel burn, solo wording, nominal-burnout label, kg bounds and planned/delivered launch impulse are asserted. Both runs had zero console errors, with 537 and 532 in-frame launch samples respectively. Screenshots in tests/shots/.
- The intentionally unassisted descent also confirms the reported short play window; guidance/timing/EDL presentation are the next group.

## Real-player bug fixes - Group 3: capture and descent (12-18)
- Capture now has a visible 3.5-10 second burn, enlarged craft and a one-line explanation. Retrograde thrust slows the vehicle; exhaust physically points forward. Landing resets the capture HUD, instructions and guidance button state.
- EDL now accumulates fixed 0.05 s physics steps, including landing pointing consumption. Guidance uses fixed engine force divided by current wet mass and stopping distance; propellant depletion still cuts thrust and leaves a gravity-driven descent.
- The replay scale is computed from the same guided physics and initial tank state to give approximately 32 seconds at ts(1). This changes presentation time, not gravity, impulse or mass loss. Added the requested timeline, legged lander, terrain, altitude/speed gauges and mission-specific instructions; lunar controls omit parachute text/button.
- Cruise HUD explicitly shows decision pauses and burns in progress. Sources explains the simplified shallow Mars entry, force rating, fixed physics step and compressed replay.
- Actual UI play at ts(1): Moon lander and Mars rover both passed Launch -> Cruise -> Capture -> Landing -> Operations -> Report with zero console errors. Guided descent lasted 32.14 / 32.38 seconds; visible capture lasted 4.38 / 3.42 seconds. Every rendered launch sample remained in frame (534 / 539 samples). Screenshots saved in tests/shots/.
- New tests/edl-fixed.test.mjs compares exact terminal states and remaining mass at ts 1, 6 and 40 across 5-77 fps: both bodies soft-land identically. Astro, engineering, fuel and all eight propellant browser scenarios pass; updated the old launch-failure text assertion to the new explicit Fuel exhausted wording.
- Next: normal-speed Jupiter, Saturn and Voyager 2 playthroughs, then final regression/documentation checks.

## Found during playthrough
- The unassisted lunar playthrough reached impact before a useful control window; corrected the replay timing and guidance in Group 3.
- Mars used the entire 5.5 km/s entry speed vertically, leaving heavier wet vehicles too little braking distance even with fuel. Corrected the explicitly labelled game entry geometry to a shallow 12-degree path until slowed, then vertical powered descent. The normal-speed Mars rover now lands successfully.
- The guidance button retained its enabled caption on a later mission; reset it on every landing.
