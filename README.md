# Activity Snacks

A mobile fitness app that helps you combat sedentary behaviour with quick, achievable movement breaks ("activity snacks") throughout the day. It generates a daily checklist of short exercises, nudges you with hourly reminders, and tracks your weekly consistency.

Built with Expo (React Native) for the app and a small Express backend that serves the exercise catalogue.

---

## What it does

- **Today** — A daily checklist of bite-sized activities. Tap a card to mark it complete; a progress card shows your completion percentage for the day.
- **Progress** — A 7-day grid (Mon–Sun) visualising how consistently you hit 100% each day.
- **Settings** — Enable/disable hourly notifications, set the time window they fire within, choose difficulty (Easy in the MVP), refresh the activity catalogue, and send a debug report.
- **Activity detail** — Each activity has instructions and a safety/contraindication note.
- **Debug panel** — A hidden developer overlay (long-press the Today header) showing app version, catalogue version, and recent logs.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| App framework | Expo SDK 54, React Native 0.81, React 19 |
| Language | TypeScript |
| Navigation | React Navigation 7 (bottom tabs + native stacks) |
| Data fetching | TanStack Query (`@tanstack/react-query`) |
| Local persistence | AsyncStorage (all user data lives on-device) |
| Notifications | `expo-notifications` (hourly, within a user-set window) |
| Animations | `react-native-reanimated`, `react-native-gesture-handler` |
| Backend | Express 5 + `tsx`, serving a static JSON catalogue |
| Styling | Central theme tokens in `client/constants/theme.ts` (no CSS) |

---

## Project structure

```
client/                 Expo React Native app
  App.tsx               Root component (fonts, providers, ErrorBoundary)
  components/           Reusable UI (ActivityCard, ProgressBar, WeeklyGrid, etc.)
  constants/theme.ts    Colors, spacing, typography, border radius
  hooks/                useTheme, useColorScheme, useScreenOptions
  lib/                  storage, notifications, planGenerator, query-client
  navigation/           Root stack + 3 tab stacks (Today / Progress / Settings)
  screens/              TodayScreen, ProgressScreen, SettingsScreen
server/                 Express backend
  index.ts              Server entry
  routes.ts             API endpoints
  activities.json       60+ pre-seeded exercises (the catalogue)
shared/                 Types shared between client and server
  types.ts              Activity, DailyPlan, AppSettings, etc.
```

---

## Backend API

The Express server runs on port **5000** and serves the exercise catalogue plus debug endpoints. The app itself runs on port **8081** (Expo).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/health` | Status, catalogue version, activity count |
| `GET` | `/api/activities` | The full activity catalogue |
| `POST` | `/api/log` | Receive a debug report from the app |
| `GET` | `/api/debug-reports` | List recent debug reports (in-memory) |

---

## Running it locally (on Replit)

Two workflows are configured:

- **Start Backend** — `npm run server:dev` (Express on port 5000)
- **Start Frontend** — `npm run expo:dev` (Expo dev server on port 8081)

Both start automatically. After backend changes, restart **Start Backend**. The frontend has hot reload, so most changes appear without a restart.

### Testing on your phone

1. Install **Expo Go** from the App Store / Play Store.
2. Open the QR code from the Replit URL bar menu (or the Expo dev server output).
3. Scan it — the app loads on your device.

> Note: `expo-notifications` has limited support in Expo Go (SDK 53+). Hourly reminders are best verified in a development build.

---

## Getting it onto a device via TestFlight

Replit can't produce a signed iOS build directly — that requires Apple's signing pipeline. The standard path:

1. Push this repo to GitHub (already set up — see below).
2. On your own machine, install EAS CLI and run `eas build --platform ios` (needs a paid Apple Developer account, $99/yr).
3. Submit the build to App Store Connect with `eas submit`, then invite testers via TestFlight.

---

## Working with GitHub

This project is connected to `https://github.com/aledpritchard-design/fitness`.

- **To push changes:** open the **Git** pane in Replit, enter a commit message, and click **Sync** (or Commit & Push).
- **First-time sync:** if GitHub already had an initial commit, use Sync once to pull it down and merge before pushing your local history.
- Secrets (e.g. `SESSION_SECRET`) live in Replit's secrets manager, **not** in the code, so nothing sensitive is committed.

---

## Design decisions & history

This section records the key choices that shaped the app, and why.

### 1. Aesthetic: "Athletic Minimalism"
Inspired by Nike's design language — bold confidence through restraint. Clean white backgrounds, a single energetic accent (orange `#FF6B35`), near-black text, and flat cards with subtle borders rather than shadows. The goal: maximum clarity, every element earning its place. The signature interaction is the satisfying tap-to-complete on activity cards, with instant visual feedback (scale + checkbox bounce) that makes ticking off exercises feel rewarding.

### 2. Three-tab architecture
The app deliberately stays small: **Today** (do the work), **Progress** (see consistency), **Settings** (configure). This keeps the daily loop friction-free — the most common action (checking off an activity) is always one tap from launch.

### 3. Local-first persistence (AsyncStorage)
All user data — daily plans, weekly history, settings, debug logs, cached catalogue — is stored on-device via AsyncStorage. There's no user accounts or cloud database. This was a conscious MVP decision: it keeps the app private, fast, and fully functional offline. The backend's only job is to serve the shared exercise catalogue, not to store personal data.

Storage keys: `daily_plan_{date}`, `weekly_history`, `settings`, `debug_logs`, `activities_cache`, `catalogue_version`.

### 4. Backend as a catalogue server only
The Express backend serves a static, versioned `activities.json` (60+ exercises across four categories: strength, mobility, cardio, posture). Keeping the catalogue server-side means it can be updated and re-versioned without shipping a new app build, while the heavy lifting (plan generation, completion tracking) all happens on the client.

### 5. Difficulty-weighted plan generation
Each activity has an `intensity` score. A daily plan is generated to hit a target intensity budget (Easy = 12 points, Medium = 18, Hard = 24, with a ±2 tolerance). The generator first picks one activity from each category for variety, then fills the remaining budget randomly. Only **Easy** is enabled in the MVP; Medium/Hard are defined but disabled in the UI, leaving room to grow without rework.

### 6. Hourly notifications within a window
Reminders fire hourly, but only inside a user-defined time window (default 8am–8pm) so the app never nudges you while you sleep. Frequency is fixed to "Hourly" in the MVP, with the data model already allowing other cadences later.

### 7. Hidden debug panel
A long-press on the Today header reveals a developer overlay (app version, catalogue version, recent logs) and unlocks a reset button. This keeps diagnostic tooling out of the everyday UI while making support and testing easy.

### 8. Robust crash handling
The entire app is wrapped in an `ErrorBoundary` that shows a friendly, branded recovery screen with a "Try Again" button (using Expo's `reloadAppAsync`) instead of a white screen of death.

### 9. Light-mode lock (most recent change)
The theme originally followed the device's system appearance via `useColorScheme()`, which meant the app rendered dark on phones set to dark mode. Per the desired lighter look, `useTheme()` is now hard-locked to the light palette (`isDark = false`) regardless of system setting. The dark palette remains defined in `theme.ts`, so a future in-app Light/Dark/System toggle could be added without redoing the colours.

---

## License / disclaimer

This app provides general movement suggestions and is not medical advice. Each activity includes a contraindication note; users should consult a professional before starting any new exercise routine.
