import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import type { Unit } from '../domain/types';
import { StatusChip } from '../components/StatusChip';
import { FoodIcon } from '../components/FoodIcon';

export function FoodDetailPage() {
  const { foodId } = useParams();
  const { data, actions } = useAppState();
  const food = data.inventory.find((item) => item.id === foodId);
  const batch = food?.batches[0];
  const [amount, setAmount] = useState(batch?.physicalStock?.toString() ?? '');
  const [unit, setUnit] = useState<Unit>(batch?.unit ?? 'g');
  const [saved, setSaved] = useState(false);
  if (!food || !batch) return <Navigate to="/fridge" replace />;
  return <div className="page-stack narrow-page food-detail-page"><section className="food-detail-heading"><FoodIcon name={food.canonicalName} large /><div><span className="overline">Food details</span><h1>{food.name}</h1><div className="chip-row"><StatusChip tone={batch.confidence === 'confirmed' ? 'good' : 'danger'}>{batch.confidence === 'confirmed' ? 'Confirmed' : 'Needs a check'}</StatusChip><StatusChip tone={batch.state === 'use_soon' ? 'warn' : 'neutral'}>{batch.state === 'use_soon' ? 'Use soon' : batch.state}</StatusChip></div></div></section>
    <section className="form-card"><h2>How much is left?</h2><p>Keeping this current improves recipes and shopping.</p><div className="field-row"><label>Amount<input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="Unknown" /></label><label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value as Unit)}><option>g</option><option>ml</option><option>item</option><option>tbsp</option></select></label></div><button className="button primary full" onClick={() => { actions.correctFood(food.id, amount === '' ? null : Number(amount), unit); setSaved(true); }}>Save changes</button>{saved && <p className="inline-feedback" role="status">Saved. Your matches are up to date.</p>}</section>
    <details className="concept-card"><summary>Storage & date</summary><p>{batch.storage[0].toUpperCase() + batch.storage.slice(1)} · {batch.dateType === 'unknown' || !batch.relevantDate ? 'No date recorded.' : `${batch.dateType.replace('_', ' ')} ${batch.relevantDate}.`}</p><p>Always follow the product label and suitable storage guidance. FridgeMind cannot decide whether food is safe to eat.</p></details>
  </div>;
}
