# FridgeMind — Consumer Mobile Companion

FridgeMind is an installable food-first companion for people living alone. It helps turn food already at home into an easy next meal, keeps shopping gaps clear and makes use-soon food easier to rescue.

**Primary product:** Capacitor-packaged iOS and Android app.  
**Secondary distribution:** shareable web research/backup build from the same React codebase.

V0.1.0 remains frozen as the Functional Interaction Prototype. V0.1.1 preserves its domain logic, evidence and tests while migrating distribution and phone-context interactions; it is a hybrid Web Native app, not a rewrite into fully native components.

## HCI context and research basis

The prototype addresses the course theme **Sensing the Benefits**. The supplied 115-response survey points directionally toward decision support, flexible portions, low-effort stock awareness, actionable use-soon support and configurable intervention. It does **not** validate the product.

The available survey summary includes 52 people living alone and 63 people not currently living alone, while later aggregates use all 115 responses. Findings must therefore be treated as mixed-sample directional evidence, not target-group population conclusions. Alex is a demo scenario persona, not an interview-derived persona.

## Main features

- A visual, action-first Today recommendation with deterministic reasons on demand.
- Non-generative recipe artwork with stored/imported/curated image fallbacks and a branded ingredient placeholder that always renders.
- Batch/confidence-aware fridge and demo-photo/manual input.
- Searchable fridge inventory and need-based recipe filters.
- Editable text recipe import, live portion scaling and grouped inventory matching.
- Explained shopping gaps and lightweight cooking completion.
- Use-soon sensing-to-intervention loop with why, snooze, dismiss, correct and disable controls.
- Confirm-first habit insight and five-scenario Research Mode.
- Local-first persistence and resettable evidence state.
- Native camera/library access with a pre-permission explanation and manual fallback.
- Notification delivery adapters separating proactive decisions from in-app or native local delivery.
- Safe-area, keyboard and Android hardware-back behaviour.
- A compact four-tab shell and verified layouts at 320px, 375px and 390px.

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

For the secondary HTTPS research build, run `pnpm research:build` and deploy `dist/`; `netlify.toml` provides SPA fallback configuration. GitHub Pages deployment and the participant-specific `/test` workflow are documented in [`docs/REMOTE_USABILITY_TEST_GUIDE.md`](docs/REMOTE_USABILITY_TEST_GUIDE.md).

Verified public research build: [fridgemind-research-v011.ampleartichoke32.chatgpt.site](https://fridgemind-research-v011.ampleartichoke32.chatgpt.site). This is a browser-accessible study/backup route, not the primary product identity.

## Demo mode

Complete the four-step setup as Alex, or use **Settings → Reset demo**. **Settings → Demo / Research Mode** switches between use-soon, uncertain stock, quiet hours, recent dismissal and saved-recipe scenarios. See [`docs/10_DEMO_SCRIPT.md`](docs/10_DEMO_SCRIPT.md) for a presenter-ready walkthrough.

## Architecture

React + TypeScript + Vite with pure domain engines, React state coordination and versioned localStorage repositories. Capacitor packages the same build for iOS and Android. Platform adapters contain Camera and Local Notification APIs so recommendation, intervention and inventory logic remain platform-independent. See [`docs/06_ARCHITECTURE.md`](docs/06_ARCHITECTURE.md).

## Known limitations

No real CV/OCR, arbitrary web parser, safety judgement, backend, remote push, background sensing, package optimisation, account or longitudinal learning. Native signing and Android build toolchains remain environment-dependent. See [`docs/12_KNOWN_LIMITATIONS.md`](docs/12_KNOWN_LIMITATIONS.md).

## Documentation map

The `docs` directory contains the project brief, survey record, research limitations, requirements, UX/IA/architecture, decision log, backlog, test plan, demo script, PPT evidence log, limitations, changelog, distribution guide, mobile UX audit, devlog and versioned screenshot evidence.
