# Build decision log

A record of key architectural and design decisions made during development. Newest entry at the top.

Template fields: **date · decision · context · why · impact · status.**

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
