# FridgeMind V0.1.1 — Native Mobile Prototype

FridgeMind is an installable mobile HCI functional demo exploring how adults living alone might connect food already at home, recipes, real routines and future shopping decisions with less management effort and more control.

**Primary product:** Capacitor-packaged iOS and Android app.  
**Secondary distribution:** shareable web research/backup build from the same React codebase.

V0.1.0 remains frozen as the Functional Interaction Prototype. V0.1.1 preserves its domain logic, evidence and tests while migrating distribution and phone-context interactions; it is a hybrid Web Native app, not a rewrite into fully native components.

## HCI context and research basis

The prototype addresses the course theme **Sensing the Benefits**. The supplied 115-response survey points directionally toward decision support, flexible portions, low-effort stock awareness, actionable use-soon support and configurable intervention. It does **not** validate the product.

The available survey summary includes 52 people living alone and 63 people not currently living alone, while later aggregates use all 115 responses. Findings must therefore be treated as mixed-sample directional evidence, not target-group population conclusions. Alex is a demo scenario persona, not an interview-derived persona.

## Main features

- “What should I cook?” ranking with visible deterministic reasons.
- Batch/confidence-aware fridge and demo-photo/manual input.
- Editable text recipe import, 1–4 serving scaling and live inventory matching.
- Explained shopping gaps and lightweight cooking completion.
- Use-soon sensing-to-intervention loop with why, snooze, dismiss, correct and disable controls.
- Confirm-first habit insight and five-scenario Research Mode.
- Local-first persistence and resettable evidence state.
- Native camera/library access with a pre-permission explanation and manual fallback.
- Notification delivery adapters separating proactive decisions from in-app or native local delivery.
- Safe-area, keyboard and Android hardware-back behaviour.

## Run

```bash
pnpm install
pnpm dev
```

Build and tests:

```bash
pnpm test
pnpm build
pnpm smoke
pnpm screenshots
```

Native project preparation:

```bash
pnpm mobile:sync
pnpm mobile:ios
pnpm mobile:android
```

The generated native projects live under `ios/` and `android/`. Platform signing and toolchain requirements are documented in [`docs/13_MOBILE_DISTRIBUTION.md`](docs/13_MOBILE_DISTRIBUTION.md).

For the secondary HTTPS research build, run `pnpm research:build` and deploy `dist/`; `netlify.toml` provides SPA fallback configuration.

## Demo mode

Complete the four-step setup as Alex, or use **Settings → Reset demo**. **Settings → Demo / Research Mode** switches between use-soon, uncertain stock, quiet hours, recent dismissal and saved-recipe scenarios. See [`docs/10_DEMO_SCRIPT.md`](docs/10_DEMO_SCRIPT.md) for a presenter-ready walkthrough.

## Architecture

React + TypeScript + Vite with pure domain engines, React state coordination and versioned localStorage repositories. Capacitor packages the same build for iOS and Android. Platform adapters contain Camera and Local Notification APIs so recommendation, intervention and inventory logic remain platform-independent. See [`docs/06_ARCHITECTURE.md`](docs/06_ARCHITECTURE.md).

## Known limitations

No real CV/OCR, arbitrary web parser, safety judgement, backend, remote push, background sensing, package optimisation, account or longitudinal learning. Native signing and Android build toolchains remain environment-dependent. See [`docs/12_KNOWN_LIMITATIONS.md`](docs/12_KNOWN_LIMITATIONS.md).

## Documentation map

The `docs` directory contains the project brief, survey record, research limitations, requirements, UX/IA/architecture, decision log, backlog, test plan, demo script, PPT evidence log, limitations, changelog, distribution guide, mobile UX audit, devlog and versioned screenshot evidence.
