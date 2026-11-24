import type { AppData, FoodItem, Recipe } from '../domain/types';

export const demoInventory: FoodItem[] = [
  {
    id: 'food-spinach', name: 'Spinach', canonicalName: 'spinach', batches: [
      { id: 'batch-spinach', physicalStock: 150, reservedStock: 0, unit: 'g', relevantDate: '2026-11-24', dateType: 'use_by', storage: 'fridge', confidence: 'confirmed', quantityMode: 'exact', state: 'use_soon', note: 'Opened pack' },
    ],
  },
  {
    id: 'food-mushroom', name: 'Mushrooms', canonicalName: 'mushroom', batches: [
      { id: 'batch-mushroom', physicalStock: 120, reservedStock: 0, unit: 'g', relevantDate: '2026-11-24', dateType: 'best_before', storage: 'fridge', confidence: 'confirmed', quantityMode: 'exact', state: 'use_soon' },
    ],
  },
  {
    id: 'food-pasta', name: 'Pasta', canonicalName: 'pasta', batches: [
      { id: 'batch-pasta', physicalStock: 500, reservedStock: 0, unit: 'g', relevantDate: '2027-06-01', dateType: 'best_before', storage: 'cupboard', confidence: 'confirmed', quantityMode: 'exact', state: 'stable' },
    ],
  },
  {
    id: 'food-chicken', name: 'Chicken', canonicalName: 'chicken', batches: [
      { id: 'batch-chicken', physicalStock: 250, reservedStock: 0, unit: 'g', relevantDate: '2026-11-25', dateType: 'use_by', storage: 'fridge', confidence: 'confirmed', quantityMode: 'exact', state: 'fresh' },
    ],
  },
  {
    id: 'food-cream', name: 'Cream', canonicalName: 'cream', batches: [
      { id: 'batch-cream', physicalStock: null, reservedStock: 0, unit: 'ml', dateType: 'unknown', storage: 'fridge', confidence: 'needs_confirmation', quantityMode: 'unknown', quantityDescription: 'some left', state: 'unknown', note: 'Opened; amount not checked' },
    ],
  },
  {
    id: 'food-rice', name: 'Rice', canonicalName: 'rice', batches: [
      { id: 'batch-rice', physicalStock: 400, reservedStock: 0, unit: 'g', relevantDate: '2027-08-01', dateType: 'best_before', storage: 'cupboard', confidence: 'estimated', quantityMode: 'approximate', quantityDescription: 'about 400g', state: 'stable' },
    ],
  },
  {
    id: 'food-onion', name: 'Onion', canonicalName: 'onion', batches: [
      { id: 'batch-onion', physicalStock: 2, reservedStock: 0, unit: 'item', relevantDate: '2026-12-02', dateType: 'best_before', storage: 'cupboard', confidence: 'confirmed', quantityMode: 'exact', state: 'stable' },
    ],
  },
];

export const demoRecipes: Recipe[] = [
  {
    id: 'recipe-mushroom-pasta', name: 'Mushroom Pasta', baseServings: 2, minutes: 20, source: 'saved', tags: ['Quick', 'Comforting'],
    ingredients: [
      { id: 'mp-1', name: 'Pasta', canonicalName: 'pasta', quantity: 180, unit: 'g' },
      { id: 'mp-2', name: 'Mushrooms', canonicalName: 'mushroom', quantity: 200, unit: 'g', defaultPackageQuantity: 250 },
      { id: 'mp-3', name: 'Cream', canonicalName: 'cream', quantity: 120, unit: 'ml', defaultPackageQuantity: 300, possibleSubstitutes: ['crème fraîche', 'plant cream'] },
      { id: 'mp-4', name: 'Onion', canonicalName: 'onion', quantity: 1, unit: 'item' },
    ],
    steps: ['Slice the mushrooms and onion.', 'Cook the pasta.', 'Sauté vegetables, add cream, then combine.'],
  },
  {
    id: 'recipe-chicken-stir-fry', name: 'Chicken Stir Fry', baseServings: 2, minutes: 25, source: 'saved', tags: ['Quick', 'High protein'],
    ingredients: [
      { id: 'cs-1', name: 'Chicken', canonicalName: 'chicken', quantity: 250, unit: 'g' },
      { id: 'cs-2', name: 'Rice', canonicalName: 'rice', quantity: 140, unit: 'g' },
      { id: 'cs-3', name: 'Spinach', canonicalName: 'spinach', quantity: 100, unit: 'g' },
      { id: 'cs-4', name: 'Soy sauce', canonicalName: 'soy sauce', quantity: 2, unit: 'tbsp', defaultPackageQuantity: 12 },
    ],
    steps: ['Cook the rice.', 'Stir-fry chicken until cooked through.', 'Add spinach and sauce.'],
  },
  {
    id: 'recipe-spinach-pasta', name: 'Spinach Pasta', baseServings: 2, minutes: 18, source: 'recommended', tags: ['Very quick', 'Use soon'],
    ingredients: [
      { id: 'sp-1', name: 'Pasta', canonicalName: 'pasta', quantity: 180, unit: 'g' },
      { id: 'sp-2', name: 'Spinach', canonicalName: 'spinach', quantity: 150, unit: 'g' },
      { id: 'sp-3', name: 'Cream', canonicalName: 'cream', quantity: 100, unit: 'ml', defaultPackageQuantity: 300, possibleSubstitutes: ['crème fraîche', 'plant cream'] },
    ],
    steps: ['Cook the pasta.', 'Wilt spinach with cream.', 'Combine and season.'],
  },
  {
    id: 'recipe-rice-bowl', name: 'Quick Rice Bowl', baseServings: 1, minutes: 15, source: 'recommended', tags: ['One bowl', 'Flexible'],
    ingredients: [
      { id: 'rb-1', name: 'Rice', canonicalName: 'rice', quantity: 80, unit: 'g' },
      { id: 'rb-2', name: 'Spinach', canonicalName: 'spinach', quantity: 60, unit: 'g' },
      { id: 'rb-3', name: 'Egg', canonicalName: 'egg', quantity: 1, unit: 'item' },
    ],
    steps: ['Cook rice.', 'Wilt spinach and fry an egg.', 'Assemble in a bowl.'],
  },
  {
    id: 'recipe-vegetable-soup', name: 'Vegetable Soup', baseServings: 4, minutes: 45, source: 'saved', tags: ['Batch cook', 'Freezer friendly'],
    ingredients: [
      { id: 'vs-1', name: 'Onion', canonicalName: 'onion', quantity: 1, unit: 'item' },
      { id: 'vs-2', name: 'Carrot', canonicalName: 'carrot', quantity: 3, unit: 'item' },
      { id: 'vs-3', name: 'Stock', canonicalName: 'stock', quantity: 800, unit: 'ml' },
      { id: 'vs-4', name: 'Spinach', canonicalName: 'spinach', quantity: 100, unit: 'g' },
    ],
    steps: ['Chop vegetables.', 'Simmer in stock for 35 minutes.', 'Stir in spinach.'],
  },
];

export function createSeedData(): AppData {
  return {
    schemaVersion: 3,
    profile: {
      id: 'alex', name: 'Alex', onboardingComplete: false,
      routine: { cookingFrequency: '3-4', shoppingFrequency: '1-2', typicalServings: 2, weekdayLunchAtHome: false },
      notifications: { proactiveEnabled: true, mode: 'actionable', quietHoursEnabled: true, quietStart: '22:00', quietEnd: '08:00', useSoon: true, shopping: true, habitSuggestions: true },
    },
    inventory: structuredClone(demoInventory),
    inventoryEvents: [],
    recipes: structuredClone(demoRecipes),
    savedRecipes: [
      { recipeId: 'recipe-mushroom-pasta', savedAt: '2026-11-12T18:00:00Z', preference: 1 },
      { recipeId: 'recipe-chicken-stir-fry', savedAt: '2026-11-15T18:00:00Z', preference: 0.8 },
      { recipeId: 'recipe-vegetable-soup', savedAt: '2026-11-18T18:00:00Z', preference: 0.7 },
    ],
    mealPlans: [], shopping: [],
    habits: [{ id: 'habit-weekday-lunch', label: 'Weekday lunch away from home', evidence: 'In this demo, no weekday lunches were planned at home across the last two weeks.', proposedChange: 'Reduce weekday-lunch shopping suggestions. Nothing changes until you confirm.', status: 'pending' }],
    interventions: [{ id: 'intervention-spinach', foodId: 'food-spinach', title: 'Spinach could use a plan', message: 'Use 150g soon, or freeze it if your plans changed.', decision: 'notify', explanation: ['The use-by date is tomorrow.', 'Two quick recipes can use it.', 'Actionable reminders are enabled.'], createdAt: '2026-11-23T12:00:00Z' }],
    interventionFeedback: [], activity: [],
    mealContexts: [],
    recommendationFeedback: [],
    approvedRoutines: [],
    substitutions: {},
    awayMode: { active: false },
    usabilitySessions: [],
    researchScenario: 'A',
  };
}
