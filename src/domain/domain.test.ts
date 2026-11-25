import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import { deductIngredient, matchRecipe, recipeAvailability, scaleIngredients } from './inventory';
import { rankRecipes, scoreRecipe } from './recommendationEngine';
import { decideIntervention } from './interventionEngine';
import { respondToHabit } from './habit';

describe('serving scaling and inventory matching', () => {
  const data = createSeedData();
  const recipe = data.recipes.find((item) => item.id === 'recipe-mushroom-pasta')!;

  it('scales all quantities from two to one serving', () => {
    expect(scaleIngredients(recipe, 1).map((item) => item.quantity)).toEqual([90, 100, 60, 0.5]);
  });

  it('separates available, partial and uncertain stock and calculates gaps', () => {
    const matches = matchRecipe(recipe, 2, data.inventory);
    expect(matches.find((item) => item.ingredient.name === 'Pasta')?.status).toBe('available');
    expect(matches.find((item) => item.ingredient.name === 'Mushrooms')).toMatchObject({ status: 'partial', gap: 80 });
    expect(matches.find((item) => item.ingredient.name === 'Cream')?.status).toBe('uncertain');
  });

  it('recalculates the shopping gap when servings change', () => {
    const one = matchRecipe(recipe, 1, data.inventory).find((item) => item.ingredient.name === 'Mushrooms');
    const three = matchRecipe(recipe, 3, data.inventory).find((item) => item.ingredient.name === 'Mushrooms');
    expect(one?.status).toBe('available');
    expect(three?.gap).toBe(180);
  });
});

describe('recommendation scoring', () => {
  it('rewards actionable use-soon coverage and gives plain-language reasons', () => {
    const data = createSeedData();
    const spinachPasta = data.recipes.find((item) => item.id === 'recipe-spinach-pasta')!;
    const score = scoreRecipe(spinachPasta, data.inventory, 2, data.savedRecipes);
    expect(score.useSoonCoverage).toBeGreaterThan(0);
    expect(score.reasons.join(' ')).toContain('needs attention');
    expect(score.score).toBeGreaterThan(0.4);
  });

  it('stores real availability semantics and handles decision-point uncertainty', () => {
    const data = createSeedData();
    const recipe = data.recipes.find((item) => item.id === 'recipe-spinach-pasta')!;
    const uncertain = matchRecipe(recipe, 2, data.inventory);
    expect(recipeAvailability(uncertain, recipe.minutes)).toBe('READY_WITH_UNCERTAINTY');
    const cream = data.inventory.find((item) => item.canonicalName === 'cream')!;
    cream.batches[0].minimumStockConfirmed = 100;
    expect(recipeAvailability(matchRecipe(recipe, 2, data.inventory), recipe.minutes)).toBe('READY');
    expect(cream.batches[0].physicalStock).toBeNull();
  });

  it('keeps temporary and persistent feedback distinct', () => {
    const data = createSeedData();
    const now = new Date('2026-11-24T18:00:00Z');
    const recipeId = 'recipe-spinach-pasta';
    const temporary = [{ id: 'f1', recipeId, action: 'not_in_mood' as const, createdAt: now.toISOString(), active: true }];
    expect(rankRecipes(data.recipes, data.inventory, 2, data.savedRecipes, { feedback: temporary, now }).some((entry) => entry.recipe.id === recipeId)).toBe(false);
    expect(rankRecipes(data.recipes, data.inventory, 2, data.savedRecipes, { feedback: temporary, now: new Date('2026-11-25T18:00:00Z') }).some((entry) => entry.recipe.id === recipeId)).toBe(true);
    const persistent = [{ ...temporary[0], action: 'never_recommend' as const }];
    expect(rankRecipes(data.recipes, data.inventory, 2, data.savedRecipes, { feedback: persistent, now: new Date('2027-01-01T18:00:00Z') }).some((entry) => entry.recipe.id === recipeId)).toBe(false);
  });

  it('never creates negative inventory while preserving approximate mode', () => {
    const data = createSeedData();
    const rice = data.inventory.find((item) => item.canonicalName === 'rice')!;
    const updated = deductIngredient(rice, 999, 'g');
    expect(updated.batches[0].physicalStock).toBe(0);
    expect(updated.batches[0].quantityMode).toBe('approximate');
  });
});

describe('intervention suppression', () => {
  const preferences = createSeedData().profile.notifications;
  it('stays silent after a recent dismissal', () => {
    expect(decideIntervention({ foodUrgency: 'high', inventoryConfidence: 'confirmed', preferences, isQuietHours: false, recentDismissals: 1, actionability: 'high', recipeAvailable: true }).decision).toBe('stay_silent');
  });
  it('keeps information in-app during quiet hours', () => {
    expect(decideIntervention({ foodUrgency: 'high', inventoryConfidence: 'confirmed', preferences, isQuietHours: true, recentDismissals: 0, actionability: 'high', recipeAvailable: true }).decision).toBe('show_in_app');
  });
  it('asks before acting on uncertain inventory', () => {
    expect(decideIntervention({ foodUrgency: 'medium', inventoryConfidence: 'needs_confirmation', preferences, isQuietHours: false, recentDismissals: 0, actionability: 'high', recipeAvailable: true }).decision).toBe('ask_for_confirmation');
  });
});

describe('habit confirmation', () => {
  it('does not confirm unless the user chooses confirm', () => {
    const habit = createSeedData().habits[0];
    expect(respondToHabit(habit, 'not_now').status).toBe('not_now');
    expect(respondToHabit(habit, 'confirm').status).toBe('confirmed');
  });
});
