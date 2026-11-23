# Changelog

## v0.1.1 — Native Mobile Prototype — 2026-11-23

### Added

- Capacitor 8 iOS and Android projects generated from the existing Vite application.
- Native camera, keyboard, Android back-button and local-notification plugins behind platform adapters.
- Pre-permission explanation sheets with manual/in-app fallbacks.
- Native-oriented Add Food actions: Take a photo, Choose from library and Add manually.
- Safe-area, portrait, keyboard-open and touch-state refinements.
- Versioned V0.1/V0.1.1 evidence, mobile distribution guide and screen-by-screen mobile UX audit.
- Static HTTPS research-build configuration.

### Changed

- FridgeMind is documented as a mobile app first; the web build is a secondary research/fallback channel.
- OS notification delivery is separated from `InterventionEngine` through adapters.
- Screenshot automation writes V0.1.1 evidence without overwriting frozen V0.1 material.

### Fixed

- Bottom tabs and permission sheets now account for phone safe areas.
- Native keyboard display no longer leaves the bottom tab bar over form controls.

### Research / Design notes

The hybrid Web Native choice preserves the evidence-informed interaction prototype while enabling installable builds. This is a technical/design decision, not evidence that native packaging improves outcomes.

### Known limitations

Android could not be compiled on the current machine because Java/Android SDK are unavailable. Native camera capture is real, but recognition remains simulated. Background sensing/scheduling is not implemented; local notification delivery is user-authorised and adapter-based.

## v0.1.0 — Functional Interaction Prototype — 2026-11-23

### Added

Decision-first Today experience, confidence-aware inventory, deterministic recipe import/scaling/matching, explained shopping gaps, lightweight cooking completion, use-soon controls, habit permission, Research Mode, local-first repositories, automated tests and evidence capture.

### Changed

Not applicable; initial version.

### Fixed

Not applicable; initial version.

### Research / Design notes

All survey findings are treated as directional mixed-sample evidence. Alex and all scoring/timing behaviours are prototype constructs requiring validation.

### Known limitations

No production recognition, safety judgement, backend, external grocery integration or target-group-filtered research analysis.
