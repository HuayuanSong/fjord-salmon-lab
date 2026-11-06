import test from "node:test";
import assert from "node:assert/strict";
import { SimulationRunner } from "../dist/simulation-runner.mjs";

function fakeWorker() {
  return {
    requests: [],
    terminated: false,
    postMessage(request) {
      this.requests.push(request);
    },
    terminate() {
      this.terminated = true;
    },
    respond(data) {
      this.onmessage({ data });
    },
  };
}

test("rapid updates keep one calculation in flight and discard stale results", () => {
  const worker = fakeWorker(),
    results = [];
  const runner = new SimulationRunner(
    (result) => results.push(result),
    () => worker,
  );
  runner.request({ warming: 0 });
  runner.request({ warming: 1 });
  runner.request({ warming: 3 });
  assert.equal(worker.requests.length, 1);
  worker.respond({ id: 1, result: "obsolete" });
  assert.deepEqual(results, []);
  assert.equal(worker.requests.length, 2);
  assert.equal(worker.requests[1].params.warming, 3);
  worker.respond({ id: 3, result: "current" });
  assert.deepEqual(results, ["current"]);
});

test("worker errors fall back to the latest input and ignore later worker events", () => {
  const worker = fakeWorker(),
    results = [];
  const runner = new SimulationRunner(
    (result) => results.push(result),
    () => worker,
  );
  runner.request({ fish: 10000 });
  runner.request({ fish: 50000 });
  worker.onerror({ preventDefault() {} });
  assert.ok(worker.terminated);
  assert.equal(results.length, 1);
  assert.equal(results[0].main[0].N, 50000);
  worker.respond({ id: 1, result: "obsolete" });
  assert.equal(results.length, 1);
  runner.request({ fish: 20000 });
  assert.equal(results[1].main[0].N, 20000);
});

test("unsupported workers and failed postMessage both retain the demo", () => {
  for (const createWorker of [
    () => {
      throw new Error("unavailable");
    },
    () => ({
      postMessage() {
        throw new Error("failed");
      },
      terminate() {},
    }),
  ]) {
    let result;
    const runner = new SimulationRunner((value) => {
      result = value;
    }, createWorker);
    runner.request({ infestation: false });
    assert.equal(result.main.at(-1).lice, 0);
    assert.equal(result.main.length, 366);
  }
});
