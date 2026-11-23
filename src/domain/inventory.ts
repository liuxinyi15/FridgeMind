import type { FoodBatch, FoodItem, Recipe, RecipeIngredient, Unit } from './types';

export const canonicalise = (value: string) => value.toLowerCase().trim().replace(/s$/, '');

export function availableToPlan(batch: FoodBatch): number | null {
  if (batch.physicalStock === null) return null;
  return Math.max(0, batch.physicalStock - batch.reservedStock);
}

export function totalAvailable(item: FoodItem, unit: Unit): { amount: number; uncertain: boolean } {
  const compatible = item.batches.filter((batch) => batch.unit === unit);
  const uncertain = compatible.some((batch) => batch.physicalStock === null || batch.confidence === 'needs_confirmation');
  return {
    amount: compatible.reduce((sum, batch) => sum + (availableToPlan(batch) ?? 0), 0),
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
}

export function matchRecipe(recipe: Recipe, servings: number, inventory: FoodItem[]): IngredientMatch[] {
  return scaleIngredients(recipe, servings).map((ingredient) => {
    const item = inventory.find((food) => food.canonicalName === ingredient.canonicalName);
    if (!item) return { ingredient, status: 'missing', available: 0, gap: ingredient.quantity };
    const stock = totalAvailable(item, ingredient.unit);
    const gap = Math.max(0, Math.round((ingredient.quantity - stock.amount) * 100) / 100);
    if (stock.uncertain && stock.amount < ingredient.quantity) {
      return { ingredient, inventoryItem: item, status: 'uncertain', available: stock.amount, gap };
    }
    if (stock.amount >= ingredient.quantity) {
      return { ingredient, inventoryItem: item, status: 'available', available: stock.amount, gap: 0 };
    }
    if (stock.amount > 0) {
      return { ingredient, inventoryItem: item, status: 'partial', available: stock.amount, gap };
    }
    return { ingredient, inventoryItem: item, status: stock.uncertain ? 'uncertain' : 'missing', available: 0, gap };
  });
}

export function deductIngredient(item: FoodItem, quantity: number, unit: Unit): FoodItem {
  let remaining = quantity;
  const batches = item.batches.map((batch) => {
    if (remaining <= 0 || batch.unit !== unit || batch.physicalStock === null) return batch;
    const deduction = Math.min(batch.physicalStock, remaining);
    remaining -= deduction;
    return { ...batch, physicalStock: Math.round((batch.physicalStock - deduction) * 100) / 100 };
  });
  return { ...item, batches };
}
