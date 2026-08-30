# Splitwatch

A browser-based stopwatch with accurate timing and lap splits, styled as a
small precision-timing instrument rather than a generic form.

## Purpose

Splitwatch measures elapsed time and records individual lap ("split") times
directly in the browser — no build step, no server, no dependencies beyond
two Google Fonts.

## Features

- Start / Pause / Resume / Reset
- Lap recording with per-lap split and running total
- Fastest / slowest lap highlighting (once 3+ laps are recorded)
- Timestamp-based timing — accurate even if the browser throttles callbacks
- Light and dark themes, remembered per device
- Keyboard shortcuts: `Space` start/pause, `L` lap, `R` reset
- Built-in user guide (dialog)
- Fully responsive, down to small phones
- Accessible: semantic HTML, visible focus states, `aria-live` status
  announcements, keyboard-operable throughout
- Laps and elapsed time (when paused) are restored on page reload

## Technologies used

- HTML5
- CSS3 (custom properties for theming, CSS Grid, no framework)
- Vanilla JavaScript (`requestAnimationFrame`, no libraries)

No React, build tooling, or backend of any kind.

## How the stopwatch works

Rather than incrementing a counter on every timer tick — which drifts as
soon as the browser delays a callback — Splitwatch stores two things:

- `accumulatedMs`: time already banked from previous run segments
- `segmentStart`: the `performance.now()` timestamp when the current run
  segment began

On every animation frame, elapsed time is **recomputed** as:

```
elapsed = accumulatedMs + (performance.now() - segmentStart)
```

Pausing simply folds the current segment into `accumulatedMs` and clears
`segmentStart`. This means the displayed time is always derived from real
timestamps, never from a running sum of small increments, so it stays
accurate across pauses, resumes, and any frame-rate hiccups.

Laps store both the **split** (time since the previous lap) and the
**total** (time since Start), computed from the same elapsed-time function.

## How to run

No build step required.

```bash
# Option 1 — just open it
open index.html          # macOS
start index.html         # Windows
xdg-open index.html      # Linux

# Option 2 — serve it locally (recommended for consistent font loading)
python3 -m http.server 8000
# then visit http://localhost:8000
```

To deploy, push the folder to a static host such as GitHub Pages, Netlify,
or Vercel — it's plain static files.

## Project structure

```
stopwatch-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
└── README.md
```

## Future improvements

- Exportable lap history (CSV)
- Multiple named timers / sessions
- PWA support for offline use and installability
- Unit tests for the time-formatting and lap-calculation logic
- Sound/vibration cue on lap or on round-minute marks
