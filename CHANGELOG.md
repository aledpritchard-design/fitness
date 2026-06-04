# Changelog

All notable changes to Activity Snacks are noted here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Version numbers correspond to `app.json`.

---

## [Unreleased] — v1.0.0

Initial build. App created on Replit using Expo SDK 54 and a small Express catalogue server. Not yet submitted to the App Store or Google Play.

### Added

- **Today screen** — daily checklist of bite-sized activities; tap a card to mark it complete; progress card shows the day's completion percentage.
- **Progress screen** — 7-day Mon–Sun grid visualising how consistently the user hit 100% each day.
- **Settings screen** — enable/disable hourly notifications, set the notification window, choose difficulty, refresh the catalogue, and send a debug report.
- **Activity detail view** — per-activity instructions and a safety/contraindication note.
- **Plan generator** — difficulty-weighted daily plan built to an intensity budget (Easy = 12 ±2 points in the MVP); picks one activity from each category for variety, then fills the remaining budget at random.
- **Hourly notifications** — fire within a user-defined time window (default 08:00–20:00); cadence is fixed to hourly in the MVP, with room to extend later.
- **Hidden debug panel** — long-press the Today header to reveal app version, catalogue version, recent logs, and a reset button.
- **Crash recovery** — app-level `ErrorBoundary` wraps the root; shows a branded recovery screen with "Try Again" instead of a white screen of death.
- **Express backend** — serves the activity catalogue (`activities.json`, 60+ exercises across strength, mobility, cardio, and posture) and debug-report endpoints.
- **Local-first persistence** — all user data (daily plans, weekly history, settings, logs, catalogue cache) stored on-device via AsyncStorage; no accounts or cloud database.
- **Light-mode lock** — `useTheme()` hard-coded to the light palette regardless of system appearance; dark palette preserved in `theme.ts` for a future user-controlled toggle.
