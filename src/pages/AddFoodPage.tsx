import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Unit } from '../domain/types';
import { foodCamera, type CameraPurpose } from '../platform/camera/CameraAdapter';
import { getRuntimePlatform } from '../platform/runtime';
import { useAppState } from '../state/AppState';

export function AddFoodPage() {
  const { actions } = useAppState();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'choices' | 'review' | 'manual'>('choices');
  const [permissionPurpose, setPermissionPurpose] = useState<CameraPurpose | null>(null);
  const [status, setStatus] = useState('');
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState<string | undefined>();
  const [name, setName] = useState('Tomatoes');
  const [quantity, setQuantity] = useState('4');
  const [unit, setUnit] = useState<Unit>('item');
  const [date, setDate] = useState('');
  const [storage, setStorage] = useState<'fridge' | 'freezer' | 'cupboard'>('fridge');
  const [note, setNote] = useState('');
  const platform = getRuntimePlatform();

  const save = (demo = false) => {
    actions.addFood({ name, quantity: quantity === '' ? null : Number(quantity), unit, relevantDate: date || undefined, dateType: date ? 'best_before' : 'unknown', storage, note }, demo);
    navigate('/fridge');
  };

  const continueImageFlow = async () => {
    if (!permissionPurpose) return;
    if (!foodCamera.isAvailable()) {
      setPermissionPurpose(null);
      fileInput.current?.click();
      return;
    }
    setWorking(true);
    setStatus('');
    try {
      const permission = await foodCamera.requestPermission(permissionPurpose);
      const permitted = permissionPurpose === 'camera' ? permission?.camera === 'granted' : permission?.photos === 'granted' || permission?.photos === 'limited';
      if (!permitted) {
        setStatus('Permission was not granted. You can still add food manually.');
        setPermissionPurpose(null);
        return;
      }
      const image = await foodCamera.capture(permissionPurpose);
      setPreview(image.webPath);
      setMode('review');
      setPermissionPurpose(null);
    } catch {
      setStatus('The image could not be opened. Manual entry is still available.');
      setPermissionPurpose(null);
    } finally {
      setWorking(false);
    }
  };

  const handleWebFile = (file?: File) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setMode('review');
    setStatus('');
  };

  return <div className="page-stack narrow-page add-food-page">
    <section><span className="kicker">Add food</span><h1>What are you putting away?</h1><p>Choose the quickest route. Review is always required before anything is saved.</p></section>

    {mode === 'choices' && <section className="mobile-action-list" aria-label="Add food options">
      <button onClick={() => setPermissionPurpose('camera')}><span className="action-icon" aria-hidden="true">◉</span><span><strong>Take a photo</strong><small>Use your {platform === 'web' ? 'device image picker' : 'camera'} and review the suggestion.</small></span></button>
      <button onClick={() => setPermissionPurpose('library')}><span className="action-icon" aria-hidden="true">▧</span><span><strong>Choose from library</strong><small>Select an existing food or package photo.</small></span></button>
      <button onClick={() => setMode('manual')}><span className="action-icon" aria-hidden="true">＋</span><span><strong>Add manually</strong><small>Reliable fallback — no camera permission needed.</small></span></button>
    </section>}

    {(mode === 'manual' || mode === 'review') && <section className="form-card">
      {mode === 'review' && <div className="recognition-review">{preview && <img src={preview} alt="Selected food for review" />}<div className="demo-notice"><strong>Demo recognition — please review before saving.</strong><p>The image was captured natively, but food recognition remains a deterministic prototype suggestion.</p></div></div>}
      <FoodForm name={name} setName={setName} quantity={quantity} setQuantity={setQuantity} unit={unit} setUnit={setUnit} date={date} setDate={setDate} storage={storage} setStorage={setStorage} note={note} setNote={setNote} />
      <div className="button-row mobile-form-actions"><button className="button secondary" onClick={() => setMode('choices')}>Choose another method</button><button className="button primary" onClick={() => save(mode === 'review')} disabled={!name.trim()}>Save to My Fridge</button></div>
    </section>}

    {status && <p className="inline-feedback permission-denied" role="status">{status}</p>}
    <details className="concept-card"><summary>Receipt scan concept</summary><p>Receipt scanning remains a future concept; no production OCR is claimed in V0.1.1.</p></details>

    <input ref={fileInput} className="sr-only" type="file" accept="image/*" onChange={(event) => handleWebFile(event.target.files?.[0])} aria-label="Choose food photo from device" />

    {permissionPurpose && <div className="sheet-backdrop" role="presentation" onClick={() => setPermissionPurpose(null)}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="camera-permission-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <span className="kicker">Before we open your {permissionPurpose === 'camera' ? 'camera' : 'library'}</span>
        <h2 id="camera-permission-title">You stay in control</h2>
        <p>FridgeMind uses the selected image only to prepare an editable demo suggestion on this device. Manual entry always remains available.</p>
        <ul className="permission-list"><li>No production recognition claim</li><li>No participant image is uploaded by this local-first prototype</li><li>You can deny permission and continue manually</li></ul>
        <div className="sheet-actions"><button className="button secondary" onClick={() => { setPermissionPurpose(null); setMode('manual'); }}>Use manual entry</button><button className="button primary" onClick={continueImageFlow} disabled={working}>{working ? 'Opening…' : `Continue to ${permissionPurpose === 'camera' ? 'camera' : 'library'}`}</button></div>
      </section>
    </div>}
  </div>;
}

function FoodForm(props: { name: string; setName: (v: string) => void; quantity: string; setQuantity: (v: string) => void; unit: Unit; setUnit: (v: Unit) => void; date: string; setDate: (v: string) => void; storage: 'fridge' | 'freezer' | 'cupboard'; setStorage: (v: 'fridge' | 'freezer' | 'cupboard') => void; note: string; setNote: (v: string) => void }) {
  return <div className="form-grid"><label className="wide">Food name<input value={props.name} onChange={(e) => props.setName(e.target.value)} /></label><label>Quantity<input inputMode="decimal" value={props.quantity} onChange={(e) => props.setQuantity(e.target.value)} placeholder="Unknown" /></label><label>Unit<select value={props.unit} onChange={(e) => props.setUnit(e.target.value as Unit)}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>tsp</option><option>cup</option></select></label><label>Relevant date<input type="date" value={props.date} onChange={(e) => props.setDate(e.target.value)} /></label><label>Storage<select value={props.storage} onChange={(e) => props.setStorage(e.target.value as typeof props.storage)}><option>fridge</option><option>freezer</option><option>cupboard</option></select></label><label className="wide">Optional note<textarea value={props.note} onChange={(e) => props.setNote(e.target.value)} rows={3} /></label></div>;
}
