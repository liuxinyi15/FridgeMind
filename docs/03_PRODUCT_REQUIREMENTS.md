# Product Requirements

## P0 functional requirements

- Lightweight editable onboarding for cooking, shopping, portions and reminder mode.
- Today ranks at least three recipes and explains each score.
- Inventory shows batches, amounts, dates, states and confidence; supports photo-demo and manual add/correction.
- Recipes support saved/imported/recommended groupings, editable text parsing, 1–4 serving scaling and real stock matching.
- Match separates available, partial, uncertain and missing ingredients.
- Shopping suggestions are editable, removable, markable, and explain recipe/stock gaps.
- Cooking completion defaults to planned use and allows less/more/substitute/not-used corrections.
- Use-soon intervention offers explain, snooze, dismiss, correct and settings; quiet hours and repeated dismissal suppress notifications.
- Research Mode reproduces five sensing/intervention scenarios.
- Habit insight follows Suggest → Explain → Confirm → Apply.
- Local-first persistence sits behind repository interfaces.

## Non-functional requirements

Semantic and keyboard-operable UI; visible focus; status conveyed by text plus icon; 44px targets; 390px without horizontal overflow; responsive desktop frame; deterministic behaviour; no safety claims; honest demo-AI labelling.

## Out of scope

Production CV/OCR, LLM dependency, nutrition/medical advice, supermarket APIs, backend/authentication, multi-user/multi-device sync, payments, automatic purchasing and smart-fridge hardware.
