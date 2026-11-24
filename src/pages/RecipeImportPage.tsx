import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseRecipeText } from '../domain/parser';
import type { Recipe, Unit } from '../domain/types';
import { useAppState } from '../state/AppState';

const sample = `Tomato Toast\nServings: 2\n4 item Tomatoes\n4 item Bread slices\n2 tbsp Olive oil`;

export function RecipeImportPage() {
  const { actions } = useAppState(); const navigate = useNavigate();
  const [text, setText] = useState(sample); const [draft, setDraft] = useState<Recipe | null>(null);
  const parse = () => setDraft(parseRecipeText(text));
  const save = () => { if (!draft) return; actions.addRecipe(draft); navigate(`/recipes/${draft.id}`); };
  return <div className="page-stack narrow-page"><section><span className="kicker">Import with review</span><h1>Paste a recipe</h1><p>The simple parser extracts common quantity lines. Review and correct the draft before saving.</p></section>
    {!draft ? <section className="form-card"><label>Recipe text<textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} /></label><button className="button primary full" onClick={parse}>Review recipe</button><div className="demo-notice"><strong>You stay in control</strong><p>Check the name, servings and ingredient amounts before saving. Recipe links and image import are not supported yet.</p></div></section> : <section className="form-card"><div className="demo-notice"><strong>Review before saving</strong><p>Correct any name, quantity or unit that was not read as you expected.</p></div><label>Recipe name<input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label><label>Servings<input type="number" min="1" max="12" value={draft.baseServings} onChange={(e) => setDraft({ ...draft, baseServings: Number(e.target.value) })} /></label><h2>Ingredients</h2>{draft.ingredients.map((ingredient, index) => <div className="ingredient-edit" key={ingredient.id}><label><span className="sr-only">Ingredient {index + 1} name</span><input value={ingredient.name} onChange={(e) => setDraft({ ...draft, ingredients: draft.ingredients.map((item) => item.id === ingredient.id ? { ...item, name: e.target.value, canonicalName: e.target.value.toLowerCase().replace(/s$/, '') } : item) })} /></label><label><span className="sr-only">Quantity</span><input type="number" value={ingredient.quantity} onChange={(e) => setDraft({ ...draft, ingredients: draft.ingredients.map((item) => item.id === ingredient.id ? { ...item, quantity: Number(e.target.value) } : item) })} /></label><label><span className="sr-only">Unit</span><select value={ingredient.unit} onChange={(e) => setDraft({ ...draft, ingredients: draft.ingredients.map((item) => item.id === ingredient.id ? { ...item, unit: e.target.value as Unit } : item) })}><option>g</option><option>ml</option><option>item</option><option>tbsp</option><option>tsp</option><option>cup</option></select></label></div>)}<div className="button-row"><button className="button secondary" onClick={() => setDraft(null)}>Back to text</button><button className="button primary" onClick={save} disabled={!draft.ingredients.length}>Save imported recipe</button></div></section>}
  </div>;
}
