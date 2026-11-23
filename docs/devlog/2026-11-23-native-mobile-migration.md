# Devlog — V0.1.1 Native Mobile Migration

Date: 2026-11-23  
Version: 0.1.1  
Scope: migrate the existing functional prototype into an installable mobile architecture without discarding the V0.1.0 interaction, domain or research evidence.

## Preserved from V0.1.0

- React/TypeScript interface and route structure.
- Pure recommendation, inventory, matching and intervention engines.
- Versioned localStorage repositories and resettable demo state.
- Original tests, documentation and all 15 screenshots, copied into `docs/evidence/v0.1/` while retaining their previous location.
- Existing browser path as a secondary research and technical fallback.

## Implemented for V0.1.1

- Capacitor iOS and Android projects with shared Vite output.
- Platform adapters for camera/photo-library input and notification delivery.
- A native runtime bridge for Android hardware-back behaviour and keyboard-aware navigation.
- Safe-area-aware layout, portrait phone sizing and mobile bottom sheets.
- Add Food choices for camera, photo library and manual entry, with an explanation before the OS permission prompt and a manual fallback after denial/cancellation.
- An explicitly labelled deterministic recognition review; no CV/OCR or image upload claim.
- Notification decision logic kept separate from in-app/native delivery. Native builds can request local notification permission and schedule a local preview; browser builds retain the Today/in-app fallback.
- Public HTTPS research fallback at <https://fridgemind-research-v011.ampleartichoke32.chatgpt.site>.

## Main files and boundaries

- `capacitor.config.ts`, `ios/`, `android/`: native packaging and platform metadata.
- `src/platform/camera/`: native and browser image-input boundary.
- `src/platform/notifications/`: delivery contract plus in-app/native adapters.
- `src/components/NativeRuntimeBridge.tsx`: app lifecycle, hardware back and keyboard bridge.
- `src/components/NativeNotificationPermissionCard.tsx`: capability/preference explanation and fallback UI.
- `src/pages/AddFoodPage.tsx`: mobile input and permission flow.
- `docs/13_MOBILE_DISTRIBUTION.md`: development, signing and study distribution instructions.
- `docs/14_MOBILE_UX_AUDIT.md`: screen-by-screen mobile audit.

## Verification record

- Unit/component: 15 tests passed across 4 files.
- Web production build: passed.
- Capacitor sync: passed for iOS and Android; App, Camera, Keyboard and Local Notifications plugins registered.
- Mobile browser smoke test: passed, including the main workflow and 390 px horizontal-overflow checks.
- V0.1.1 evidence capture: 10 phone-viewport screenshots generated at 390 × 844.
- iOS command build: `xcodebuild` Debug simulator target completed with `** BUILD SUCCEEDED **` and code signing disabled.
- iOS simulator interaction: not completed because the installed CoreSimulator service/runtime is incompatible with the current Xcode installation.
- Android project sync: completed. Android compilation/emulator interaction was not completed because this machine has no Java runtime or Android SDK.
- Public research deployment: Sites deployment reported success at the URL above; the final source and asset version is redeployed after this log is committed.

## Decisions

1. Use a hybrid Web Native migration rather than a UI rewrite so the validated interaction flow and domain behaviour remain one codebase.
2. Treat installable iOS/Android builds as the product and the HTTPS build as research/backup distribution.
3. Keep sensing/intervention decisions independent of OS delivery, allowing in-app fallback without changing recommendation policy.
4. Explain camera and notification access before requesting it, and preserve a complete non-permission path.
5. Record browser screenshots as phone-viewport evidence, not simulator/device evidence.

## Open validation work

- Run the complete workflow on at least one physical iPhone and one representative Android device.
- Exercise allow, deny and previously-denied permission states on both platforms.
- Verify notification delivery across foreground/background/quiet-hour states on real devices.
- Build a signed Android research APK and TestFlight build under project-owned developer accounts.
- Conduct assistive-technology, dynamic text and soft-keyboard testing.
- Test with consented target participants before making effectiveness claims.
