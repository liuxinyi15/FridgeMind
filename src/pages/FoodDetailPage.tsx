import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import type { Unit } from '../domain/types';
import { StatusChip } from '../components/StatusChip';

export function FoodDetailPage() {
  const { foodId } = useParams();
  const { data, actions } = useAppState();
  const food = data.inventory.find((item) => item.id === foodId);
  const batch = food?.batches[0];
  const [amount, setAmount] = useState(batch?.physicalStock?.toString() ?? '');
  const [unit, setUnit] = useState<Unit>(batch?.unit ?? 'g');
  const [saved, setSaved] = useState(false);
  if (!food || !batch) return <Navigate to="/fridge" replace />;
  return <div className="page-stack narrow-page"><section><span className="kicker">Inventory correction</span><h1>{food.name}</h1><div className="chip-row"><StatusChip tone={batch.confidence === 'confirmed' ? 'good' : 'danger'}>{batch.confidence.replace('_', ' ')}</StatusChip><StatusChip tone={batch.state === 'use_soon' ? 'warn' : 'neutral'}>{batch.state.replace('_', ' ')}</StatusChip></div></section>
    <section className="form-card"><h2>What is actually there?</h2><p>A lightweight correction updates recipe matches and shopping gaps.</p><div className="field-row"><label>Amount<input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} placeholder="Unknown" /></label><label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value as Unit)}><option>g</option><option>ml</option><option>item</option><option>tbsp</option></select></label></div><button className="button primary full" onClick={() => { actions.correctFood(food.id, amount === '' ? null : Number(amount), unit); setSaved(true); }}>Save correction</button>{saved && <p className="inline-feedback" role="status">Saved. Recipe matches will use this correction.</p>}</section>
    <section className="safety-panel"><h2>Food safety boundary</h2><p>{batch.dateType === 'unknown' || !batch.relevantDate ? 'Date or storage is uncertain. Check the product label or storage guidance before using.' : `This record says ${batch.dateType.replace('_', '-')} ${batch.relevantDate}. Always follow the product label and suitable storage guidance.`}</p><p>FridgeMind does not decide whether food is safe to eat.</p></section>
  </div>;
}
