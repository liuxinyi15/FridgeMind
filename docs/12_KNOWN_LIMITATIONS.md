# Known Limitations

- Research summary is not filtered to the target group; evidence is directional.
- Recommendation and intervention thresholds are unvalidated deterministic heuristics.
- Photo “recognition” is a deterministic demonstration and must be reviewed; URL/image recipe import and receipt scan are concept-only.
- Text parser recognises common simple quantity lines, not arbitrary recipes, fractions, unit conversions or web pages.
- Inventory matching uses canonical aliases and compatible units; it does not infer density or convert volume to weight.
- Dates are illustrative; the prototype does not assess food safety, storage history, smell or contamination.
- LocalStorage is single-browser and has no account, sync, conflict handling or production security model.
- Reservations are modelled but not exposed as a complete planning workflow.
- Shopping does not optimise package sizes, stores, prices or delivery.
- Habit inference is seeded rather than learned from longitudinal data.
- Notifications are simulated in-app; no OS push delivery occurs.
- Accessibility has automated/component coverage and manual checklist guidance, but requires assistive-technology testing with users.
