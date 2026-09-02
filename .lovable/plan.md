# Real-data overhaul: timetable upload, no mock data, clear button

The app currently runs on hardcoded demo teachers, a demo timetable, demo punches and randomly generated history. This change makes it run purely on the files you upload.

## 1. Timetable upload becomes real

The sample file's "Ind TT-2026-2027" sheet is a grid of per-faculty blocks laid out two blocks per row:

```text
Dr. P. Chitra                 <- faculty name
        1   2   3   4  5  6  7   <- hour header
1           AOOP                 <- day rows 1..5 = Mon..Fri
2           AOOP
3       AOOP
...
```

Parser logic:
- Scan every cell of the sheet. A cell whose next-row neighbour starts the `1 2 3 4 5 6 7` hour header marks the start of a faculty block; the cell text is the faculty name.
- Read the following 5 rows as Mon-Fri; for each day, the first hour column containing a non-empty subject is that day's first class hour (also keep the subject code for display).
- Build the active timetable as `{ teacherName: { Mon: hourNumber, ... } }`. Days with no entry mean no class (holiday for that teacher).
- The parsed teacher list fully replaces the roster; the old hardcoded `TEACHERS` / `TIMETABLE` constants are deleted.

## 2. Deadlines and cross-verification

- Hour 1 -> deadline 07:55, hour 2 -> 08:40, any other hour -> 09:00.
- Punch parsing matches names from the punch sheet against the **active uploaded timetable** only (normalised: case, extra spaces, titles, dots).
- Today's records are derived state (`useMemo`) over `(timetable, punchMap, now)`, so uploading either file instantly recalculates everything. Uploading a new timetable re-evaluates existing punches against the new schedule with no stale cache.
- A teacher scheduled today with no punch is `Waiting` before their deadline, `Absent` after it.

## 3. Purge all mock data

Delete: `TEACHERS`, `TIMETABLE`, `BASE_PUNCHES`, `PENDING_PUNCHES`, `punchSheet`, `seeded`, `buildHistory`, the simulated auto-sync punch injection, and the demo-date constants used to fabricate rows.

Empty defaults: today's records `[]`, history `[]`. Every screen (dashboard table, needs-attention, charts, history table, teacher search) shows a "No data available - upload a timetable and punch sheet" empty state when there is nothing.

## 4. History storage (LocalStorage, real records only)

- Key `ff_history_store`, shape `{ "YYYY-MM-DD": [ {teacher, dept, status, delay, deadline, punch} ] }`.
- Whenever today's records change from a real upload, the current day is written (upsert on that date key).
- History page reads only this store: date-range filter, teacher search, charts, absent/late summary and Excel/PDF exports all operate on saved records. Empty store -> "No data available".

## 5. Clear Punch Sheet

- Button on the dashboard clears the punch map and today's derived rows to empty, leaving no ghost rows.
- It removes today's entry from the active view only; past dates in LocalStorage are untouched, so History still shows previous days.

## Technical notes

- All work is in `src/components/FacultyFlow.jsx`; parsing helpers (`parseTimetableFile`, `parsePunchFile`, history store I/O) go in the helper block at the top of the file.
- `xlsx` is already installed and dynamically imported; `jspdf` / `jspdf-autotable` stay wired to the History exports.
- Code written compactly, no comments.
- Verification: production build plus a browser pass that uploads the sample timetable and confirms rows render, clear works, and History persists.
