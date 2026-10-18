"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const flowPath = path.join(root, "node-red", "flows.json");
const flows = JSON.parse(fs.readFileSync(flowPath, "utf8"));
const byId = new Map(flows.map((node) => [node.id, node]));

function node(id) {
  const value = byId.get(id);
  if (!value) throw new Error(`missing flow node: ${id}`);
  return value;
}

function replaceOnce(id, before, after) {
  const target = node(id);
  const parts = target.func.split(before);
  if (parts.length !== 2) throw new Error(`expected one baseline fragment in ${id}: ${before}`);
  target.func = parts.join(after);
}

replaceOnce("generate-workshop-tick", "thresholdC:32", "thresholdC:30");
replaceOnce("generate-workshop-tick", "schemaVersion:'2.0.0-base'", "schemaVersion:'2.0.0'");

replaceOnce(
  "build-live-response",
  "snapshot.stations = Object.values(byId).map((station) => ({...station,ageMs:Math.max(0, now - Date.parse(station.observedAt))}));",
  [
    "snapshot.stations = Object.values(byId).map((station) => {",
    "  const validTemperature = Number.isFinite(station.temperatureC);",
    "  const comfortMargin = validTemperature ? Number((station.thresholdC - station.temperatureC).toFixed(1)) : null;",
    "  return {...station,comfort_margin_c:comfortMargin,ageMs:Math.max(0, now - Date.parse(station.observedAt))};",
    "});",
    "const primary = snapshot.stations.find((station) => station.id === 'cnc-cell');",
    "snapshot.configured_demo_temperature_limit_c = primary.thresholdC;",
    "snapshot.validated_temperature_c = Number.isFinite(primary.temperatureC) ? primary.temperatureC : null;",
    "snapshot.comfort_margin_c = primary.comfort_margin_c;"
  ].join("\n")
);
replaceOnce("build-live-response", "flowVersion:'2.0.0-base'", "flowVersion:'2.0.0'");

replaceOnce("validate-sample", "[22,34].includes(raw)", "[22,30,34].includes(raw)");
replaceOnce("validate-sample", "sample must be the JSON number 22 or 34", "sample must be the JSON number 22, 30 or 34");
node("validate-sample").name = "Allow 22 C, 30 C or 34 C only";

replaceOnce(
  "threshold-rule",
  "    threshold:30,",
  [
    "    threshold:30,",
    "    validated_temperature_c:temperature,",
    "    configured_demo_temperature_limit_c:30,",
    "    comfort_margin_c:Number((30 - temperature).toFixed(1)),"
  ].join("\n")
);

replaceOnce("health-payload", "version:'2.0.0-base'", "version:'2.0.0'");

const capture = node("capture-payload");
capture.func = "msg.statusCode=200; msg.headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}; msg.payload={recordingPhase:env.get('NODE_LAB_RECORDING_PHASE')||'recorded-change',reservedChange:{id:'comfort-margin',performed:true,description:'The actual Node-RED response path now derives comfort_margin_c from the configured limit and validated temperature.'},sourceRevision:env.get('NODE_LAB_SOURCE_REVISION')||'development',sourceArchiveSha256:env.get('NODE_LAB_SOURCE_ARCHIVE_SHA256')||'unavailable',artifacts:{prompt:'capture/prompt.md',beforeFunction:'capture/before-live-response.js',functionalDiff:'capture/comfort-margin.diff',validation:'capture/change-validation.json',deployedReadback:'capture/change-readback.json',deployedFlow:'source/flows.json',telemetrySchema:'source/telemetry.schema.json'},truth:'This is a guided recording of an actual bounded edit, checks and release. Inactive build waits may be shortened later with a truthful label; no terminal or completion is fabricated.'}; return msg;";

fs.writeFileSync(flowPath, `${JSON.stringify(flows, null, 2)}\n`);
