import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FoodItem, Intervention } from '../domain/types';
import { useAppState } from '../state/AppState';
import { StatusChip } from './StatusChip';
import { FoodIcon } from './FoodIcon';
import { Icon } from './Icon';

export function UseSoonCard({ food, intervention }: { food: FoodItem; intervention: Intervention }) {
  const { actions } = useAppState();
  const [message, setMessage] = useState('');
  const batch = food.batches[0];
  if (intervention.dismissedAt) return <div className="quiet-card"><strong>Reminder dismissed</strong><p>{food.name} is still visible in My Fridge. It will not interrupt you again now.</p></div>;
  return (
    <article className="use-soon-card" aria-labelledby={`use-soon-${food.id}`}>
      <div className="rescue-visual"><FoodIcon name={food.canonicalName} large /></div>
      <div className="rescue-content"><div className="rescue-heading"><span className="overline">Food rescue</span><StatusChip tone="warn">Tomorrow</StatusChip></div>
      <h2 id={`use-soon-${food.id}`}>Use your {food.name.toLowerCase()} by tomorrow</h2>
      <p>{batch.physicalStock ?? 'Some'}{batch.physicalStock !== null ? batch.unit : ''} left · opened pack</p>
      <div className="button-row rescue-actions">
        <Link className="button primary" to={`/recipes?uses=${food.canonicalName}`}>Find a recipe</Link>
        <button className="button secondary icon-leading" onClick={() => setMessage('Good plan. Check the pack first, then freeze it if suitable.')}><Icon name="snowflake" size={18} /> Freeze it</button>
      </div>
      {message && <p className="inline-feedback" role="status">{message}</p>}
      <details className="explanation"><summary>More options</summary><p className="safety-note">{batch.dateType === 'unknown' ? 'Check the product label and storage guidance before using.' : `${batch.dateType === 'use_by' ? 'Use-by' : 'Best-before'} ${batch.relevantDate}. Always check the label and storage guidance.`}</p><ul>{intervention.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul><div className="text-actions"><button onClick={() => actions.respondToIntervention(intervention.id, 'snoozed')}>Snooze one day</button><Link to={`/fridge/${food.id}`}>Correct details</Link><button onClick={() => actions.respondToIntervention(intervention.id, 'dismissed')}>Dismiss</button><Link to="/settings">Reminder settings</Link></div></details>
      </div>
    </article>
  );
}
