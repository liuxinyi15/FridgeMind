import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { rankRecipes } from '../domain/recommendationEngine';
import { useAppState } from '../state/AppState';
import { RecipeCard } from '../components/RecipeCard';
import { Icon } from '../components/Icon';

type RecipeFilter = 'all' | 'quick' | 'use_soon' | 'saved' | 'personal' | 'built_in';

export function RecipesPage() {
  const { data } = useAppState();
  const [params] = useSearchParams();
  const ingredient = params.get('uses');
  const [filter, setFilter] = useState<RecipeFilter>(ingredient ? 'use_soon' : 'all');
  const ranked = rankRecipes(data.recipes, data.inventory, data.profile.routine.typicalServings, data.savedRecipes);
  const filtered = ranked.filter((entry) => {
    if (ingredient && !entry.recipe.ingredients.some((item) => item.canonicalName === ingredient)) return false;
    if (filter === 'quick') return entry.recipe.minutes > 0 && entry.recipe.minutes <= 20;
    if (filter === 'use_soon') return entry.useSoonCoverage > 0;
    if (filter === 'saved') return data.savedRecipes.some((saved) => saved.recipeId === entry.recipe.id);
    if (filter === 'personal') return entry.recipe.ownership === 'personal';
    if (filter === 'built_in') return entry.recipe.ownership !== 'personal';
    return true;
  });

  return <div className="page-stack recipes-page">
    <section className="page-title-row"><div><span className="overline">Made for your fridge</span><h1>Recipes</h1><p>{ingredient ? `Ideas using ${ingredient}` : 'Good food, fewer extra groceries.'}</p></div><Link className="icon-action" to="/recipes/import" aria-label="Import recipe"><Icon name="plus" /></Link></section>
    <div className="filter-chips recipe-filters" role="group" aria-label="Filter recipes">{([
      ['all', 'All'], ['quick', 'Under 20 min'], ['use_soon', 'Uses food soon'], ['saved', 'Saved'], ['personal', 'My recipes'], ['built_in', 'Built-in ideas'],
    ] as const).map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
    {ingredient && <div className="filter-banner"><span><Icon name="leaf" size={18} /> Showing meals with <strong>{ingredient}</strong></span><Link to="/recipes">Clear</Link></div>}
    {filtered.length ? <section aria-label="Recipe results"><div className="recipe-library-heading"><h2>{filter === 'personal' ? 'My recipes' : ingredient ? `Recipes using ${ingredient}` : 'Recommended for your fridge'}</h2><span>{filtered.length} recipes</span></div><div className="recipe-list recipe-grid">{filtered.map((entry) => <RecipeCard key={entry.recipe.id} recommendation={entry} />)}</div></section> : <section className="empty-state"><Icon name="recipes" size={32} /><h2>No matches yet</h2><p>Try another filter or check what’s in your fridge.</p><button className="button secondary" onClick={() => setFilter('all')}>Show all recipes</button></section>}
  </div>;
}
