import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import { migrateAppData } from '../data/repositories';
import { matchRecipe } from './inventory';
import { parseRecipeText } from './parser';
import { rankRecipes } from './recommendationEngine';

describe('V0.3 personal food and recipe model', () => {
  it('parses flexible compact recipe text and preserves the source text', () => {
    const text = `Chicken stir fry\n250g chicken\n1 onion\nspinach\n2 tbsp soy sauce\n25 minutes\n2 servings`;
    const recipe = parseRecipeText(text);
    expect(recipe.name).toBe('Chicken stir fry');
    expect(recipe.baseServings).toBe(2);
    expect(recipe.minutes).toBe(25);
    expect(recipe.ingredients.map((item) => item.canonicalName)).toEqual(expect.arrayContaining(['chicken', 'onion', 'spinach', 'soy sauce']));
    expect(recipe.originalText).toBe(text);
    expect(recipe.ownership).toBe('personal');
  });

  it('keeps imported recipes in the existing availability and ranking engines', () => {
    const data = createSeedData();
    const imported = parseRecipeText(`Spinach rice\n80g rice\n60g spinach\n15 minutes\n1 serving`);
    const matches = matchRecipe(imported, 1, data.inventory);
    expect(matches.every((item) => item.status === 'available')).toBe(true);
    const ranked = rankRecipes([...data.recipes, imported], data.inventory, 1, data.savedRecipes);
    expect(ranked.some((entry) => entry.recipe.id === imported.id)).toBe(true);
    expect(ranked.find((entry) => entry.recipe.id === imported.id)?.useSoonCoverage).toBeGreaterThan(0);
  });

  it('ships a varied curated library without making seeded recipes special to ranking', () => {
    const data = createSeedData();
    expect(data.recipes.length).toBeGreaterThanOrEqual(12);
    expect(data.recipes.some((recipe) => recipe.minutes <= 15)).toBe(true);
    expect(data.recipes.some((recipe) => recipe.tags.includes('Freezer friendly'))).toBe(true);
    expect(data.recipes.every((recipe) => recipe.ownership === 'built_in')).toBe(true);
  });

  it('migrates V0.2 food and recipes with safe provenance defaults', () => {
    const legacy = createSeedData();
    const batch = legacy.inventory[0].batches[0];
    delete batch.source;
    const recipe = legacy.recipes[0];
    delete recipe.ownership;
    const migrated = migrateAppData({ ...legacy, schemaVersion: 3 as never });
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.inventory[0].batches[0].source).toBe('manual');
    expect(migrated.recipes[0].ownership).toBe('built_in');
  });
});
