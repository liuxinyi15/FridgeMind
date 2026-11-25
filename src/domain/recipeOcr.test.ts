import { describe, expect, it } from 'vitest';
import { parseRecipeText } from './parser';
import { cleanOcrRecipeText, scoreRecipeDocument } from './recipeOcr';

describe('recipe OCR cleanup and quality gate', () => {
  it('discards isolated OCR artefacts and scores garbage as poor', () => {
    const raw = 'ANC AK\n:\\\nRE CIPI\n+ ec\n---\n|';
    const cleaned = cleanOcrRecipeText(raw);
    expect(cleaned.discardedLines).toEqual(expect.arrayContaining([':\\', 'RE CIPI', '+ ec', '---', '|']));
    const score = scoreRecipeDocument(raw, 18);
    expect(score.quality).toBe('poor');
    expect(parseRecipeText(raw).ingredients).toEqual([]);
    expect(parseRecipeText(raw).name).toBe('Imported recipe');
  });

  it('recognises structured recipe evidence without depending on a food dictionary', () => {
    const text = `Vanilla breakfast cakes
Serves 4
Ingredients:
1 cup milk
1 egg
2 tablespoons butter, melted
1 teaspoon vanilla extract
Instructions:
1. Whisk the flour and sugar.
2. Add milk and egg.
3. Cook until golden.`;
    const score = scoreRecipeDocument(text, 91);
    expect(score.quality).toBe('good');
    expect(score.ingredientLineCount).toBe(4);
  });
});

describe('hardened recipe parser', () => {
  it('normalises recipe units and keeps instructions out of ingredients', () => {
    const recipe = parseRecipeText(`Vanilla breakfast cakes
Serves 4
Ingredients
1 cup milk
1 egg
2 tablespoons butter, melted
1 teaspoon vanilla extract
Method
1. Whisk the flour and sugar.
2. Add milk and egg.
3. Cook until golden.`);
    expect(recipe.name).toBe('Vanilla breakfast cakes');
    expect(recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit }))).toEqual([
      { name: 'milk', quantity: 1, unit: 'cup' },
      { name: 'egg', quantity: 1, unit: 'item' },
      { name: 'butter', quantity: 2, unit: 'tbsp' },
      { name: 'vanilla extract', quantity: 1, unit: 'tsp' },
    ]);
    expect(recipe.steps).toEqual(['Whisk the flour and sugar.', 'Add milk and egg.', 'Cook until golden.']);
  });

  it('supports mixed and Unicode fractions without rounding them to integers', () => {
    const recipe = parseRecipeText(`Soft flatbreads
Ingredients
1 1/2 cups flour
½ cup yoghurt
¼ teaspoon salt
Directions
1. Mix and cook.`);
    expect(recipe.ingredients.map(({ quantity, unit }) => ({ quantity, unit }))).toEqual([
      { quantity: 1.5, unit: 'cup' },
      { quantity: .5, unit: 'cup' },
      { quantity: .25, unit: 'tsp' },
    ]);
  });
});
