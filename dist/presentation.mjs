import { DAYS } from "./model.mjs";

export function seasonLabel(day) {
  if (day === DAYS) return "A SEASON COMPLETE";
  if (day < 60 || day >= 330) return "EARLY SPRING";
  if (day < 150) return "SUMMER";
  if (day < 240) return "AUTUMN";
  return "WINTER";
}

export function describeDay(record, untreatedRecord, parameters) {
  if (record.day === DAYS)
    return "A year has passed. Compare fish survival, growth and lice together: one number cannot tell the whole story.";
  if (record.recovery > 0) {
    if (parameters.efficacy === 0)
      return "This intervention removes no lice directly, but still causes a small fish loss and a temporary recovery cost.";
    return "An intervention has been applied. Its effects depend on the lice present; fish also face a recovery period and a small immediate loss.";
  }
  if (record.treatments > 0 && record.mobile < untreatedRecord.mobile - 1e-9)
    return "Attached mobile lice are lower than in the untreated comparison. Surviving stages and outside arrivals can still rebuild the population.";
  if (record.lice > 0.35)
    return "More adult females mean more potential offspring. Outside infestation can also replenish the cycle.";
  if (parameters.infestation && record.day >= parameters.seedDay)
    return "A life cycle begins. Young lice attach, mature and contribute to the next generation.";
  if (record.day > 10)
    return "The school is growing. Biomass combines how many fish survive with how much each fish weighs.";
  return "A new cohort enters the water. The fish will grow in size, not reproduce in this cage.";
}
