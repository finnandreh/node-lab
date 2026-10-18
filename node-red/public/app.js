(() => {
  "use strict";

  const dashboard = document.querySelector(".dashboard-shell");
  if (!dashboard) return;

  const scenarioButtons = Array.from(document.querySelectorAll("[data-scenario]"));
  const validationButtons = Array.from(document.querySelectorAll("[data-temperature]"));
  const stationCards = new Map(
    Array.from(document.querySelectorAll("[data-station]")).map((card) => [card.dataset.station, card])
  );
  const state = {
    scenario: "normal",
    pending: false,
    lastSnapshot: null,
    lastHistorySample: null,
    histories: new Map(Array.from(stationCards.keys()).map((id) => [id, []])),
    events: []
  };

  const text = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  };

  const formatInteger = (value) => Number(value || 0).toLocaleString("en-GB");

  function formatAge(ms) {
    if (!Number.isFinite(ms)) return "—";
    if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;
    return `${(ms / 1000).toFixed(1)} s`;
  }

  function formatUptime(seconds) {
    const safe = Math.max(0, Number(seconds || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const remaining = Math.floor(safe % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m ${remaining}s`;
  }

  function chartPoints(history, threshold) {
    const values = history.filter(Number.isFinite);
    if (values.length === 0) return "";
    const plotted = values.length === 1 ? [values[0], values[0]] : values;
    const ceiling = Math.max(threshold + 12, ...plotted) + 3;
    return plotted.map((sample, index) => {
      const x = index * 600 / Math.max(1, plotted.length - 1);
      const y = 112 - (Math.max(0, sample) / ceiling) * 100;
      return `${x.toFixed(1)},${Math.max(8, Math.min(112, y)).toFixed(1)}`;
    }).join(" ");
  }

  function cardField(card, name) {
    return card.querySelector(`[data-field="${name}"]`);
  }

  function updateStation(station, appendHistory) {
    const card = stationCards.get(station.id);
    if (!card) return;
    card.dataset.health = station.health;
    const temperature = cardField(card, "temperature");
    const power = cardField(card, "power");
    const process = cardField(card, "process");
    const processLabel = cardField(card, "process-label");
    const health = cardField(card, "health");
    const quality = cardField(card, "quality");
    const stationState = cardField(card, "state");
    const threshold = cardField(card, "threshold");
    const age = cardField(card, "age");

    temperature.textContent = Number.isFinite(station.temperatureC) ? station.temperatureC.toFixed(1) : "—";
    power.textContent = Number.isFinite(station.powerKw) ? `${station.powerKw.toFixed(1)} kW` : "—";
    process.textContent = `${station.processValue}${station.processUnit}`;
    processLabel.textContent = station.processLabel;
    health.textContent = station.health;
    stationState.textContent = station.state;
    threshold.textContent = station.thresholdC;
    quality.textContent = station.quality === "good" ? "Valid emulated signal" : "Missing emulated signal";
    age.textContent = formatAge(station.ageMs);

    if (appendHistory && Number.isFinite(station.temperatureC)) {
      const history = state.histories.get(station.id);
      history.push(station.temperatureC);
      state.histories.set(station.id, history.slice(-30));
    }
    const chart = card.querySelector(`[data-chart="${station.id}"]`);
    chart.setAttribute("points", chartPoints(state.histories.get(station.id), station.thresholdC));
  }

  function updateEventHistory(snapshot) {
    for (const event of snapshot.events) {
      if (!state.events.some((current) => current.id === event.id)) state.events.unshift(event);
    }
    state.events = state.events.slice(0, 12);
    const list = document.getElementById("event-list");
    list.replaceChildren();
    if (state.events.length === 0) {
      const empty = document.createElement("li");
      empty.className = "event-empty";
      empty.textContent = "No events for this sample.";
      list.append(empty);
    } else {
      for (const event of state.events) {
        const item = document.createElement("li");
        item.dataset.level = event.level;
        const marker = document.createElement("span");
        marker.textContent = event.level.toUpperCase();
        const body = document.createElement("div");
        const message = document.createElement("strong");
        message.textContent = event.message;
        const meta = document.createElement("small");
        meta.textContent = `${event.id} · ${new Date(event.at).toLocaleTimeString("en-GB", { hour12: false })}`;
        body.append(message, meta);
        item.append(marker, body);
        list.append(item);
      }
    }
    text("event-count", `${state.events.length} ${state.events.length === 1 ? "event" : "events"}`);
  }

  function renderSnapshot(snapshot) {
    const appendHistory = snapshot.sampleKey !== state.lastHistorySample;
    state.lastSnapshot = snapshot;
    if (appendHistory) state.lastHistorySample = snapshot.sampleKey;
    dashboard.dataset.dashboardHealth = "online";
    text("connection-label", "Node-RED stream active");
    text("hero-connection", "online");
    text("sample-key", `Sample ${snapshot.sampleKey}`);
    text("hero-sample", snapshot.sampleKey);
    text("generated-time", `Server ${new Date(snapshot.generatedAt).toLocaleTimeString("en-GB", { hour12: false })} UTC`);
    text("hero-generated", snapshot.generatedAt.replace("T", " ").replace(".000Z", "Z"));
    text("scenario-label", snapshot.scenario.label);
    text("hero-scenario", snapshot.scenario.label);
    text("metric-ticks", formatInteger(snapshot.runtime.ticksGenerated));
    text("metric-messages", formatInteger(snapshot.runtime.messagesProcessed));
    text("metric-uptime", formatUptime(snapshot.runtime.uptimeSeconds));
    text("metric-latency", `${snapshot.runtime.generationLatencyMs} ms`);
    snapshot.stations.forEach((station) => updateStation(station, appendHistory));
    updateEventHistory(snapshot);
    text("scenario-message", `${snapshot.sampleKey} accepted · ${snapshot.scenario.scope.replaceAll("-", " ")}.`);
    refreshAges();
  }

  function refreshAges() {
    if (!state.lastSnapshot) return;
    const now = Date.now();
    const snapshotAge = Math.max(0, now - Date.parse(state.lastSnapshot.generatedAt));
    text("update-age", `Age ${formatAge(snapshotAge)}`);
    text("hero-age", formatAge(snapshotAge));
    dashboard.dataset.dashboardHealth = snapshotAge > 5000 ? "stale" : "online";
    if (snapshotAge > 5000) {
      text("connection-label", "Waiting for a fresh backend sample");
      text("hero-connection", "stale");
    }
    state.lastSnapshot.stations.forEach((station) => {
      const card = stationCards.get(station.id);
      if (card) cardField(card, "age").textContent = formatAge(Math.max(0, now - Date.parse(station.observedAt)));
    });
  }

  async function fetchSnapshot(scenario = state.scenario, invalidProbe = false) {
    if (state.pending) return;
    state.pending = true;
    try {
      const response = await fetch(`api/live?scenario=${encodeURIComponent(scenario)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      const result = await response.json();
      if (!response.ok) {
        if (invalidProbe && response.status === 400) {
          const preserved = state.lastSnapshot ? state.lastSnapshot.sampleKey : "no prior sample";
          text("scenario-message", `400 rejected · previous valid ${preserved} preserved.`);
          return;
        }
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      renderSnapshot(result);
    } catch (error) {
      dashboard.dataset.dashboardHealth = "offline";
      text("connection-label", "Backend read failed");
      text("hero-connection", "offline");
      text("scenario-message", `No new state applied: ${error.message}`);
    } finally {
      state.pending = false;
    }
  }

  scenarioButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const scenario = button.dataset.scenario;
      if (scenario === "invalid") {
        fetchSnapshot("not-a-supported-scenario", true);
        return;
      }
      state.scenario = scenario;
      scenarioButtons.forEach((candidate) => candidate.setAttribute("aria-pressed", String(candidate === button)));
      fetchSnapshot();
    });
  });

  async function runValidation(temperature, label) {
    validationButtons.forEach((button) => { button.disabled = true; });
    try {
      const response = await fetch("api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ temperature })
      });
      const result = await response.json();
      if (!response.ok) {
        text("validation-message", `${response.status} rejected · previous accepted result preserved.`);
        return;
      }
      text("validation-value", result.temperature);
      text("validation-status", result.status === "HIGH TEMPERATURE" ? "High temperature" : "Normal operation");
      text("validation-message", `${label} accepted by the real validation flow.`);
      document.querySelector(".validation-result").dataset.validationState = result.status === "HIGH TEMPERATURE" ? "alert" : "normal";
    } catch (error) {
      text("validation-message", `Request failed · previous accepted result preserved. ${error.message}`);
    } finally {
      validationButtons.forEach((button) => { button.disabled = false; });
    }
  }

  validationButtons.forEach((button) => {
    button.addEventListener("click", () => runValidation(Number(button.dataset.temperature), button.dataset.label));
  });

  async function loadCaptureFacts() {
    try {
      const response = await fetch("api/capture", { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!response.ok) return;
      const result = await response.json();
      text("capture-state", result.recordingPhase.replaceAll("-", " ").toUpperCase());
      text("capture-revision", result.sourceRevision);
      text("capture-archive", result.sourceArchiveSha256);
    } catch (_) {
      // Static evidence links remain usable if the optional facts request fails.
    }
  }

  fetchSnapshot();
  loadCaptureFacts();
  window.setInterval(() => fetchSnapshot(), 1500);
  window.setInterval(refreshAges, 250);
})();
