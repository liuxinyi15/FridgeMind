import type { HabitInference } from '../domain/types';
import { useAppState } from '../state/AppState';

export function HabitInsight({ habit }: { habit: HabitInference }) {
  const { actions } = useAppState();
  if (habit.status === 'disabled') return <div className="quiet-card"><strong>Pattern disabled</strong><p>This weekday-lunch pattern will not be used.</p></div>;
  if (habit.status === 'confirmed') return <div className="quiet-card success"><strong>Change confirmed</strong><p>Weekday lunch suggestions will be reduced. You can change this later.</p></div>;
  return (
    <article className="habit-card">
      <span className="overline">A helpful pattern?</span>
      <h2>Skip weekday lunch suggestions?</h2>
      <p>It looks like you usually eat lunch away from home.</p>
      <details className="explanation"><summary>What we noticed</summary><p>{habit.evidence}</p><p>{habit.proposedChange}</p></details>
      <div className="button-row habit-actions">
        <button className="button primary" onClick={() => actions.respondToHabit(habit.id, 'confirm')}>Confirm</button>
        <button className="button secondary" onClick={() => actions.respondToHabit(habit.id, 'not_now')}>Not now</button>
        <button className="button ghost" onClick={() => actions.respondToHabit(habit.id, 'disable')}>Don’t use this pattern</button>
      </div>
    </article>
  );
}
