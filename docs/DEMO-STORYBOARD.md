# Node Lab — ten-minute recording storyboard

This is a plan for a later recording. No film is generated or published by the
Node Lab release.

## 0:00 — The problem

Show how a small automation can become impossible to trust when the input,
decision rule and output are hidden. Introduce the goal: one transparent flow
with synthetic data and no hardware claim.

## 0:45 — Open Node Lab

Open the public page. Point out the **synthetic data**, **no hardware**, and
**no live AI inference** labels before interacting.

## 1:30 — Start Docker

In a clean local clone, run `docker compose -p node-lab-example up --detach
--build`, inspect `docker compose -p node-lab-example ps`, and request
`/healthz`. Mention the named volume,
loopback-only listener and non-root restrictions.

## 2:30 — Inspect the flow

Start the separate loopback-only editor profile. Walk from HTTP input through
the allowlist function, 30 C function and HTTP response. Show the two private
inject nodes. Never expose or proxy the editor.

## 4:00 — Normal and alert

On the public page send 22 C, then 34 C. Read the actual JSON in browser
developer tools and correlate it with the visible chart and status.

## 5:15 — Edit the threshold privately

In a disposable local editor copy, change the threshold to demonstrate where
the decision lives. Do not alter the public runtime. Revert or discard the
local edit after the explanation.

## 6:15 — Failure and recovery

Send invalid 99 C and show HTTP 400 with the previous accepted state retained.
Then send 22 C and show recovery to normal.

## 7:15 — AI prompt and artifact review

Open `docs/AI-PROMPT.md` beside `node-red/flows.json`. Explain that Codex
assisted source authoring, while deterministic validation and a human-owned
release gate decided what shipped. Do not describe scripted output as live AI.

## 8:30 — Reproduce from source

Open the public repository, clone anonymously, build, run the contract test,
and compare the local commit to the release reference.

## 9:30 — Limits and next step

Close with the exact limits: synthetic samples, no sensor, no actuator, no
customer data, no live model, and no industrial safety claim. A future physical
integration needs its own hardware, security and fail-safe acceptance.
