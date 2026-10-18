// Exact baseline behavior excerpt from the live-response Node-RED Function.
// The reserved Comfort margin is intentionally not calculated here.
const tick = flow.get("latestTick");
if (!tick) {
  msg.statusCode = 503;
  msg.payload = { accepted: false, error: "live generator is starting" };
  return msg;
}

const snapshot = JSON.parse(JSON.stringify(tick));
const byId = Object.fromEntries(
  snapshot.stations.map((station) => [station.id, station])
);

snapshot.stations = Object.values(byId).map((station) => ({
  ...station,
  ageMs: Math.max(0, Date.now() - Date.parse(station.observedAt))
}));

msg.statusCode = 200;
msg.payload = snapshot;
return msg;
