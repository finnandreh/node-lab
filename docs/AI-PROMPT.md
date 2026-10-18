# Inspectable authoring prompt

Create a polished Node-RED learning project that demonstrates a complete,
truthful continuously updating data path without hardware or AI inference.

## Required live flow

- Generate one fresh backend tick every 1.5 seconds.
- Include exactly three fictional stations with meaningful emulated
  temperature, power and process values.
- Give every tick a unique sample ID and source timestamp.
- For every valid station observation derive `comfort_margin_c` as configured
  demo temperature limit minus validated current temperature, from that same
  sample. Return `null` when the observation is unavailable.
- Expose normal, heating, fault/stale and recovery as allowlisted read-only
  response transformations. Never persist a visitor's selected scenario.
- Show missing/stale data in the fault path and a fresh validated signal in the
  recovery path.
- Separate emulated physical values from actual aggregate application metrics:
  ticks, messages, API responses, uptime and function timing.
- Retain a fixed-value validation lesson for 22 C, 30 C and 34 C, plus rejected
  malformed input that preserves the previous valid display.
- Include generator-aware health, truth and read-only capture endpoints.

## Public presentation

- Make the live simulation disclosure unmistakable.
- Render current values, Comfort margin with Celsius units, health, signal
  age, rolling charts and bounded events.
- Keep history and scenario selection in the open browser tab.
- Link the exact flow JSON, schema, source archive and recording artifacts.
- Use first-party assets only and support desktop and narrow mobile layouts.

## Safety and review

- Disable production editor/admin routes.
- No arbitrary input, URL, method, command, code execution, external action,
  credential, customer data, analytics or third-party browser dependency.
- Use a pinned restricted container and loopback-only default listener.
- Treat generated files as a candidate. Validate JSON and source contracts,
  build the pinned image, exercise all states, check visitor isolation,
  inspect desktop/mobile rendering and retain an exact rollback before release.
