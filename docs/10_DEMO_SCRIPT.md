# Demo Script

## Preparation

Preferred: install/sync the V0.1.1 app using the platform route in `13_MOBILE_DISTRIBUTION.md`. Backup: open the hosted HTTPS research build. Choose **Reset demo** in Settings, then complete the four short onboarding steps as Alex. Alex is a walkthrough persona only.

Before the core flow, demonstrate **My Fridge → Add food → Take a photo**. Explain the pre-permission sheet, choose **Use manual entry**, and show that denial never blocks the task. On a signed device build, Continue opens the real Camera plugin; recognition after capture is still explicitly simulated.

## Scenario 1 — Decide what to cook

**Starting state:** mushrooms need using soon, pasta is available, cream quantity is uncertain. Open **Today**. Expect Mushroom Pasta or another use-soon, high-coverage, quick option near the top. Open **Why this suggestion?** Explain that the visible factors are a prototype heuristic, not a validated model.

## Scenario 2 — Match and scale

Open Mushroom Pasta. Change from 2 to 1 then 3 servings; ingredient quantities and groups change. Point out **Already have**, **Partially available**, **Needs confirmation**, and **Need to buy**. Use **Correct** on cream if desired.

## Scenario 3 — Import and correct

Recipes → **Import recipe**. Paste the included sample and choose **Parse draft**. Edit the intentionally uncertain line, noting the parser is deterministic and requires review. Save it.

## Scenario 4 — Shopping

From a recipe, **Add gaps to shopping**. Open Shopping, expand **Why is this suggested?**, edit/remove an item and mark one bought. Explain that the amount reflects recipe need minus available stock.

## Scenario 5 — Cook and update

Return to recipe, choose **Start cooking**, then review “Did anything change?”. Keep planned amounts or select used less/more/substituted/didn’t use for one item. Finish; the inventory and recipe match recalculate without a mandatory full stocktake.

## Scenario 6 — Proactive rescue and control

On Today, use the Spinach card. Open **Why am I seeing this?**, then demonstrate **Snooze**, **Dismiss**, or **Correct information**. Explain that food safety overrides rescue and uncertain items show label/storage guidance, never a safety claim.

## Scenario 7 — Habit permission

Settings → Habit insight. Read the evidence and proposed weekday-lunch change, then choose **Confirm**, **Not now**, or **Don’t use this pattern**. No setting changes before confirmation.

## Scenario 8 — Research Mode

Settings → Research Mode. Switch between spinach priority, uncertain quantity, quiet hours, recently dismissed and saved-recipe opportunity. Observe the decision (`notify`, `ask_for_confirmation`, `show_in_app`, `stay_silent`) and explanation update live.

## Scenario 9 — Native notification permission

On an installed app, open Settings → OS notifications. Read the explanation before continuing to the OS prompt. If granted, **Send real notification preview** schedules a local notification through Capacitor. If denied—or when using the web fallback—Food Rescue remains fully visible inside Today. Do not describe this as background sensing or remote push.
