# Reserved Node Lab change request

This request is intentionally not implemented in the `v2.0.0-base` source. It
is reserved for one authentic, coordinated recording after `RECORDING-START`.

> In this existing Node Lab teaching project, add a Comfort margin value to the
> live-generated simulation. Define `comfort_margin_c` as the configured demo
> temperature limit minus the validated current temperature in Celsius. Add
> the calculation to the actual Node-RED data path and a clearly labelled
> dashboard card with units. Keep the current simulation disclosure,
> scenarios, source timestamps, sample IDs, health indicators, invalid-input
> handling and working controls.
>
> Inspect the existing files first. Make the smallest functional change in
> flow/source code rather than moving nodes around. Show the diff. Check a
> below-limit sample, an above-limit sample, the limit itself, a malformed
> sample and recovery. Check the displayed value against the same server
> sample. Preserve the previous valid state on rejected input. Do not expose
> the editor or create a physical-device/AI-inference claim. Use the existing
> project release process and return the exact revision, check results and
> deployed readback. Preserve the baseline for comparison and rollback.
