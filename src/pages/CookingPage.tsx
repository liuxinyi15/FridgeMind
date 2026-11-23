import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { scaleIngredients } from '../domain/inventory';
import { useAppState } from '../state/AppState';

const options = [
  { value: 1, label: 'As planned' },
  { value: 0.5, label: 'Used less' },
  { value: 1.25, label: 'Used more' },
  { value: 0, label: 'Didn’t use / substituted' },
];

export function CookingPage() {
  const { recipeId } = useParams(); const [params] = useSearchParams(); const { data, actions } = useAppState(); const navigate = useNavigate();
  const recipe = data.recipes.find((item) => item.id === recipeId); const servings = Math.min(4, Math.max(1, Number(params.get('servings')) || data.profile.routine.typicalServings));
  const [stage, setStage] = useState<'steps' | 'confirm'>('steps'); const [factors, setFactors] = useState<Record<string, number>>({});
  if (!recipe) return <Navigate to="/recipes" replace />;
  const ingredients = scaleIngredients(recipe, servings);
  const finish = () => { actions.completeCooking(recipe, servings, factors); navigate('/fridge', { state: { cooked: recipe.name } }); };
  if (stage === 'steps') return <div className="page-stack narrow-page"><section><span className="kicker">Cooking · {servings} servings</span><h1>{recipe.name}</h1><p>Use the recipe as a guide. Always follow relevant product safety and cooking instructions.</p></section><section className="steps-card"><h2>Ingredients</h2><ul className="plain-list">{ingredients.map((item) => <li key={item.id}><span>{item.name}</span><strong>{item.quantity}{item.unit}</strong></li>)}</ul><h2>Method</h2><ol className="method-list">{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol></section><button className="button primary full" onClick={() => setStage('confirm')}>I’ve finished cooking</button></div>;
  return <div className="page-stack narrow-page"><section><span className="kicker">One light check</span><h1>Did anything change?</h1><p>We will use planned amounts by default. Only adjust exceptions — no full inventory count required.</p></section><section className="confirmation-list">{ingredients.map((ingredient) => <article key={ingredient.id}><div><strong>{ingredient.name}</strong><span>Planned: {ingredient.quantity}{ingredient.unit}</span></div><select aria-label={`Usage for ${ingredient.name}`} value={factors[ingredient.id] ?? 1} onChange={(e) => setFactors({ ...factors, [ingredient.id]: Number(e.target.value) })}>{options.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}</select></article>)}</section><div className="demo-notice"><strong>Correction over administration</strong><p>If a substitution occurred, choose “Didn’t use / substituted”. V0.1 does not add the replacement automatically.</p></div><button className="button primary full" onClick={finish}>Update My Fridge</button></div>;
}
