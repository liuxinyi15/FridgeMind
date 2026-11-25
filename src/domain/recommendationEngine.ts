import { matchRecipe, recipeAvailability } from './inventory';
import type { ActivityEvent, FoodItem, MealContextChoice, Recipe, RecipeAvailability, RecommendationFeedback, SavedRecipe } from './types';

export interface RecommendationFactors {
  urgency: number;
  availability: number;
  inventoryConfidence: number;
  missingItems: number;
  preparationFit: number;
  portionFit: number;
  cookingFrequencyFit: number;
  savedPreference: number;
  repetitionPenalty: number;
  contextFit: number;
}

export interface RecommendationScore {
  recipe: Recipe;
  score: number;
  pantryCoverage: number;
  useSoonCoverage: number;
  timeFit: number;
  portionFit: number;
  savedPreference: number;
  missingIngredientCount: number;
  uncertainIngredientCount: number;
  availability: RecipeAvailability;
  factors: RecommendationFactors;
  reasons: string[];
}

export interface RecommendationOptions {
  cookingFrequency?: string;
  mealContext?: MealContextChoice;
  activity?: ActivityEvent[];
  feedback?: RecommendationFeedback[];
  substitutions?: Record<string, string>;
  now?: Date;
}

const sameLocalDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export function scoreRecipe(
  recipe: Recipe,
  inventory: FoodItem[],
  typicalServings: number,
  savedRecipes: SavedRecipe[],
  options: RecommendationOptions = {},
): RecommendationScore {
  const matches = matchRecipe(recipe, typicalServings, inventory, options.substitutions);
  const availableEquivalents = matches.reduce((sum, match) => {
    if (match.status === 'available') return sum + 1;
    if (match.status === 'partial') return sum + Math.min(1, match.available / match.ingredient.quantity);
    if (match.status === 'uncertain') return sum + 0.4;
    return sum;
  }, 0);
  const pantryCoverage = matches.length ? availableEquivalents / matches.length : 0;
  const useSoonIngredients = new Set(inventory.filter((item) => item.kind !== 'leftover' && item.batches.some((batch) => batch.state === 'use_soon')).map((item) => item.canonicalName));
  const usedSoon = recipe.ingredients.filter((ingredient) => useSoonIngredients.has(ingredient.canonicalName));
  const useSoonCoverage = Math.min(1, usedSoon.length / Math.max(1, useSoonIngredients.size));
  const missingIngredientCount = matches.filter((match) => match.status === 'missing' || match.status === 'partial').length;
  const uncertainIngredientCount = matches.filter((match) => match.status === 'uncertain').length;
  const timeFit = recipe.minutes <= 0 ? .55 : recipe.minutes <= 20 ? 1 : recipe.minutes <= 30 ? 0.82 : recipe.minutes <= 45 ? 0.55 : 0.25;
  const portionFit = recipe.baseServings === typicalServings ? 1 : recipe.baseServings <= 2 ? 0.85 : 0.55;
  const saved = savedRecipes.find((entry) => entry.recipeId === recipe.id);
  const savedPreference = saved?.preference ?? 0;
  const confidenceFit = matches.length ? matches.filter((match) => match.status !== 'uncertain').length / matches.length : 1;
  const missingFit = 1 - Math.min(1, missingIngredientCount / Math.max(1, matches.length));
  const cookingFrequencyFit = ['0', '1-2'].includes(options.cookingFrequency ?? '') ? (recipe.minutes <= 25 ? 1 : .45) : .8;
  const now = options.now ?? new Date();
  const recentCompletions = (options.activity ?? []).filter((event) => event.type === 'cooking_completed' && event.metadata?.recipeId === recipe.id && now.getTime() - new Date(event.at).getTime() < 7 * 86_400_000).length;
  const feedback = (options.feedback ?? []).filter((entry) => entry.recipeId === recipe.id && entry.active);
  const permanentBlock = feedback.some((entry) => entry.action === 'never_recommend');
  const dayBlock = feedback.some((entry) => entry.action === 'not_in_mood' && sameLocalDay(new Date(entry.createdAt), now));
  const recentlyAte = feedback.some((entry) => entry.action === 'ate_recently' && now.getTime() - new Date(entry.createdAt).getTime() < 7 * 86_400_000);
  const repetitionPenalty = Math.min(1, recentCompletions * .45 + (recentlyAte ? .65 : 0));
  const contextFit = options.mealContext === 'cooking'
    ? Math.max(0, .55 * missingFit + .45 * timeFit)
    : options.mealContext === 'eating_out' ? .15 : .65;
  const factors: RecommendationFactors = {
    urgency: useSoonCoverage,
    availability: pantryCoverage,
    inventoryConfidence: confidenceFit,
    missingItems: missingFit,
    preparationFit: timeFit,
    portionFit,
    cookingFrequencyFit,
    savedPreference,
    repetitionPenalty,
    contextFit,
  };
  const raw = .22 * factors.urgency + .2 * factors.availability + .1 * factors.inventoryConfidence + .12 * factors.missingItems + .1 * factors.preparationFit + .08 * factors.portionFit + .05 * factors.cookingFrequencyFit + .06 * factors.savedPreference + .07 * factors.contextFit - .18 * factors.repetitionPenalty;
  const score = permanentBlock || dayBlock ? -1 : raw;
  const reasons: string[] = [];
  if (usedSoon.length) reasons.push(`Uses ${usedSoon.slice(0, 2).map((item) => item.name).join(' and ')} that should be used soon`);
  if (missingIngredientCount === 0 && uncertainIngredientCount === 0) reasons.push('Everything you need is confirmed');
  else if (missingIngredientCount === 1) reasons.push('Only one ingredient is missing');
  if (recipe.minutes > 0 && recipe.minutes <= 30) reasons.push(`Ready in ${recipe.minutes} minutes`);
  if (recipe.baseServings === typicalServings) reasons.push(`Matches your usual ${typicalServings}-portion cooking preference`);
  if (saved) reasons.push('One of your saved recipes');
  return {
    recipe,
    score,
    pantryCoverage,
    useSoonCoverage,
    timeFit,
    portionFit,
    savedPreference,
    missingIngredientCount,
    uncertainIngredientCount,
    availability: recipeAvailability(matches, recipe.minutes),
    factors,
    reasons: reasons.slice(0, 3),
  };
}

export function rankRecipes(recipes: Recipe[], inventory: FoodItem[], typicalServings: number, saved: SavedRecipe[], options: RecommendationOptions = {}) {
  return recipes
    .map((recipe) => scoreRecipe(recipe, inventory, typicalServings, saved, options))
    .filter((result) => result.score >= 0 && result.availability !== 'NOT_PRACTICAL')
    .sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes);
}
