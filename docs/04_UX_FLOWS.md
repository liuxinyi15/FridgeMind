# UX Flows

## Primary end-to-end flow

Onboarding → Today recommendations → Why this suggestion → Recipe detail → servings → stock match → add gaps to Shopping → mark bought → Start cooking → planned-use confirmation → inventory updates → use-soon intervention → Why / Snooze / Correct.

## Add-food flow

My Fridge → Add food → Take photo / Choose library / Add manually → pre-permission explanation before any native request → native capture or browser picker → deterministic editable suggestion labelled demo recognition → review name/quantity/unit/date/storage → save → matching and ranking recalculate. Denial routes directly to manual entry.

## Habit flow

Settings → Habit insight → inspect observation evidence and proposed change → Confirm / Not now / Don’t use this pattern. No silent routine changes.

## Intervention state flow

Sense urgency/confidence → evaluate user preference, quiet hours, recent dismissal, actionability and recipe availability → `notify`, `ask_for_confirmation`, `show_in_app` or `stay_silent` → explain decision → record feedback → suppress or adapt subsequent presentation.

Delivery follows the decision through a platform boundary: `InAppNotificationAdapter` always remains available; `NativeLocalNotificationAdapter` is used only after the in-product explanation and an explicitly granted OS permission.
