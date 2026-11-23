import { canonicalise } from './inventory';
import type { Recipe, RecipeIngredient, Unit } from './types';

const knownUnits: Record<string, Unit> = {
  g: 'g', gram: 'g', grams: 'g', ml: 'ml', item: 'item', items: 'item', tbsp: 'tbsp', tsp: 'tsp', cup: 'cup', cups: 'cup',
};

export function parseRecipeText(text: string): Recipe {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const name = lines[0]?.replace(/^#\s*/, '') || 'Imported recipe';
  const servingLine = lines.find((line) => /^servings?\s*:/i.test(line));
  const baseServings = Number(servingLine?.split(':')[1]?.trim()) || 2;
  const ingredientLines = lines.filter((line) => /^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s+/.test(line));
  const ingredients: RecipeIngredient[] = ingredientLines.map((line, index) => {
    const match = line.match(/^(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s+(.+)$/)!;
    const quantity = Number(match[1]);
    const unit = knownUnits[match[2].toLowerCase()] ?? 'item';
    const ingredientName = match[3].replace(/^of\s+/i, '');
    return { id: `imported-ingredient-${index}`, name: ingredientName, canonicalName: canonicalise(ingredientName), quantity, unit };
  });
  return {
    id: `imported-${Date.now()}`,
    name,
    baseServings,
    ingredients,
    minutes: 30,
    steps: ['Review the imported recipe instructions before cooking.'],
    tags: ['Imported', 'Needs review'],
    source: 'imported',
  };
}
