import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FoodItem, Intervention } from '../domain/types';
import { useAppState } from '../state/AppState';
import { StatusChip } from './StatusChip';
import { FoodIcon } from './FoodIcon';

export function UseSoonCard({ food, intervention }: { food: FoodItem; intervention: Intervention }) {
  const { actions } = useAppState();
  const [handling, setHandling] = useState(false);
  const batch = food.batches[0];
  if (intervention.dismissedAt) return <div className="quiet-card"><strong>Reminder dismissed</strong><p>{food.name} is still visible in My Fridge. It will not interrupt you again now.</p></div>;
  return (
    <article className="use-soon-card" aria-labelledby={`use-soon-${food.id}`}>
      <div className="rescue-visual"><FoodIcon name={food.canonicalName} large /></div>
      <div className="rescue-content"><div className="rescue-heading"><span className="overline">Needs attention</span><StatusChip tone="warn">Use soon</StatusChip></div>
      <h2 id={`use-soon-${food.id}`}>Make a plan for your {food.name.toLowerCase()}</h2>
      <p>{batch.physicalStock ?? 'Some'}{batch.physicalStock !== null ? batch.unit : ''} left · opened pack</p>
      <div className="button-row rescue-actions">
        <Link className="button primary" to={`/recipes?uses=${food.canonicalName}`}>Find a recipe</Link>
        <button className="button secondary" onClick={() => setHandling(true)}>I used it</button>
        <Link className="button ghost" to={`/fridge/${food.id}`}>Check storage options</Link>
      </div>
      <details className="explanation"><summary>More options</summary><p className="safety-note">{batch.dateType === 'unknown' ? 'Check the product label and storage guidance before using.' : `${batch.dateType === 'use_by' ? 'Use-by' : 'Best-before'} ${batch.relevantDate}. Always check the label and storage guidance.`}</p><ul>{intervention.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="text-actions"><button onClick={() => actions.respondToIntervention(intervention.id, 'snoozed')}>Snooze one day</button><Link to={`/fridge/${food.id}`}>Correct details</Link><button onClick={() => actions.respondToIntervention(intervention.id, 'dismissed')}>Dismiss</button><Link to="/settings">Reminder settings</Link></div></details>
      </div>
      {handling && <div className="sheet-backdrop" role="presentation"><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="handled-title"><div className="sheet-handle" /><h2 id="handled-title">What happened?</h2><div className="handled-actions"><button onClick={() => actions.handleFood(food.id, 'used')}>I used it</button><button onClick={() => actions.handleFood(food.id, 'frozen')}>I froze it</button><button onClick={() => { actions.handleFood(food.id, 'still'); setHandling(false); }}>It’s still there</button><button onClick={() => actions.handleFood(food.id, 'remove')}>Remove it</button></div><button className="button ghost full" onClick={() => setHandling(false)}>Cancel</button></section></div>}
    </article>
  );
}
