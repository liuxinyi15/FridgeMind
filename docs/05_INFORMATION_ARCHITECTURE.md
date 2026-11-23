# Information Architecture

- **Today:** decision-first recommendations, proactive/use-soon card, habit insight.
- **My Fridge:** current inventory, confidence, batches, use-soon status, add/correct food.
- **Recipes:** saved/imported/recommended, import, recipe detail, scaling, matching.
- **Shopping:** editable recipe gaps and rationale.
- **Profile/Settings:** notification controls, quiet hours, habit insight and Research Mode.

Bottom navigation exposes the four frequent tasks; settings is deliberately secondary in the header. Detail routes preserve context and provide explicit back navigation.

V0.1.1 keeps this hierarchy as native-style bottom tabs: Today, Fridge, Recipes and Shopping. Settings remains behind the profile entry; Research Mode remains behind Settings. Native hardware back follows route history and exits only from Today. Web navigation is retained solely as the secondary research/fallback channel.
