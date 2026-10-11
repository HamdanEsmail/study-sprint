# Study Sprint

Pick one study task, run a focus sprint, and keep your queue after you refresh.

No account and no server. Tasks, the timer, and finished sprints stay in this browser.

## Demo

https://hamdanesmail.github.io/study-sprint/

Add `?demo=1` for a 12-second timer if you want to test completion without waiting 25 minutes.

## Features

- Add, edit, complete, delete, and select tasks, with an optional subject
- Custom focus and break lengths from 1 to 90 whole minutes; defaults are 25/5
- Start, pause, and reset
- Queue, timer, and chosen lengths restore after refresh
- Filter the queue by subject, including tasks with no subject
- Today's completed focus minutes, using the browser's local calendar
- Export and import JSON backups; older backups keep working
- Keyboard: Space starts or pauses, `R` resets, `N` focuses the task field
- Keyboard shortcuts leave text fields and the subject dropdown alone
- Warm evening-library layout that stacks on a phone

## Run locally

```powershell
npm.cmd test
python -m http.server 4173 --bind 127.0.0.1
```

Then open http://127.0.0.1:4173/ and leave the terminal running. Python 3 and Node.js are needed for these commands. The site itself uses plain HTML, CSS and JavaScript, with no build step or production dependencies.

On Windows PowerShell, `npm.cmd` avoids the script-policy error that can occur with `npm.ps1`.

## How it works

| File | Job |
| --- | --- |
| `index.html` | Page structure |
| `css/styles.css` | Layout and styles |
| `js/timer.js` | Timer math |
| `js/tasks.js` | Task create, edit, complete, and delete |
| `js/storage.js` | Saving to `localStorage` |
| `js/app.js` | Events and rendering |

While a sprint is running, remaining time is `endAt - Date.now()`. The interval only redraws the clock. Finishing a sprint adds one log entry and does not start the next mode by itself.

Changing timer lengths requires a paused timer and resets that timer. Filtering changes the visible queue while preserving the selected timer task. The filter returns to All subjects on refresh or backup import.

The daily total includes completed focus sessions from the stored history, using their actual finish timestamps. Breaks and previous days are excluded. Up to 40 finished sessions are retained. The 12-second demo contributes 0.2 minutes when completed; use a separate browser profile or local origin for disposable tests.

## Try it

1. Add two tasks with different subjects and select one.
2. Set focus/break lengths to 15/3, then start and pause the timer.
3. Filter to the other subject. The original timer task stays selected, with an explanatory note.
4. Refresh to check that the tasks and timer settings remain.
5. Export a backup before clearing browser data or testing imports. Importing a valid backup replaces the current saved state after confirmation.

## Development

Built by Hamdan Esmail The project is a personal learning project; development notes describe the implemented changes and checks.

## Privacy

Everything is stored in this browser only. Clearing site data deletes the queue. There is no login, sync, or notifications.
