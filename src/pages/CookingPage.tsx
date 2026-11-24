import { useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { scaleIngredients } from '../domain/inventory';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

const options = [
  { value: 1, label: 'As planned' },
  { value: 0.5, label: 'Used less' },
  { value: 1.25, label: 'Used more' },
  { value: 0, label: 'Didn’t use / substituted' },
];

type Stage = 'steps' | 'done' | 'corrections' | 'leftovers';

export function CookingPage() {
  const { recipeId } = useParams();
  const [params] = useSearchParams();
  const { data, actions } = useAppState();
  const navigate = useNavigate();
  const recipe = data.recipes.find((item) => item.id === recipeId);
  const servings = Math.min(4, Math.max(1, Number(params.get('servings')) || data.profile.routine.typicalServings));
  const [stage, setStage] = useState<Stage>('steps');
  const [factors, setFactors] = useState<Record<string, number>>({});
  const [eatNow, setEatNow] = useState(servings > 1 ? 1 : servings);
  if (!recipe) return <Navigate to="/recipes" replace />;
  const ingredients = scaleIngredients(recipe, servings);
  const complete = (saveRest: boolean) => {
    actions.completeCooking(recipe, servings, factors, saveRest ? eatNow : servings);
    navigate('/', { state: { cooked: recipe.name } });
  };
  const continueAfterReview = () => servings > 1 ? setStage('leftovers') : complete(false);

  if (stage === 'steps') return <div className="page-stack narrow-page cooking-page"><section className="cooking-title"><span className="overline">Cooking · {servings} {servings === 1 ? 'portion' : 'portions'}</span><h1>{recipe.name}</h1><p>{servings === 2 ? 'One now + one for later, if you want.' : 'Take it one step at a time.'}</p></section><section className="steps-card"><h2>Ingredients</h2><ul className="plain-list">{ingredients.map((item) => <li key={item.id}><span>{item.name}</span><strong>{item.quantity}{item.unit}</strong></li>)}</ul><h2>Method</h2><ol className="method-list">{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol><details className="explanation"><summary>Food safety note</summary><p>Always follow relevant product safety and cooking instructions.</p></details></section><button className="button primary full" onClick={() => { actions.markCookingReview(); setStage('done'); }}>Finish cooking</button></div>;

  if (stage === 'done') return <div className="page-stack narrow-page completion-page"><section className="completion-hero"><div className="completion-icon"><Icon name="check" size={30} /></div><span className="overline">Quick check</span><h1>Dinner done?</h1><p>FridgeMind can update your fridge in one go.</p></section><div className="completion-actions"><button className="button primary full" onClick={continueAfterReview}>Yes, update my fridge</button><button className="button secondary full" onClick={() => { actions.logUsabilityEvent('recipe_correction_opened'); setStage('corrections'); }}>I changed the recipe</button><button className="button ghost full" onClick={() => setStage('steps')}>Not yet</button></div></div>;

  if (stage === 'corrections') return <div className="page-stack narrow-page"><section><span className="overline">Lightweight correction</span><h1>What changed?</h1><p>Only adjust ingredients you used differently.</p></section><section className="confirmation-list">{ingredients.map((ingredient) => <article key={ingredient.id}><div><strong>{ingredient.name}</strong><span>Planned: {ingredient.quantity}{ingredient.unit}</span></div><select aria-label={`Usage for ${ingredient.name}`} value={factors[ingredient.id] ?? 1} onChange={(event) => setFactors({ ...factors, [ingredient.id]: Number(event.target.value) })}>{options.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}</select></article>)}</section><details className="concept-card"><summary>Used a substitute?</summary><p>Choose “Didn’t use / substituted”. FridgeMind will not invent an amount for the replacement.</p></details><button className="button primary full" onClick={continueAfterReview}>Continue</button></div>;

  return <div className="page-stack narrow-page leftover-page"><section><span className="overline">Leftovers</span><h1>Save the rest?</h1><p>{servings} portions cooked. Tell us what you’re eating now.</p></section><section className="leftover-choice"><div><strong>Eat now</strong><span>The rest becomes a fridge item.</span></div><div className="stepper"><button aria-label="Eat one fewer portion now" onClick={() => setEatNow(Math.max(1, eatNow - 1))} disabled={eatNow === 1}><Icon name="minus" size={18} /></button><output>{eatNow}</output><button aria-label="Eat one more portion now" onClick={() => setEatNow(Math.min(servings, eatNow + 1))} disabled={eatNow === servings}><Icon name="plus" size={18} /></button></div></section>{servings - eatNow > 0 && <div className="leftover-preview"><Icon name="servings" size={24} /><div><strong>Save {servings - eatNow} for later</strong><span>{recipe.name} · Stored today · Fridge</span></div></div>}<div className="completion-actions"><button className="button primary full" onClick={() => complete(true)} disabled={servings - eatNow === 0}>Save {servings - eatNow || ''} for later</button><button className="button secondary full" onClick={() => complete(false)}>No leftovers</button></div></div>;
}
