import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { canonicalise, matchRecipe, recipeAvailability } from '../domain/inventory';
import type { IngredientMatch, MatchStatus } from '../domain/inventory';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';
import { Icon } from '../components/Icon';
import { RecipeArtwork } from '../components/RecipeArtwork';

const groupMeta: Record<MatchStatus, { title: string; tone: 'good' | 'warn' | 'danger' | 'neutral'; description: string }> = {
  available: { title: 'In your fridge', tone: 'good', description: 'Ready to use' },
  partial: { title: 'Running low', tone: 'warn', description: 'Buy only the difference' },
  uncertain: { title: 'Check first', tone: 'neutral', description: 'Confirm only when it matters' },
  missing: { title: 'Need to buy', tone: 'danger', description: 'Not currently in your fridge' },
};

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { data, actions } = useAppState();
  const recipe = data.recipes.find((item) => item.id === recipeId);
  const [servings, setServings] = useState<number>(data.profile.routine.typicalServings);
  const [added, setAdded] = useState(false);
  const [checking, setChecking] = useState<IngredientMatch | null>(null);
  if (!recipe) return <Navigate to="/recipes" replace />;
  const matches = matchRecipe(recipe, servings, data.inventory, data.substitutions);
  const availability = recipeAvailability(matches, recipe.minutes);
  const missing = matches.filter((match) => match.status === 'missing' || match.status === 'partial').length;
  const uncertain = matches.filter((match) => match.status === 'uncertain');
  const addShopping = () => { actions.addRecipeGapsToShopping(recipe, servings); setAdded(true); };
  const start = () => {
    if (uncertain.length) {
      setChecking(uncertain[0]);
      actions.logUsabilityEvent('uncertainty_prompt_shown', { ingredient: uncertain[0].ingredient.canonicalName });
      return;
    }
    actions.startCooking(recipe, servings);
    navigate(`/recipes/${recipe.id}/cook?servings=${servings}`);
  };
  const resolve = (answer: 'enough' | 'not_enough' | 'none') => {
    if (!checking?.inventoryItem) return;
    actions.resolveIngredientAmount(checking.inventoryItem.id, checking.ingredient.quantity, answer);
    setChecking(null);
  };
  const availabilityLabel = availability === 'READY' ? 'Everything you need' : availability === 'READY_WITH_UNCERTAINTY' ? `Check ${uncertain.length} item${uncertain.length === 1 ? '' : 's'}` : availability === 'MISSING_ITEMS' ? `Missing ${missing} ingredient${missing === 1 ? '' : 's'}` : 'Not practical today';

  return <div className="page-stack recipe-detail-page">
    <section className="recipe-detail-hero">
      <div className="detail-image"><RecipeArtwork recipe={recipe} alt={`${recipe.name} recipe artwork`} eager /></div>
      <div className="detail-identity"><span className="overline">{recipe.tags[0]} · {recipe.source}</span><h1>{recipe.name}</h1><div className="recipe-facts"><span><Icon name="clock" size={17} /> {recipe.minutes} min</span><span><Icon name="servings" size={17} /> {servings} {servings === 1 ? 'portion' : 'portions'}</span><StatusChip tone={availability === 'READY' ? 'good' : 'neutral'}>{availabilityLabel}</StatusChip></div></div>
    </section>
    <section className="portion-strip" aria-labelledby="serving-title"><div><h2 id="serving-title">Portions</h2><p>{servings === 2 ? 'Cooking alone? That can be 1 now + 1 for later.' : 'Amounts update as you change this.'}</p></div><div className="stepper"><button aria-label="Decrease portions" onClick={() => setServings(Math.max(1, servings - 1))} disabled={servings === 1}><Icon name="minus" size={18} /></button><output aria-live="polite">{servings}</output><button aria-label="Increase portions" onClick={() => setServings(Math.min(4, servings + 1))} disabled={servings === 4}><Icon name="plus" size={18} /></button></div></section>
    <section aria-labelledby="match-title"><div className="section-heading"><div><h2 id="match-title">Ingredients</h2><p>{availabilityLabel}</p></div></div><div className="match-groups">{(['available', 'partial', 'uncertain', 'missing'] as MatchStatus[]).map((status) => { const items = matches.filter((match) => match.status === status); if (!items.length) return null; return <MatchGroup key={status} recipeId={recipe.id} status={status} items={items} />; })}</div></section>
    {added && <p className="inline-feedback" role="status">Only confirmed gaps were added for {servings} {servings === 1 ? 'portion' : 'portions'}. <Link to="/shopping">View list</Link></p>}
    <div className="sticky-actions recipe-sticky"><button className="button secondary" onClick={addShopping} disabled={missing === 0}>{added ? 'List updated' : missing ? 'Add missing items' : 'No shopping gaps'}</button><button className="button primary" onClick={start}>Start cooking</button></div>
    {checking && <div className="sheet-backdrop" role="presentation"><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="stock-check-title"><div className="sheet-handle" /><span className="overline">Quick stock check</span><h2 id="stock-check-title">{checking.ingredient.name} amount is uncertain</h2><p>Do you have enough for this recipe? It needs {checking.ingredient.quantity}{checking.ingredient.unit}.</p><div className="stock-check-actions"><button className="button primary" onClick={() => resolve('enough')}>Yes</button><button className="button secondary" onClick={() => resolve('not_enough')}>Not enough</button><button className="button ghost" onClick={() => resolve('none')}>None left</button></div></section></div>}
  </div>;
}

function MatchGroup({ recipeId, status, items }: { recipeId: string; status: MatchStatus; items: IngredientMatch[] }) {
  const { data, actions } = useAppState();
  const meta = groupMeta[status];
  return <section className={`match-group match-${status}`}><div className="match-heading"><StatusChip tone={meta.tone}>{meta.title}</StatusChip><span>{meta.description}</span></div>{items.map((match) => {
    const alternative = match.ingredient.possibleSubstitutes?.map((name) => data.inventory.find((item) => item.canonicalName === canonicalise(name))).find(Boolean);
    return <div className="match-row" key={match.ingredient.id}><div><strong>{match.ingredient.name}</strong><span>{match.ingredient.quantity}{match.ingredient.unit} needed{match.substitutionUsed ? ` · using ${match.inventoryItem?.name}` : ''}</span></div><div className="match-amount">{status === 'available' && <span>{match.available}{match.ingredient.unit} available</span>}{status === 'partial' && <><span>{match.available}{match.ingredient.unit} at home</span><strong>Missing {match.gap}{match.ingredient.unit}</strong></>}{status === 'uncertain' && <><span>Some left — check before cooking</span>{match.inventoryItem && <Link to={`/fridge/${match.inventoryItem.id}`}>Edit amount</Link>}</>}{status === 'missing' && <><strong>Buy {match.gap}{match.ingredient.unit}</strong>{alternative && <button className="text-button" onClick={() => actions.confirmSubstitution(recipeId, match.ingredient.id, alternative.canonicalName)}>Use {alternative.name} instead</button>}</>}</div></div>;
  })}</section>;
}
