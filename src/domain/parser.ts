import { canonicalise } from './inventory';
import type { Recipe, RecipeIngredient, Unit } from './types';

const knownUnits: Record<string, Unit> = {
  g: 'g', gram: 'g', grams: 'g', ml: 'ml', item: 'item', items: 'item', tbsp: 'tbsp', tsp: 'tsp', cup: 'cup', cups: 'cup',
};

export function parseRecipeText(text: string): Recipe {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const name = lines[0]?.replace(/^#\s*/, '') || 'Imported recipe';
  const servingLine = lines.find((line) => /\bservings?\b/i.test(line));
  const baseServings = Number(servingLine?.match(/\d+/)?.[0]) || 2;
  const minuteLine = lines.find((line) => /\b(min|mins|minutes)\b/i.test(line));
  const minutes = Number(minuteLine?.match(/\d+/)?.[0]) || 30;
  const metadata = new Set([name, servingLine, minuteLine].filter(Boolean));
  const ingredientLines = lines.filter((line) => !metadata.has(line) && !/^(ingredients?|instructions?|method|steps?)\s*:?$/i.test(line) && !/^\d+[.)]\s+/.test(line));
  const ingredients: RecipeIngredient[] = ingredientLines.map((line, index) => {
    const match = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
    const compact = line.match(/^(\d+(?:\.\d+)?)(g|ml)\s+(.+)$/i);
    const noUnit = line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    const quantity = Number((compact ?? match ?? noUnit)?.[1]) || 1;
    const unitToken = (compact ?? match)?.[2]?.toLowerCase();
    const unit = unitToken ? knownUnits[unitToken] ?? 'item' : 'item';
    const ingredientName = ((compact ?? match)?.[3] ?? noUnit?.[2] ?? line).replace(/^of\s+/i, '');
    return { id: `imported-ingredient-${index}`, name: ingredientName, canonicalName: canonicalise(ingredientName), quantity, unit };
  }).filter((ingredient) => ingredient.name.length > 1);
  return {
    id: `imported-${Date.now()}`,
    name,
    baseServings,
    ingredients,
    minutes,
    steps: ['Review the imported recipe instructions before cooking.'],
    tags: ['Imported', 'Needs review'],
    source: 'imported',
    ownership: 'personal',
    originalText: text,
    createdAt: new Date().toISOString(),
  };
}
