import { describe, expect, it } from 'vitest';
import { createConsumerData, createSeedData } from '../data/seed';
import { parseReceiptText, parseRecipeText } from './parser';
import { rankRecipes } from './recommendationEngine';

describe('V0.4 honest consumer state', () => {
  it('starts a real user with no invented fridge, history or saved recipes', () => {
    const data = createConsumerData();
    expect(data.experienceMode).toBe('consumer');
    expect(data.inventory).toEqual([]);
    expect(data.savedRecipes).toEqual([]);
    expect(data.activity).toEqual([]);
    expect(data.recipes.every((recipe) => recipe.ownership === 'built_in')).toBe(true);
  });

  it('keeps deterministic inventory explicitly in demo state', () => {
    const data = createSeedData();
    expect(data.experienceMode).toBe('demo');
    expect(data.inventory.length).toBeGreaterThan(0);
    expect(data.inventory.every((item) => item.batches.every((batch) => batch.source === 'seeded'))).toBe(true);
  });

  it('parses a realistic copied recipe into editable fields and keeps the source', () => {
    const text = `Creamy mushroom pasta

Serves 2
Ready in 25 minutes

Ingredients
180 g spaghetti
200g mushrooms
1 small onion
120 ml double cream
2 cloves garlic
Salt and pepper

Method
1. Cook the pasta.
2. Fry mushrooms and onion.
3. Add cream.
4. Combine and serve.`;
    const recipe = parseRecipeText(text);
    expect(recipe.name).toBe('Creamy mushroom pasta');
    expect(recipe.baseServings).toBe(2);
    expect(recipe.minutes).toBe(25);
    expect(recipe.ingredients.map((item) => [item.name, item.quantity, item.unit])).toEqual([
      ['spaghetti', 180, 'g'], ['mushrooms', 200, 'g'], ['onion', 1, 'item'], ['double cream', 120, 'ml'], ['garlic', 2, 'item'], ['Salt and pepper', 1, 'item'],
    ]);
    expect(recipe.steps).toEqual(['Cook the pasta.', 'Fry mushrooms and onion.', 'Add cream.', 'Combine and serve.']);
    expect(recipe.originalText).toBe(text);
  });

  it('extracts conservative receipt names without quantities or dates', () => {
    expect(parseReceiptText('TESCO\nMUSHROOMS 250G\nBABY SPINACH\nCHICKEN BREAST\nPENNE PASTA\nTOTAL £9.40')).toEqual(['Mushrooms', 'Spinach', 'Chicken', 'Pasta']);
  });

  it('lets a matching personal recipe outrank an equivalent built-in idea', () => {
    const data = createSeedData();
    const builtIn = data.recipes.find((recipe) => recipe.id === 'recipe-spinach-pasta')!;
    const personal = { ...builtIn, id: 'my-spinach-pasta', name: 'My spinach pasta', ownership: 'personal' as const, source: 'imported' as const };
    const ranked = rankRecipes([builtIn, personal], data.inventory, 2, data.savedRecipes);
    expect(ranked[0].recipe.id).toBe(personal.id);
  });
});
