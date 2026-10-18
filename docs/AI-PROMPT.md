# Inspectable authoring prompt

Create a small Node-RED learning project that demonstrates a complete,
truthful data path without connecting hardware or an AI inference service.

## Required flow

- Receive a same-origin JSON temperature from a public page.
- Accept only the fixed synthetic values 22 C and 34 C.
- Reject every other value, including the explicit test value 99 C, with HTTP
  400 before state presentation changes.
- Apply one visible rule: alert when temperature is greater than or equal to
  30 C.
- Return JSON containing the accepted value, threshold, status, synthetic
  source label and normal/alert sequence.
- Include private-editor inject nodes for 22 C and 34 C and a debug result.
- Include a health endpoint and a truth endpoint.

## Public presentation

- Explain input -> validation -> threshold -> output.
- Show real normal, alert and recovery interactions.
- Keep history per browser tab; do not create shared public writable state.
- State clearly that no device and no live AI inference are connected.
- Link the exact prompt, flow JSON, source and recording storyboard.

## Safety

- Disable production editor/admin routes.
- No arbitrary input, URL, method, command, code execution, external action,
  credential, customer data, analytics or third-party browser dependency.
- Use a pinned, restricted Docker runtime with a loopback-only default.

## Review instruction

Treat generated files as a candidate. Validate JSON, build the pinned image,
exercise accepted/rejected cases, inspect the public authorization boundary,
check desktop/mobile rendering, and retain a scoped rollback before release.

