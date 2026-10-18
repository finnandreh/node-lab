# Node Lab

Node Lab is a small, inspectable Node-RED lesson: send a synthetic temperature,
validate it, apply a 30 C threshold, and render the explicit result. The public
interface and API are real; the sensor values are deliberately synthetic.

The demo proves this sequence:

1. `22 C` -> `NORMAL OPERATION`
2. `34 C` -> `HIGH TEMPERATURE`
3. `22 C` -> `NORMAL OPERATION`
4. `99 C` -> HTTP `400`, with the last accepted browser state unchanged

It does **not** connect a physical device, expose the Node-RED editor, call an
AI inference API, or retain shared visitor state.

## Start locally

Requirements: Docker Engine with Compose v2.

```bash
docker compose -p node-lab-example up --detach --build
curl --fail http://127.0.0.1:1880/healthz
```

Open <http://127.0.0.1:1880/>. The default Compose listener is loopback-only.

Stop without deleting the named volume:

```bash
docker compose -p node-lab-example stop
```

See [RUNBOOK.md](RUNBOOK.md) for status, health, update, backup, restore and
explicit reset procedures.

## Inspect the work

- [Flow JSON](node-red/flows.json)
- [Authoring prompt](docs/AI-PROMPT.md)
- [Ten-minute recording storyboard](docs/DEMO-STORYBOARD.md)
- [Telemetry result schema](telemetry.schema.json)
- [Security and truth boundary](SECURITY.md)
- [Credits](CREDITS.md)

The production learning page is
<https://teachthecompany.com/node-lab/> and the public repository is
<https://github.com/finnandreh/node-lab>.

## AI assistance

OpenAI Codex assisted with the flow and public explanation. Humans reviewed
the generated artifacts, ran the deterministic checks, and controlled the
release. There is no model endpoint behind the demo.

## License

Apache License 2.0. Node-RED and FlowFuse retain their own licenses and marks;
see [CREDITS.md](CREDITS.md).
