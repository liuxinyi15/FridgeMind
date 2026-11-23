# FridgeMind V0.1.1 — Mobile Distribution

## Product hierarchy

**Primary product:** installable FridgeMind mobile app for iOS and Android.  
**Secondary distribution:** web-accessible research and backup build for remote review, QR access and participants who cannot install an app.

FridgeMind is not being repositioned as a browser-first product. The web build is a distribution and research fallback from the same React/TypeScript codebase.

## Local development

### Shared preparation

```bash
pnpm install
pnpm mobile:sync
```

`mobile:sync` builds Vite into `dist`, copies the same assets into both native projects and updates Capacitor plugins.

### iOS simulator

Requirements: macOS, Xcode, an installed iOS simulator runtime and no signing requirement for simulator builds.

```bash
pnpm mobile:ios
```

In Xcode, select an available iPhone simulator and Run. This repository uses Capacitor 8 Swift Package Manager integration, so CocoaPods is not required.

### Android emulator

Requirements: JDK 21-compatible toolchain, Android Studio, Android SDK and an emulator image.

```bash
pnpm mobile:android
```

Open the generated `android/` project, allow Gradle sync, select an emulator and Run.

### Physical-device testing

- **iOS:** open `ios/App/App.xcodeproj`, select a development team and a connected iPhone, then Run. Device installation needs Apple signing; wider research distribution normally needs TestFlight and an Apple Developer account.
- **Android:** enable developer mode/USB debugging, build a debug APK in Android Studio or with `./gradlew assembleDebug`, and install it with Android Studio/ADB. Research distribution outside Play Store requires participants to permit installation from the chosen source.

## Research distribution

### Android installable build

For a bounded study, generate and checksum a signed APK or App Bundle. Record the source commit, version (`0.1.1`), test device/OS and signing owner. Never commit keystores or passwords.

### iOS testing route

Preferred: TestFlight using an Apple Developer account. Small on-device development tests can use registered devices from Xcode, but this is not universal distribution.

### Web fallback

The static Vite build contains demo/local data only and no participant-sensitive data:

```bash
pnpm research:build
```

Deploy `dist/` to an HTTPS static host with SPA fallback to `index.html`. `netlify.toml` contains a portable configuration; the verified research deployment for this iteration is hosted through ChatGPT Sites.

Configuration location: `netlify.toml`  
Build command: `pnpm build`  
Publish directory: `dist`  
Sites project binding: `.openai/hosting.json`  
Redeployment: build, push the same source commit to the bound source repository, save a new site version from `dist/`, then deploy that version. Record the deployed version in the study log before participant recruitment.

## Final demonstration

1. Primary: a previously installed, tested real-device build with demo data reset.
2. Backup: the hosted HTTPS research build opened from the documented URL/QR code.
3. Last-resort technical fallback: local Vite preview; this is not the participant distribution route.

## Current environment verification — 2026-11-23

- iOS project: generated and synchronised. Xcode 27.2 is installed. A command-line simulator build is recorded in the verification devlog; simulator UI availability depends on an installed/working runtime.
- Android project: generated and synchronised. This machine currently has no Java runtime or Android SDK, so an APK/emulator run cannot be honestly claimed here.
- Web research build: production build and mobile browser smoke tests are automated. A public HTTPS deployment is recorded below.

### Public research build status

**Status:** deployed and publicly reachable through ChatGPT Sites.  
**URL:** <https://fridgemind-research-v011.ampleartichoke32.chatgpt.site>  
**Build:** `pnpm build`, static output from `dist/`, SPA fallback handled by the host.  
**Content boundary:** the V0.1.1 demo contains seeded/local demo data and does not upload participant photos or other participant-sensitive data. Browser storage remains local to that browser. Host availability is still an external dependency, so the installed-app build remains the primary demonstration route.
