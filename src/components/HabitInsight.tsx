import type { HabitInference } from '../domain/types';
import { useAppState } from '../state/AppState';

export function HabitInsight({ habit }: { habit: HabitInference }) {
  const { actions } = useAppState();
  if (habit.status === 'disabled') return <div className="quiet-card"><strong>Pattern disabled</strong><p>This weekday-lunch pattern will not be used.</p></div>;
  if (habit.status === 'confirmed') return <div className="quiet-card success"><strong>Change confirmed</strong><p>Weekday lunch suggestions will be reduced. You can change this later.</p></div>;
  return (
    <article className="habit-card">
      <span className="kicker">A pattern to review</span>
      <h2>Weekday lunches may be different</h2>
      <p>{habit.evidence}</p>
      <div className="proposal"><strong>Proposed change</strong><p>{habit.proposedChange}</p></div>
      <details className="explanation"><summary>How was this inferred?</summary><p>This is seeded demo evidence, not a proven habit. FridgeMind never silently applies it.</p></details>
      <div className="button-row">
        <button className="button primary" onClick={() => actions.respondToHabit(habit.id, 'confirm')}>Confirm</button>
        <button className="button secondary" onClick={() => actions.respondToHabit(habit.id, 'not_now')}>Not now</button>
        <button className="button ghost" onClick={() => actions.respondToHabit(habit.id, 'disable')}>Don’t use this pattern</button>
      </div>
    </article>
  );
}
