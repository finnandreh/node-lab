# Node Lab authoring prompt

The complete authoring prompt used for this release is published in the
source repository at `docs/AI-PROMPT.md`.

Build a transparent Node-RED lesson with fixed synthetic 22 C, 30 C and 34 C
input, strict rejection of malformed public values, one visible 30 C threshold,
and explicit JSON output. Derive `comfort_margin_c` as configured limit minus
validated current temperature from the same sample, return unavailable for a
missing observation, and show the value with Celsius units. Keep browser
history per visitor. State that no physical device or live AI inference exists.
Disable the production editor and expose no arbitrary command, code or external
action.

Source: https://github.com/finnandreh/node-lab/blob/main/docs/AI-PROMPT.md
