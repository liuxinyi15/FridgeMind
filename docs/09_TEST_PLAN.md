# Test Plan

## Automated

- Unit: serving scaling, inventory matching, gap calculation, recommendation score/reason, intervention quiet/dismiss/uncertain logic and habit confirmation.
- Component: recipe match groups, Use Soon controls, shopping rationale/actions and habit decision controls.
- E2E smoke: reset/onboard → Today → recipe → servings → shopping → cooking → inventory → food rescue response.
- Screenshots: fixed seed, 390×844 viewport, named evidence paths.

## Manual accessibility and responsive checks

Keyboard-only navigation, visible focus, headings/landmarks/labels, status text independent of colour, 200% zoom, 390px overflow check, touch target sizing, basic contrast, and screen-reader spot check.

## Usability measures for next round

Task completion, wrong turns, time to choose a meal, understanding of available/uncertain/missing, perceived effort, intervention explanation recall, trust, control, reminder acceptability and any unsafe interpretation.

## Exit criteria

Build and automated tests pass; no mobile horizontal overflow in inspected routes; primary journey can be completed from reset seed; limitations and failures are recorded rather than hidden.

## V0.1.1 mobile migration checks

- Preserve every V0.1 domain test and add repository restart persistence plus notification-adapter coverage.
- Component-test camera pre-permission explanation and manual denial/fallback path.
- Re-run the 390×844 research-build journey and horizontal overflow checks.
- Run `cap sync` and verify the built assets/config/plugins exist in both native projects.
- Build iOS using the available Xcode toolchain without code signing where possible.
- Build Android only on a machine with a supported JDK and SDK; record environment failure rather than claiming success.
- On real devices, verify safe areas, Android back, keyboard resize, camera denial, notification denial, offline restart and local notification delivery.
