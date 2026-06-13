# Build decision log

A record of key architectural and design decisions made during development. Newest entry at the top.

Template fields: **date · decision · context · why · impact · status.**

---

## 2026-06-13 — v1 new-feature scope

**Decision:** Ship three new features in v1 — streaks/simple milestones (APP-118), adjustable reminder frequency (APP-146), and snooze/"not now" reminder action (APP-147). Defer medium/hard difficulty unlock to post-launch feedback. Defer accounts, cloud sync, social, and Apple Health to v2.

**Context:** APP-115 (lock the v1 new-feature scope) called for a deliberate short list. The priority is a solid, quick launch followed by real-user feedback rather than pre-shipping every candidate. Candidates were evaluated by value-for-effort.

**Why:** Streaks are the highest-value motivator for a habit app and are cheap to build on top of existing weekly history. Adjustable reminder frequency and snooze/not-now improve the notification experience with minimal effort. Difficulty unlock is already modelled in the generator but deferred because it adds complexity without a clear signal that users need it before first use. v2 features (accounts, sync, social) require significant infrastructure and should wait for validated demand.

**Impact:** APP-118, APP-146, and APP-147 are confirmed in scope for v1. Difficulty unlock stays in Backlog until post-launch data is available. v2 scope is recorded here as a reference point.

**Status:** Decided — delegated recording to APP-118 run (Aled, 2026-06-09).

---

## 2026-06-01 — Bundle the activity catalogue with the app

**Decision:** Move `activities.json` from the Express server into the app bundle (client assets), fetched locally rather than over HTTP.

**Context:** The current architecture has `activities.json` hosted by the Express backend (`GET /api/activities`). The client fetches it on first launch and caches it via AsyncStorage. The catalogue is static between releases and never differs per-user.

**Why:** Serving a static file over HTTP adds an unnecessary runtime dependency on a running server. Bundling it removes that dependency, makes the app fully self-contained from first launch, and simplifies the overall architecture. Offline reliability improves as a side-effect.

**Impact:** The `/api/activities` endpoint can be retired once the change ships. Catalogue updates will require a new app build and store release rather than a server-side file swap. Versioning moves from an API field to a constant in the client.

**Status:** Decided — pending implementation.

---

## 2026-05-21 — Lock the app to light mode

**Decision:** Hard-lock `useTheme()` to the light palette, ignoring the device's system appearance setting.

**Context:** The theme hook originally called `useColorScheme()` to follow the system. On phones set to dark mode, the app rendered with a dark palette — inconsistent with the intended "Athletic Minimalism" look (white backgrounds, high-contrast orange accent).

**Why:** Aled asked to revert to the lighter look. The aesthetic depends on a clean white canvas; dark mode inverts the design assumptions. An in-app toggle is left for a later iteration, not the MVP.

**Impact:** All users see the light palette regardless of system setting. The dark palette remains defined in `client/constants/theme.ts` so a future Light/Dark/System toggle can be added without redoing the colours.

**Status:** Implemented — `client/hooks/useTheme.ts`, commit `9258051`.
