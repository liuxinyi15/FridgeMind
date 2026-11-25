import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rankRecipes, type RecommendationScore } from '../domain/recommendationEngine';
import { useAppState } from '../state/AppState';
import { RecipeCard } from '../components/RecipeCard';
import { Icon } from '../components/Icon';

type RecipeFilter = 'all' | 'ready' | 'quick' | 'use_soon' | 'saved' | 'personal';

export function RecipesPage() {
  const { data } = useAppState();
  const [params] = useSearchParams();
  const ingredient = params.get('uses');
  const [filter, setFilter] = useState<RecipeFilter>(ingredient ? 'use_soon' : 'all');
  const ranked = rankRecipes(data.recipes, data.inventory, data.profile.routine.typicalServings, data.savedRecipes);
  const scoped = ranked.filter((entry) => !ingredient || entry.recipe.ingredients.some((item) => item.canonicalName === ingredient));
  const personal = scoped.filter((entry) => entry.recipe.ownership === 'personal');
  const saved = scoped.filter((entry) => data.savedRecipes.some((item) => item.recipeId === entry.recipe.id) && entry.recipe.ownership !== 'personal');
  const builtIn = scoped.filter((entry) => entry.recipe.ownership !== 'personal');
  const filtered = scoped.filter((entry) => {
    if (filter === 'ready') return entry.availability === 'READY';
    if (filter === 'quick') return entry.recipe.minutes > 0 && entry.recipe.minutes <= 20;
    if (filter === 'use_soon') return entry.useSoonCoverage > 0;
    if (filter === 'saved') return data.savedRecipes.some((item) => item.recipeId === entry.recipe.id);
    if (filter === 'personal') return entry.recipe.ownership === 'personal';
    return true;
  });

  return <div className="page-stack recipes-page">
    <section className="page-title-row"><div><span className="overline">Cook without shopping</span><h1>Recipes</h1><p>{ingredient ? `Meals that use ${ingredient}` : 'Start with meals you know, then see what your fridge can cover.'}</p></div><Link className="icon-action" to="/recipes/import" aria-label="Add recipe"><Icon name="plus" /></Link></section>
    <div className="filter-chips recipe-filters" role="group" aria-label="Filter recipes">{([
      ['all', 'For you'], ['ready', 'No shopping needed'], ['quick', 'Under 20 min'], ['use_soon', 'Uses food soon'], ['personal', 'My recipes'], ['saved', 'Saved'],
    ] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {ingredient && <div className="filter-banner"><span><Icon name="leaf" size={18} /> Using <strong>{ingredient}</strong></span><Link to="/recipes">Clear</Link></div>}
    {filter !== 'all' ? <RecipeSection title={filterTitle(filter, ingredient)} entries={filtered} emptyAction={() => setFilter('all')} /> : <>
      <section className="personal-recipe-section" aria-labelledby="my-recipes-title"><div className="recipe-library-heading"><div><span className="overline">Recipes you trust</span><h2 id="my-recipes-title">My recipes</h2></div><Link className="text-button" to="/recipes/import">Add recipe</Link></div>{personal.length ? <div className="recipe-list recipe-grid">{personal.map((entry) => <RecipeCard key={entry.recipe.id} recommendation={entry} />)}</div> : <div className="empty-state compact personal-empty"><Icon name="recipes" size={28} /><h3>Add a recipe you already like</h3><p>Paste the text and FridgeMind will structure it for review.</p><Link className="button primary" to="/recipes/import">Add a recipe</Link></div>}</section>
      {saved.length > 0 && <RecipeSection title="Saved" entries={saved.slice(0, 4)} />}
      {data.inventory.length > 0 && <RecipeSection title="Cook without shopping" subtitle={`${scoped.filter((entry) => entry.availability === 'READY').length} meals use only confirmed food`} entries={scoped.filter((entry) => entry.availability === 'READY').slice(0, 4)} />}
      <RecipeSection title={data.inventory.length ? 'Ideas for your fridge' : 'Simple ideas to explore'} subtitle="Built-in ideas stay secondary to your own recipes" entries={builtIn.slice(0, 8)} />
    </>}
  </div>;
}

function RecipeSection({ title, subtitle, entries, emptyAction }: { title: string; subtitle?: string; entries: RecommendationScore[]; emptyAction?: () => void }) {
  return <section aria-label={title}><div className="recipe-library-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><span>{entries.length} {entries.length === 1 ? 'recipe' : 'recipes'}</span></div>{entries.length ? <div className="recipe-list recipe-grid">{entries.map((entry) => <RecipeCard key={entry.recipe.id} recommendation={entry} />)}</div> : <div className="empty-state compact"><h3>No matches yet</h3><p>Try another filter or add what is in your fridge.</p>{emptyAction && <button className="button secondary" onClick={emptyAction}>Show all recipes</button>}</div>}</section>;
}

function filterTitle(filter: RecipeFilter, ingredient: string | null) {
  if (ingredient) return `Recipes using ${ingredient}`;
  if (filter === 'ready') return 'No shopping needed';
  if (filter === 'quick') return 'Under 20 minutes';
  if (filter === 'use_soon') return 'Uses food soon';
  if (filter === 'personal') return 'My recipes';
  if (filter === 'saved') return 'Saved';
  return 'Recipes';
}
