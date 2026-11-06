import test from "node:test";
import assert from "node:assert/strict";
import {
  calculate,
  simulate,
  normalize,
  PRESETS,
  treatmentDays,
} from "../dist/model.mjs";
test("every preset preserves finite nonnegative states and mass identities", () => {
  for (const { values } of Object.values(PRESETS))
    for (const r of simulate(values)) {
      for (const key of ["N", "W", "B", "R", "J", "M", "F", "lice"])
        assert.ok(Number.isFinite(r[key]) && r[key] >= 0, key);
      assert.ok(Math.abs(r.B - (r.N * r.W) / 1e6) < 1e-9);
      assert.ok(Math.abs(r.lice - r.F / r.N) < 1e-9);
      assert.ok(r.N <= values.fish);
    }
});
test("no infestation creates no parasites; grow-out does not create fish", () => {
  const r = simulate({ infestation: false, treatment: false });
  assert.ok(r.at(-1).W > r[0].W);
  for (let i = 1; i < r.length; i++) {
    assert.ok(r[i].N <= r[i - 1].N);
    assert.equal(r[i].R + r[i].J + r[i].M + r[i].F, 0);
  }
});
test("a treatment suppresses attached stages but does not directly kill free larvae", () => {
  const a = simulate({ treatmentDay: 110 }),
    b = simulate({ treatment: false });
  for (const key of ["J", "M", "F"]) assert.ok(a[110][key] < b[110][key]);
  assert.equal(a[110].R, b[110].R);
  assert.ok(a[110].N < b[110].N);
  assert.equal(a[110].recovery, 7);
});
test("repeated events occur at exact days and growth models remain bounded in intended input range", () => {
  const r = simulate({ repeat: true, treatmentDay: 90 });
  assert.deepEqual(
    r.filter((x) => x.events.includes("treatment")).map((x) => x.day),
    [90, 160, 230, 300],
  );
  for (const growth of ["thermal", "gompertz", "bertalanffy"])
    for (const warming of [-3, 4]) {
      const a = simulate({
        growth,
        warming,
        feed: 1.2,
        pressure: 2,
        weight: 500,
      });
      assert.ok(a.every((x) => Number.isFinite(x.W) && x.W > 0 && x.N > 0));
    }
});
test("sensitivity bounds enclose nominal run and comparison branches share starting stock", () => {
  const d = calculate();
  assert.equal(d.main[0].N, d.untreated[0].N);
  assert.equal(d.main[0].W, d.clean[0].W);
  d.main.forEach((r, i) => {
    assert.ok(d.band[i].Bmin <= r.B && d.band[i].Bmax >= r.B);
  });
});
test("invalid inputs are normalized to safe defaults", () => {
  const p = normalize({ fish: NaN, weight: -4, growth: "bad" });
  assert.equal(p.fish, 100000);
  assert.equal(p.weight, 50);
  assert.equal(p.growth, "thermal");
});

test("zero removal preserves lice per fish at the event but still costs fish", () => {
  const treated = simulate({ efficacy: 0 }),
    untreated = simulate({ treatment: false });
  const before = untreated[110],
    after = treated[110];
  assert.ok(Math.abs(before.lice - after.lice) < 1e-12);
  assert.ok(after.N < before.N);
  assert.equal(after.recovery, 7);
  assert.equal(treated[116].recovery, 1);
  assert.equal(treated[117].recovery, 0);
});

test("full removal leaves larvae available for reinfestation", () => {
  const records = simulate({ efficacy: 100 });
  assert.equal(records[110].M + records[110].F, 0);
  assert.ok(records[110].R > 0);
  assert.ok(records.at(-1).lice > 0);
});

test("reference reuse agrees with independently simulated comparisons", () => {
  for (const parameters of [
    {},
    { treatment: false },
    { infestation: false },
    { infestation: false, treatment: false },
  ]) {
    const result = calculate(parameters);
    assert.deepEqual(
      result.untreated,
      simulate({ ...parameters, treatment: false }),
    );
    assert.deepEqual(
      result.clean,
      simulate({ ...parameters, treatment: false, infestation: false }),
    );
    for (const [day, bounds] of result.band.entries()) {
      assert.ok(
        bounds.Lmin <= result.main[day].lice &&
          bounds.Lmax >= result.main[day].lice,
      );
    }
  }
});

test("the shared event schedule matches simulated treatment events", () => {
  for (const treatmentDay of [1, 85, 350]) {
    const parameters = normalize({ repeat: true, treatmentDay });
    assert.deepEqual(
      treatmentDays(parameters),
      simulate(parameters)
        .filter((record) => record.events.includes("treatment"))
        .map((record) => record.day),
    );
  }
  assert.equal(normalize({ fish: 10000.4 }).fish, 10000);
  assert.equal(normalize({ growth: "toString" }).growth, "thermal");
});
