# Foundation and Core Loop

## What was implemented

Research-labelled documentation, domain entities and deterministic decision engines; local repositories; a mobile-first linked prototype covering onboarding, Today, inventory, recipe matching/scaling/import, shopping, cooking feedback, interventions, settings and Research Mode.

## Why

The loop prioritises deciding what to cook and reduces mandatory inventory upkeep. These choices translate supplied survey directions into testable hypotheses rather than claiming efficacy.

## Files changed

`src/domain`, `src/data`, `src/state`, `src/components`, `src/pages`, `src/styles.css`, `docs`, `e2e` and test configuration.

## Design decisions

Deterministic scoring supports explanation; confidence triggers correction; interventions respect mode, quiet hours and recent feedback; habit changes require confirmation.

## Known issues / assumptions

See `docs/12_KNOWN_LIMITATIONS.md`. Especially: mixed survey sample, seeded persona, demo recognition, coarse unit support and no safety inference.

## What should be tested later

Ranking relevance, comprehension of confidence and partial stock, post-cook burden, intervention timing/tone, quiet-hour expectations, correction discoverability and any unsafe interpretation.
