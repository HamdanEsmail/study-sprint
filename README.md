# Study Sprint

Pick one study task, run a focus sprint, and keep the queue after you refresh. This is a local-first browser app for Hack Club Terra: no account, no server, and no fake study statistics.

**Status:** first working version, 10 October 2026. Prep Week 2.

## Try it

Live demo: https://hamdanesmail.github.io/study-sprint/

Source: https://github.com/HamdanEsmail/study-sprint

Add `?demo=1` to the URL for a 12-second timer while you test completion without waiting 25 minutes.

Run locally:

```powershell
npm test
npx --yes serve . -p 4173
```

Then open http://localhost:4173

## What works

- Add, complete, delete, and select tasks, with an optional subject
- 25-minute focus and 5-minute break, using an end timestamp rather than counting interval ticks
- Start, pause, and reset without creating a second clock
- Tasks, timer, and finished sprints restore after refresh
- Space starts or pauses, `R` resets, `N` focuses the task field
- Phone-width layout stacks the timer above the queue

## How it works

| File | Job |
| --- | --- |
| `index.html` | Page structure and labels |
| `css/styles.css` | Library-desk layout: cobalt timer, ruled queue |
| `js/timer.js` | Pure timer math |
| `js/tasks.js` | Task create/toggle/delete |
| `js/storage.js` | Versioned `localStorage`, with recovery from bad data |
| `js/app.js` | Events, rendering, keyboard |

The remaining time while running is `endAt - Date.now()`. The 250ms interval only redraws the clock. Completing a sprint writes one session log entry and does not start the next mode by itself.

## Limits

- Data stays in this browser. Clearing site data deletes the queue.
- There is no account, sync, notification permission, or Hackatime connection inside the app.
- Minutes shown here are study minutes, not Terra coding hours.

## Terra notes

Work done during prep weeks is useful practice and can earn prep water, but it is not the Week 1 required-week entry. If this app is started in prep, Week 1 should be a real update with new work.

AI helped write the first version. Review the files, run the tests, and change something yourself before treating a session as finished.
