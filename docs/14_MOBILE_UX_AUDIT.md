# V0.1.1 Native Mobile UX Audit

Primary audit viewport: 390 × 844 portrait. Shared controls retain at least 44px touch targets, visible focus and text-plus-colour status cues. Safe-area insets are applied to the app header, bottom tabs, content and permission sheets. The bottom tab bar hides while the native keyboard is open; native Android back dispatches to route history and exits only at Today.

| Screen | Audit finding | V0.1.1 response | Validation still needed |
|---|---|---|---|
| Onboarding | Already short but needed notched-device padding. | `100dvh` plus top/bottom safe areas; large radio rows and one primary action. | One-handed completion and VoiceOver/TalkBack. |
| Today | Long feed can feel dashboard-like. | Keeps one task-led heading, short recipe cards and actionable rescue; fixed tabs remain reachable. | Ranking scan time on small phones. |
| My Fridge | Dense metadata risk. | Touch-first food rows; secondary date hides on narrow phones while confidence remains text-labelled. | Whether hidden dates reduce awareness. |
| Add Food | Browser file picker was not an app interaction. | Three native-oriented actions: Take photo, Choose library, Add manually; pre-permission sheet and manual denial fallback. | Real camera/device ergonomics and image-review comprehension. |
| Recipes | Sectioned lists are mobile-safe. | Compact vertical recipe rows and full-row touch navigation; no hover dependency. | Saved/recommended distinction. |
| Recipe Import | Long keyboard interaction. | Task-oriented full-width textarea/edit rows; keyboard-open state removes tab obstruction. | Paste behaviour and keyboard dismissal on iOS/Android. |
| Recipe Match | Sticky actions could clash with home indicator. | Sticky action tray sits above safe-area-aware bottom tabs; grouped stock states remain vertically scrollable. | Very small phone and dynamic type. |
| Serving Adjustment | Four controls already touch-friendly. | 1–4 segmented buttons with `aria-pressed`; quantities recalculate immediately. | Accidental selection and leftover label clarity. |
| Shopping | Wide tables were avoided. | Editable vertical cards, large checkbox, expandable rationale. | Shop-floor glanceability and offline use. |
| Cooking Confirmation | Selects must stay visible above keyboard. | One ingredient per card, planned-use default, exception-only corrections, keyboard-aware tab hiding. | Wet/occupied-hand use context. |
| Habit Insight | Must not resemble silent automation. | Evidence, proposal and three explicit actions remain in one card. | Trust and “Don’t use” interpretation. |
| Settings | OS and in-app notification concepts could blur. | Separate preference controls from native capability/permission state; web fallback is labelled. | Permission conversion and denial recovery. |
| Research Mode | Evaluator tool should not dominate the product. | Remains behind Settings, not a permanent tab; scenario buttons are touch-sized. | Facilitator discoverability. |

## Loading, disabled and offline behaviour

- Native permission and scheduling actions show working labels and disable repeated taps.
- Browser-only/native-only capability buttons explicitly show unavailable state.
- Core state is localStorage-backed inside the WebView and does not require a network connection after installation.
- Camera and notification denial never blocks manual add, Today rescue, recipes, shopping or cooking.
- The web fallback uses the same local demo data; no participant account or sensitive upload path exists.
