'use strict';

/* ===========================================================
   Splitwatch
   Timestamp-based stopwatch: elapsed time is always derived
   from performance.now() rather than incremented by a tick
   count, so drift from delayed browser callbacks never
   accumulates.
   =========================================================== */

(() => {
  const STORAGE_THEME_KEY = 'splitwatch:theme';
  const STORAGE_LAPS_KEY = 'splitwatch:state';

  // ---- DOM references ----
  const primaryBtn   = document.getElementById('primaryBtn');
  const lapBtn        = document.getElementById('lapBtn');
  const resetBtn       = document.getElementById('resetBtn');
  const clearLapsBtn    = document.getElementById('clearLapsBtn');

  const minutesEl = document.getElementById('minutes');
  const secondsEl  = document.getElementById('seconds');
  const centisEl    = document.getElementById('centis');

  const statusLed  = document.getElementById('statusLed');
  const statusText  = document.getElementById('statusText');
  const ticksWrap    = document.getElementById('ticks');

  const lapsBody     = document.getElementById('lapsBody');
  const lapsEmptyRow  = document.getElementById('lapsEmptyRow');
  const liveRegion     = document.getElementById('liveRegion');

  const themeBtn   = document.getElementById('themeBtn');
  const themeIcon   = document.getElementById('themeIcon');

  const guideBtn      = document.getElementById('guideBtn');
  const guideDialog    = document.getElementById('guideDialog');
  const closeGuideBtn   = document.getElementById('closeGuideBtn');

  // ---- Stopwatch state ----
  // state: 'idle' | 'running' | 'paused'
  let state = 'idle';
  let accumulatedMs = 0;   // time banked before the current running segment
  let segmentStart = null; // performance.now() when the current segment began
  let rafId = null;
  let laps = []; // { n, splitMs, totalMs }

  // ---- Build the 12-segment tick ruler once ----
  const TICK_COUNT = 12;
  const tickEls = [];
  for (let i = 0; i < TICK_COUNT; i++) {
    const t = document.createElement('span');
    t.className = 'tick';
    ticksWrap.appendChild(t);
    tickEls.push(t);
  }

  // ===========================================================
  // Time formatting & rendering
  // ===========================================================

  function currentElapsedMs() {
    if (state === 'running') {
      return accumulatedMs + (performance.now() - segmentStart);
    }
    return accumulatedMs;
  }

  function formatParts(ms) {
    const totalCentis = Math.floor(ms / 10);
    const centis = totalCentis % 100;
    const totalSeconds = Math.floor(totalCentis / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      centis: String(centis).padStart(2, '0'),
      totalSeconds
    };
  }

  function formatShort(ms) {
    // used for lap split/total cells, e.g. 00:04.58
    const p = formatParts(ms);
    return `${p.minutes}:${p.seconds}.${p.centis}`;
  }

  function renderTime(ms) {
    const p = formatParts(ms);
    minutesEl.textContent = p.minutes;
    secondsEl.textContent = p.seconds;
    centisEl.textContent = '.' + p.centis;

    const filled = Math.floor((p.totalSeconds % 60) / 5);
    tickEls.forEach((el, i) => el.classList.toggle('is-active', i <= filled && ms > 0));
  }

  function renderStatus() {
    const labels = { idle: 'Ready', running: 'Running', paused: 'Paused' };
    statusText.textContent = labels[state];
    statusLed.classList.toggle('is-running', state === 'running');
  }

  function renderButtons() {
    if (state === 'running') {
      primaryBtn.textContent = 'Pause';
      primaryBtn.classList.add('is-running');
      lapBtn.disabled = false;
    } else if (state === 'paused') {
      primaryBtn.textContent = 'Resume';
      primaryBtn.classList.remove('is-running');
      lapBtn.disabled = true;
    } else {
      primaryBtn.textContent = 'Start';
      primaryBtn.classList.remove('is-running');
      lapBtn.disabled = true;
    }
    resetBtn.disabled = state === 'idle' && accumulatedMs === 0 && laps.length === 0;
    clearLapsBtn.disabled = laps.length === 0;
  }

  // ===========================================================
  // Animation loop
  // ===========================================================

  function loop() {
    renderTime(currentElapsedMs());
    if (state === 'running') {
      rafId = requestAnimationFrame(loop);
    }
  }

  function startLoop() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function stopLoop() {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  // ===========================================================
  // Actions
  // ===========================================================

  function announce(msg) {
    liveRegion.textContent = msg;
  }

  function start() {
    if (state === 'running') return;
    segmentStart = performance.now();
    state = 'running';
    startLoop();
    renderStatus();
    renderButtons();
    announce(state === 'running' ? 'Stopwatch started' : '');
  }

  function pause() {
    if (state !== 'running') return;
    accumulatedMs += performance.now() - segmentStart;
    segmentStart = null;
    state = 'paused';
    stopLoop();
    renderTime(accumulatedMs);
    renderStatus();
    renderButtons();
    persist();
    announce('Stopwatch paused at ' + formatShort(accumulatedMs));
  }

  function togglePrimary() {
    if (state === 'running') pause();
    else start();
  }

  function reset() {
    stopLoop();
    state = 'idle';
    accumulatedMs = 0;
    segmentStart = null;
    laps = [];
    renderTime(0);
    renderStatus();
    renderButtons();
    renderLaps();
    persist();
    announce('Stopwatch reset');
  }

  function recordLap() {
    if (state !== 'running') return;
    const total = currentElapsedMs();
    const prevTotal = laps.length ? laps[laps.length - 1].totalMs : 0;
    const split = total - prevTotal;
    const lap = { n: laps.length + 1, splitMs: split, totalMs: total };
    laps.push(lap);
    renderLaps();
    renderButtons();
    persist();
    announce(`Lap ${lap.n} recorded, split ${formatShort(split)}`);
  }

  function clearLaps() {
    if (!laps.length) return;
    laps = [];
    renderLaps();
    renderButtons();
    persist();
    announce('Laps cleared');
  }

  // ===========================================================
  // Lap table rendering
  // ===========================================================

  function renderLaps() {
    lapsBody.querySelectorAll('tr:not(#lapsEmptyRow)').forEach(r => r.remove());

    if (!laps.length) {
      lapsEmptyRow.style.display = '';
      return;
    }
    lapsEmptyRow.style.display = 'none';

    let fastestIdx = 0, slowestIdx = 0;
    if (laps.length >= 3) {
      laps.forEach((l, i) => {
        if (l.splitMs < laps[fastestIdx].splitMs) fastestIdx = i;
        if (l.splitMs > laps[slowestIdx].splitMs) slowestIdx = i;
      });
    }

    // newest lap first, easier to scan while running
    const frag = document.createDocumentFragment();
    for (let i = laps.length - 1; i >= 0; i--) {
      const l = laps[i];
      const tr = document.createElement('tr');
      if (laps.length >= 3 && i === fastestIdx) tr.classList.add('lap-fastest');
      if (laps.length >= 3 && i === slowestIdx) tr.classList.add('lap-slowest');

      const tdN = document.createElement('td');
      tdN.textContent = String(l.n).padStart(2, '0');
      const tdSplit = document.createElement('td');
      tdSplit.textContent = formatShort(l.splitMs);
      const tdTotal = document.createElement('td');
      tdTotal.textContent = formatShort(l.totalMs);

      tr.append(tdN, tdSplit, tdTotal);
      frag.appendChild(tr);
    }
    lapsBody.appendChild(frag);
  }

  // ===========================================================
  // Persistence (theme always; laps/elapsed only when not running)
  // ===========================================================

  function persist() {
    try {
      const payload = {
        accumulatedMs: state === 'running' ? currentElapsedMs() : accumulatedMs,
        laps
      };
      localStorage.setItem(STORAGE_LAPS_KEY, JSON.stringify(payload));
    } catch (e) {
      /* localStorage unavailable — fail silently, timer still works */
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(STORAGE_LAPS_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.accumulatedMs === 'number' && data.accumulatedMs > 0) {
        accumulatedMs = data.accumulatedMs;
        state = 'paused';
      }
      if (Array.isArray(data.laps)) laps = data.laps;
    } catch (e) {
      /* ignore malformed storage */
    }
  }

  // ===========================================================
  // Theme
  // ===========================================================

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeBtn.setAttribute('aria-pressed', String(theme === 'light'));
    try { localStorage.setItem(STORAGE_THEME_KEY, theme); } catch (e) { /* ignore */ }
  }

  function initTheme() {
    let theme;
    try { theme = localStorage.getItem(STORAGE_THEME_KEY); } catch (e) { theme = null; }
    if (!theme) {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light' : 'dark';
    }
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ===========================================================
  // Guide dialog
  // ===========================================================

  function openGuide() {
    if (typeof guideDialog.showModal === 'function') {
      guideDialog.showModal();
    } else {
      guideDialog.setAttribute('open', '');
    }
  }

  function closeGuide() {
    if (typeof guideDialog.close === 'function') guideDialog.close();
    else guideDialog.removeAttribute('open');
  }

  // ===========================================================
  // Keyboard shortcuts
  // ===========================================================

  function onKeydown(e) {
    if (guideDialog.open) return; // let the dialog own its own keys (Esc, etc.)

    const key = e.key.toLowerCase();
    if (key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePrimary();
    } else if (key === 'l') {
      if (!lapBtn.disabled) recordLap();
    } else if (key === 'r') {
      if (!resetBtn.disabled) reset();
    }
  }

  // ===========================================================
  // Wire up
  // ===========================================================

  primaryBtn.addEventListener('click', togglePrimary);
  lapBtn.addEventListener('click', recordLap);
  resetBtn.addEventListener('click', reset);
  clearLapsBtn.addEventListener('click', clearLaps);
  themeBtn.addEventListener('click', toggleTheme);
  guideBtn.addEventListener('click', openGuide);
  closeGuideBtn.addEventListener('click', closeGuide);
  document.addEventListener('keydown', onKeydown);

  guideDialog.addEventListener('click', (e) => {
    const r = guideDialog.getBoundingClientRect();
    const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    if (!inside) closeGuide();
  });

  // ---- init ----
  initTheme();
  restore();
  renderTime(accumulatedMs);
  renderStatus();
  renderButtons();
  renderLaps();
})();
