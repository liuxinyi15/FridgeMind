import { Link, useSearchParams } from 'react-router-dom';
import { rankRecipes } from '../domain/recommendationEngine';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';

export function RecipesPage() {
  const { data } = useAppState(); const [params] = useSearchParams();
  const filter = params.get('uses');
  const ranked = rankRecipes(data.recipes, data.inventory, data.profile.routine.typicalServings, data.savedRecipes);
  const filtered = filter ? ranked.filter((item) => item.recipe.ingredients.some((ingredient) => ingredient.canonicalName === filter)) : ranked;
  return <div className="page-stack"><section className="page-title-row"><div><span className="kicker">Plans that connect to stock</span><h1>Recipes</h1><p>Saved, imported and recommended options use the same live fridge match.</p></div><Link className="button primary" to="/recipes/import">Import recipe</Link></section>
    {filter && <div className="filter-banner"><span>Showing recipes using <strong>{filter}</strong></span><Link to="/recipes">Clear filter</Link></div>}
    {['saved', 'imported', 'recommended'].map((source) => { const recipes = filtered.filter((entry) => entry.recipe.source === source); if (!recipes.length) return null; return <section key={source}><div className="section-heading"><h2>{source[0].toUpperCase() + source.slice(1)}</h2><span className="small-note">{recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}</span></div><div className="compact-recipe-list">{recipes.map((entry) => <article className="compact-recipe" key={entry.recipe.id}><div><span className="kicker">{entry.recipe.minutes} min · {entry.recipe.baseServings} servings</span><h3><Link to={`/recipes/${entry.recipe.id}`}>{entry.recipe.name}</Link></h3><p>{entry.recipe.tags.join(' · ')}</p></div><div className="recipe-match-side"><StatusChip tone={entry.pantryCoverage >= 0.75 ? 'good' : 'neutral'}>{Math.round(entry.pantryCoverage * 100)}% available</StatusChip><span>{entry.missingIngredientCount} gaps</span></div></article>)}</div></section>; })}
    {!filtered.length && <section className="empty-state"><h2>No good match right now</h2><p>We could not find a useful option for this filter. Correct your fridge or import a recipe rather than forcing a poor recommendation.</p></section>}
  </div>;
}
