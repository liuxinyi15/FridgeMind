import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FoodItem, Intervention } from '../domain/types';
import { useAppState } from '../state/AppState';
import { StatusChip } from './StatusChip';

export function UseSoonCard({ food, intervention }: { food: FoodItem; intervention: Intervention }) {
  const { actions } = useAppState();
  const [message, setMessage] = useState('');
  const batch = food.batches[0];
  if (intervention.dismissedAt) return <div className="quiet-card"><strong>Reminder dismissed</strong><p>{food.name} is still visible in My Fridge. It will not interrupt you again now.</p></div>;
  return (
    <article className="use-soon-card" aria-labelledby={`use-soon-${food.id}`}>
      <div className="section-heading compact"><div><span className="kicker">A small nudge</span><h2 id={`use-soon-${food.id}`}>{intervention.title}</h2></div><StatusChip tone="warn">Use soon</StatusChip></div>
      <p>{intervention.message}</p>
      <p className="safety-note"><span aria-hidden="true">ⓘ</span> {batch.dateType === 'unknown' ? 'Date or storage is uncertain. Check the product label or storage guidance before using.' : `${batch.dateType === 'use_by' ? 'Use-by' : 'Best-before'}: ${batch.relevantDate}. Check the label and storage guidance before using.`}</p>
      <div className="action-grid">
        <Link className="button primary" to="/recipes?uses=spinach">Cook something</Link>
        <button className="button secondary" onClick={() => setMessage('Plan noted: freeze or store it after checking suitable storage guidance.')}>Freeze / store</button>
        <button className="button secondary" onClick={() => setMessage('Added as an in-app plan for your next meal.')}>Plan for later</button>
        <button className="button ghost" onClick={() => actions.respondToIntervention(intervention.id, 'dismissed')}>Dismiss</button>
      </div>
      {message && <p className="inline-feedback" role="status">{message}</p>}
      <details className="explanation"><summary>Why am I seeing this?</summary><ul>{intervention.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>
      <div className="text-actions">
        <button onClick={() => actions.respondToIntervention(intervention.id, 'snoozed')}>Snooze 1 day</button>
        <Link to={`/fridge/${food.id}`}>Correct information</Link>
        <Link to="/settings">Reminder settings</Link>
      </div>
    </article>
  );
}
