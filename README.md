# Node Lab

Node Lab is an inspectable Node-RED workshop simulation. Its backend generates a
fresh sample every 1.5 seconds for three fictional stations: CNC Cell, Curing
Oven and Packing Line. The process values are emulated; the ticks, messages,
uptime and generation timing are measured from the running application.

The public interface demonstrates:

- continuously generated temperature, power and process values;
- normal, heating, fault/stale and recovery views scoped to one visitor's
  read-only response;
- a same-sample Comfort margin derived from each configured temperature limit
  and validated observation, with unavailable state for missing data;
- bounded event history and rolling charts in the open browser tab;
- a retained validation lesson where 22 C, 30 C and 34 C are accepted, while
  malformed values are rejected without replacing the last valid result;
- source, schema and capture artifacts that can be inspected and reproduced.

It does **not** connect physical hardware, store a shared visitor scenario,
expose the Node-RED editor, call an AI inference API or use customer data.

## Start locally

Requirements: Docker Engine with Compose v2.

    docker compose -p node-lab-example up --detach --build
    curl --fail http://127.0.0.1:1880/healthz
    python3 tests/test_contract.py --base http://127.0.0.1:1880 --origin http://127.0.0.1:1880

Open http://127.0.0.1:1880/. The default listener is loopback-only.

    docker compose -p node-lab-example stop

See RUNBOOK.md for the complete reusable lifecycle.

## Inspect the work

- Flow JSON: node-red/flows.json
- Workshop snapshot schema: telemetry.schema.json
- Authoring prompt: docs/AI-PROMPT.md
- Recording storyboard: docs/DEMO-STORYBOARD.md
- Security and truth boundary: SECURITY.md
- Credits: CREDITS.md

The production learning page is
https://teachthecompany.com/node-lab/ and the public repository is
https://github.com/finnandreh/node-lab.

## AI assistance

OpenAI Codex assisted source authoring, review and deterministic checks under
Finn's deployment authorization. There is no model endpoint behind the demo.

## License

Apache License 2.0. Node-RED and FlowFuse retain their own licenses and marks;
see CREDITS.md.
