# FridgeMind V0.2 Usability Test Guide

## Purpose

This build evaluates whether the existing FridgeMind product loop is understandable, low-effort, and useful for a person living alone. It is not intended to demonstrate technical completeness or minimise click count.

All session data stays in browser local storage until the researcher exports or resets it. Nothing is uploaded.

## Tasks and success criteria

1. **Decide what to cook** — success when the participant opens a recipe or explicitly chooses not to cook.
2. **Handle uncertain stock** — success when the participant resolves unknown cream quantity and understands whether the recipe remains feasible.
3. **Resolve a missing ingredient** — success when the genuine recipe gap reaches Shopping.
4. **Add purchased food back** — success when the purchased item is reconciled into inventory.
5. **Cook and update inventory** — success when cooking completes and inventory updates.
6. **Save leftovers** — success when one of two cooked portions is saved.
7. **Return the next day** — success when the participant selects or explicitly recognises the existing leftover as the practical option.

## Events captured

Events are recorded only while a Research Mode usability task is running:

- task start, completion, and abandonment;
- page visits and back navigation;
- primary and secondary CTA clicks;
- More, recommendation explanation, and explanatory disclosure opens;
- recipe opening and meal-context changes;
- uncertainty prompt display and response;
- manual food correction;
- shopping addition, duplicate attempt, and reconciliation;
- manual duplicate-fridge attempt;
- cooking start, correction, and completion;
- leftover save and selection;
- researcher-marked dead ends.

No participant-entered food names, notes, or other free text are copied into the event log. The only optional free text in the research record is the participant's post-task comment.

## Metrics available

Each task run reports:

- completion yes/no;
- interaction count;
- back-navigation count;
- time to completion or abandonment;
- correction count;
- researcher-marked dead ends;
- explanatory disclosure count.

These are friction indicators, not an automatic usability score. A lower interaction count is not assumed to be better.

## Reset and replay

Launching any task resets the product to that task's deterministic fixture while preserving the local research session. Re-launching a task creates another run. If another task is still running, it is marked abandoned.

Task 7 advances the Research Mode date by one day and seeds one Mushroom Pasta leftover. The ordinary product clock is unchanged outside that fixture.

## Export format

The **Export JSON** action downloads:

~~~json
{
  "format": "fridgemind-usability-v1",
  "exportedAt": "ISO-8601 timestamp",
  "storage": "local-only",
  "sessions": [
    {
      "id": "session id",
      "startedAt": "ISO-8601 timestamp",
      "completedAt": "optional ISO-8601 timestamp",
      "taskRuns": [{ "taskId": "task-1", "status": "completed", "metrics": {} }],
      "events": [],
      "responses": [],
      "observations": []
    }
  ]
}
~~~

## Exact participant walkthrough

1. Open /settings/research/usability.
2. Start a new session.
3. Choose the task and decide whether to show the two post-task rating questions.
4. Read only the quoted prompt aloud. Do not name a screen, route, or button.
5. Hand the device to the participant and remain neutral.
6. Do not correct hesitation or misunderstanding unless safety or study protocol requires it.
7. Use **Mark dead end** only when the participant reaches a genuine impasse.
8. Allow automatic success detection to complete the task. If the participant verbalises completion that cannot be detected, they may choose **I'm finished**.
9. If the participant stops, choose **I want to stop** so abandonment is recorded.
10. Collect the optional ease and confidence ratings when enabled.
11. Return to the Usability Test page and mark the observation checklist.
12. Launch the next task. For Task 7, say only: “It's the next evening. Decide what to eat.”
13. After Task 7, use the final interview guide.
14. End the session and export the JSON before resetting app data.

## Known limitations

- Timing uses client timestamps and does not distinguish thinking time from interruptions.
- Back navigation is inferred from router history and explicit back actions.
- Dead ends require researcher marking.
- Verbal recognition of leftovers or recipe feasibility may need **I'm finished**.
- The optional comment is stored verbatim because it is explicitly supplied as research feedback.
- Results are local to the browser profile until exported.
