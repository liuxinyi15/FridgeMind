# FridgeMind V0.1

FridgeMind is a mobile-first HCI functional demo exploring how adults living alone might connect food already at home, recipes, real routines and future shopping decisions with less management effort and more control.

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

## Demo mode

Complete the four-step setup as Alex, or use **Settings → Reset demo**. **Settings → Demo / Research Mode** switches between use-soon, uncertain stock, quiet hours, recent dismissal and saved-recipe scenarios. See [`docs/10_DEMO_SCRIPT.md`](docs/10_DEMO_SCRIPT.md) for a presenter-ready walkthrough.

## Architecture

React + TypeScript + Vite with pure domain engines, React state coordination and versioned localStorage repositories. Inventory distinguishes physical, reserved and available-to-plan stock. See [`docs/06_ARCHITECTURE.md`](docs/06_ARCHITECTURE.md).

## Known limitations

No real CV/OCR, arbitrary web parser, safety judgement, backend, push notifications, package optimisation, account or longitudinal learning. See [`docs/12_KNOWN_LIMITATIONS.md`](docs/12_KNOWN_LIMITATIONS.md).

## Documentation map

The `docs` directory contains the project brief, survey record, research limitations, requirements, UX/IA/architecture, decision log, backlog, test plan, demo script, PPT evidence log, limitations, changelog, devlog and screenshot evidence.
