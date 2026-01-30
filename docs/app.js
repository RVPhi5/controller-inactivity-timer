(() => {
  const dot = document.getElementById("dot");
  const statusText = document.getElementById("statusText");
  const controllerName = document.getElementById("controllerName");

  const timerText = document.getElementById("timerText");
  const modeText = document.getElementById("modeText");

  const minutesInput = document.getElementById("minutes");
  const axisIndexInput = document.getElementById("axisIndex");
  const thresholdInput = document.getElementById("threshold");

  const resetBtn = document.getElementById("resetBtn");
  const debugBtn = document.getElementById("debugBtn");
  const debugPanel = document.getElementById("debugPanel");
  const debugPre = document.getElementById("debugPre");
  const liveAxisText = document.getElementById("liveAxisText");

  let gpIndex = null;

  // Stick release detection state
  let lastPulledLeft = false;

  // Timer state
  let timerRunning = false;
  let timerEndMs = null;

  // Hysteresis: avoid false "release" due to small stick jitter near threshold
  const releaseGate = -0.20; // must return past this toward center to count as released

  function fmtMs(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = String(Math.floor(total / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${m}:${s}`;
  }

  function getDurationMs() {
    const mins = Number(minutesInput.value || 15);
    return mins * 60 * 1000;
  }

  function setConnectedUI(connected, name = "—") {
    dot.className = "dot " + (connected ? "ok" : "bad");
    statusText.textContent = connected ? "Controller connected" : "No controller detected";
    controllerName.textContent = name;
  }

  function hardReset() {
    timerRunning = false;
    timerEndMs = null;
    lastPulledLeft = false;
    modeText.textContent = "Waiting for release…";
    timerText.textContent = fmtMs(getDurationMs());
  }

  function startTimer() {
    timerRunning = true;
    timerEndMs = performance.now() + getDurationMs();
    modeText.textContent = "Released → timer running";
  }

  function cancelTimer() {
    timerRunning = false;
    timerEndMs = null;
    modeText.textContent = "Pulled left again → timer canceled (waiting for release…)";
    timerText.textContent = fmtMs(getDurationMs());
  }

  resetBtn.addEventListener("click", hardReset);
  debugBtn.addEventListener("click", () => {
    debugPanel.hidden = !debugPanel.hidden;
  });

  window.addEventListener("gamepadconnected", (e) => {
    gpIndex = e.gamepad.index;
    setConnectedUI(true, e.gamepad.id);
  });

  window.addEventListener("gamepaddisconnected", (e) => {
    if (gpIndex === e.gamepad.index) gpIndex = null;
    setConnectedUI(false);
    hardReset();
  });

  function loop() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp = (gpIndex != null) ? pads[gpIndex] : (pads && pads[0]);

    if (!gp) {
      setConnectedUI(false);
      timerText.textContent = fmtMs(getDurationMs());
      requestAnimationFrame(loop);
      return;
    }

    if (gpIndex == null) gpIndex = gp.index;
    setConnectedUI(true, gp.id);

    const axisIndex = Number(axisIndexInput.value || 0);
    const threshold = Number(thresholdInput.value || 0.6);

    const x = gp.axes[axisIndex] ?? 0;
    liveAxisText.textContent = `axis ${axisIndex} x=${x.toFixed(3)}`;

    const pulledLeft = x <= -threshold;

    // release event: was pulled left, now returned closer to center
    const released = lastPulledLeft && (x > releaseGate) && !pulledLeft;

    if (released) startTimer();
    if (timerRunning && pulledLeft) cancelTimer();

    if (!debugPanel.hidden) {
      debugPre.textContent =
        `id: ${gp.id}\n` +
        `axes(${gp.axes.length}): [${gp.axes.map(v => v.toFixed(3)).join(", ")}]\n` +
        `buttons(${gp.buttons.length}): pressed=${gp.buttons.filter(b => b.pressed).length}\n` +
        `pulledLeft=${pulledLeft} released=${released}`;
    }

    if (timerRunning) {
      const remaining = timerEndMs - performance.now();
      if (remaining <= 0) {
        timerRunning = false;
        timerEndMs = null;
        timerText.textContent = "00:00";
        modeText.textContent = "⏰ TIME’S UP!";
      } else {
        timerText.textContent = fmtMs(remaining);
      }
    } else {
      timerText.textContent = fmtMs(getDurationMs());
    }

    lastPulledLeft = pulledLeft;
    requestAnimationFrame(loop);
  }

  hardReset();
  loop();
})();
