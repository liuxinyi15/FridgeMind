import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { canonicalise } from '../domain/inventory';
import type { QuantityMode, StorageLocation, Unit } from '../domain/types';
import { foodCamera, type CameraPurpose } from '../platform/camera/CameraAdapter';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

type CaptureFlow = 'grocery' | 'receipt' | 'single';
type View = 'choices' | 'capture' | 'processing' | 'review' | 'manual' | 'failure';

interface FoodCandidate {
  id: string; selected: boolean; name: string; category: 'fresh' | 'pantry' | 'frozen'; quantityMode: QuantityMode;
  quantity: string; quantityDescription: string; unit: Unit; storage: StorageLocation; date: string; mergeChoice: 'new' | 'merge';
}

const makeCandidate = (id: string, name: string, quantityMode: QuantityMode, quantity: string, quantityDescription: string, unit: Unit, storage: StorageLocation): FoodCandidate => ({
  id: `candidate-${id}`, selected: true, name, category: storage === 'cupboard' ? 'pantry' : storage === 'freezer' ? 'frozen' : 'fresh', quantityMode, quantity, quantityDescription, unit, storage, date: '', mergeChoice: 'new',
});
const groceryCandidates = () => [makeCandidate('spinach', 'Spinach', 'approximate', '1', 'Approx. 1 pack', 'item', 'fridge'), makeCandidate('mushroom', 'Mushrooms', 'approximate', '1', 'Approx. 1 pack', 'item', 'fridge'), makeCandidate('chicken', 'Chicken', 'approximate', '250', 'Approx. 250g', 'g', 'fridge')];
const receiptCandidates = () => [makeCandidate('mushroom', 'Mushrooms', 'unknown', '', 'Amount not detected', 'g', 'fridge'), makeCandidate('spinach', 'Spinach', 'unknown', '', 'Amount not detected', 'g', 'fridge'), makeCandidate('pasta', 'Pasta', 'unknown', '', 'Amount not detected', 'g', 'cupboard'), makeCandidate('chicken', 'Chicken', 'unknown', '', 'Amount not detected', 'g', 'fridge')];

export function AddFoodPage() {
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileInput = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>('choices');
  const [flow, setFlow] = useState<CaptureFlow>('grocery');
  const [permissionPurpose, setPermissionPurpose] = useState<CameraPurpose | null>(null);
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [candidates, setCandidates] = useState<FoodCandidate[]>([]);
  const [manual, setManual] = useState(() => makeCandidate('manual', '', 'exact', '1', '', 'item', 'fridge'));

  useEffect(() => {
    const fixture = params.get('fixture');
    if (fixture === 'grocery' || fixture === 'duplicate') { setFlow('grocery'); setCandidates(groceryCandidates()); setView('review'); }
    if (fixture === 'receipt') { setFlow('receipt'); setCandidates(receiptCandidates()); setView('review'); }
  }, [params]);

  const beginCapture = (nextFlow: CaptureFlow) => { setFlow(nextFlow); setView('capture'); };
  const propose = (fileName = '') => { setView('processing'); window.setTimeout(() => { if (/empty|unknown|blank/i.test(fileName)) { setView('failure'); return; } setCandidates(flow === 'receipt' ? receiptCandidates() : flow === 'single' ? [makeCandidate('tomato', 'Tomatoes', 'approximate', '4', 'Approx. 4 items', 'item', 'fridge')] : groceryCandidates()); setView('review'); }, 250); };
  const chooseFile = () => fileInput.current?.click();
  const handleFile = (file?: File) => { if (!file) return; setPreview(URL.createObjectURL(file)); propose(file.name); };
  const continueCamera = async () => {
    if (!permissionPurpose) return;
    if (!foodCamera.isAvailable()) { setPermissionPurpose(null); chooseFile(); return; }
    setWorking(true);
    try {
      const permission = await foodCamera.requestPermission(permissionPurpose);
      const allowed = permissionPurpose === 'camera' ? permission?.camera === 'granted' : permission?.photos === 'granted' || permission?.photos === 'limited';
      if (!allowed) { setPermissionPurpose(null); setView('failure'); return; }
      const image = await foodCamera.capture(permissionPurpose); setPreview(image.webPath); setPermissionPurpose(null); propose();
    } catch { setPermissionPurpose(null); setView('failure'); } finally { setWorking(false); }
  };
  const update = (candidateId: string, change: Partial<FoodCandidate>) => setCandidates((items) => items.map((item) => item.id === candidateId ? { ...item, ...change } : item));
  const selected = candidates.filter((item) => item.selected && item.name.trim());
  const saveBatch = () => {
    selected.forEach((item) => {
      const shoppingMatch = data.shopping.find((shopping) => !shopping.addedToFridge && shopping.canonicalName === canonicalise(item.name));
      const amount = item.quantityMode === 'unknown' || !item.quantity ? null : Number(item.quantity);
      if (flow === 'receipt' && shoppingMatch) actions.reconcileShopping(shoppingMatch.id, amount, item.unit);
      else actions.addFood({ name: item.name, quantity: amount, quantityMode: item.quantityMode, quantityDescription: item.quantityDescription || undefined, unit: item.unit, relevantDate: item.date || undefined, dateType: item.date ? 'use_by' : 'unknown', storage: item.storage, source: flow === 'receipt' ? 'receipt' : 'photo', category: item.category }, { source: flow === 'receipt' ? 'receipt' : 'photo', mergeExisting: item.mergeChoice === 'merge' });
    });
    navigate('/fridge', { state: { addedCount: selected.length } });
  };
  const saveManual = () => { actions.addFood({ name: manual.name, quantity: manual.quantityMode === 'unknown' || !manual.quantity ? null : Number(manual.quantity), quantityMode: manual.quantityMode, quantityDescription: manual.quantityDescription || undefined, unit: manual.unit, relevantDate: manual.date || undefined, dateType: manual.date ? 'best_before' : 'unknown', storage: manual.storage, source: 'manual' }, { source: 'manual', mergeExisting: manual.mergeChoice === 'merge' }); navigate('/fridge', { state: { addedCount: 1 } }); };
  const manualDuplicate = data.inventory.find((food) => food.kind !== 'leftover' && food.canonicalName === canonicalise(manual.name));

  return <div className="page-stack narrow-page add-food-page">
    <section className="add-food-intro"><span className="overline">Add groceries</span><h1>{view === 'review' ? 'Review detected items' : view === 'manual' ? 'Enter food details' : 'Capture what you bought'}</h1><p>{view === 'review' ? 'Check what matters, remove anything incorrect, then add the selected items.' : 'Start with a photo or receipt, then review before anything is added.'}</p></section>
    {view === 'choices' && <section className="mobile-action-list method-sheet" aria-label="Add food options"><div className="sheet-handle" aria-hidden="true" /><h2>Add from</h2><CaptureChoice icon="camera" title="Scan groceries" detail="Photograph one item or several groceries." onClick={() => beginCapture('grocery')} /><CaptureChoice icon="receipt" title="Scan receipt" detail="Extract grocery names without forcing exact amounts." onClick={() => beginCapture('receipt')} /><CaptureChoice icon="gallery" title="Add from photo" detail="Choose a food photo from your library." onClick={() => beginCapture('single')} /><CaptureChoice icon="edit" title="Enter manually" detail="Add only the details you know." onClick={() => setView('manual')} /></section>}
    {view === 'capture' && <section className="capture-card"><div className="capture-illustration"><Icon name={flow === 'receipt' ? 'receipt' : 'camera'} size={34} /></div><h2>{flow === 'receipt' ? 'Scan your receipt' : 'Add a clear photo'}</h2><p>Your photo is used to prepare an editable suggestion. Nothing is saved until you review it.</p><div className="button-row"><button className="button primary" onClick={() => setPermissionPurpose('camera')}>Take a photo</button><button className="button secondary" onClick={chooseFile}>Choose photo instead</button><button className="button ghost" onClick={() => setView('choices')}>Cancel</button></div></section>}
    {view === 'processing' && <section className="processing-card" aria-live="polite"><span className="processing-spinner" aria-hidden="true" /><h2>{flow === 'receipt' ? 'Extracting items…' : 'Processing photo…'}</h2><p>You can review everything before saving.</p></section>}
    {view === 'failure' && <section className="empty-state"><Icon name="info" size={30} /><h2>We couldn’t identify enough from this image.</h2><p>Try a clearer photo, or add the food manually.</p><div className="button-row"><button className="button primary" onClick={() => setView('capture')}>Try another photo</button><button className="button secondary" onClick={() => setView('manual')}>Add manually</button></div></section>}
    {view === 'review' && <section className="batch-review"><div className="batch-review-toolbar"><div><strong>{candidates.length} possible {candidates.length === 1 ? 'item' : 'items'}</strong><span>Check before saving</span></div><div><button className="text-button" onClick={() => setCandidates((items) => items.map((item) => ({ ...item, selected: true })))}>Select all</button><button className="text-button" onClick={() => setCandidates((items) => items.map((item) => ({ ...item, selected: false })))}>Deselect</button></div></div>{preview && <img className="batch-preview" src={preview} alt="Selected groceries" />}<div className="import-candidate-list">{candidates.map((item, index) => <CandidateCard key={item.id} item={item} index={index} flow={flow} inventory={data.inventory} shopping={data.shopping} update={update} remove={() => setCandidates((items) => items.filter((entry) => entry.id !== item.id))} />)}</div><div className="sticky-actions import-sticky"><button className="button secondary" onClick={() => setView('choices')}>Cancel</button><button className="button primary" disabled={!selected.length} onClick={saveBatch}>Add {selected.length} {selected.length === 1 ? 'item' : 'items'}</button></div></section>}
    {view === 'manual' && <section className="form-card"><CandidateForm item={manual} update={(change) => setManual({ ...manual, ...change })} />{manualDuplicate && <fieldset className="duplicate-choice"><legend>You already have {manualDuplicate.name.toLowerCase()}</legend><label><input type="radio" name="manual-duplicate" checked={manual.mergeChoice === 'new'} onChange={() => setManual({ ...manual, mergeChoice: 'new' })} /> Add as new purchase</label><label><input type="radio" name="manual-duplicate" checked={manual.mergeChoice === 'merge'} onChange={() => setManual({ ...manual, mergeChoice: 'merge' })} /> Merge with existing stock</label></fieldset>}<div className="button-row mobile-form-actions"><button className="button secondary" onClick={() => setView('choices')}>Choose another method</button><button className="button primary" onClick={saveManual} disabled={!manual.name.trim()}>Save to My Fridge</button></div></section>}
    <details className="concept-card"><summary>Photo privacy</summary><p>Selected photos stay on this device and are used only to prepare the editable review. FridgeMind does not upload them.</p></details>
    <input ref={fileInput} className="sr-only" type="file" accept="image/*" onChange={(event) => handleFile(event.target.files?.[0])} aria-label="Choose food photo from device" />
    {permissionPurpose && <div className="sheet-backdrop" role="presentation" onClick={() => setPermissionPurpose(null)}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="camera-permission-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><h2 id="camera-permission-title">Open your camera?</h2><p>Your photo is used to prepare an editable suggestion.</p><div className="sheet-actions"><button className="button ghost" onClick={() => setPermissionPurpose(null)}>Cancel</button><button className="button secondary" onClick={() => { setPermissionPurpose(null); chooseFile(); }}>Choose photo instead</button><button className="button primary" onClick={continueCamera} disabled={working}>{working ? 'Opening…' : 'Continue'}</button></div></section></div>}
  </div>;
}

function CandidateCard({ item, index, flow, inventory, shopping, update, remove }: { item: FoodCandidate; index: number; flow: CaptureFlow; inventory: ReturnType<typeof useAppState>['data']['inventory']; shopping: ReturnType<typeof useAppState>['data']['shopping']; update: (id: string, change: Partial<FoodCandidate>) => void; remove: () => void }) {
  const duplicate = inventory.find((food) => food.kind !== 'leftover' && food.canonicalName === canonicalise(item.name));
  const shoppingMatch = flow === 'receipt' && shopping.find((entry) => !entry.addedToFridge && entry.canonicalName === canonicalise(item.name));
  return <article className={`import-candidate${item.selected ? '' : ' deselected'}`}><div className="candidate-heading"><label className="candidate-select"><input type="checkbox" checked={item.selected} onChange={(event) => update(item.id, { selected: event.target.checked })} /><span>Item {index + 1}</span></label><button className="text-button" onClick={remove}>Remove</button></div><div className="candidate-fields"><label>Name<input value={item.name} onChange={(event) => update(item.id, { name: event.target.value })} /></label><label>Quantity<select value={item.quantityMode} onChange={(event) => update(item.id, { quantityMode: event.target.value as QuantityMode })}><option value="unknown">Unknown</option><option value="approximate">Approximate</option><option value="exact">Exact</option></select></label>{item.quantityMode !== 'unknown' && <><label>Amount<input inputMode="decimal" value={item.quantity} onChange={(event) => update(item.id, { quantity: event.target.value })} /></label><label>Unit<select value={item.unit} onChange={(event) => update(item.id, { unit: event.target.value as Unit })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>cup</option></select></label></>}<label>Storage<select value={item.storage} onChange={(event) => update(item.id, { storage: event.target.value as StorageLocation })}><option value="fridge">Fridge</option><option value="freezer">Freezer</option><option value="cupboard">Cupboard</option></select></label><label>Date<input type="date" value={item.date} onChange={(event) => update(item.id, { date: event.target.value })} /></label></div><p className="candidate-cue">{item.date ? 'Date added' : 'Date not detected'} · {item.quantityMode === 'unknown' ? 'Amount not detected' : item.quantityDescription}</p>{shoppingMatch && <p className="match-notice"><strong>Matches your shopping list</strong><span>It will be marked purchased and added to your fridge.</span></p>}{duplicate && !shoppingMatch && <fieldset className="duplicate-choice"><legend>You already have {duplicate.name.toLowerCase()}</legend><label><input type="radio" name={`duplicate-${item.id}`} checked={item.mergeChoice === 'new'} onChange={() => update(item.id, { mergeChoice: 'new' })} /> Add as new purchase</label><label><input type="radio" name={`duplicate-${item.id}`} checked={item.mergeChoice === 'merge'} onChange={() => update(item.id, { mergeChoice: 'merge' })} /> Merge with existing stock</label></fieldset>}<details><summary>Advanced details</summary><label>Plain-language amount<input value={item.quantityDescription} onChange={(event) => update(item.id, { quantityDescription: event.target.value })} /></label><label>Category<select value={item.category} onChange={(event) => update(item.id, { category: event.target.value as FoodCandidate['category'] })}><option value="fresh">Fresh food</option><option value="pantry">Pantry</option><option value="frozen">Frozen</option></select></label></details></article>;
}

function CaptureChoice({ icon, title, detail, onClick }: { icon: 'camera' | 'receipt' | 'gallery' | 'edit'; title: string; detail: string; onClick: () => void }) { return <button onClick={onClick}><span className="action-icon" aria-hidden="true"><Icon name={icon} /></span><span><strong>{title}</strong><small>{detail}</small></span><Icon name="chevron" size={18} /></button>; }
function CandidateForm({ item, update }: { item: FoodCandidate; update: (change: Partial<FoodCandidate>) => void }) { return <div className="form-grid"><label className="wide">Food name<input value={item.name} onChange={(event) => update({ name: event.target.value })} /></label><fieldset className="quantity-mode wide"><legend>How much do you know?</legend>{([['exact', 'Exact'], ['approximate', 'Approximate'], ['unknown', 'Unknown']] as [QuantityMode, string][]).map(([value, label]) => <label key={value} className={item.quantityMode === value ? 'selected' : ''}><input type="radio" name="manual-quantity-mode" checked={item.quantityMode === value} onChange={() => update({ quantityMode: value })} />{label}</label>)}</fieldset>{item.quantityMode !== 'unknown' && <><label>{item.quantityMode === 'exact' ? 'Quantity' : 'About how much'}<input inputMode="decimal" value={item.quantity} onChange={(event) => update({ quantity: event.target.value })} /></label><label>Unit<select value={item.unit} onChange={(event) => update({ unit: event.target.value as Unit })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>cup</option></select></label></>}{item.quantityMode !== 'exact' && <label className="wide">Plain-language amount<input value={item.quantityDescription} onChange={(event) => update({ quantityDescription: event.target.value })} placeholder="e.g. about half a pack" /></label>}<label>Relevant date<input type="date" value={item.date} onChange={(event) => update({ date: event.target.value })} /></label><label>Storage<select value={item.storage} onChange={(event) => update({ storage: event.target.value as StorageLocation })}><option value="fridge">Fridge</option><option value="freezer">Freezer</option><option value="cupboard">Cupboard</option></select></label></div>; }
