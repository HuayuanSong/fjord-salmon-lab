import { SimulationRunner } from "./simulation-runner.mjs";
import { describeDay, seasonLabel } from "./presentation.mjs";
import { DIALOG_CONTENT } from "./dialog-content.mjs";
import {
  DEFAULTS,
  PRESETS,
  normalize,
  DAYS,
  treatmentDays,
  PARAMETER_LIMITS,
  GROWTH_MODELS,
} from "./model.mjs";
import { OceanScene } from "./scene.mjs";
const $ = (id) => document.getElementById(id);
const ADVANCED_FIELDS = [
  "growth",
  "fish",
  "weight",
  "method",
  "efficacy",
  "pressure",
];
const numberFormatter = new Intl.NumberFormat("en-GB");
let parameters = { ...DEFAULTS },
  selectedPreset = "response",
  day = 0,
  playing = false,
  speed = 30,
  lastPlaybackTime = 0,
  pendingDays = 0,
  metric = "B",
  showLice = false,
  data = null;
const scene = new OceanScene($("ocean"));
const simulation = new SimulationRunner((result) => {
  data = result;
  $("download").disabled = false;
  document.querySelector(".main-lab").setAttribute("aria-busy", "false");
  renderResults();
});
function run() {
  parameters = normalize(parameters);
  syncControls();
  $("download").disabled = true;
  document.querySelector(".main-lab").setAttribute("aria-busy", "true");
  $("status").textContent = "Recalculating the scenario.";
  simulation.request(parameters);
}
function renderResults() {
  renderMarkers();
  renderChart();
  renderTakeaway();
  $("status").textContent =
    "Scenario recalculated. All results are illustrative.";
}
function syncControls() {
  for (const k of ["warming", "seedDay", "treatmentDay"])
    $(k).value = parameters[k];
  $("feed").value = Math.round(parameters.feed * 100);
  for (const k of ["infestation", "treatment", "repeat"])
    $(k).checked = parameters[k];
  $("warming-value").textContent =
    parameters.warming === 0
      ? "Typical season"
      : `${parameters.warming > 0 ? "+" : ""}${parameters.warming.toFixed(1)}°C`;
  $("feed-value").textContent = `${Math.round(parameters.feed * 100)}%`;
  for (const k of ["seedDay", "treatmentDay"])
    $(k + "-value").textContent = `Day ${parameters[k]}`;
  $("lice-settings").hidden = !parameters.infestation;
  $("treatment-settings").hidden = !parameters.treatment;
  document.querySelectorAll("[data-preset]").forEach((button) => {
    const on = button.dataset.preset === selectedPreset;
    button.classList.toggle("active", on);
    button.setAttribute("aria-pressed", String(on));
  });
  $("scene-title").textContent =
    PRESETS[selectedPreset]?.name || "Your own experiment";
}
function choosePreset(key) {
  selectedPreset = key;
  parameters = { ...PRESETS[key].values };
  day = 0;
  pause();
  run();
}
document
  .querySelectorAll("[data-preset]")
  .forEach((button) =>
    button.addEventListener("click", () => choosePreset(button.dataset.preset)),
  );
for (const k of ["warming", "seedDay", "treatmentDay"])
  $(k).addEventListener("input", (e) => {
    parameters[k] = Number(e.target.value);
    run();
  });
$("feed").addEventListener("input", (e) => {
  parameters.feed = Number(e.target.value) / 100;
  run();
});
for (const k of ["infestation", "treatment", "repeat"])
  $(k).addEventListener("change", (e) => {
    parameters[k] = e.target.checked;
    run();
  });
$("toggle-settings").addEventListener("click", () => {
  const open = $("toggle-settings").getAttribute("aria-expanded") !== "true";
  $("toggle-settings").setAttribute("aria-expanded", String(open));
  $("toggle-settings").querySelector("span").textContent = open ? "−" : "+";
  $("season-settings").classList.toggle("expanded", open);
});
$("reset-settings").addEventListener("click", () =>
  choosePreset(selectedPreset),
);
function pause() {
  playing = false;
  $("play-icon").textContent = "▶";
  $("play-label").textContent = day >= DAYS ? "Replay" : "Play season";
  $("play").setAttribute(
    "aria-label",
    day >= DAYS ? "Replay the season" : "Play the season",
  );
}
$("play").addEventListener("click", () => {
  if (playing) pause();
  else {
    if (day >= DAYS) {
      day = 0;
      renderDay();
    }
    playing = true;
    pendingDays = 0;
    lastPlaybackTime = performance.now();
    $("play-icon").textContent = "Ⅱ";
    $("play-label").textContent = "Pause";
    $("play").setAttribute("aria-label", "Pause the season");
  }
});
$("rewind").addEventListener("click", () => {
  day = 0;
  pause();
  renderDay();
});
$("speed").addEventListener("change", (e) => (speed = Number(e.target.value)));
$("time").addEventListener("input", (e) => {
  day = Number(e.target.value);
  pause();
  renderDay();
});
$("jump-end").addEventListener("click", () => {
  day = DAYS;
  pause();
  renderDay();
  $("ocean").scrollIntoView({
    behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "instant"
      : "smooth",
    block: "center",
  });
});
$("show-lice").addEventListener("click", () => {
  showLice = !showLice;
  $("show-lice").setAttribute("aria-pressed", String(showLice));
  $("show-lice").querySelector("span").textContent = showLice
    ? "Hide the parasites"
    : "Reveal the parasites";
  renderDay();
});
function tick(now) {
  requestAnimationFrame(tick);
  if (!playing || !data) {
    lastPlaybackTime = now;
    return;
  }
  if (document.hidden) {
    lastPlaybackTime = now;
    return;
  }
  pendingDays += Math.min((now - lastPlaybackTime) / 1000, 0.1) * speed;
  lastPlaybackTime = now;
  if (pendingDays >= 1) {
    day = Math.min(DAYS, day + Math.floor(pendingDays));
    pendingDays %= 1;
    renderDay();
    if (day === DAYS) pause();
  }
}
requestAnimationFrame(tick);
function renderDay() {
  if (!data) return;
  const record = data.main[day];
  $("time").value = day;
  $("day-number").textContent = day;
  $("temperature").textContent = record.T.toFixed(1);
  $("season-name").textContent = seasonLabel(day);
  $("fish-count").textContent = numberFormatter.format(Math.round(record.N));
  $("survival").textContent =
    `${((100 * record.N) / data.p.fish).toFixed(1)}% of the original school`;
  $("fish-weight").innerHTML = `${(record.W / 1000).toFixed(2)} <i>kg</i>`;
  $("biomass").innerHTML = `${record.B.toFixed(1)} <i>t</i>`;
  $("lice-count").textContent = record.lice.toFixed(2);
  $("scene-caption").textContent = describeDay(
    record,
    data.untreated[day],
    data.p,
  );
  scene.initialFish = data.p.fish;
  scene.update(record, showLice);
  const line = $("cursor-line");
  if (line) {
    const x = chartX(day);
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    $("cursor-dot").setAttribute("cx", x);
    $("cursor-dot").setAttribute("cy", chartY(value(record)));
  }
}
function renderMarkers() {
  const parameters = data.p;
  const markers = treatmentDays(parameters).map(
    (day) =>
      `<span class="event-marker treatment" style="left:${(day / DAYS) * 100}%" title="Intervention on day ${day}"></span>`,
  );
  if (parameters.infestation)
    markers.push(
      `<span class="event-marker" style="left:${(parameters.seedDay / DAYS) * 100}%" title="Lice introduced on day ${parameters.seedDay}"></span>`,
    );
  $("event-markers").innerHTML = markers.join("");
}
const METRICS = {
  B: { name: "Biomass", decimals: 0, unit: "tonnes" },
  lice: { name: "Adult female lice", decimals: 2, unit: "per fish" },
  W: { name: "Mean fish weight", decimals: 1, unit: "kg" },
  N: { name: "Survival", decimals: 0, unit: "% of initial fish" },
};
function value(record) {
  if (metric === "W") return record.W / 1000;
  if (metric === "N") return (record.N / data.p.fish) * 100;
  return record[metric];
}
let yMax = 1,
  chartWidth = 780;
function chartX(day) {
  return 43 + (day / DAYS) * (chartWidth - 68);
}
function chartY(value) {
  return 182 - (value / yMax) * 153;
}
function renderChart() {
  if (!data) return;
  chartWidth = Math.max(300, $("chart").clientWidth);
  let max = 0;
  for (const series of [data.main, data.untreated, data.clean]) {
    for (const record of series) max = Math.max(max, value(record));
  }
  const bandOn = $("show-band").checked && ["B", "lice"].includes(metric);
  if (bandOn)
    max = Math.max(
      max,
      ...data.band.map((b) => (metric === "B" ? b.Bmax : b.Lmax)),
    );
  yMax =
    metric === "N" ? 100 : Math.max(metric === "lice" ? 0.1 : 1, max * 1.12);
  const path = (rows) =>
    rows
      .map(
        (record, i) =>
          `${i ? "L" : "M"}${chartX(record.day).toFixed(2)},${chartY(value(record)).toFixed(2)}`,
      )
      .join("");
  let svg = `<svg viewBox="0 0 ${chartWidth} 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><title>${METRICS[metric].name}: simulated full-season comparisons</title><text x="43" y="14" fill="var(--muted)" font-size="10" font-family="sans-serif">${METRICS[metric].unit}</text>`;
  for (let i = 0; i <= 4; i++) {
    const val = (yMax * i) / 4,
      y = chartY(val);
    const label = val.toFixed(METRICS[metric].decimals);
    svg += `<line x1="43" y1="${y}" x2="${chartWidth - 25}" y2="${y}" stroke="var(--line)" stroke-width="1"/><text x="34" y="${y + 3}" text-anchor="end" fill="var(--muted)" font-size="10" font-family="sans-serif">${label}</text>`;
  }
  for (const d of chartWidth < 480 ? [0, 180, 365] : [0, 90, 180, 270, 365])
    svg += `<text x="${chartX(d)}" y="207" text-anchor="middle" fill="var(--muted)" font-size="10" font-family="sans-serif">Day ${d}</text>`;
  if (bandOn) {
    const bounds = data.band;
    const coords = bounds
      .map(
        (record, i) =>
          `${chartX(record.day)},${chartY(metric === "B" ? record.Bmax : record.Lmax)}`,
      )
      .concat(
        [...bounds]
          .reverse()
          .map(
            (record) =>
              `${chartX(record.day)},${chartY(metric === "B" ? record.Bmin : record.Lmin)}`,
          ),
      );
    svg += `<polygon points="${coords.join(" ")}" fill="var(--chart-band)"/>`;
  }
  for (const [rows, color, dash] of [
    [data.clean, "var(--chart-clean)", "2 5"],
    [data.untreated, "var(--chart-untreated)", "6 5"],
    [data.main, "var(--chart-main)", ""],
  ])
    svg += `<path d="${path(rows)}" fill="none" stroke="${color}" stroke-width="${dash ? 1.8 : 2.8}" stroke-dasharray="${dash}" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  svg += `<line id="cursor-line" x1="48" y1="23" x2="48" y2="186" stroke="var(--chart-main)" stroke-opacity=".45" stroke-dasharray="3 4"/><circle id="cursor-dot" cx="48" cy="182" r="4" fill="var(--chart-main)" stroke="var(--paper)" stroke-width="2"/></svg>`;
  $("chart").innerHTML = svg;
  $("chart").setAttribute(
    "aria-label",
    `${METRICS[metric].name}, full-season simulated comparison. Your scenario ends at ${value(data.main.at(-1)).toFixed(2)} ${METRICS[metric].unit}; without intervention ${value(data.untreated.at(-1)).toFixed(2)}.`,
  );
  $("show-band").disabled = !["B", "lice"].includes(metric);
  renderDay();
}
document.querySelectorAll("[data-metric]").forEach((button) =>
  button.addEventListener("click", () => {
    metric = button.dataset.metric;
    document.querySelectorAll("[data-metric]").forEach((x) => {
      x.classList.toggle("active", x === button);
      x.setAttribute("aria-pressed", String(x === button));
    });
    renderChart();
  }),
);
$("show-band").addEventListener("change", renderChart);
new ResizeObserver(() => {
  if (Math.abs($("chart").clientWidth - chartWidth) > 1) renderChart();
}).observe($("chart"));
function renderTakeaway() {
  const scenarioEnd = data.main.at(-1),
    untreatedEnd = data.untreated.at(-1),
    parasiteFreeEnd = data.clean.at(-1),
    biomassDifference = scenarioEnd.B - untreatedEnd.B;
  if (!data.p.infestation) {
    $("takeaway-title").textContent =
      "Growth and survival tell different stories.";
    $("takeaway-text").textContent =
      `In this model, ${numberFormatter.format(Math.round(scenarioEnd.N))} fish remain and average ${(scenarioEnd.W / 1000).toFixed(2)} kg each. Together they make ${scenarioEnd.B.toFixed(1)} tonnes of biomass.`;
  } else if (!data.p.treatment) {
    $("takeaway-title").textContent =
      "A small parasite can change the whole season.";
    $("takeaway-text").textContent =
      `This scenario ends with ${scenarioEnd.lice.toFixed(2)} adult female lice per fish and ${(parasiteFreeEnd.B - scenarioEnd.B).toFixed(1)} fewer tonnes than the parasite-free reference. Try adding an intervention and compare.`;
  } else {
    $("takeaway-title").textContent =
      biomassDifference >= 0
        ? "A response changes the trajectory."
        : "An intervention also carries a cost.";
    $("takeaway-text").textContent =
      `Your ${scenarioEnd.treatments === 1 ? "intervention" : scenarioEnd.treatments + " interventions"} leads to ${Math.abs(biomassDifference).toFixed(1)} ${biomassDifference >= 0 ? "more" : "fewer"} tonnes than the same conditions without intervention. ${numberFormatter.format(Math.round(scenarioEnd.N))} fish remain. These differences depend on the assumed effects.`;
  }
}
$("download").addEventListener("click", () => {
  if (!data || $("download").disabled) return;
  const metadata = `# Fjord illustrative model v0.1 — uncalibrated, no real farm data\n# Parameters: ${JSON.stringify(data.p)}\n# Sensitivity envelope is not a confidence interval\n`;
  const header =
    "day,fish_alive,mean_weight_g,biomass_t,adult_female_lice_per_fish,temperature_c,interventions,biomass_without_intervention_t,biomass_without_parasites_t";
  const rows = data.main.map((record, i) =>
    [
      record.day,
      record.N.toFixed(2),
      record.W.toFixed(3),
      record.B.toFixed(4),
      record.lice.toFixed(5),
      record.T.toFixed(2),
      record.treatments,
      data.untreated[i].B.toFixed(4),
      data.clean[i].B.toFixed(4),
    ].join(","),
  );
  const url = URL.createObjectURL(
    new Blob([metadata + header + "\n" + rows.join("\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "fjord-illustrative-season.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("status").textContent = "Illustrative scenario exported as CSV.";
});
let lastFocus;
function openDialog(name) {
  pause();
  lastFocus = document.activeElement;
  if (name === "advanced") {
    $("dialog-content").innerHTML =
      `<h2>A little more control.</h2><p>All values describe an illustrative cohort. They are not calibrated farm parameters.</p><div class="dialog-controls"><label>Growth model<select id="adv-growth"></select></label><label>Initial number of fish<input id="adv-fish" type="number" min="1000" max="200000" step="1000"></label><label>Initial mean weight (grams)<input id="adv-weight" type="number" min="50" max="500" step="10"></label><label>Intervention profile<select id="adv-method"><option value="broad">Broad pulse — affects all attached stages</option><option value="adult">Adult-focused pulse — more young stages survive</option></select></label><label class="range-label" for="adv-efficacy">Assumed adult-stage removal<output id="adv-efficacy-value"></output></label><input id="adv-efficacy" type="range" min="0" max="100" step="5"><label class="range-label" for="adv-pressure">Outside infestation pressure<output id="adv-pressure-value"></output></label><input id="adv-pressure" type="range" min="0" max="2" step="0.1"></div><p style="margin-top:20px">Interventions also have a small illustrative fish loss and temporary growth cost. The two simple curve models do not directly respond to temperature; their parasites still do.</p><button id="apply-advanced" class="play-button">Apply & explore →</button>`;
    $("adv-growth").innerHTML = Object.entries(GROWTH_MODELS)
      .map(([value, label]) => `<option value="${value}">${label}</option>`)
      .join("");
    for (const key of ["fish", "weight", "efficacy", "pressure"]) {
      const [minimum, maximum] = PARAMETER_LIMITS[key];
      $("adv-" + key).min = minimum;
      $("adv-" + key).max = maximum;
    }
    for (const key of ADVANCED_FIELDS) $("adv-" + key).value = parameters[key];
    function labels() {
      $("adv-efficacy-value").textContent = $("adv-efficacy").value + "%";
      $("adv-pressure-value").textContent =
        Number($("adv-pressure").value).toFixed(1) + "×";
    }
    labels();
    $("adv-efficacy").oninput = labels;
    $("adv-pressure").oninput = labels;
    $("apply-advanced").onclick = () => {
      for (const key of ["fish", "weight"]) {
        const input = $("adv-" + key);
        input.required = true;
        if (!input.reportValidity()) return;
      }
      for (const key of ADVANCED_FIELDS)
        parameters[key] = ["growth", "method"].includes(key)
          ? $("adv-" + key).value
          : Number($("adv-" + key).value);
      closeDialog();
      run();
    };
  } else
    $("dialog-content").innerHTML =
      DIALOG_CONTENT[name] || DIALOG_CONTENT.guide;
  $("dialog-content").querySelector("h2").id = "dialog-title";
  if (!$("info-dialog").open) $("info-dialog").showModal();
  $("info-dialog").scrollTop = 0;
  $("close-dialog").focus();
}
function closeDialog() {
  $("info-dialog").close();
}
document
  .querySelectorAll("[data-dialog]")
  .forEach((button) =>
    button.addEventListener("click", () => openDialog(button.dataset.dialog)),
  );
$("close-dialog").addEventListener("click", closeDialog);
$("info-dialog").addEventListener("click", (e) => {
  if (e.target === $("info-dialog")) {
    const bounds = $("info-dialog").getBoundingClientRect();
    if (
      e.clientX < bounds.left ||
      e.clientX > bounds.right ||
      e.clientY < bounds.top ||
      e.clientY > bounds.bottom
    )
      closeDialog();
  }
});
$("info-dialog").addEventListener("close", () => lastFocus?.focus());
run();
