import type { FoodBatch, FoodItem, Recipe, RecipeAvailability, RecipeIngredient, Unit } from './types';

export const canonicalise = (value: string) => value.toLowerCase().trim().replace(/s$/, '');

export function availableToPlan(batch: FoodBatch): number | null {
  if (batch.physicalStock === null) return null;
  return Math.max(0, batch.physicalStock - batch.reservedStock);
}

export function totalAvailable(item: FoodItem, unit: Unit): { amount: number; uncertain: boolean } {
  const compatible = item.batches.filter((batch) => batch.unit === unit);
  const uncertain = compatible.some((batch) => batch.physicalStock === null || batch.confidence === 'needs_confirmation');
  return {
    amount: compatible.reduce((sum, batch) => sum + Math.max(availableToPlan(batch) ?? 0, batch.minimumStockConfirmed ?? 0), 0),
    uncertain,
  };
}

export function scaleIngredients(recipe: Recipe, servings: number): RecipeIngredient[] {
  const factor = servings / recipe.baseServings;
  return recipe.ingredients.map((ingredient) => ({
    ...ingredient,
    quantity: Math.round(ingredient.quantity * factor * 100) / 100,
  }));
}

export type MatchStatus = 'available' | 'partial' | 'uncertain' | 'missing';

export interface IngredientMatch {
  ingredient: RecipeIngredient;
  status: MatchStatus;
  available: number;
  gap: number;
  inventoryItem?: FoodItem;
  substitutionUsed?: string;
}

export function matchRecipe(recipe: Recipe, servings: number, inventory: FoodItem[], substitutions: Record<string, string> = {}): IngredientMatch[] {
  return scaleIngredients(recipe, servings).map((ingredient) => {
    const substitution = substitutions[`${recipe.id}:${ingredient.id}`];
    const item = inventory.find((food) => food.canonicalName === (substitution ?? ingredient.canonicalName));
    if (!item) return { ingredient, status: 'missing', available: 0, gap: ingredient.quantity };
    if (item.batches.some((batch) => batch.unit === ingredient.unit && (batch.insufficientFor ?? 0) >= ingredient.quantity)) {
      return { ingredient, inventoryItem: item, status: 'missing', available: 0, gap: ingredient.quantity, substitutionUsed: substitution };
    }
    const stock = totalAvailable(item, ingredient.unit);
    const gap = Math.max(0, Math.round((ingredient.quantity - stock.amount) * 100) / 100);
    if (stock.uncertain && stock.amount < ingredient.quantity) {
      return { ingredient, inventoryItem: item, status: 'uncertain', available: stock.amount, gap, substitutionUsed: substitution };
    }
    if (stock.amount >= ingredient.quantity) {
      return { ingredient, inventoryItem: item, status: 'available', available: stock.amount, gap: 0, substitutionUsed: substitution };
    }
    if (stock.amount > 0) {
      return { ingredient, inventoryItem: item, status: 'partial', available: stock.amount, gap, substitutionUsed: substitution };
    }
    return { ingredient, inventoryItem: item, status: stock.uncertain ? 'uncertain' : 'missing', available: 0, gap, substitutionUsed: substitution };
  });
}

export function recipeAvailability(matches: IngredientMatch[], minutes: number): RecipeAvailability {
  const missing = matches.filter((match) => match.status === 'missing' || match.status === 'partial').length;
  const uncertain = matches.filter((match) => match.status === 'uncertain').length;
  if (missing >= 3 || (missing >= 2 && minutes > 45)) return 'NOT_PRACTICAL';
  if (missing) return 'MISSING_ITEMS';
  if (uncertain) return 'READY_WITH_UNCERTAINTY';
  return 'READY';
}

export function deductIngredient(item: FoodItem, quantity: number, unit: Unit): FoodItem {
  let remaining = quantity;
  const batches = item.batches.map((batch) => {
    if (remaining <= 0 || batch.unit !== unit || batch.physicalStock === null) {
      if (batch.unit === unit && batch.physicalStock === null && batch.minimumStockConfirmed) return { ...batch, minimumStockConfirmed: undefined };
      return batch;
    }
    const deduction = Math.min(batch.physicalStock, remaining);
    remaining -= deduction;
    return { ...batch, physicalStock: Math.max(0, Math.round((batch.physicalStock - deduction) * 100) / 100) };
  });
  return { ...item, batches };
}
