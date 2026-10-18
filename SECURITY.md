# Security and truth boundary

- Public input is restricted to exact JSON numeric samples `22` and `34` and an
  exact configured same-origin request. The deliberate `99` test returns 400.
- The production `httpAdminRoot` is `false`, disabling both editor and admin
  API. The supplied editor profile conditionally mounts `/admin`,
  binds to loopback and uses a separate volume.
- The container runs as a non-root user with a read-only root filesystem,
  dropped capabilities, `no-new-privileges`, resource limits and no Docker
  socket.
- The runtime network is internal. Browser assets are first-party, with no
  analytics, account, cookie, external font, model API, hardware bridge or
  customer data.
- Visitor history exists only in the open browser tab.

This is an educational synthetic demonstration, not an industrial control
system, safety controller or proof of physical hardware behavior.

Report security concerns privately to the repository owner. Do not include
credentials or sensitive production details in a public issue.
