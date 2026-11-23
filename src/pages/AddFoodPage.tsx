import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Unit } from '../domain/types';
import { useAppState } from '../state/AppState';

export function AddFoodPage() {
  const { actions } = useAppState(); const navigate = useNavigate();
  const [tab, setTab] = useState<'photo' | 'manual'>('photo');
  const [recognised, setRecognised] = useState(false);
  const [name, setName] = useState('Tomatoes'); const [quantity, setQuantity] = useState('4'); const [unit, setUnit] = useState<Unit>('item'); const [date, setDate] = useState(''); const [storage, setStorage] = useState<'fridge' | 'freezer' | 'cupboard'>('fridge'); const [note, setNote] = useState('');
  const save = (demo = false) => { actions.addFood({ name, quantity: quantity === '' ? null : Number(quantity), unit, relevantDate: date || undefined, dateType: date ? 'best_before' : 'unknown', storage, note }, demo); navigate('/fridge'); };
  return <div className="page-stack narrow-page"><section><span className="kicker">Correction over administration</span><h1>Add food</h1><p>Choose the quickest useful route. You can correct everything later.</p></section>
    <div className="segmented" role="tablist" aria-label="Add food method"><button role="tab" aria-selected={tab === 'photo'} onClick={() => setTab('photo')}>Add by photo</button><button role="tab" aria-selected={tab === 'manual'} onClick={() => setTab('manual')}>Manual add</button></div>
    {tab === 'photo' && !recognised && <section className="photo-panel"><div className="camera-placeholder" aria-hidden="true">▣</div><h2>Photograph food or packaging</h2><p>For V0.1 this returns deterministic suggestions so the review interaction can be tested.</p><label className="button primary file-button">Choose demo photo<input type="file" accept="image/*" onChange={() => setRecognised(true)} /></label><button className="button secondary" onClick={() => setRecognised(true)}>Use sample image</button></section>}
    {(tab === 'manual' || recognised) && <section className="form-card">{recognised && <div className="demo-notice"><strong>Demo recognition — please review before saving.</strong><p>No production computer vision is running.</p></div>}<FoodForm name={name} setName={setName} quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} date={date} setDate={setDate} storage={storage} setStorage={setStorage} note={note} setNote={setNote} /><button className="button primary full" onClick={() => save(recognised)} disabled={!name.trim()}>Save to My Fridge</button></section>}
    <details className="concept-card"><summary>Receipt scan concept</summary><p>Receipt scanning is a future concept, not implemented recognition in V0.1.</p></details>
  </div>;
}

function FoodForm(props: { name: string; setName: (v: string) => void; quantity: string; setQuantity: (v: string) => void; unit: Unit; setUnit: (v: Unit) => void; date: string; setDate: (v: string) => void; storage: 'fridge' | 'freezer' | 'cupboard'; setStorage: (v: 'fridge' | 'freezer' | 'cupboard') => void; note: string; setNote: (v: string) => void }) {
  return <div className="form-grid"><label className="wide">Food name<input value={props.name} onChange={(e) => props.setName(e.target.value)} /></label><label>Quantity<input inputMode="decimal" value={props.quantity} onChange={(e) => props.setQuantity(e.target.value)} placeholder="Unknown" /></label><label>Unit<select value={props.unit} onChange={(e) => props.setUnit(e.target.value as Unit)}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>tsp</option><option>cup</option></select></label><label>Relevant date<input type="date" value={props.date} onChange={(e) => props.setDate(e.target.value)} /></label><label>Storage<select value={props.storage} onChange={(e) => props.setStorage(e.target.value as typeof props.storage)}><option>fridge</option><option>freezer</option><option>cupboard</option></select></label><label className="wide">Optional note<textarea value={props.note} onChange={(e) => props.setNote(e.target.value)} rows={3} /></label></div>;
}
