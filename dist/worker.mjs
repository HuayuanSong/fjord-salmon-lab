import { calculate } from "./model.mjs";
self.onmessage = ({ data }) => {
  try {
    self.postMessage({ id: data.id, result: calculate(data.params) });
  } catch (e) {
    self.postMessage({ id: data.id, error: String(e) });
  }
};
