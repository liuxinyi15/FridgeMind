# Architecture

## Layers

- `src/domain`: pure types, units/scaling, matching, recommendation and intervention decisions.
- `src/data`: deterministic seed plus localStorage repository interfaces/implementations.
- `src/state`: React context coordinating persisted state and domain operations.
- `src/components`: accessible reusable interaction patterns.
- `src/pages`: route-level task flows.
- `e2e`: reproducible smoke journey and screenshot evidence.

## Data flow

Pages dispatch actions to `AppState`; state persists through repository interfaces; pure domain functions derive scaled recipes, matches, shopping gaps, recommendation rankings and interventions. The UI never treats a heuristic as research truth.

## Local-first repositories

`InventoryRepository`, `RecipeRepository`, `PreferenceRepository`, and `InterventionRepository` separate domain data from storage. V0.1 uses versioned localStorage keys and a resettable seed, permitting a later backend adapter without rewriting decision logic.

## Inventory semantics

Each batch keeps `physicalStock`, `reservedStock`, and derived `availableToPlan`. V0.1 reserves no stock by default but preserves the distinction in the model.
