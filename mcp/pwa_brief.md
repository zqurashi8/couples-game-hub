# Couples Game Hub PWA brief

## Goals
- Convert current website into a high quality PWA.
- Modern but fun design. Couples should want to return.
- Must remain fast, accessible, and responsive.

## Scope rules
- Prefer minimal changes.
- Avoid new frameworks.
- Only touch these areas unless absolutely necessary:
  - index.html
  - css/ (hub styles only)
  - js/ (hub scripts only)
  - add manifest + service worker + icons in assets/
  - update each game page only if required for offline support or theme consistency

## PWA requirements
1) Web App Manifest
- Add /manifest.webmanifest
- Name: Couples Game Hub
- Short name: Game Hub
- start_url: /couples-game-hub/index.html
- scope: /couples-game-hub/
- display: standalone
- background_color + theme_color: match new theme
- icons: 192, 512, 512 maskable

2) Service Worker
- Offline support:
  - App shell cached: index.html, global css, global js, manifest, icons
  - Each game page cached on first visit
  - Static assets cached (css, js, images)
- Update strategy:
  - Use stale-while-revalidate for assets
  - Show “Update available” toast when new SW activates
- Must not break the app if SW fails

3) Install UX
- Add install prompt UI (non intrusive) on hub:
  - “Install app” button appears only when installable
  - Respect dismiss

4) Performance and quality
- Lighthouse targets (mobile):
  - Performance >= 90
  - Accessibility >= 95
  - Best Practices >= 95
  - PWA passes installable + offline
- No console errors

## Design goals
- Modern, playful, romantic but not cheesy
- Use a consistent design system:
  - spacing scale
  - typography scale
  - button styles
  - card styles
- Hub should feel like an app home screen:
  - hero area with 2 CTAs (Play now, Install)
  - search + filter chips
  - game grid with consistent cards

## Color direction (choose one)
Option A: Night Neon Romance
- background: deep navy
- accents: magenta + cyan
- cards: glass but readable

Option B: Warm Modern
- background: near-black with warm gradient
- accents: coral + gold
- cards: solid, high contrast

Option C: Soft Playful
- background: dark slate
- accents: lavender + mint
- cards: slightly rounded, bright highlights
