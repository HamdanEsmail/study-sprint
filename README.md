# Study Sprint

Pick one study task, run a focus sprint, and keep your queue after you refresh.

No account and no server. Tasks, the timer, and finished sprints stay in this browser.

## Demo

https://hamdanesmail.github.io/study-sprint/

Add `?demo=1` for a 12-second timer if you want to test completion without waiting 25 minutes.

## Features

- Add, complete, delete, and select tasks, with an optional subject
- 25-minute focus and 5-minute break
- Start, pause, and reset
- Queue and timer restore after refresh
- Keyboard: Space starts or pauses, `R` resets, `N` focuses the task field
- Layout stacks the timer above the queue on a phone

## Run locally

```powershell
npm test
npx --yes serve . -p 4173
```

Then open http://localhost:4173

## How it works

| File | Job |
| --- | --- |
| `index.html` | Page structure |
| `css/styles.css` | Layout and styles |
| `js/timer.js` | Timer math |
| `js/tasks.js` | Task create, complete, and delete |
| `js/storage.js` | Saving to `localStorage` |
| `js/app.js` | Events and rendering |

While a sprint is running, remaining time is `endAt - Date.now()`. The interval only redraws the clock. Finishing a sprint adds one log entry and does not start the next mode by itself.

## Privacy

Everything is stored in this browser only. Clearing site data deletes the queue. There is no login, sync, or notifications.
