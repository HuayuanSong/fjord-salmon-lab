# Fjord — A living systems lab

A visual, browser-only salmon-farm simulation. Explore a year of fish growth, sea-lice development and hypothetical interventions through an animated sea cage, a scrubbable timeline and comparison curves.

## Run locally

Requires Python 3. No dependency installation or build is needed.

```sh
cd /Users/huayuansong/Documents/git/salmon-lab
python3 -m http.server 4387 --bind 127.0.0.1 --directory dist
```

Open **http://127.0.0.1:4387/**. Keep the terminal running; press Ctrl+C to stop it. If that port is occupied, change `4387` in both the command and the address. Serve the files over HTTP rather than opening `index.html` directly, because the app uses JavaScript modules and a module worker.

With Node.js installed, `npm start` runs the same server. `npm test` checks model invariants and intervention behavior, and `npm run check` checks JavaScript syntax.

## Explore

- Four starting stories: no parasites, parasite introduction, an intervention, and warmer water.
- Play, pause, rewind or scrub through days 0–365. Changes recalculate the same season.
- Reveal magnified parasite marks; move arrival and intervention dates; compare repeated pulses.
- Change food, seasonal temperature, stock size, growth equation, outside infestation pressure and assumed treatment efficacy.
- Compare your scenario with the same conditions without intervention, and a parasite-free reference.
- Inspect an illustrative sensitivity envelope and export daily results with the selected parameters as CSV.

On phones, **Adjust temperature & events** expands the detailed controls. **How to explore** explains the interactions; **Model notes** documents equations, coefficients and limitations.

## Hosting

Everything required to run the app is in `dist/`, including `.nojekyll`. Asset and worker paths are relative, so it can run under a GitHub Pages project subpath. There is no backend, API key, external font, paid model API or database. A Web Worker calculates the scenarios, with a synchronous fallback.

For GitHub Pages, put the **contents** of `dist/` at the root of a dedicated Pages repository and configure Pages to publish that branch's root folder. Alternatively, use a Pages workflow that uploads `dist/` as its artifact. See [GitHub Pages documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). This project has not created or published a GitHub repository.

`.openai/hosting.json` configures the separate Sites preview. It is not needed by GitHub Pages.

## Scientific scope

**An educational prototype with illustrative, uncalibrated parameters. It is not a validated farm forecast or treatment recommendation.** No actual farm observations are included, and the coefficients are not estimates extracted from the linked research.

The deterministic model follows one stocked cohort through 365 daily steps. Fish grow without reproducing; their number declines through background mortality, a hypothetical parasite penalty and intervention losses. Biomass is always calculated from surviving fish count and mean weight. Three growth choices are available: a temperature-driven cube-root update, Gompertz and von Bertalanffy. The last two do not depend directly on temperature.

The reduced parasite life cycle tracks an effective free-swimming pool, attached juveniles, mobile stages and adult females. Exponential competing-risk transfers keep counts nonnegative. Adult males are omitted and fertilization is assumed available. Recruitment combines early survival and local return, rather than representing measured egg production. Attached lice leave proportionally when fish die. Displayed lice counts are adult females per living fish.

Interventions are hypothetical stage-specific pulses. They leave the free-swimming pool, cause a small immediate fish loss and temporarily reduce growth. No named medicine, procedure or regulatory threshold is modeled. Four alternative parameter sets illustrate sensitivity; the shaded envelope is not a confidence interval. The animation shows a representative school, not an individual-based simulation. Parasite marks are magnified.

Missing mechanisms include oxygen, salinity, currents, harvesting, genetics, resistance, other diseases and farm connectivity. Model notes in the app contain the exact numerical assumptions. The implementation is in `dist/model.mjs`.

### Research context and potential future data

- [SLIM: staged sea-lice population models](https://slim.readthedocs.io/en/latest/model.html)
- [FishMet: fish appetite and growth modeling](https://fishmet.uib.no/)
- [Research on mortality following delousing](https://pubmed.ncbi.nlm.nih.gov/33606885/)
- [BarentsWatch Fish Health API](https://developer.barentswatch.no/docs/fishhealth/)

These sources provide context and possible directions for a later calibrated model. This is an independent educational implementation, not an implementation or endorsement of those tools. A forecasting version would need suitable observations, parameter calibration, held-out evaluation, baseline comparisons and uncertainty validation.

## Project structure

| File | Purpose |
| --- | --- |
| `dist/index.html`, `dist/style.css` | Accessible controls and responsive interface |
| `dist/model.mjs` | Pure simulation, presets and sensitivity runs |
| `dist/worker.mjs` | Background computation |
| `dist/scene.mjs` | Canvas illustration, with reduced-motion support |
| `dist/app.mjs` | Playback, chart, dialogs and CSV export |
| `test/model.test.mjs` | Numerical invariants and behavior checks |
