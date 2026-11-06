/** Educational model v0.1. All numerical coefficients are illustrative.
 * Daily exponential competing-risk updates preserve nonnegative populations.
 * Fish weight is grams, N is fish, lice compartments are absolute counts.
 * Records are start-of-day snapshots after any scheduled intervention.
 * F tracks adult females; males are omitted, with fertilisation assumed.
 */
export const DAYS = 365;
export const TREATMENT_INTERVAL = 70;
export const RECOVERY_DAYS = 7;
const ASYMPTOTIC_WEIGHT = 6500;
const ASYMPTOTIC_CUBE_ROOT = Math.cbrt(ASYMPTOTIC_WEIGHT);
const ADULT_DAILY_SURVIVAL = Math.exp(-0.025);
export const DEFAULTS = Object.freeze({
  fish: 100000,
  weight: 150,
  warming: 0,
  feed: 1,
  pressure: 0.7,
  seedDay: 35,
  treatmentDay: 110,
  treatment: true,
  repeat: false,
  efficacy: 85,
  method: "broad",
  growth: "thermal",
  infestation: true,
});
export const PRESETS = {
  calm: {
    name: "A calm start",
    values: { ...DEFAULTS, infestation: false, treatment: false },
  },
  lice: {
    name: "An unwelcome guest",
    values: { ...DEFAULTS, treatment: false },
  },
  response: {
    name: "A timely response",
    values: { ...DEFAULTS },
  },
  warm: {
    name: "A warmer season",
    values: { ...DEFAULTS, warming: 3 },
  },
};
export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
export const GROWTH_MODELS = Object.freeze({
  thermal: "Temperature-driven growth",
  gompertz: "Gompertz growth curve",
  bertalanffy: "Von Bertalanffy growth curve",
});
export const PARAMETER_LIMITS = Object.freeze({
  fish: [1000, 200000],
  weight: [50, 500],
  warming: [-3, 4],
  feed: [0.65, 1.2],
  pressure: [0, 2],
  seedDay: [1, 300],
  treatmentDay: [1, 350],
  efficacy: [0, 100],
});
export function normalize(input = {}) {
  const parameters = { ...DEFAULTS, ...input };
  for (const [key, [minimum, maximum]] of Object.entries(PARAMETER_LIMITS)) {
    const value = Number(parameters[key]);
    parameters[key] = clamp(
      Number.isFinite(value) ? value : DEFAULTS[key],
      minimum,
      maximum,
    );
  }
  for (const k of ["infestation", "treatment", "repeat"])
    parameters[k] = parameters[k] === true;
  parameters.growth = Object.hasOwn(GROWTH_MODELS, parameters.growth)
    ? parameters.growth
    : "thermal";
  parameters.method = parameters.method === "adult" ? "adult" : "broad";
  parameters.fish = Math.round(parameters.fish);
  parameters.seedDay = Math.round(parameters.seedDay);
  parameters.treatmentDay = Math.round(parameters.treatmentDay);
  return parameters;
}
export function temperature(day, parameters) {
  return (
    10.5 +
    3.5 * Math.sin((2 * Math.PI * (day - 55)) / DAYS) +
    parameters.warming
  );
}
function flow(population, development, mortality) {
  const rate = development + mortality;
  const lost = population * -Math.expm1(-rate);
  return {
    stay: population - lost,
    move: rate > 0 ? (lost * development) / rate : 0,
  };
}
export function treatmentDays(parameters) {
  if (!parameters.treatment) return [];
  const days = [parameters.treatmentDay];
  if (parameters.repeat) {
    for (
      let day = parameters.treatmentDay + TREATMENT_INTERVAL;
      day <= DAYS;
      day += TREATMENT_INTERVAL
    )
      days.push(day);
  }
  return days;
}
export function simulate(input = {}, variation = {}) {
  return simulateNormalized(normalize(input), variation);
}
function simulateNormalized(parameters, variation = {}) {
  const factors = {
    growth: 1,
    reproduction: 1,
    mortality: 1,
    efficacy: 1,
    ...variation,
  };
  let fishCount = parameters.fish,
    meanWeight = parameters.weight,
    larvae = 0,
    juveniles = 0,
    mobileStages = 0,
    adultFemales = 0,
    recovery = 0,
    treatments = 0;
  const records = [];
  const scheduledTreatments = new Set(treatmentDays(parameters));
  for (let day = 0; day <= DAYS; day++) {
    const waterTemperature = temperature(day, parameters),
      events = [];
    if (day === parameters.seedDay && parameters.infestation) {
      larvae += fishCount * 0.6;
      events.push("lice");
    }
    if (scheduledTreatments.has(day)) {
      const removalFraction = clamp(
          (parameters.efficacy / 100) * factors.efficacy,
          0,
          1,
        ),
        fishBeforeTreatment = fishCount;
      fishCount *= 1 - 0.003 * factors.mortality;
      const survivalFraction =
        fishBeforeTreatment > 0 ? fishCount / fishBeforeTreatment : 0;
      juveniles *=
        survivalFraction *
        (1 - removalFraction * (parameters.method === "adult" ? 0.2 : 0.9));
      mobileStages *=
        survivalFraction *
        (1 - removalFraction * (parameters.method === "adult" ? 0.65 : 1));
      adultFemales *= survivalFraction * (1 - removalFraction);
      recovery = RECOVERY_DAYS;
      treatments++;
      events.push("treatment");
    }
    const mobile =
      fishCount > 0 ? (mobileStages + adultFemales) / fishCount : 0;
    records.push({
      day,
      N: fishCount,
      W: meanWeight,
      B: (fishCount * meanWeight) / 1e6,
      R: larvae,
      J: juveniles,
      M: mobileStages,
      F: adultFemales,
      lice: fishCount > 0 ? adultFemales / fishCount : 0,
      mobile,
      T: waterTemperature,
      treatments,
      recovery,
      events,
    });
    if (day === DAYS) break;
    const temperatureFactor = clamp(
      Math.pow(1.8, (waterTemperature - 10) / 10),
      0.3,
      2.5,
    );
    const attachmentRate = 0.075 * clamp(fishCount / parameters.fish, 0, 1.4);
    const larval = flow(larvae, attachmentRate, 0.18),
      juvenile = flow(juveniles, 0.038 * temperatureFactor, 0.012),
      motile = flow(mobileStages, 0.035 * temperatureFactor, 0.017);
    const crowding = 1 + mobile / 12;
    const outsideArrivals =
      parameters.infestation && day >= parameters.seedDay
        ? parameters.fish * parameters.pressure * 0.0015
        : 0;
    const recruitment =
      (adultFemales * 0.8 * temperatureFactor * factors.reproduction) /
      crowding;
    larvae = larval.stay + recruitment + outsideArrivals;
    juveniles = juvenile.stay + larval.move;
    mobileStages = motile.stay + juvenile.move;
    adultFemales = adultFemales * ADULT_DAILY_SURVIVAL + motile.move * 0.5;
    // The other half of maturing mobile lice are males and leave this reduced model.
    const hazard =
      (0.00014 + 0.00023 * Math.max(0, mobile - 1)) * factors.mortality;
    const dailySurvival = Math.exp(-hazard);
    fishCount *= dailySurvival;
    juveniles *= dailySurvival;
    mobileStages *= dailySurvival;
    adultFemales *= dailySurvival;
    const condition =
      (parameters.feed / (1 + 0.055 * mobile)) *
      (recovery > 0 ? 0.75 : 1) *
      factors.growth;
    if (parameters.growth === "thermal") {
      const heatPenalty = Math.exp(
        -0.065 * Math.max(0, waterTemperature - 15) ** 2,
      );
      meanWeight =
        (Math.cbrt(meanWeight) +
          0.00215 * Math.max(0, waterTemperature) * heatPenalty * condition) **
        3;
    } else if (parameters.growth === "gompertz") {
      meanWeight =
        ASYMPTOTIC_WEIGHT *
        Math.exp(
          Math.log(meanWeight / ASYMPTOTIC_WEIGHT) *
            Math.exp(-0.0042 * condition),
        );
    } else {
      const cubeRootWeight =
        ASYMPTOTIC_CUBE_ROOT +
        (Math.cbrt(meanWeight) - ASYMPTOTIC_CUBE_ROOT) *
          Math.exp(-0.0028 * condition);
      meanWeight = cubeRootWeight ** 3;
    }
    recovery = Math.max(0, recovery - 1);
  }
  return records;
}
export function calculate(input = {}) {
  const parameters = normalize(input),
    main = simulateNormalized(parameters),
    untreated = parameters.treatment
      ? simulateNormalized({ ...parameters, treatment: false })
      : main;
  // Consumers treat the series as read-only; identical references share a run.
  const clean = parameters.infestation
    ? simulateNormalized({
        ...parameters,
        infestation: false,
        treatment: false,
      })
    : untreated;
  // Four deliberately chosen parameter perturbations, NOT a confidence interval.
  const variations = [
    { growth: 0.9, reproduction: 1.18, mortality: 1.2, efficacy: 0.9 },
    { growth: 1.1, reproduction: 0.82, mortality: 0.8, efficacy: 1.1 },
    { growth: 0.95, reproduction: 0.9, mortality: 1.1, efficacy: 1 },
    { growth: 1.05, reproduction: 1.1, mortality: 0.9, efficacy: 1 },
  ];
  const band = main.map((record) => ({
    day: record.day,
    Bmin: record.B,
    Bmax: record.B,
    Lmin: record.lice,
    Lmax: record.lice,
  }));
  for (const variation of variations) {
    const alternative = simulateNormalized(parameters, variation);
    for (let day = 0; day <= DAYS; day++) {
      const bounds = band[day],
        record = alternative[day];
      bounds.Bmin = Math.min(bounds.Bmin, record.B);
      bounds.Bmax = Math.max(bounds.Bmax, record.B);
      bounds.Lmin = Math.min(bounds.Lmin, record.lice);
      bounds.Lmax = Math.max(bounds.Lmax, record.lice);
    }
  }
  return { p: parameters, main, untreated, clean, band };
}
