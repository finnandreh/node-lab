(() => {
  "use strict";

  const shell = document.querySelector(".demo-shell");
  const controls = Array.from(document.querySelectorAll("[data-temperature]"));
  if (!shell || controls.length === 0) return;

  const value = document.getElementById("temperature-value");
  const meter = document.getElementById("temperature-meter");
  const statusSymbol = document.getElementById("status-symbol");
  const statusHeading = document.getElementById("status-heading");
  const statusDescription = document.getElementById("status-description");
  const resultPill = document.getElementById("result-pill");
  const message = document.getElementById("demo-message");
  const sampleCount = document.getElementById("sample-count");
  const historyLine = document.getElementById("history-line");

  const state = {
    history: [22],
    temperature: 22,
    pending: false
  };

  function chartPoints(history) {
    const width = 1000;
    const usable = history.length === 1 ? [history[0], history[0]] : history;
    return usable.map((sample, index) => {
      const x = index * width / Math.max(1, usable.length - 1);
      const y = 190 - (sample * 3.8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }

  function render(result) {
    const alert = result.status === "HIGH TEMPERATURE";
    state.temperature = result.temperature;
    state.history.push(result.temperature);
    state.history = state.history.slice(-12);
    shell.dataset.demoState = alert ? "alert" : "normal";
    value.textContent = String(result.temperature);
    meter.style.width = `${Math.min(100, Math.max(0, result.temperature * 2))}%`;
    statusSymbol.textContent = alert ? "!" : "✓";
    statusHeading.textContent = alert ? "High temperature" : "Normal operation";
    statusDescription.textContent = alert
      ? "The sample meets or exceeds the 30 °C threshold."
      : "The sample is below the 30 °C threshold.";
    resultPill.textContent = `200 · ${result.sequence}`;
    sampleCount.textContent = `${state.history.length} samples`;
    historyLine.setAttribute("points", chartPoints(state.history));
  }

  function setPending(pending) {
    state.pending = pending;
    controls.forEach((button) => { button.disabled = pending; });
  }

  async function submit(button) {
    if (state.pending) return;
    const temperature = Number(button.dataset.temperature);
    const label = button.dataset.label;
    setPending(true);
    message.textContent = `Sending the ${label} sample through Node-RED…`;

    try {
      const response = await fetch("api/sample", {
        method: "POST",
        credentials: "omit",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ temperature })
      });
      const payload = await response.json();

      if (!response.ok) {
        if (label === "invalid" && response.status === 400) {
          resultPill.textContent = "400 · rejected";
          message.textContent = `Rejected as designed: ${payload.error}. The last accepted state stayed at ${state.temperature} °C.`;
          return;
        }
        throw new Error(payload.error || `HTTP ${response.status}`);
      }

      render(payload);
      message.textContent = label === "recovery"
        ? "Recovery confirmed: the same flow returned to normal operation."
        : `${payload.temperature} °C accepted by the real Node-RED flow as ${payload.status}.`;
    } catch (error) {
      resultPill.textContent = "request unavailable";
      message.textContent = `The flow could not be reached. No state was changed. ${error.message}`;
    } finally {
      setPending(false);
    }
  }

  controls.forEach((button) => button.addEventListener("click", () => submit(button)));
  historyLine.setAttribute("points", chartPoints(state.history));
})();

