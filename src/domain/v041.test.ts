import { describe, expect, it } from 'vitest';
import { parsePackageText, parseQuickAddText, parseReceiptCandidates, parseRecipeText } from './parser';

describe('V0.4.1 Quick Add', () => {
  it('parses comma, semicolon and newline separated food names', () => {
    expect(parseQuickAddText('spinach, mushrooms; chicken\npasta').map((item) => item.name)).toEqual(['Spinach', 'Mushrooms', 'Chicken', 'Pasta']);
  });

  it('keeps unknown amounts while accepting lightweight quantity shorthand', () => {
    const items = parseQuickAddText('spinach 200g\n2 onions\npasta 500g\nmilk 1L\navocado');
    expect(items).toMatchObject([
      { name: 'Spinach', quantity: 200, unit: 'g', quantityMode: 'exact' },
      { name: 'Onions', quantity: 2, unit: 'item', quantityMode: 'exact' },
      { name: 'Pasta', quantity: 500, unit: 'g', storage: 'cupboard' },
      { name: 'Milk', quantity: 1000, unit: 'ml' },
      { name: 'Avocado', quantity: null, quantityMode: 'unknown' },
    ]);
  });

  it('deduplicates equivalent entries without rejecting the batch', () => {
    expect(parseQuickAddText('spinach, spinach, pasta')).toHaveLength(2);
  });
});

describe('V0.4.1 OCR parser handoff', () => {
  it('passes OCR recipe text through the existing structured parser', () => {
    const recipe = parseRecipeText('Spinach pasta\nServes 2\n20 minutes\nIngredients\n180g pasta\n150g spinach\nMethod\n1. Cook and combine.');
    expect(recipe.name).toBe('Spinach pasta');
    expect(recipe.ingredients.map((item) => item.canonicalName)).toEqual(['pasta', 'spinach']);
    expect(recipe.originalText).toContain('150g spinach');
  });

  it('extracts explicit receipt weights but leaves missing amounts unknown', () => {
    expect(parseReceiptCandidates('TESCO\nMUSHROOMS 250G\nBABY SPINACH\nPENNE PASTA 500G')).toMatchObject([
      { name: 'Mushrooms', quantity: 250, unit: 'g' },
      { name: 'Spinach', quantity: null, quantityMode: 'unknown' },
      { name: 'Pasta', quantity: 500, storage: 'cupboard' },
    ]);
  });

  it('extracts a package name and printed weight', () => {
    expect(parsePackageText('TESCO BABY SPINACH 200G')).toMatchObject({ name: 'Spinach', quantity: 200, unit: 'g', storage: 'fridge' });
  });

  it('returns no package proposal for empty OCR output', () => {
    expect(parsePackageText('')).toBeNull();
  });
});
