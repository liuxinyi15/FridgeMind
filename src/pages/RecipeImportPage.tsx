import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { canonicalise } from '../domain/inventory';
import { parseRecipeText } from '../domain/parser';
import type { Recipe, RecipeIngredient, Unit } from '../domain/types';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

type ImportView = 'choices' | 'text' | 'processing' | 'review' | 'failure';
const sample = `Chicken stir fry

250g chicken
1 item onion
100g spinach
2 tbsp soy sauce
140g rice

25 minutes
2 servings`;

function imageRecipe(): Recipe {
  return {
    id: `imported-${Date.now()}`, name: 'Mushroom Pasta', baseServings: 2, minutes: 20, source: 'imported', ownership: 'personal', tags: ['Imported'], createdAt: new Date().toISOString(),
    ingredients: [ingredient('pasta', 'Pasta', 180, 'g'), ingredient('mushrooms', 'Mushrooms', 120, 'g'), ingredient('cream', 'Cream', 120, 'ml'), ingredient('onion', 'Onion', 1, 'item')],
    steps: ['Cook the pasta.', 'Cook the mushrooms and onion.', 'Add cream and combine.'],
  };
}
function ingredient(id: string, name: string, quantity: number, unit: Unit): RecipeIngredient { return { id: `personal-${id}-${Date.now()}`, name, canonicalName: canonicalise(name), quantity, unit }; }
function blankRecipe(): Recipe { return { id: `created-${Date.now()}`, name: '', baseServings: 2, minutes: 0, source: 'created', ownership: 'personal', tags: [], ingredients: [ingredient('ingredient', '', 1, 'item')], steps: [], createdAt: new Date().toISOString() }; }

export function RecipeImportPage() {
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const imageInput = useRef<HTMLInputElement>(null);
  const editRecipe = data.recipes.find((recipe) => recipe.id === params.get('edit') && recipe.ownership === 'personal');
  const [view, setView] = useState<ImportView>(editRecipe ? 'review' : 'choices');
  const [text, setText] = useState(sample);
  const [draft, setDraft] = useState<Recipe | null>(editRecipe ? structuredClone(editRecipe) : null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(editRecipe?.importedImage);
  const [useCover, setUseCover] = useState(Boolean(editRecipe?.importedImage));

  useEffect(() => {
    const fixture = params.get('fixture');
    if (fixture === 'image') { setDraft(imageRecipe()); setView('review'); }
    if (fixture === 'text') { setText(sample); setView('text'); }
  }, [params]);

  const parse = () => { setDraft(parseRecipeText(text)); setView('review'); };
  const handleImage = (file?: File) => {
    if (!file) return;
    setView('processing');
    const reader = new FileReader();
    reader.onload = () => { const url = String(reader.result); setImagePreview(url); setUseCover(true); window.setTimeout(() => { if (/empty|unknown|blank/i.test(file.name)) { setView('failure'); return; } const proposed = imageRecipe(); setDraft({ ...proposed, importedImage: url }); setView('review'); }, 250); };
    reader.onerror = () => setView('failure');
    reader.readAsDataURL(file);
  };
  const startManual = () => { setDraft(blankRecipe()); setView('review'); };
  const save = () => {
    if (!draft || !draft.name.trim() || !draft.ingredients.filter((item) => item.name.trim()).length) return;
    const recipe = { ...draft, ingredients: draft.ingredients.filter((item) => item.name.trim()), importedImage: useCover ? imagePreview ?? draft.importedImage : undefined, ownership: 'personal' as const };
    if (editRecipe) actions.updateRecipe(recipe); else actions.addRecipe(recipe);
    navigate(`/recipes/${recipe.id}`);
  };
  const updateIngredient = (id: string, change: Partial<RecipeIngredient>) => draft && setDraft({ ...draft, ingredients: draft.ingredients.map((item) => item.id === id ? { ...item, ...change, ...(change.name ? { canonicalName: canonicalise(change.name) } : {}) } : item) });

  return <div className="page-stack narrow-page recipe-import-page">
    <section><span className="overline">Personal recipes</span><h1>{editRecipe ? 'Edit recipe' : view === 'review' ? 'Review recipe' : 'Import recipe'}</h1><p>{view === 'review' ? 'Correct anything that was missed. You can save without complete instructions.' : 'Start with a screenshot, pasted text, or only the details you know.'}</p></section>
    {view === 'choices' && <section className="mobile-action-list method-sheet" aria-label="Recipe import options"><div className="sheet-handle" /><h2>Add a recipe</h2><button onClick={() => imageInput.current?.click()}><span className="action-icon"><Icon name="gallery" /></span><span><strong>Recipe photo or screenshot</strong><small>Review an editable proposal before saving.</small></span><Icon name="chevron" size={18} /></button><button onClick={() => setView('text')}><span className="action-icon"><Icon name="edit" /></span><span><strong>Paste recipe text</strong><small>Flexible formatting is fine.</small></span><Icon name="chevron" size={18} /></button><button onClick={startManual}><span className="action-icon"><Icon name="plus" /></span><span><strong>Create manually</strong><small>Name, servings and ingredients are enough.</small></span><Icon name="chevron" size={18} /></button></section>}
    {view === 'text' && <section className="form-card"><label>Recipe text<textarea rows={13} value={text} onChange={(event) => setText(event.target.value)} /></label><div className="button-row"><button className="button secondary" onClick={() => setView('choices')}>Back</button><button className="button primary" onClick={parse} disabled={!text.trim()}>Review recipe</button></div><p className="form-hint">We’ll preserve the original text and propose the fields we can identify.</p></section>}
    {view === 'processing' && <section className="processing-card" aria-live="polite"><span className="processing-spinner" /><h2>Preparing recipe…</h2><p>You can review every field before saving.</p></section>}
    {view === 'failure' && <section className="empty-state"><Icon name="info" size={30} /><h2>We couldn’t structure this recipe automatically.</h2><p>The image may be unclear or contain too little recipe text.</p><div className="button-row"><button className="button primary" onClick={() => imageInput.current?.click()}>Try another image</button><button className="button secondary" onClick={() => setView('text')}>Paste text</button><button className="button ghost" onClick={startManual}>Create manually</button></div></section>}
    {view === 'review' && draft && <section className="recipe-review form-card">{imagePreview && <div className="recipe-cover-review"><img src={imagePreview} alt="Recipe import preview" /><label><input type="checkbox" checked={useCover} onChange={(event) => setUseCover(event.target.checked)} /> Use original image as cover</label></div>}<div className="form-grid"><label className="wide">Recipe name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label><label>Servings<input type="number" min="1" max="12" value={draft.baseServings} onChange={(event) => setDraft({ ...draft, baseServings: Number(event.target.value) || 1 })} /></label><label>Preparation time<input type="number" min="0" value={draft.minutes} onChange={(event) => setDraft({ ...draft, minutes: Number(event.target.value) || 0 })} /></label></div><div className="review-section-heading"><h2>Ingredients</h2><button className="text-button" onClick={() => setDraft({ ...draft, ingredients: [...draft.ingredients, ingredient(`new-${draft.ingredients.length}`, '', 1, 'item')] })}>Add ingredient</button></div><div className="ingredient-edit-list">{draft.ingredients.map((item, index) => <div className="ingredient-edit" key={item.id}><label><span className="sr-only">Ingredient {index + 1} name</span><input aria-label={`Ingredient ${index + 1} name`} value={item.name} onChange={(event) => updateIngredient(item.id, { name: event.target.value })} /></label><label><span className="sr-only">Quantity</span><input aria-label={`Ingredient ${index + 1} quantity`} type="number" min="0" value={item.quantity} onChange={(event) => updateIngredient(item.id, { quantity: Number(event.target.value) })} /></label><label><span className="sr-only">Unit</span><select aria-label={`Ingredient ${index + 1} unit`} value={item.unit} onChange={(event) => updateIngredient(item.id, { unit: event.target.value as Unit })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>tsp</option><option>cup</option></select></label><button className="icon-button small" aria-label={`Delete ingredient ${index + 1}`} onClick={() => setDraft({ ...draft, ingredients: draft.ingredients.filter((ingredientItem) => ingredientItem.id !== item.id) })}><Icon name="trash" size={17} /></button></div>)}</div><label>Instructions<textarea rows={5} value={draft.steps.join('\n')} onChange={(event) => setDraft({ ...draft, steps: event.target.value.split('\n').filter(Boolean) })} placeholder="Optional" /></label><label>Tags<input value={draft.tags.join(', ')} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean) })} placeholder="Quick, vegetarian" /></label><div className="sticky-actions import-sticky"><button className="button secondary" onClick={() => editRecipe ? navigate(`/recipes/${editRecipe.id}`) : setView('choices')}>Cancel</button><button className="button primary" onClick={save} disabled={!draft.name.trim() || !draft.ingredients.some((item) => item.name.trim())}>{editRecipe ? 'Save changes' : 'Save recipe'}</button></div></section>}
    <input ref={imageInput} className="sr-only" type="file" accept="image/*" aria-label="Choose recipe image" onChange={(event) => handleImage(event.target.files?.[0])} />
  </div>;
}
