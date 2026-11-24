export type InventoryConfidence = 'confirmed' | 'estimated' | 'needs_confirmation';
export type DateType = 'use_by' | 'best_before' | 'unknown';
export type FoodState = 'fresh' | 'use_soon' | 'stable' | 'frozen' | 'unknown';
export type StorageLocation = 'fridge' | 'freezer' | 'cupboard';
export type Unit = 'g' | 'ml' | 'item' | 'tbsp' | 'tsp' | 'cup';

export interface CookingRoutine {
  cookingFrequency: '0' | '1-2' | '3-4' | '5-7' | '8+';
  shoppingFrequency: '0' | '1-2' | '3-4' | '5-7' | '8+';
  typicalServings: 1 | 2 | 3 | 4;
  weekdayLunchAtHome: boolean;
}

export type ReminderMode = 'actionable' | 'simple' | 'in_app' | 'off';

export interface NotificationPreference {
  proactiveEnabled: boolean;
  mode: ReminderMode;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  useSoon: boolean;
  shopping: boolean;
  habitSuggestions: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  onboardingComplete: boolean;
  routine: CookingRoutine;
  notifications: NotificationPreference;
}

export interface FoodBatch {
  id: string;
  physicalStock: number | null;
  reservedStock: number;
  unit: Unit;
  relevantDate?: string;
  dateType: DateType;
  storage: StorageLocation;
  confidence: InventoryConfidence;
  state: FoodState;
  note?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  canonicalName: string;
  batches: FoodBatch[];
}

export interface InventoryEvent {
  id: string;
  foodId: string;
  type: 'added' | 'corrected' | 'consumed' | 'reserved' | 'released';
  amount?: number;
  unit?: Unit;
  at: string;
  note?: string;
}

export interface RecipeIngredient {
  id: string;
  name: string;
  canonicalName: string;
  quantity: number;
  unit: Unit;
}

export interface Recipe {
  id: string;
  name: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  minutes: number;
  steps: string[];
  tags: string[];
  source: 'saved' | 'imported' | 'recommended';
  /** Existing image already stored with the recipe. */
  image?: string;
  /** Image explicitly supplied while importing or creating the recipe. */
  importedImage?: string;
  /** Provenance-checked asset bundled for a seeded recipe. */
  builtInImage?: string;
}

export interface SavedRecipe {
  recipeId: string;
  savedAt: string;
  preference: number;
}

export interface MealPlan {
  id: string;
  recipeId: string;
  servings: number;
  plannedFor?: string;
  status: 'planned' | 'cooked' | 'cancelled';
}

export interface ShoppingItem {
  id: string;
  ingredientName: string;
  canonicalName: string;
  quantity: number;
  unit: Unit;
  recipeId: string;
  recipeName: string;
  reason: string;
  bought: boolean;
}

export interface HabitInference {
  id: string;
  label: string;
  evidence: string;
  proposedChange: string;
  status: 'pending' | 'confirmed' | 'not_now' | 'disabled';
}

export type InterventionDecision = 'notify' | 'ask_for_confirmation' | 'show_in_app' | 'stay_silent';

export interface Intervention {
  id: string;
  foodId: string;
  title: string;
  message: string;
  decision: InterventionDecision;
  explanation: string[];
  createdAt: string;
  snoozedUntil?: string;
  dismissedAt?: string;
}

export interface InterventionFeedback {
  id: string;
  interventionId: string;
  action: 'snoozed' | 'dismissed' | 'corrected' | 'accepted';
  at: string;
}

export interface ActivityEvent {
  id: string;
  type: string;
  at: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface AppData {
  profile: UserProfile;
  inventory: FoodItem[];
  inventoryEvents: InventoryEvent[];
  recipes: Recipe[];
  savedRecipes: SavedRecipe[];
  mealPlans: MealPlan[];
  shopping: ShoppingItem[];
  habits: HabitInference[];
  interventions: Intervention[];
  interventionFeedback: InterventionFeedback[];
  activity: ActivityEvent[];
  researchScenario: string;
}
