import test from "node:test";
import assert from "node:assert/strict";
import { describeDay, seasonLabel } from "../dist/presentation.mjs";
import { calculate } from "../dist/model.mjs";

test("a zero-removal intervention does not claim to control lice", () => {
  const result = calculate({ efficacy: 0 });
  const caption = describeDay(
    result.main[110],
    result.untreated[110],
    result.p,
  );
  assert.match(caption, /removes no lice directly/);
});

test("an intervention before infestation does not claim a reduction", () => {
  const result = calculate({ seedDay: 100, treatmentDay: 10 });
  const caption = describeDay(result.main[20], result.untreated[20], result.p);
  assert.doesNotMatch(caption, /lower|reduced/);
});

test("the season is only complete at its endpoint", () => {
  assert.equal(seasonLabel(364), "EARLY SPRING");
  assert.equal(seasonLabel(365), "A SEASON COMPLETE");
});
