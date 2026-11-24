import { useEffect, useMemo, useState } from 'react';
import type { Recipe } from '../domain/types';
import { FoodIcon } from './FoodIcon';
import { Icon } from './Icon';

export function recipeImageCandidates(recipe: Recipe) {
  return [recipe.image, recipe.importedImage, recipe.builtInImage]
    .filter((value): value is string => Boolean(value?.trim()))
    .filter((value, index, values) => values.indexOf(value) === index);
}

export function RecipeArtwork({ recipe, alt = '', eager = false }: { recipe: Recipe; alt?: string; eager?: boolean }) {
  const candidates = useMemo(() => recipeImageCandidates(recipe), [recipe.image, recipe.importedImage, recipe.builtInImage]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => setCandidateIndex(0), [recipe.id, candidates.join('|')]);

  const candidate = candidates[candidateIndex];
  if (candidate) {
    return <img src={candidate} alt={alt} loading={eager ? 'eager' : 'lazy'} onError={() => setCandidateIndex((index) => index + 1)} />;
  }
  return <RecipePlaceholder recipe={recipe} alt={alt} />;
}

function RecipePlaceholder({ recipe, alt }: { recipe: Recipe; alt: string }) {
  const ingredients = recipe.ingredients.slice(0, 3);
  const ingredientNames = ingredients.map((item) => item.name).join(', ');
  return <div className={`recipe-placeholder placeholder-${categoryFor(recipe)}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}>
    <span className="placeholder-brand"><Icon name="leaf" size={14} /> FridgeMind</span>
    <div className="placeholder-food-cluster" aria-hidden="true">{ingredients.map((ingredient) => <FoodIcon key={ingredient.id} name={ingredient.canonicalName} />)}</div>
    <div className="placeholder-caption"><strong>{recipe.name}</strong><span>{ingredientNames || 'Your saved recipe'}</span></div>
  </div>;
}

function categoryFor(recipe: Recipe) {
  const text = `${recipe.name} ${recipe.tags.join(' ')}`.toLowerCase();
  if (text.includes('soup')) return 'soup';
  if (text.includes('pasta') || text.includes('noodle')) return 'pasta';
  if (text.includes('rice') || text.includes('bowl')) return 'bowl';
  if (text.includes('toast') || text.includes('bread')) return 'toast';
  return 'fresh';
}
