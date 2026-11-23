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

## V0.1.1 native/distribution limits

- Capacitor uses a hybrid Web Native architecture; most UI is rendered in a WebView rather than rewritten as UIKit/Jetpack Compose components.
- Native local notification permission and a real local-delivery adapter exist, but there is no background sensing worker that evaluates fresh inventory while the app is closed.
- Native camera capture/library selection is integrated; food recognition is still deterministic demo behaviour and no participant image is uploaded.
- Xcode is available on the current machine, but simulator service/runtime availability is unreliable; actual simulator screenshots could not be claimed. V0.1.1 screenshots are mobile browser evidence unless explicitly labelled otherwise.
- The Android project is generated and synchronised but could not be compiled here because no Java runtime or Android SDK is installed.
- iOS device/TestFlight distribution requires Apple signing and an Apple Developer account. Android research APK distribution requires an owned signing key and participant installation consent; no secrets are committed.
- `netlify.toml` prepares a non-localhost HTTPS route, but a public URL depends on a connected hosting account/deployment and must not be claimed before verified.
