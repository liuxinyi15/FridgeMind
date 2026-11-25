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
  {
    id: 'recipe-mushroom-omelette', name: 'Mushroom Omelette', baseServings: 1, minutes: 12, source: 'recommended', tags: ['Very quick', 'Low ingredient'],
    ingredients: [{ id: 'mo-1', name: 'Mushrooms', canonicalName: 'mushroom', quantity: 80, unit: 'g' }, { id: 'mo-2', name: 'Eggs', canonicalName: 'egg', quantity: 2, unit: 'item' }],
    steps: ['Cook sliced mushrooms.', 'Add beaten eggs and fold when set.'],
  },
  {
    id: 'recipe-eggs-on-toast', name: 'Eggs on Toast', baseServings: 1, minutes: 10, source: 'recommended', tags: ['10 minutes', 'Low ingredient'],
    ingredients: [{ id: 'et-1', name: 'Eggs', canonicalName: 'egg', quantity: 2, unit: 'item' }, { id: 'et-2', name: 'Bread slices', canonicalName: 'bread slice', quantity: 2, unit: 'item' }],
    steps: ['Toast the bread.', 'Cook the eggs your preferred way and serve.'],
  },
  {
    id: 'recipe-spinach-fried-rice', name: 'Spinach Fried Rice', baseServings: 2, minutes: 18, source: 'recommended', tags: ['Quick', 'One pan'],
    ingredients: [{ id: 'fr-1', name: 'Rice', canonicalName: 'rice', quantity: 160, unit: 'g' }, { id: 'fr-2', name: 'Spinach', canonicalName: 'spinach', quantity: 100, unit: 'g' }, { id: 'fr-3', name: 'Eggs', canonicalName: 'egg', quantity: 2, unit: 'item' }, { id: 'fr-4', name: 'Soy sauce', canonicalName: 'soy sauce', quantity: 2, unit: 'tbsp' }],
    steps: ['Cook or reheat the rice.', 'Stir-fry with spinach and egg.', 'Season with soy sauce.'],
  },
  {
    id: 'recipe-one-pan-chicken-rice', name: 'One-pan Chicken Rice', baseServings: 2, minutes: 30, source: 'recommended', tags: ['One pan', 'Leftovers friendly'],
    ingredients: [{ id: 'cr-1', name: 'Chicken', canonicalName: 'chicken', quantity: 250, unit: 'g' }, { id: 'cr-2', name: 'Rice', canonicalName: 'rice', quantity: 160, unit: 'g' }, { id: 'cr-3', name: 'Onion', canonicalName: 'onion', quantity: 1, unit: 'item' }, { id: 'cr-4', name: 'Stock', canonicalName: 'stock', quantity: 400, unit: 'ml' }],
    steps: ['Brown the chicken and onion.', 'Add rice and stock.', 'Cover and cook until the rice and chicken are done.'],
  },
  {
    id: 'recipe-tomato-pasta', name: 'Simple Tomato Pasta', baseServings: 2, minutes: 20, source: 'recommended', tags: ['Quick', 'Vegetarian'],
    ingredients: [{ id: 'tp-1', name: 'Pasta', canonicalName: 'pasta', quantity: 180, unit: 'g' }, { id: 'tp-2', name: 'Tomatoes', canonicalName: 'tomato', quantity: 4, unit: 'item' }, { id: 'tp-3', name: 'Onion', canonicalName: 'onion', quantity: 1, unit: 'item' }],
    steps: ['Cook the pasta.', 'Soften onion and tomatoes.', 'Combine and season.'],
  },
  {
    id: 'recipe-chicken-spinach-pasta', name: 'Chicken Spinach Pasta', baseServings: 2, minutes: 25, source: 'recommended', tags: ['Use soon', 'Leftovers friendly'],
    ingredients: [{ id: 'cp-1', name: 'Chicken', canonicalName: 'chicken', quantity: 250, unit: 'g' }, { id: 'cp-2', name: 'Pasta', canonicalName: 'pasta', quantity: 180, unit: 'g' }, { id: 'cp-3', name: 'Spinach', canonicalName: 'spinach', quantity: 120, unit: 'g' }, { id: 'cp-4', name: 'Cream', canonicalName: 'cream', quantity: 100, unit: 'ml' }],
    steps: ['Cook the pasta.', 'Cook chicken thoroughly.', 'Wilt spinach with cream and combine.'],
  },
  {
    id: 'recipe-lentil-curry', name: 'Easy Lentil Curry', baseServings: 4, minutes: 35, source: 'recommended', tags: ['Freezer friendly', 'Vegetarian'],
    ingredients: [{ id: 'lc-1', name: 'Lentils', canonicalName: 'lentil', quantity: 240, unit: 'g' }, { id: 'lc-2', name: 'Onion', canonicalName: 'onion', quantity: 1, unit: 'item' }, { id: 'lc-3', name: 'Tomatoes', canonicalName: 'tomato', quantity: 4, unit: 'item' }, { id: 'lc-4', name: 'Rice', canonicalName: 'rice', quantity: 240, unit: 'g' }],
    steps: ['Soften the onion.', 'Simmer lentils and tomatoes with curry seasoning.', 'Serve with rice.'],
  },
  {
    id: 'recipe-mushroom-rice', name: 'Mushroom Rice Bowl', baseServings: 1, minutes: 15, source: 'recommended', tags: ['15 minutes', 'One bowl'],
    ingredients: [{ id: 'mr-1', name: 'Rice', canonicalName: 'rice', quantity: 80, unit: 'g' }, { id: 'mr-2', name: 'Mushrooms', canonicalName: 'mushroom', quantity: 120, unit: 'g' }, { id: 'mr-3', name: 'Soy sauce', canonicalName: 'soy sauce', quantity: 1, unit: 'tbsp' }],
    steps: ['Cook the rice.', 'Brown the mushrooms.', 'Serve together with soy sauce.'],
  },
  {
    id: 'recipe-loaded-potato', name: 'Loaded Baked Potato', baseServings: 1, minutes: 50, source: 'recommended', tags: ['One person', 'Oven'],
    ingredients: [{ id: 'bp-1', name: 'Potato', canonicalName: 'potato', quantity: 1, unit: 'item' }, { id: 'bp-2', name: 'Cheese', canonicalName: 'cheese', quantity: 40, unit: 'g' }, { id: 'bp-3', name: 'Spinach', canonicalName: 'spinach', quantity: 60, unit: 'g' }],
    steps: ['Bake the potato until tender.', 'Wilt the spinach.', 'Split, fill and top with cheese.'],
  },
  {
    id: 'recipe-chickpea-salad', name: 'Chickpea Crunch Salad', baseServings: 2, minutes: 12, source: 'recommended', tags: ['No cook', 'Lunch', 'Leftovers friendly'],
    ingredients: [{ id: 'cc-1', name: 'Chickpeas', canonicalName: 'chickpea', quantity: 240, unit: 'g' }, { id: 'cc-2', name: 'Tomatoes', canonicalName: 'tomato', quantity: 2, unit: 'item' }, { id: 'cc-3', name: 'Spinach', canonicalName: 'spinach', quantity: 80, unit: 'g' }],
    steps: ['Drain the chickpeas.', 'Chop the tomatoes.', 'Toss everything with your usual dressing.'],
  },
  {
    id: 'recipe-tomato-eggs', name: 'Tomato Eggs on Toast', baseServings: 1, minutes: 18, source: 'recommended', tags: ['One person', 'Stovetop'],
    ingredients: [{ id: 'te-1', name: 'Eggs', canonicalName: 'egg', quantity: 2, unit: 'item' }, { id: 'te-2', name: 'Tomatoes', canonicalName: 'tomato', quantity: 2, unit: 'item' }, { id: 'te-3', name: 'Bread slices', canonicalName: 'bread slice', quantity: 2, unit: 'item' }],
    steps: ['Soften the tomatoes in a pan.', 'Add beaten eggs and stir gently.', 'Serve on toast.'],
  },
  {
    id: 'recipe-chicken-traybake', name: 'Chicken and Vegetable Traybake', baseServings: 2, minutes: 40, source: 'recommended', tags: ['Oven', 'Makes leftovers'],
    ingredients: [{ id: 'ct-1', name: 'Chicken', canonicalName: 'chicken', quantity: 250, unit: 'g' }, { id: 'ct-2', name: 'Potatoes', canonicalName: 'potato', quantity: 400, unit: 'g' }, { id: 'ct-3', name: 'Onion', canonicalName: 'onion', quantity: 1, unit: 'item' }, { id: 'ct-4', name: 'Carrots', canonicalName: 'carrot', quantity: 2, unit: 'item' }],
    steps: ['Chop the vegetables.', 'Roast with the chicken until everything is cooked through.', 'Save the second portion for later.'],
  },
];

export function createSeedData(): AppData {
  return {
    schemaVersion: 5,
    experienceMode: 'demo',
    profile: {
      id: 'alex', name: 'Alex', onboardingComplete: false,
      routine: { cookingFrequency: '3-4', shoppingFrequency: '1-2', typicalServings: 2, weekdayLunchAtHome: false },
      notifications: { proactiveEnabled: true, mode: 'actionable', quietHoursEnabled: true, quietStart: '22:00', quietEnd: '08:00', useSoon: true, shopping: true, habitSuggestions: true },
    },
    inventory: structuredClone(demoInventory).map((item) => ({ ...item, batches: item.batches.map((batch) => ({ ...batch, source: 'seeded' as const })) })),
    inventoryEvents: [],
    recipes: structuredClone(demoRecipes).map((recipe) => ({ ...recipe, ownership: 'built_in' as const })),
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

/** A real first run: useful built-in ideas, but no invented food, history or preferences. */
export function createConsumerData(): AppData {
  const data = createSeedData();
  return {
    ...data,
    experienceMode: 'consumer',
    profile: {
      ...data.profile,
      id: 'local-user',
      name: 'You',
      onboardingComplete: false,
      notifications: { ...data.profile.notifications, proactiveEnabled: false, mode: 'in_app' },
    },
    inventory: [],
    inventoryEvents: [],
    savedRecipes: [],
    mealPlans: [],
    shopping: [],
    habits: [],
    interventions: [],
    interventionFeedback: [],
    activity: [],
    mealContexts: [],
    cookingSession: undefined,
    recommendationFeedback: [],
    approvedRoutines: [],
    substitutions: {},
    awayMode: { active: false },
    usabilitySessions: [],
    currentUsabilitySessionId: undefined,
    participantStudySessionId: undefined,
    researchNow: undefined,
    researchScenario: 'A',
  };
}
