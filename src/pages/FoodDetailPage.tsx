import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import type { QuantityMode, Unit } from '../domain/types';
import { StatusChip } from '../components/StatusChip';
import { FoodIcon } from '../components/FoodIcon';

export function FoodDetailPage() {
  const { foodId } = useParams();
  const { data, actions } = useAppState();
  const food = data.inventory.find((item) => item.id === foodId);
  const batch = food?.batches[0];
  const [amount, setAmount] = useState(batch?.physicalStock?.toString() ?? '');
  const [unit, setUnit] = useState<Unit>(batch?.unit ?? 'g');
  const [mode, setMode] = useState<QuantityMode>(batch?.quantityMode ?? 'exact');
  const [description, setDescription] = useState(batch?.quantityDescription ?? '');
  const [saved, setSaved] = useState(false);
  if (!food || !batch) return <Navigate to="/fridge" replace />;
  return <div className="page-stack narrow-page food-detail-page"><section className="food-detail-heading"><FoodIcon name={food.canonicalName} large /><div><span className="overline">Food details</span><h1>{food.name}</h1><div className="chip-row"><StatusChip tone={batch.confidence === 'confirmed' ? 'good' : 'danger'}>{batch.confidence === 'confirmed' ? 'Confirmed' : 'Needs a check'}</StatusChip><StatusChip tone={batch.state === 'use_soon' ? 'warn' : 'neutral'}>{batch.state === 'use_soon' ? 'Use soon' : batch.state}</StatusChip></div></div></section>
    <section className="form-card"><h2>How much is left?</h2><p>Track enough to help — exact numbers are optional.</p><fieldset className="quantity-mode"><legend>Quantity type</legend>{([['exact', 'Exact'], ['approximate', 'Approximate'], ['unknown', 'Some left']] as [QuantityMode, string][]).map(([value, label]) => <label key={value} className={mode === value ? 'selected' : ''}><input type="radio" name="detail-quantity-mode" checked={mode === value} onChange={() => setMode(value)} />{label}</label>)}</fieldset>{mode !== 'unknown' && <div className="field-row"><label>Amount<input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} /></label><label>Unit<select value={unit} onChange={(event) => setUnit(event.target.value as Unit)}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>portion</option></select></label></div>}{mode !== 'exact' && <label>Plain-language amount<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={mode === 'unknown' ? 'some left' : 'about half a pack'} /></label>}<button className="button primary full" onClick={() => { actions.correctFood(food.id, mode === 'unknown' || amount === '' ? null : Number(amount), unit, mode, description); setSaved(true); }}>Save changes</button>{saved && <p className="inline-feedback" role="status">Saved. Your matches are up to date.</p>}</section>
    <details className="concept-card"><summary>Storage & date</summary><p>{batch.storage[0].toUpperCase() + batch.storage.slice(1)} · {batch.dateType === 'unknown' || !batch.relevantDate ? 'No date recorded.' : `${batch.dateType.replace('_', ' ')} ${batch.relevantDate}.`}</p><p>Always follow the product label and suitable storage guidance. FridgeMind cannot decide whether food is safe to eat.</p></details>
  </div>;
}
