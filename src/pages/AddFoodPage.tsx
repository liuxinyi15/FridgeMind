import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuantityMode, Unit } from '../domain/types';
import { foodCamera, type CameraPurpose } from '../platform/camera/CameraAdapter';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

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
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('exact');
  const [quantityDescription, setQuantityDescription] = useState('');
  const [unit, setUnit] = useState<Unit>('item');
  const [date, setDate] = useState('');
  const [storage, setStorage] = useState<'fridge' | 'freezer' | 'cupboard'>('fridge');
  const [note, setNote] = useState('');

  const save = (demo = false) => {
    actions.addFood({ name, quantity: quantityMode === 'unknown' || quantity === '' ? null : Number(quantity), quantityMode, quantityDescription: quantityDescription || undefined, unit, relevantDate: date || undefined, dateType: date ? 'best_before' : 'unknown', storage, note }, demo);
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
    <section className="add-food-intro"><span className="overline">Add food</span><h1>What are you putting away?</h1><p>Choose a quick way to start.</p></section>

    {mode === 'choices' && <section className="mobile-action-list method-sheet" aria-label="Add food options">
      <div className="sheet-handle" aria-hidden="true" /><h2>Add from</h2>
      <button onClick={() => setPermissionPurpose('camera')}><span className="action-icon" aria-hidden="true"><Icon name="camera" /></span><span><strong>Camera</strong><small>Take a photo, then add the details.</small></span><Icon name="chevron" size={18} /></button>
      <button onClick={() => setPermissionPurpose('library')}><span className="action-icon" aria-hidden="true"><Icon name="gallery" /></span><span><strong>Photo library</strong><small>Choose a photo to keep with your entry.</small></span><Icon name="chevron" size={18} /></button>
      <button onClick={() => setMode('manual')}><span className="action-icon" aria-hidden="true"><Icon name="edit" /></span><span><strong>Enter manually</strong><small>Fast and no photo needed.</small></span><Icon name="chevron" size={18} /></button>
    </section>}

    {(mode === 'manual' || mode === 'review') && <section className="form-card">
      {mode === 'review' && <div className="recognition-review">{preview && <img src={preview} alt="Selected food for review" />}<div className="demo-notice"><strong>Photo added for reference</strong><p>Automatic food recognition is not available yet. Check the starter details below.</p></div></div>}
      <FoodForm name={name} setName={setName} quantity={quantity} setQuantity={setQuantity} quantityMode={quantityMode} setQuantityMode={setQuantityMode} quantityDescription={quantityDescription} setQuantityDescription={setQuantityDescription} unit={unit} setUnit={setUnit} date={date} setDate={setDate} storage={storage} setStorage={setStorage} note={note} setNote={setNote} />
      <div className="button-row mobile-form-actions"><button className="button secondary" onClick={() => setMode('choices')}>Choose another method</button><button className="button primary" onClick={() => save(mode === 'review')} disabled={!name.trim()}>Save to My Fridge</button></div>
    </section>}

    {status && <p className="inline-feedback permission-denied" role="status">{status}</p>}
    <details className="concept-card"><summary>Photo privacy</summary><p>Your selected photo stays on this device and is only used while you review this entry. Manual entry is always available.</p></details>

    <input ref={fileInput} className="sr-only" type="file" accept="image/*" onChange={(event) => handleWebFile(event.target.files?.[0])} aria-label="Choose food photo from device" />

    {permissionPurpose && <div className="sheet-backdrop" role="presentation" onClick={() => setPermissionPurpose(null)}>
      <section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="camera-permission-title" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" aria-hidden="true" />
        <span className="overline">Photo access</span>
        <h2 id="camera-permission-title">Open your {permissionPurpose === 'camera' ? 'camera' : 'photo library'}?</h2>
        <p>Your photo stays on this device. You’ll review everything before saving.</p>
        <div className="sheet-actions"><button className="button secondary" onClick={() => { setPermissionPurpose(null); setMode('manual'); }}>Enter manually</button><button className="button primary" onClick={continueImageFlow} disabled={working}>{working ? 'Opening…' : 'Continue'}</button></div>
      </section>
    </div>}
  </div>;
}

function FoodForm(props: { name: string; setName: (v: string) => void; quantity: string; setQuantity: (v: string) => void; quantityMode: QuantityMode; setQuantityMode: (v: QuantityMode) => void; quantityDescription: string; setQuantityDescription: (v: string) => void; unit: Unit; setUnit: (v: Unit) => void; date: string; setDate: (v: string) => void; storage: 'fridge' | 'freezer' | 'cupboard'; setStorage: (v: 'fridge' | 'freezer' | 'cupboard') => void; note: string; setNote: (v: string) => void }) {
  return <div className="form-grid"><label className="wide">Food name<input value={props.name} onChange={(e) => props.setName(e.target.value)} /></label><fieldset className="quantity-mode wide"><legend>How much do you know?</legend>{([['exact', 'Exact'], ['approximate', 'Approximate'], ['unknown', 'Some left']] as [QuantityMode, string][]).map(([value, label]) => <label key={value} className={props.quantityMode === value ? 'selected' : ''}><input type="radio" name="quantity-mode" value={value} checked={props.quantityMode === value} onChange={() => props.setQuantityMode(value)} />{label}</label>)}</fieldset>{props.quantityMode !== 'unknown' && <><label>{props.quantityMode === 'exact' ? 'Quantity' : 'About how much'}<input inputMode="decimal" value={props.quantity} onChange={(e) => props.setQuantity(e.target.value)} /></label><label>Unit<select value={props.unit} onChange={(e) => props.setUnit(e.target.value as Unit)}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>tsp</option><option>cup</option></select></label></>}{props.quantityMode !== 'exact' && <label className="wide">Plain-language amount<input value={props.quantityDescription} onChange={(e) => props.setQuantityDescription(e.target.value)} placeholder={props.quantityMode === 'unknown' ? 'e.g. some left' : 'e.g. about half a pack'} /></label>}<label>Relevant date<input type="date" value={props.date} onChange={(e) => props.setDate(e.target.value)} /></label><label>Storage<select value={props.storage} onChange={(e) => props.setStorage(e.target.value as typeof props.storage)}><option>fridge</option><option>freezer</option><option>cupboard</option></select></label><label className="wide">Optional note<textarea value={props.note} onChange={(e) => props.setNote(e.target.value)} rows={3} /></label></div>;
}
