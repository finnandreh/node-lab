(() => {
  "use strict";
  const set = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  };
  fetch("../api/capture", { headers: { Accept: "application/json" }, cache: "no-store" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((facts) => {
      set("capture-phase", facts.recordingPhase.replaceAll("-", " "));
      set("capture-change", facts.reservedChange.performed ? "performed" : "not performed");
      set("capture-source", facts.sourceRevision);
      set("capture-hash", facts.sourceArchiveSha256);
    })
    .catch(() => set("capture-phase", "facts endpoint unavailable"));
})();
