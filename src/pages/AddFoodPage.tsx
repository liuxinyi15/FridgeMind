import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { canonicalise } from '../domain/inventory';
import { parsePackageText, parseQuickAddText, parseReceiptCandidates, type ParsedFoodText } from '../domain/parser';
import type { ImportSource, QuantityMode, StorageLocation, Unit } from '../domain/types';
import { foodCamera, type CameraPurpose } from '../platform/camera/CameraAdapter';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';
import { showsResearchUi } from '../domain/usability';

type CaptureFlow = 'quick' | 'grocery' | 'receipt' | 'package';
type View = 'choices' | 'quick' | 'capture' | 'processing' | 'review' | 'manual' | 'receipt-text' | 'failure';

interface FoodCandidate {
  id: string; selected: boolean; name: string; category: 'fresh' | 'pantry' | 'frozen'; quantityMode: QuantityMode;
  quantity: string; quantityDescription: string; unit: Unit; storage: StorageLocation; date: string; mergeChoice: 'new' | 'merge';
}

const makeCandidate = (id: string, name: string, quantityMode: QuantityMode, quantity: string, quantityDescription: string, unit: Unit, storage: StorageLocation): FoodCandidate => ({
  id: `candidate-${id}`, selected: true, name, category: storage === 'cupboard' ? 'pantry' : storage === 'freezer' ? 'frozen' : 'fresh', quantityMode, quantity, quantityDescription, unit, storage, date: '', mergeChoice: 'new',
});
const fromParsed = (item: ParsedFoodText, index: number, prefix: string) => makeCandidate(`${prefix}-${index}`, item.name, item.quantityMode, item.quantity === null ? '' : String(item.quantity), item.quantity === null ? 'Amount unknown' : `${item.quantityMode === 'approximate' ? 'About ' : ''}${item.quantity}${item.unit}`, item.unit, item.storage);
const groceryCandidates = () => [makeCandidate('spinach', 'Spinach', 'approximate', '1', 'Approx. 1 pack', 'item', 'fridge'), makeCandidate('mushroom', 'Mushrooms', 'approximate', '1', 'Approx. 1 pack', 'item', 'fridge'), makeCandidate('chicken', 'Chicken', 'approximate', '250', 'Approx. 250g', 'g', 'fridge')];
const receiptCandidates = () => [makeCandidate('mushroom', 'Mushrooms', 'unknown', '', 'Amount unknown', 'item', 'fridge'), makeCandidate('spinach', 'Spinach', 'unknown', '', 'Amount unknown', 'item', 'fridge'), makeCandidate('pasta', 'Pasta', 'unknown', '', 'Amount unknown', 'item', 'cupboard'), makeCandidate('chicken', 'Chicken', 'unknown', '', 'Amount unknown', 'item', 'fridge')];

export function AddFoodPage() {
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | undefined>(undefined);
  const abortOcr = useRef<AbortController | undefined>(undefined);
  const [view, setView] = useState<View>('choices');
  const [flow, setFlow] = useState<CaptureFlow>('quick');
  const [permissionPurpose, setPermissionPurpose] = useState<CameraPurpose | null>(null);
  const [working, setWorking] = useState(false);
  const [preview, setPreview] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [quickText, setQuickText] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [candidates, setCandidates] = useState<FoodCandidate[]>([]);
  const [manual, setManual] = useState(() => makeCandidate('manual', '', 'exact', '1', '', 'item', 'fridge'));
  const researchUi = showsResearchUi(data);

  useEffect(() => () => {
    abortOcr.current?.abort();
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
  }, []);
  useEffect(() => {
    const fixture = params.get('fixture');
    if (researchUi && (fixture === 'grocery' || fixture === 'duplicate')) { setFlow('grocery'); setCandidates(groceryCandidates()); setView('review'); }
    if (researchUi && fixture === 'receipt') { setFlow('receipt'); setCandidates(receiptCandidates()); setView('review'); }
  }, [params, researchUi]);

  const isResearchFixture = researchUi && Boolean(params.get('fixture'));
  const beginQuick = () => { setFlow('quick'); setView('quick'); actions.logUsabilityEvent('quick_add_opened'); };
  const beginCapture = (nextFlow: 'receipt' | 'package') => { setFlow(nextFlow); setView('capture'); };
  const chooseFile = () => fileInput.current?.click();
  const showPreview = (file: File) => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    const url = URL.createObjectURL(file); previewUrl.current = url; setPreview(url);
  };
  const parseQuick = () => {
    const parsed = parseQuickAddText(quickText);
    setCandidates(parsed.map((item, index) => fromParsed(item, index, 'quick')));
    actions.logUsabilityEvent('quick_add_parsed', { count: parsed.length });
    setFlow('quick'); setView(parsed.length ? 'review' : 'failure');
  };
  const parseReceipt = () => {
    const parsed = parseReceiptCandidates(receiptText);
    setFlow('receipt'); setCandidates(parsed.map((item, index) => fromParsed(item, index, 'receipt')));
    setView(parsed.length ? 'review' : 'failure');
  };
  const runOcr = async (image: File | string) => {
    abortOcr.current?.abort();
    const controller = new AbortController(); abortOcr.current = controller;
    setView('processing'); setProgress(0); actions.logUsabilityEvent('ocr_started', { flow });
    if (flow === 'receipt') actions.logUsabilityEvent('receipt_ocr_used');
    if (flow === 'package') actions.logUsabilityEvent('package_ocr_used');
    try {
      const { recogniseImageText } = await import('../platform/ocr/browserOcr');
      const raw = await recogniseImageText(image, { signal: controller.signal, onProgress: ({ progress: next }) => setProgress(Math.round(next * 100)) });
      if (!raw.trim()) { actions.logUsabilityEvent('ocr_returned_empty', { flow }); setView('failure'); return; }
      actions.logUsabilityEvent('ocr_completed', { flow, characters: raw.length });
      const parsed = flow === 'receipt' ? parseReceiptCandidates(raw) : [parsePackageText(raw)].filter((item): item is ParsedFoodText => Boolean(item));
      setCandidates(parsed.map((item, index) => fromParsed(item, index, flow)));
      if (!parsed.length) { actions.logUsabilityEvent('ocr_returned_empty', { flow, textFound: true }); setView('failure'); return; }
      actions.logUsabilityEvent('ocr_parse_reviewed', { flow, count: parsed.length });
      setView('review');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setView('failure');
    }
  };
  const handleFile = (file?: File) => { if (file) { showPreview(file); void runOcr(file); } };
  const continueCamera = async () => {
    if (!permissionPurpose) return;
    if (!foodCamera.isAvailable()) { setPermissionPurpose(null); chooseFile(); return; }
    setWorking(true);
    try {
      const permission = await foodCamera.requestPermission(permissionPurpose);
      const allowed = permissionPurpose === 'camera' ? permission?.camera === 'granted' : permission?.photos === 'granted' || permission?.photos === 'limited';
      if (!allowed) { setPermissionPurpose(null); setView('failure'); return; }
      const image = await foodCamera.capture(permissionPurpose); setPreview(image.webPath); setPermissionPurpose(null);
      if (image.webPath) await runOcr(image.webPath); else setView('failure');
    } catch { setPermissionPurpose(null); setView('failure'); } finally { setWorking(false); }
  };
  const update = (candidateId: string, change: Partial<FoodCandidate>) => {
    setCandidates((items) => items.map((item) => item.id === candidateId ? { ...item, ...change } : item));
    if (flow === 'quick') actions.logUsabilityEvent('quick_add_item_edited', { field: Object.keys(change)[0] ?? 'unknown' });
  };
  const selected = candidates.filter((item) => item.selected && item.name.trim());
  const sourceForFlow = (): ImportSource => flow === 'quick' ? 'quick' : flow === 'receipt' ? 'receipt' : flow === 'package' ? 'package' : 'photo';
  const saveBatch = () => {
    selected.forEach((item) => {
      const shoppingMatch = data.shopping.find((shopping) => !shopping.addedToFridge && shopping.canonicalName === canonicalise(item.name));
      const amount = item.quantityMode === 'unknown' || !item.quantity ? null : Number(item.quantity);
      if (flow === 'receipt' && shoppingMatch) actions.reconcileShopping(shoppingMatch.id, amount, item.unit);
      else actions.addFood({ name: item.name, quantity: amount, quantityMode: item.quantityMode, quantityDescription: item.quantityDescription || undefined, unit: item.unit, relevantDate: item.date || undefined, dateType: item.date ? 'use_by' : 'unknown', storage: item.storage, source: sourceForFlow(), category: item.category }, { source: sourceForFlow(), mergeExisting: item.mergeChoice === 'merge' });
    });
    navigate('/fridge', { state: { addedCount: selected.length } });
  };
  const saveManual = () => { actions.addFood({ name: manual.name, quantity: manual.quantityMode === 'unknown' || !manual.quantity ? null : Number(manual.quantity), quantityMode: manual.quantityMode, quantityDescription: manual.quantityDescription || undefined, unit: manual.unit, relevantDate: manual.date || undefined, dateType: manual.date ? 'best_before' : 'unknown', storage: manual.storage, source: 'manual' }, { source: 'manual', mergeExisting: manual.mergeChoice === 'merge' }); navigate('/fridge', { state: { addedCount: 1 } }); };
  const manualDuplicate = data.inventory.find((food) => food.kind !== 'leftover' && food.canonicalName === canonicalise(manual.name));

  const heading = view === 'review' ? isResearchFixture ? 'Review simulated items' : flow === 'quick' ? 'Review foods' : flow === 'receipt' ? 'Review receipt items' : 'Review package' : view === 'quick' ? 'Quick add foods' : view === 'manual' ? 'Enter food details' : view === 'receipt-text' ? 'Paste receipt text' : 'Add what you bought';
  return <div className="page-stack narrow-page add-food-page">
    <section className="add-food-intro"><span className="overline">Add groceries</span><h1>{heading}</h1><p>{view === 'review' ? isResearchFixture ? 'This deterministic result is available only in Research Mode.' : 'Review what we found. Every item stays editable before saving.' : 'Choose the quickest honest way to add useful details.'}</p></section>
    {view === 'choices' && <section className="mobile-action-list method-sheet" aria-label="Add food options"><div className="sheet-handle" aria-hidden="true" /><h2>Add from</h2><CaptureChoice icon="edit" title="Quick add foods" detail="Type several names at once. Amounts are optional." onClick={beginQuick} /><CaptureChoice icon="gallery" title="Scan package" detail="Read a product name and printed amount from a label." onClick={() => beginCapture('package')} /><CaptureChoice icon="receipt" title="Scan receipt" detail="Read product lines, then reconcile your shopping list." onClick={() => beginCapture('receipt')} /><CaptureChoice icon="plus" title="Enter manually" detail="Add only the details you know." onClick={() => setView('manual')} /></section>}
    {view === 'quick' && <section className="form-card quick-add-card"><label>Food names<textarea autoFocus rows={7} value={quickText} onChange={(event) => setQuickText(event.target.value)} placeholder={'spinach, mushrooms, chicken, pasta\n\nor\n\nspinach 200g\n2 onions\nmilk 1L'} /></label><p className="form-hint">Separate foods with commas, semicolons or new lines. Leave amounts out if you do not know them.</p><div className="button-row"><button className="button secondary" onClick={() => setView('choices')}>Back</button><button className="button primary" onClick={parseQuick} disabled={!quickText.trim()}>Review foods</button></div></section>}
    {view === 'capture' && <section className="capture-card"><div className="capture-illustration"><Icon name={flow === 'receipt' ? 'receipt' : 'camera'} size={34} /></div><h2>{flow === 'receipt' ? 'Scan a receipt' : 'Scan a package label'}</h2><p>Use a clear, well-lit image with readable text. Image text is processed on this device.</p><div className="button-row"><button className="button primary" onClick={() => setPermissionPurpose('camera')}>Take a photo</button><button className="button secondary" onClick={chooseFile}>Choose image</button><button className="button ghost" onClick={() => setView('choices')}>Cancel</button></div>{flow === 'receipt' && <button className="text-button" onClick={() => { actions.logUsabilityEvent('ocr_fallback_used', { flow: 'receipt' }); setView('receipt-text'); }}>Paste receipt text instead</button>}</section>}
    {view === 'receipt-text' && <section className="form-card"><label>Receipt text<textarea rows={11} value={receiptText} onChange={(event) => setReceiptText(event.target.value)} placeholder={'TESCO\nMUSHROOMS 250G\nBABY SPINACH\nCHICKEN BREAST 500G\nPENNE PASTA 500G'} /></label><p className="form-hint">We only propose recognised product names and printed amounts. Check everything before adding it.</p><div className="button-row"><button className="button secondary" onClick={() => setView('choices')}>Back</button><button className="button primary" onClick={parseReceipt} disabled={!receiptText.trim()}>Review items</button></div></section>}
    {view === 'processing' && <section className="processing-card" aria-live="polite"><span className="processing-spinner" aria-hidden="true" /><h2>{flow === 'receipt' ? 'Reading receipt…' : 'Reading package…'}</h2><p>{progress ? `${progress}% · ` : ''}This can take a few seconds. The app remains on this screen.</p><button className="button secondary" onClick={() => { abortOcr.current?.abort(); setView('capture'); }}>Cancel</button></section>}
    {view === 'failure' && <section className="empty-state"><Icon name="info" size={30} /><h2>We couldn’t read enough text from this image.</h2><p>Try a sharper image, paste receipt text, or add the food another way.</p><div className="button-row">{flow === 'receipt' && <button className="button primary" onClick={() => { actions.logUsabilityEvent('ocr_fallback_used', { flow }); setView('receipt-text'); }}>Paste receipt text</button>}<button className="button secondary" onClick={() => setView('manual')}>Enter manually</button><button className="button ghost" onClick={() => setView('choices')}>Try another image</button></div></section>}
    {view === 'review' && <section className="batch-review">{isResearchFixture && <p className="fixture-label">Research Mode · simulated recognition fixture</p>}<div className="batch-review-toolbar"><div><strong>{candidates.length} {candidates.length === 1 ? 'item' : 'items'}</strong><span>Check before saving</span></div><div><button className="text-button" onClick={() => setCandidates((items) => [...items, makeCandidate(`added-${Date.now()}`, '', 'unknown', '', 'Amount unknown', 'item', 'fridge')])}>Add item</button>{candidates.length > 1 && <button className="text-button" onClick={() => setCandidates((items) => items.map((item) => ({ ...item, selected: false })))}>Deselect</button>}</div></div>{preview && <img className="batch-preview" src={preview} alt="Scanned source preview" />}<div className="import-candidate-list">{candidates.map((item, index) => <CandidateCard key={item.id} item={item} index={index} flow={flow} inventory={data.inventory} shopping={data.shopping} update={update} remove={() => setCandidates((items) => items.filter((entry) => entry.id !== item.id))} />)}</div><div className="sticky-actions import-sticky"><button className="button secondary" onClick={() => setView('choices')}>Cancel</button><button className="button primary" disabled={!selected.length} onClick={saveBatch}>Add {selected.length} {selected.length === 1 ? 'food' : 'foods'}</button></div></section>}
    {view === 'manual' && <section className="form-card"><CandidateForm item={manual} update={(change) => setManual({ ...manual, ...change })} />{manualDuplicate && <fieldset className="duplicate-choice"><legend>You already have {manualDuplicate.name.toLowerCase()}</legend><label><input type="radio" name="manual-duplicate" checked={manual.mergeChoice === 'new'} onChange={() => setManual({ ...manual, mergeChoice: 'new' })} /> Add as new purchase</label><label><input type="radio" name="manual-duplicate" checked={manual.mergeChoice === 'merge'} onChange={() => setManual({ ...manual, mergeChoice: 'merge' })} /> Merge with existing stock</label></fieldset>}<div className="button-row mobile-form-actions"><button className="button secondary" onClick={() => setView('choices')}>Choose another method</button><button className="button primary" onClick={saveManual} disabled={!manual.name.trim()}>Save to My Fridge</button></div></section>}
    <details className="concept-card"><summary>Image privacy</summary><p>OCR runs locally in your browser using Tesseract.js. Images are not uploaded, and scan images are not permanently stored.</p></details>
    <input ref={fileInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => handleFile(event.target.files?.[0])} aria-label="Choose image to scan" />
    {permissionPurpose && <div className="sheet-backdrop" role="presentation" onClick={() => setPermissionPurpose(null)}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="camera-permission-title" onClick={(event) => event.stopPropagation()}><div className="sheet-handle" /><h2 id="camera-permission-title">Open your camera?</h2><p>Your image is processed on this device to prepare an editable suggestion.</p><div className="sheet-actions"><button className="button ghost" onClick={() => setPermissionPurpose(null)}>Cancel</button><button className="button secondary" onClick={() => { setPermissionPurpose(null); chooseFile(); }}>Choose image instead</button><button className="button primary" onClick={continueCamera} disabled={working}>{working ? 'Opening…' : 'Continue'}</button></div></section></div>}
  </div>;
}

function CandidateCard({ item, index, flow, inventory, shopping, update, remove }: { item: FoodCandidate; index: number; flow: CaptureFlow; inventory: ReturnType<typeof useAppState>['data']['inventory']; shopping: ReturnType<typeof useAppState>['data']['shopping']; update: (id: string, change: Partial<FoodCandidate>) => void; remove: () => void }) {
  const duplicate = inventory.find((food) => food.kind !== 'leftover' && food.canonicalName === canonicalise(item.name));
  const shoppingMatch = flow === 'receipt' && shopping.find((entry) => !entry.addedToFridge && entry.canonicalName === canonicalise(item.name));
  return <article className={`import-candidate${item.selected ? '' : ' deselected'}`}><div className="candidate-heading"><label className="candidate-select"><input type="checkbox" checked={item.selected} onChange={(event) => update(item.id, { selected: event.target.checked })} /><span>{item.name || `Item ${index + 1}`}</span></label><button className="text-button" onClick={remove}>Remove</button></div><div className="candidate-fields"><label>Name<input value={item.name} onChange={(event) => update(item.id, { name: event.target.value })} /></label><label>Quantity<select value={item.quantityMode} onChange={(event) => update(item.id, { quantityMode: event.target.value as QuantityMode })}><option value="unknown">Unknown</option><option value="approximate">Approximate</option><option value="exact">Exact</option></select></label>{item.quantityMode !== 'unknown' && <><label>Amount<input inputMode="decimal" value={item.quantity} onChange={(event) => update(item.id, { quantity: event.target.value })} /></label><label>Unit<select value={item.unit} onChange={(event) => update(item.id, { unit: event.target.value as Unit })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>cup</option></select></label></>}<label>Storage<select value={item.storage} onChange={(event) => update(item.id, { storage: event.target.value as StorageLocation })}><option value="fridge">Fridge</option><option value="freezer">Freezer</option><option value="cupboard">Cupboard</option></select></label><label>Date<input type="date" value={item.date} onChange={(event) => update(item.id, { date: event.target.value })} /></label></div><p className="candidate-cue">{item.date ? 'Date added' : 'No date added'} · {item.quantityMode === 'unknown' ? 'Amount unknown' : item.quantityDescription}</p>{shoppingMatch && <p className="match-notice"><strong>Matches your shopping list</strong><span>It will be marked purchased and added to your fridge.</span></p>}{duplicate && !shoppingMatch && <fieldset className="duplicate-choice"><legend>You already have {duplicate.name.toLowerCase()}</legend><label><input type="radio" name={`duplicate-${item.id}`} checked={item.mergeChoice === 'new'} onChange={() => update(item.id, { mergeChoice: 'new' })} /> Add as new purchase</label><label><input type="radio" name={`duplicate-${item.id}`} checked={item.mergeChoice === 'merge'} onChange={() => update(item.id, { mergeChoice: 'merge' })} /> Merge with existing stock</label></fieldset>}<details><summary>Advanced details</summary><label>Plain-language amount<input value={item.quantityDescription} onChange={(event) => update(item.id, { quantityDescription: event.target.value })} /></label><label>Category<select value={item.category} onChange={(event) => update(item.id, { category: event.target.value as FoodCandidate['category'] })}><option value="fresh">Fresh food</option><option value="pantry">Pantry</option><option value="frozen">Frozen</option></select></label></details></article>;
}

function CaptureChoice({ icon, title, detail, onClick }: { icon: 'receipt' | 'gallery' | 'edit' | 'plus'; title: string; detail: string; onClick: () => void }) { return <button onClick={onClick}><span className="action-icon" aria-hidden="true"><Icon name={icon} /></span><span><strong>{title}</strong><small>{detail}</small></span><Icon name="chevron" size={18} /></button>; }
function CandidateForm({ item, update }: { item: FoodCandidate; update: (change: Partial<FoodCandidate>) => void }) { return <div className="form-grid"><label className="wide">Food name<input value={item.name} onChange={(event) => update({ name: event.target.value })} /></label><fieldset className="quantity-mode wide"><legend>How much do you know?</legend>{([['exact', 'Exact'], ['approximate', 'Approximate'], ['unknown', 'Unknown']] as [QuantityMode, string][]).map(([value, label]) => <label key={value} className={item.quantityMode === value ? 'selected' : ''}><input type="radio" name="manual-quantity-mode" checked={item.quantityMode === value} onChange={() => update({ quantityMode: value })} />{label}</label>)}</fieldset>{item.quantityMode !== 'unknown' && <><label>{item.quantityMode === 'exact' ? 'Quantity' : 'About how much'}<input inputMode="decimal" value={item.quantity} onChange={(event) => update({ quantity: event.target.value })} /></label><label>Unit<select value={item.unit} onChange={(event) => update({ unit: event.target.value as Unit })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>cup</option></select></label></>}{item.quantityMode !== 'exact' && <label className="wide">Plain-language amount<input value={item.quantityDescription} onChange={(event) => update({ quantityDescription: event.target.value })} placeholder="e.g. about half a pack" /></label>}<label>Relevant date<input type="date" value={item.date} onChange={(event) => update({ date: event.target.value })} /></label><label>Storage<select value={item.storage} onChange={(event) => update({ storage: event.target.value as StorageLocation })}><option value="fridge">Fridge</option><option value="freezer">Freezer</option><option value="cupboard">Cupboard</option></select></label></div>; }
