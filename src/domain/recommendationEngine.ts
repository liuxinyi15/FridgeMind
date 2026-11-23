import { matchRecipe } from './inventory';
import type { FoodItem, Recipe, SavedRecipe } from './types';

export interface RecommendationScore {
  recipe: Recipe;
  score: number;
  pantryCoverage: number;
  useSoonCoverage: number;
  timeFit: number;
  portionFit: number;
  savedPreference: number;
  missingIngredientCount: number;
  reasons: string[];
}

export function scoreRecipe(
  recipe: Recipe,
  inventory: FoodItem[],
  typicalServings: number,
  savedRecipes: SavedRecipe[],
): RecommendationScore {
  const matches = matchRecipe(recipe, typicalServings, inventory);
  const availableEquivalents = matches.reduce((sum, match) => {
    if (match.status === 'available') return sum + 1;
    if (match.status === 'partial') return sum + Math.min(1, match.available / match.ingredient.quantity);
    if (match.status === 'uncertain') return sum + 0.35;
    return sum;
  }, 0);
  const pantryCoverage = matches.length ? availableEquivalents / matches.length : 0;
  const useSoonIngredients = new Set(
    inventory.filter((item) => item.batches.some((batch) => batch.state === 'use_soon')).map((item) => item.canonicalName),
  );
  const usedSoon = recipe.ingredients.filter((ingredient) => useSoonIngredients.has(ingredient.canonicalName));
  const useSoonCoverage = Math.min(1, usedSoon.length / Math.max(1, useSoonIngredients.size));
  const missingIngredientCount = matches.filter((match) => match.status === 'missing' || match.status === 'partial').length;
  const timeFit = recipe.minutes <= 20 ? 1 : recipe.minutes <= 30 ? 0.8 : recipe.minutes <= 45 ? 0.55 : 0.25;
  const portionFit = recipe.baseServings === typicalServings ? 1 : recipe.baseServings <= 2 ? 0.85 : 0.65;
  const saved = savedRecipes.find((entry) => entry.recipeId === recipe.id);
  const savedPreference = saved ? saved.preference : 0;
  const penalty = Math.min(1, missingIngredientCount / Math.max(1, matches.length));
  const score = 0.3 * pantryCoverage + 0.25 * useSoonCoverage + 0.2 * timeFit + 0.1 * portionFit + 0.1 * savedPreference - 0.05 * penalty;
  const reasons: string[] = [];
  if (usedSoon.length) reasons.push(`uses ${usedSoon.map((item) => item.name).join(' and ')} that should be used soon`);
  if (recipe.minutes <= 30) reasons.push(`takes ${recipe.minutes} minutes`);
  if (missingIngredientCount === 0) reasons.push('needs no confirmed extra ingredients');
  else reasons.push(`needs ${missingIngredientCount} extra ${missingIngredientCount === 1 ? 'ingredient' : 'ingredients'}`);
  if (saved) reasons.push('is one of your saved recipes');
  return {
    recipe,
    score,
    pantryCoverage,
    useSoonCoverage,
    timeFit,
    portionFit,
    savedPreference,
    missingIngredientCount,
    reasons,
  };
}

export function rankRecipes(recipes: Recipe[], inventory: FoodItem[], typicalServings: number, saved: SavedRecipe[]) {
  return recipes
    .map((recipe) => scoreRecipe(recipe, inventory, typicalServings, saved))
    .sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes);
}
