import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { matchRecipe } from '../domain/inventory';
import type { IngredientMatch, MatchStatus } from '../domain/inventory';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';
import { Icon } from '../components/Icon';
import { RecipeArtwork } from '../components/RecipeArtwork';

const groupMeta: Record<MatchStatus, { title: string; tone: 'good' | 'warn' | 'danger' | 'neutral'; description: string }> = {
  available: { title: 'In your fridge', tone: 'good', description: 'Ready to use' },
  partial: { title: 'Running low', tone: 'warn', description: 'Buy only the difference' },
  uncertain: { title: 'Check first', tone: 'neutral', description: 'Amount needs confirming' },
  missing: { title: 'Need to buy', tone: 'danger', description: 'Not currently in your fridge' },
};

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { data, actions } = useAppState();
  const recipe = data.recipes.find((item) => item.id === recipeId);
  const [servings, setServings] = useState<number>(data.profile.routine.typicalServings);
  const [added, setAdded] = useState(false);
  if (!recipe) return <Navigate to="/recipes" replace />;
  const matches = matchRecipe(recipe, servings, data.inventory);
  const gaps = matches.filter((match) => match.status !== 'available').length;
  const missing = matches.filter((match) => match.status === 'missing' || match.status === 'partial').length;
  const addShopping = () => { actions.addRecipeGapsToShopping(recipe, servings); setAdded(true); };

  return <div className="page-stack recipe-detail-page">
    <section className="recipe-detail-hero">
      <div className="detail-image"><RecipeArtwork recipe={recipe} alt={`${recipe.name} recipe artwork`} eager /></div>
      <div className="detail-identity"><span className="overline">{recipe.tags[0]} · {recipe.source}</span><h1>{recipe.name}</h1><div className="recipe-facts"><span><Icon name="clock" size={17} /> {recipe.minutes} min</span><span><Icon name="servings" size={17} /> {servings} {servings === 1 ? 'portion' : 'portions'}</span><StatusChip tone={missing ? 'neutral' : 'good'}>{missing ? `Missing ${missing}` : 'Ready to cook'}</StatusChip></div></div>
    </section>
    <section className="portion-strip" aria-labelledby="serving-title"><div><h2 id="serving-title">Portions</h2><p>Amounts update as you change this.</p></div><div className="stepper"><button aria-label="Decrease portions" onClick={() => setServings(Math.max(1, servings - 1))} disabled={servings === 1}><Icon name="minus" size={18} /></button><output aria-live="polite">{servings}</output><button aria-label="Increase portions" onClick={() => setServings(Math.min(4, servings + 1))} disabled={servings === 4}><Icon name="plus" size={18} /></button></div></section>
    <section aria-labelledby="match-title"><div className="section-heading"><div><h2 id="match-title">Ingredients</h2><p>{gaps ? `${gaps} ${gaps === 1 ? 'item needs' : 'items need'} attention` : 'You have everything listed'}</p></div></div><div className="match-groups">{(['available', 'partial', 'uncertain', 'missing'] as MatchStatus[]).map((status) => { const items = matches.filter((match) => match.status === status); if (!items.length) return null; return <MatchGroup key={status} status={status} items={items} />; })}</div></section>
    {added && <p className="inline-feedback" role="status">Shopping list updated for {servings} {servings === 1 ? 'portion' : 'portions'}. <Link to="/shopping">View list</Link></p>}
    <div className="sticky-actions recipe-sticky"><button className="button secondary" onClick={addShopping}>{added ? 'List updated' : 'Add missing items'}</button><button className="button primary" onClick={() => navigate(`/recipes/${recipe.id}/cook?servings=${servings}`)}>Start cooking</button></div>
  </div>;
}

function MatchGroup({ status, items }: { status: MatchStatus; items: IngredientMatch[] }) {
  const meta = groupMeta[status];
  return <section className={`match-group match-${status}`}><div className="match-heading"><StatusChip tone={meta.tone}>{meta.title}</StatusChip><span>{meta.description}</span></div>{items.map((match) => <div className="match-row" key={match.ingredient.id}><div><strong>{match.ingredient.name}</strong><span>{match.ingredient.quantity}{match.ingredient.unit} needed</span></div><div className="match-amount">{status === 'available' && <span>{match.available}{match.ingredient.unit} available</span>}{status === 'partial' && <><span>{match.available}{match.ingredient.unit} at home</span><strong>Missing {match.gap}{match.ingredient.unit}</strong></>}{status === 'uncertain' && <><span>Amount unknown</span>{match.inventoryItem && <Link to={`/fridge/${match.inventoryItem.id}`}>Check amount</Link>}</>}{status === 'missing' && <strong>Buy {match.gap}{match.ingredient.unit}</strong>}</div></div>)}</section>;
}
