# Current visual validation — dense reference study

The current default has **2,400 irregularly distributed openings**, deeper narrow channels, and thin stone dividers. The mesh uses marching cubes at 256 samples per axis. The reference photo remains the visual target; this is a procedural approximation, not an inferred reconstruction of the unseen interior.

Selenium successfully launched Chrome after sandbox permissions changed. Seven intermediate density/shape screenshots were reviewed and rejected or refined before the final review. The final review captured and inspected the default, close-up, rotated, unshaded wireframe, wet stone, sleeve, profile, and mobile views. The earlier browser-blocked notes below are historical and superseded.

- Browser console: **no errors or warnings** (`browser-console.json`).
- Controls: zoom, orbit, wireframe toggle/restoration, wet finish, sleeve guides, 2D profile synchronization, parameter update, and mobile viewport all passed.
- Default fine mesh ready: **18.96 seconds** on the test machine; a draft appears first.
- First visible preview after a parameter change: **1.03 seconds** in the measured update.
- Geometry tests: all 2,400 mouth samples open; deep channel lengths; no broad chamber detected in the sampled interior; approximately 40.4% of the starting stone volume removed.
- Scheduler tests: immediate dispatch, latest-value queuing, refinement, cancellation, stale-result rejection, and native browser timer binding pass.

Latest screenshots: `final-stone.png`, `final-closeup.png`, `final-rotated.png`, `final-wireframe.png`, `final-wet.png`, `final-sleeve.png`, `final-profile.png`, `final-mobile.png`, and `final-app.png`.

## Historical checks (older model revisions)

# Validation

- JavaScript syntax checks passed for app.js, model.js, and mesh-worker.js.
- `node tests.mjs` passed: deterministic positive periodic profiles, solid/void subtraction, finite geometry, outward triangle winding.
- Default 84-grid specimen: 189,788 triangles, approximately 0.42 seconds to mesh on the local machine.
- Additional solid, extreme-density, and fine-resolution geometry checks completed. Extreme density can remove the entire solid; the UI reports this and suggests reducing radius or passage count.
- Browser visual/integration testing was attempted but blocked: the installed Browser runtime refers to a missing browser-service module version, and the fallback Chrome process could not launch in this environment. No screenshots or visual verification are claimed.
- `browser-check.mjs` is an optional integration test for a development environment with Puppeteer installed; it exercises modes, material switching, shared 2D controls, and mobile layout.

## Distinct-opening revision

Replaced three overlapping grids of through-tubes with surface-distributed, finite-depth bores. Mouth spacing limits radial envelopes to retain solid rims; bores have rounded ends and a solid core remains. Default sampled removal fell from 70.5% to 14.2%. Updated default mesh: 161,308 faces, approximately 0.35 seconds. Regression tests verify every one of 108 mouth centers is open, the core stays solid, and removed volume remains below 25%. Browser appearance has not been reverified because of the previously documented tooling limitation.

## Continuous-channel revision (supersedes the solid-core assumption)

Replaced finite-depth surface burrows with continuous, gently wandering channels through the body, including the center. Channel envelopes remain disjoint throughout their length, not only at their mouths. There is no imposed solid core and no rounded blind end. This is a modeling hypothesis for the unseen interior, with predominantly aligned channels.

Default mesh detail increased from 84 to 120 samples per axis to resolve smaller openings and walls. `node tests.mjs` passes: 108 channels remain open along sampled interior paths, all envelopes are pairwise separate, and sampled removed volume is 11.4%. Separation also holds at maximum radius, irregularity, and drift for three tested seeds. No browser visual verification is claimed.

## Live controls and closer spacing

- Parameter input starts a draft mesh immediately; ongoing previews finish rather than being starved by rapid input. New settings replace queued settings. Slider release triggers final refinement; a 240 ms idle timer handles other edits.
- New edits cancel an expensive final build. Late results from cancelled workers are ignored. Leaving stone mode cancels pending work.
- Removed iframe synchronization echoes that could send stale parameter values back to the parent.
- Radius now approaches its safe upper limit smoothly instead of silently clamping.
- Default passage count increased from 108 to 156; envelope spacing tightened while keeping pairwise channel separation. A top-level Wireframe toggle mirrors the Surface selector.
- `npm test` passes geometry and live-scheduling regression checks, including increasing radius, continuous separated channels, immediate preview dispatch, latest-value queuing, refinement, and cancellation.
- Default preview mesh generation measured about 307 ms at resolution 72. Browser interaction and rendered appearance remain unverified due to the previously documented environment limitation.

## Startup timer fix

The live-update scheduler stored native browser timers as object methods, causing a browser receiver error before the initial worker could start. Defaults now call timers explicitly on globalThis. A new regression reproduced the invalid receiver before the fix and passes after it; it also verifies dispatch reaches the initial mesh request. Existing geometry and scheduler tests pass. The page now reports uncaught startup errors rather than leaving “Preparing specimen…” indefinitely. App and scheduler URLs were versioned to avoid reusing the faulty cached modules. Full browser verification remains unavailable in this environment.
