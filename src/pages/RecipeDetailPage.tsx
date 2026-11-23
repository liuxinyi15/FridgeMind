import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { matchRecipe } from '../domain/inventory';
import type { IngredientMatch, MatchStatus } from '../domain/inventory';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';

const groupMeta: Record<MatchStatus, { title: string; tone: 'good' | 'warn' | 'danger' | 'neutral'; description: string }> = {
  available: { title: 'Already have', tone: 'good', description: 'Confirmed and available to plan.' },
  partial: { title: 'Partially available', tone: 'warn', description: 'Only the shortfall needs buying.' },
  uncertain: { title: 'Needs confirmation', tone: 'neutral', description: 'Check this amount before shopping.' },
  missing: { title: 'Need to buy', tone: 'danger', description: 'No compatible stock is confirmed.' },
};

export function RecipeDetailPage() {
  const { recipeId } = useParams(); const navigate = useNavigate(); const { data, actions } = useAppState();
  const recipe = data.recipes.find((item) => item.id === recipeId); const [servings, setServings] = useState<number>(data.profile.routine.typicalServings); const [added, setAdded] = useState(false);
  if (!recipe) return <Navigate to="/recipes" replace />;
  const matches = matchRecipe(recipe, servings, data.inventory);
  const gaps = matches.filter((match) => match.status !== 'available').length;
  const addShopping = () => { actions.addRecipeGapsToShopping(recipe, servings); setAdded(true); };
  return <div className="page-stack"><section className="recipe-hero"><div><span className="kicker">{recipe.source} recipe · {recipe.minutes} minutes</span><h1>{recipe.name}</h1><p>{recipe.tags.join(' · ')}</p></div><div className="recipe-score"><strong>{Math.round((matches.filter((m) => m.status === 'available').length / matches.length) * 100)}%</strong><span>fully available</span></div></section>
    <section className="serving-panel" aria-labelledby="serving-title"><div><span className="kicker">Flexible portions</span><h2 id="serving-title">How much are you cooking?</h2><p>Ingredient quantities and shopping gaps update together.</p></div><div className="serving-control" role="group" aria-label="Servings">{[1, 2, 3, 4].map((number) => <button key={number} aria-pressed={servings === number} onClick={() => setServings(number)}>{number}</button>)}</div><label className="cook-extra"><input type="checkbox" checked={servings > 1} onChange={(e) => setServings(e.target.checked ? 2 : 1)} /> Cook extra for later</label></section>
    <section aria-labelledby="match-title"><div className="section-heading"><div><span className="kicker">Recipe-to-Fridge</span><h2 id="match-title">What is ready, uncertain or missing</h2></div><StatusChip tone={gaps ? 'warn' : 'good'}>{gaps ? `${gaps} gaps` : 'Ready to cook'}</StatusChip></div><div className="match-groups">{(['available', 'partial', 'uncertain', 'missing'] as MatchStatus[]).map((status) => { const items = matches.filter((match) => match.status === status); if (!items.length) return null; return <MatchGroup key={status} status={status} items={items} />; })}</div></section>
    <div className="sticky-actions"><button className="button secondary" onClick={addShopping}>{added ? 'Shopping list updated' : 'Add gaps to shopping'}</button><button className="button primary" onClick={() => navigate(`/recipes/${recipe.id}/cook?servings=${servings}`)}>Start cooking</button></div>
    {added && <p className="inline-feedback" role="status">Shopping gaps were recalculated for {servings} servings. <Link to="/shopping">View list</Link></p>}
  </div>;
}

function MatchGroup({ status, items }: { status: MatchStatus; items: IngredientMatch[] }) {
  const meta = groupMeta[status];
  return <section className={`match-group match-${status}`}><div className="match-heading"><StatusChip tone={meta.tone}>{meta.title}</StatusChip><span>{meta.description}</span></div>{items.map((match) => <div className="match-row" key={match.ingredient.id}><div><strong>{match.ingredient.name}</strong><span>Need {match.ingredient.quantity}{match.ingredient.unit}</span></div><div className="match-amount">{status === 'available' && <span>Have {match.available}{match.ingredient.unit}</span>}{status === 'partial' && <><span>Have {match.available}{match.ingredient.unit}</span><strong>Missing {match.gap}{match.ingredient.unit}</strong></>}{status === 'uncertain' && <><span>Recorded amount uncertain</span>{match.inventoryItem && <Link to={`/fridge/${match.inventoryItem.id}`}>Confirm amount</Link>}</>}{status === 'missing' && <strong>Buy {match.gap}{match.ingredient.unit}</strong>}</div></div>)}</section>;
}
