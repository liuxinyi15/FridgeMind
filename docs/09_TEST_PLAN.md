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
