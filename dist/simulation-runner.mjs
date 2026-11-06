import { calculate } from "./model.mjs";

/** Runs at most one worker calculation, retaining only the latest pending input. */
export class SimulationRunner {
  constructor(
    onResult,
    createWorker = () =>
      new Worker(new URL("./worker.mjs", import.meta.url), { type: "module" }),
  ) {
    this.onResult = onResult;
    this.requestId = 0;
    this.busy = false;
    this.worker = null;
    try {
      const worker = createWorker();
      this.worker = worker;
      worker.onmessage = ({ data }) => {
        if (this.worker !== worker) return;
        this.busy = false;
        if (data.error) {
          this.useFallback();
        } else if (data.id === this.latestRequest.id) {
          this.onResult(data.result);
        } else {
          this.dispatch();
        }
      };
      worker.onerror = (event) => {
        if (this.worker !== worker) return;
        event.preventDefault();
        this.useFallback();
      };
    } catch {
      // Some static hosts or browsers cannot start module workers.
      this.worker = null;
    }
  }

  request(parameters) {
    this.latestRequest = { id: ++this.requestId, params: { ...parameters } };
    if (!this.busy) this.dispatch();
  }

  dispatch() {
    if (!this.worker) {
      this.onResult(calculate(this.latestRequest.params));
      return;
    }
    this.busy = true;
    try {
      this.worker.postMessage(this.latestRequest);
    } catch {
      this.useFallback();
    }
  }

  useFallback() {
    this.worker?.terminate();
    this.worker = null;
    this.busy = false;
    if (this.latestRequest) this.dispatch();
  }
}
