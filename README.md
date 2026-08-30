# Splitwatch — Precision Stopwatch

A modern, responsive stopwatch web application designed for accurate time measurement and lap tracking.

## Overview

**Splitwatch** provides a simple and user-friendly interface for measuring elapsed time, recording lap splits, and reviewing total timing data. The stopwatch calculates elapsed time using browser timestamps to reduce timing drift caused by delayed timer callbacks.

## Features

* Start, pause, and resume stopwatch
* Reset stopwatch
* Record multiple lap times
* Display lap split and total time
* Identify fastest and slowest laps
* Light and dark mode
* Theme preference saved locally
* Lap and stopwatch state persistence
* Keyboard shortcuts
* Responsive design for desktop, tablet, and mobile
* Accessible controls and status feedback
* User Guide built into the application

## Keyboard Shortcuts

| Key     | Action                 |
| ------- | ---------------------- |
| `Space` | Start / Pause / Resume |
| `L`     | Record Lap             |
| `R`     | Reset                  |

## How Timing Works

The stopwatch uses `performance.now()` to calculate elapsed time instead of simply increasing a counter at fixed intervals.

The basic calculation is:

```text
elapsed time = accumulated time + current timestamp - segment start
```

This approach helps maintain accurate timing even when browser rendering or callbacks are delayed.

## Technologies Used

* HTML5
* CSS3
* JavaScript
* Browser Local Storage
* Web APIs such as `performance.now()` and `requestAnimationFrame()`

## Project Structure

```text
stopwatch-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── script.js
├── assets/
│   └── icons/
└── README.md
```

## Run Locally

This project does not require a framework or build process.

### Option 1 — Open directly

Open:

```text
index.html
```

in a web browser.

### Option 2 — Run a local server

Using Python:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Use Cases

Splitwatch can be used for:

* Workout and exercise timing
* Sports practice
* Experiments
* Productivity sessions
* Performance testing
* General time interval measurement

## Future Improvements

Possible future enhancements include:

* Export laps to CSV
* Save named stopwatch sessions
* Progressive Web App (PWA) support
* Automated testing
* Sound or vibration notifications
* Multiple stopwatch sessions

## License

This project is licensed under the MIT License.
get the zip file 
Overview 
<img width="1247" height="486" alt="image" src="https://github.com/user-attachments/assets/86c94aba-4b56-445d-918d-fa786bc26e89" />
<img width="1452" height="571" alt="image" src="https://github.com/user-attachments/assets/8ba5f483-15cb-48a8-9d1d-29c28fdb016a" />


