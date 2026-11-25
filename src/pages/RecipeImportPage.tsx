import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { canonicalise } from '../domain/inventory';
import { parseRecipeText } from '../domain/parser';
import { isUsableRecipeDraft, scoreRecipeDocument, type OcrDocumentResult, type OcrQuality } from '../domain/recipeOcr';
import type { PersonalRecipeSource, Recipe, RecipeIngredient, Unit } from '../domain/types';
import { imageFileToCompressedDataUrl } from '../platform/images/prepareImage';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';
import { showsResearchUi } from '../domain/usability';

type ImportView = 'choices' | 'text' | 'processing' | 'review' | 'failure' | 'ocr-text';
const sample = `Creamy mushroom pasta

Serves 2
Ready in 25 minutes

Ingredients
180 g spaghetti
200g mushrooms
1 small onion
120 ml double cream
2 cloves garlic
Salt and pepper

Method
1. Cook the pasta.
2. Fry mushrooms and onion.
3. Add cream.
4. Combine and serve.`;

function imageRecipe(): Recipe {
  return {
    id: `imported-${Date.now()}`, name: 'Mushroom Pasta', baseServings: 2, minutes: 20, source: 'imported', ownership: 'personal', tags: ['Imported'], createdAt: new Date().toISOString(), originalText: sample,
    ingredients: [ingredient('pasta', 'Pasta', 180, 'g'), ingredient('mushrooms', 'Mushrooms', 120, 'g'), ingredient('cream', 'Cream', 120, 'ml'), ingredient('onion', 'Onion', 1, 'item')],
    steps: ['Cook the pasta.', 'Cook the mushrooms and onion.', 'Add cream and combine.'],
  };
}
function ingredient(id: string, name: string, quantity: number, unit: Unit): RecipeIngredient { return { id: `personal-${id}-${Date.now()}`, name, canonicalName: canonicalise(name), quantity, unit }; }
function blankRecipe(): Recipe { return { id: `created-${Date.now()}`, name: '', baseServings: 2, minutes: 0, source: 'created', ownership: 'personal', tags: [], ingredients: [ingredient('ingredient', '', 1, 'item')], steps: [], createdAt: new Date().toISOString() }; }

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(blob);
  });
}

export function RecipeImportPage() {
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const imageInput = useRef<HTMLInputElement>(null);
  const temporaryPreview = useRef<string | undefined>(undefined);
  const abortOcr = useRef<AbortController | undefined>(undefined);
  const ocrDraftEdited = useRef(false);
  const editRecipe = data.recipes.find((recipe) => recipe.id === params.get('edit') && recipe.ownership === 'personal');
  const [view, setView] = useState<ImportView>(editRecipe ? 'review' : 'choices');
  const [text, setText] = useState(sample);
  const [draft, setDraft] = useState<Recipe | null>(editRecipe ? structuredClone(editRecipe) : null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(editRecipe?.importedImage);
  const [imageSource, setImageSource] = useState<File | string | undefined>(editRecipe?.importedImage);
  const [useCover, setUseCover] = useState(Boolean(editRecipe?.importedImage));
  const [progress, setProgress] = useState(0);
  const [creationSource, setCreationSource] = useState<PersonalRecipeSource>('manual');
  const [ocrQuality, setOcrQuality] = useState<OcrQuality>();
  const [extractedText, setExtractedText] = useState('');
  const [ocrDiagnostics, setOcrDiagnostics] = useState<OcrDocumentResult>();
  const researchUi = showsResearchUi(data);

  useEffect(() => () => {
    abortOcr.current?.abort();
    if (temporaryPreview.current) URL.revokeObjectURL(temporaryPreview.current);
  }, []);
  useEffect(() => {
    const fixture = params.get('fixture');
    if (researchUi && fixture === 'image') { setDraft(imageRecipe()); setCreationSource('ocr'); setView('review'); }
    if (researchUi && fixture === 'text') { setText(sample); setView('text'); }
  }, [params, researchUi]);

  const isResearchFixture = researchUi && params.get('fixture') === 'image';
  const parse = () => { setDraft({ ...parseRecipeText(text), importedImage: useCover ? imagePreview : undefined }); setCreationSource('text'); setView('review'); };
  const runOcr = async (source: File | string, preview: string) => {
    abortOcr.current?.abort(); const controller = new AbortController(); abortOcr.current = controller;
    setImageSource(source); setImagePreview(preview); setUseCover(true); setView('processing'); setProgress(0);
    actions.logUsabilityEvent('ocr_started', { flow: 'recipe' });
    try {
      const { recogniseRecipeDocument } = await import('../platform/ocr/browserOcr');
      const result = await recogniseRecipeDocument(source, { signal: controller.signal, onProgress: ({ progress: next }) => setProgress(Math.round(next * 100)) });
      setExtractedText(result.rawText); setOcrQuality(result.quality); setOcrDiagnostics(result);
      actions.logUsabilityEvent('ocr_completed', { flow: 'recipe', characters: result.rawText.length, ocrQuality: result.quality, ocrPass: result.pass, qualityScore: result.qualityScore, meanConfidence: Math.round(result.meanConfidence ?? 0) });
      if (!result.rawText.trim() || result.quality === 'poor') { actions.logUsabilityEvent('ocr_returned_empty', { flow: 'recipe', textFound: Boolean(result.rawText.trim()), ocrQuality: result.quality, ocrPass: result.pass }); setView('failure'); return; }
      const parsed = { ...parseRecipeText(result.text), originalText: result.rawText };
      if (!isUsableRecipeDraft(parsed)) { actions.logUsabilityEvent('ocr_returned_empty', { flow: 'recipe', textFound: true, ocrQuality: 'poor', reason: 'invalid_structure' }); setView('failure'); return; }
      setDraft(parsed); setCreationSource('ocr'); ocrDraftEdited.current = false;
      actions.logUsabilityEvent('ocr_parse_reviewed', { flow: 'recipe', ingredients: parsed.ingredients.length, ocrQuality: result.quality, ocrPass: result.pass });
      setView('review');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setView('failure');
    }
  };
  const handleImage = (file?: File) => {
    if (!file) return;
    if (temporaryPreview.current) URL.revokeObjectURL(temporaryPreview.current);
    const url = URL.createObjectURL(file); temporaryPreview.current = url;
    void runOcr(file, url);
  };
  const startManual = () => { setDraft(blankRecipe()); setCreationSource('manual'); setView('review'); };
  const fallback = (next: 'text' | 'manual') => { actions.logUsabilityEvent('ocr_fallback_used', { flow: 'recipe', fallback: next }); if (next === 'text') setView('text'); else startManual(); };
  const parseCorrectedOcr = () => {
    const scored = scoreRecipeDocument(extractedText);
    const parsed = { ...parseRecipeText(scored.text), originalText: extractedText };
    actions.logUsabilityEvent('ocr_text_corrected', { flow: 'recipe', recovery: true });
    if (!isUsableRecipeDraft(parsed)) { setOcrQuality('poor'); setView('failure'); return; }
    setDraft(parsed); setCreationSource('ocr'); setOcrQuality(scored.quality === 'poor' ? 'review_needed' : scored.quality); ocrDraftEdited.current = true;
    actions.logUsabilityEvent('ocr_parse_reviewed', { flow: 'recipe', ingredients: parsed.ingredients.length, correctedText: true });
    setView('review');
  };
  const markOcrCorrection = () => {
    if (!draft?.originalText || ocrDraftEdited.current) return;
    ocrDraftEdited.current = true; actions.logUsabilityEvent('ocr_text_corrected', { flow: 'recipe' });
  };
  const save = async () => {
    if (!draft || !draft.name.trim() || !draft.ingredients.filter((item) => item.name.trim()).length) return;
    let cover = draft.importedImage;
    if (useCover && imageSource) {
      try {
        const file = typeof imageSource === 'string' ? new File([await (await fetch(imageSource)).blob()], 'recipe-cover', { type: 'image/jpeg' }) : imageSource;
        cover = await imageFileToCompressedDataUrl(file);
      } catch {
        try { cover = typeof imageSource === 'string' ? await blobToDataUrl(await (await fetch(imageSource)).blob()) : await blobToDataUrl(imageSource); } catch { cover = undefined; }
      }
    }
    const recipe = { ...draft, ingredients: draft.ingredients.filter((item) => item.name.trim()), importedImage: useCover ? cover : undefined, ownership: 'personal' as const };
    if (editRecipe) actions.updateRecipe(recipe); else actions.addRecipe(recipe, creationSource);
    navigate(`/recipes/${recipe.id}`);
  };
  const updateDraft = (change: Partial<Recipe>) => { markOcrCorrection(); if (draft) setDraft({ ...draft, ...change }); };
  const updateIngredient = (id: string, change: Partial<RecipeIngredient>) => { markOcrCorrection(); if (draft) setDraft({ ...draft, ingredients: draft.ingredients.map((item) => item.id === id ? { ...item, ...change, ...(change.name ? { canonicalName: canonicalise(change.name) } : {}) } : item) }); };

  return <div className="page-stack narrow-page recipe-import-page">
    <section><span className="overline">Personal recipes</span><h1>{editRecipe ? 'Edit recipe' : view === 'review' ? 'Review what we found' : view === 'processing' ? 'Reading recipe…' : 'Add a recipe'}</h1><p>{view === 'review' ? 'Check and correct the details before saving.' : 'Scan a screenshot or photo, paste recipe text, or enter the essentials yourself.'}</p></section>
    {view === 'choices' && <section className="mobile-action-list method-sheet" aria-label="Recipe import options"><div className="sheet-handle" /><h2>Add a recipe</h2><button onClick={() => imageInput.current?.click()}><span className="action-icon"><Icon name="gallery" /></span><span><strong>Scan screenshot or photo</strong><small>Read recipe text on this device, then review the result.</small></span><Icon name="chevron" size={18} /></button><button onClick={() => setView('text')}><span className="action-icon"><Icon name="edit" /></span><span><strong>Paste recipe text</strong><small>Flexible formatting is fine.</small></span><Icon name="chevron" size={18} /></button><button onClick={startManual}><span className="action-icon"><Icon name="plus" /></span><span><strong>Create manually</strong><small>Name, servings and ingredients are enough.</small></span><Icon name="chevron" size={18} /></button></section>}
    {view === 'text' && <section className="form-card"><label>Recipe text<textarea rows={13} value={text} onChange={(event) => setText(event.target.value)} /></label><div className="button-row"><button className="button secondary" onClick={() => setView('choices')}>Back</button><button className="button primary" onClick={parse} disabled={!text.trim()}>Review recipe</button></div><p className="form-hint">We’ll preserve the original text and propose the fields we can identify.</p></section>}
    {view === 'ocr-text' && <section className="form-card"><label>Extracted recipe text<textarea rows={15} value={extractedText} onChange={(event) => setExtractedText(event.target.value)} /></label><p className="form-hint">Correct the text FridgeMind could read, then try structuring it again.</p><div className="button-row"><button className="button secondary" onClick={() => setView('failure')}>Back</button><button className="button primary" onClick={parseCorrectedOcr} disabled={!extractedText.trim()}>Parse again</button></div></section>}
    {view === 'processing' && <section className="processing-card" aria-live="polite"><span className="processing-spinner" aria-hidden="true" /><h2>Reading recipe…</h2><p>{progress ? `${progress}% · ` : ''}Finding recipe text and preparing an editable draft.</p><button className="button secondary" onClick={() => { abortOcr.current?.abort(); setView('choices'); }}>Cancel</button></section>}
    {view === 'failure' && <section className="empty-state"><Icon name="info" size={30} /><h2>We couldn’t read this recipe clearly enough.</h2><p>Try another clear image, review the extracted text, paste the recipe text, or create it manually.</p><div className="button-row"><button className="button primary" onClick={() => imageInput.current?.click()}>Try another image</button>{extractedText.trim() && <button className="button secondary" onClick={() => setView('ocr-text')}>Review extracted text</button>}<button className="button secondary" onClick={() => fallback('text')}>Paste recipe text</button><button className="button ghost" onClick={() => fallback('manual')}>Create manually</button></div></section>}
    {view === 'review' && draft && <section className="recipe-review form-card">{isResearchFixture && <p className="fixture-label">Research Mode · simulated recognition fixture</p>}{ocrQuality === 'review_needed' && <p className="form-hint">Check a few details before saving.</p>}{draft.name === 'Imported recipe' && <p className="form-hint">Enter the recipe name before saving.</p>}{imagePreview && <div className="recipe-cover-review"><img src={imagePreview} alt="Recipe cover preview" /><label><input type="checkbox" checked={useCover} onChange={(event) => setUseCover(event.target.checked)} /> Use image as cover</label></div>}<div className="form-grid"><label className="wide">Recipe name<input value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} /></label><label>Servings<input type="number" min="1" max="12" value={draft.baseServings} onChange={(event) => updateDraft({ baseServings: Number(event.target.value) || 1 })} /></label><label>Preparation time<input type="number" min="0" value={draft.minutes} onChange={(event) => updateDraft({ minutes: Number(event.target.value) || 0 })} /></label></div><div className="review-section-heading"><h2>Ingredients</h2><button className="text-button" onClick={() => updateDraft({ ingredients: [...draft.ingredients, ingredient(`new-${draft.ingredients.length}`, '', 1, 'item')] })}>Add ingredient</button></div><div className="ingredient-edit-list">{draft.ingredients.map((item, index) => <div className="ingredient-edit" key={item.id}><label><span className="sr-only">Ingredient {index + 1} name</span><input aria-label={`Ingredient ${index + 1} name`} value={item.name} onChange={(event) => updateIngredient(item.id, { name: event.target.value })} /></label><label><span className="sr-only">Quantity</span><input aria-label={`Ingredient ${index + 1} quantity`} type="number" min="0" step="any" value={item.quantity} onChange={(event) => updateIngredient(item.id, { quantity: Number(event.target.value) })} /></label><label><span className="sr-only">Unit</span><select aria-label={`Ingredient ${index + 1} unit`} value={item.unit} onChange={(event) => updateIngredient(item.id, { unit: event.target.value as Unit })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>tsp</option><option>cup</option></select></label><button className="icon-button small" aria-label={`Delete ingredient ${index + 1}`} onClick={() => updateDraft({ ingredients: draft.ingredients.filter((ingredientItem) => ingredientItem.id !== item.id) })}><Icon name="trash" size={17} /></button></div>)}</div><label>Instructions<textarea rows={5} value={draft.steps.join('\n')} onChange={(event) => updateDraft({ steps: event.target.value.split('\n').filter(Boolean) })} placeholder="Optional" /></label>{draft.originalText && <details className="concept-card"><summary>Original text</summary><pre className="original-recipe-text">{draft.originalText}</pre></details>}<label>Tags<input value={draft.tags.join(', ')} onChange={(event) => updateDraft({ tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} placeholder="Quick, vegetarian" /></label><div className="sticky-actions import-sticky"><button className="button secondary" onClick={() => editRecipe ? navigate(`/recipes/${editRecipe.id}`) : setView('choices')}>Cancel</button><button className="button primary" onClick={() => void save()} disabled={!draft.name.trim() || draft.name === 'Imported recipe' || !draft.ingredients.some((item) => item.name.trim())}>{editRecipe ? 'Save changes' : 'Save recipe'}</button></div></section>}
    {researchUi && ocrDiagnostics && <details className="concept-card"><summary>OCR diagnostics</summary><p>Selected {ocrDiagnostics.pass} pass · PSM {ocrDiagnostics.psm} · quality {ocrDiagnostics.qualityScore}/100 · confidence {Math.round(ocrDiagnostics.meanConfidence ?? 0)}</p>{ocrDiagnostics.discardedLines.length > 0 && <p>Discarded lines: {ocrDiagnostics.discardedLines.join(' · ')}</p>}<pre className="original-recipe-text">{ocrDiagnostics.rawText}</pre></details>}
    <details className="concept-card"><summary>Image privacy</summary><p>OCR runs locally in your browser using Tesseract.js. Images are not uploaded. A resized copy is stored only if you choose to keep it as the recipe cover.</p></details>
    <input ref={imageInput} className="sr-only" type="file" accept="image/*" aria-label="Choose recipe image" onChange={(event) => handleImage(event.target.files?.[0])} />
  </div>;
}
