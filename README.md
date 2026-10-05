# Wormstone form lab

An interactive study of a standalone porous stone, built upon `random-curve-lab.html`. The reference is the user's `IMG_1925.jpeg`.

Run `python3 -m http.server 8000` here and open http://localhost:8000. Dependencies are bundled locally; no installation, CDN, or API key is needed. HTTP is required for JavaScript modules and workers. The original 2D lab also opens directly as an offline file.

- **2D profile:** original seeded Fourier radial curve, synchronized with the shared controls; SVG export.
- **3D sleeve:** a thick-walled open tube with optional stacked slice guides.
- **3D stone:** 2,400 irregularly distributed openings by default, with channels extending deeply inward in varied directions. A nearest-channel partition retains thin stone dividers and prevents neighboring voids from merging into chambers.
- **Views:** unlit vertices/wireframe, clay, dry limestone, and wet stone. The Wireframe button above the view restores the previous finish when toggled off.
- Orbit, zoom, pan, turntable, three lighting presets, exposure, reset, and PNG export.

The shape is a geometric approximation, not a biological or erosion simulation or a reconstruction of the unseen interior. Channels have varied lengths and can terminate at dividers or inside the stone. No uniform solid core is imposed. Surface color and grain are procedural. Scale is arbitrary.

The default uses 256 samples per axis; fine detail uses 288. Refinement can take around 20 seconds depending on the machine. An initial draft appears first. Dense models use a 112-grid live preview while dragging (72 for lower counts); these can temporarily omit very small holes. On release or after 240 ms idle, the selected detail is rebuilt. New edits interrupt an expensive refinement and prioritize previews. The status distinguishes previews from completed meshes.

`model.js` contains seeded profiles, spatially indexed channel geometry, and marching-cubes extraction. `mesh-worker.js` generates geometry off the UI thread; `mesh-updates.js` handles previews and refinement. Three.js 0.183.2 and its marching-cubes lookup tables are vendored under MIT (`vendor/THREE-LICENSE.txt`).

## Validation

Run `npm test` for geometry and live-update regressions.

With Selenium, Chrome, and a matching driver installed, run:

```sh
CHROMEDRIVER=/path/to/chromedriver python3 validation/selenium-review.py
```

The local server must already be running. The review captures the default, close-up, rotated, wireframe, wet, sleeve, profile, and mobile views, checks slider updates, and writes console logs to `validation/browser-console.json`. `final-*.png` are the latest review artifacts; `density-pass-*.png` show earlier iterations.

Additional visual references: https://natureinfocus.blog/2016/05/02/stones-with-holes-made-by-wrinkled-rock-borers-other-seashore-creatures/ and https://www.beachexplorer.org/en/species/pholadidae-locher/description . The model does not infer an organism or mineral composition from a photograph.
