export type InventoryConfidence = 'confirmed' | 'estimated' | 'needs_confirmation';
export type QuantityMode = 'exact' | 'approximate' | 'unknown';
export type DateType = 'use_by' | 'best_before' | 'unknown';
export type FoodState = 'fresh' | 'use_soon' | 'stable' | 'frozen' | 'unknown';
export type StorageLocation = 'fridge' | 'freezer' | 'cupboard';
export type Unit = 'g' | 'ml' | 'item' | 'tbsp' | 'tsp' | 'cup' | 'portion';
export type ImportSource = 'manual' | 'quick' | 'photo' | 'package' | 'receipt' | 'shopping' | 'cooking' | 'seeded';

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
  quantityMode: QuantityMode;
  /** Human wording such as "about half a pack". */
  quantityDescription?: string;
  /** A decision-point confirmation without pretending the remaining amount is exact. */
  minimumStockConfirmed?: number;
  insufficientFor?: number;
  state: FoodState;
  note?: string;
  source?: ImportSource;
}

export interface FoodItem {
  id: string;
  name: string;
  canonicalName: string;
  batches: FoodBatch[];
  kind?: 'ingredient' | 'leftover';
  portions?: number;
  cookedAt?: string;
  sourceRecipeId?: string;
  category?: 'fresh' | 'pantry' | 'frozen';
  /** Optional local photo kept only as a visual reference; never treated as recognition output. */
  referenceImage?: string;
}

export interface InventoryEvent {
  id: string;
  foodId: string;
  type: 'added' | 'corrected' | 'consumed' | 'reserved' | 'released' | 'partially_used' | 'finished' | 'discarded' | 'frozen' | 'merged' | 'leftover_created';
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
  possibleSubstitutes?: string[];
  defaultPackageQuantity?: number;
}

export interface Recipe {
  id: string;
  name: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  minutes: number;
  steps: string[];
  tags: string[];
  source: 'saved' | 'imported' | 'recommended' | 'created';
  ownership?: 'built_in' | 'personal';
  originalText?: string;
  createdAt?: string;
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
  purchasedAt?: string;
  addedToFridge?: boolean;
  suggestedPurchaseQuantity?: number;
}

export type MealContextChoice = 'cooking' | 'eating_out' | 'not_sure';

export interface DailyMealContext {
  date: string;
  choice: MealContextChoice;
}

export type RecipeAvailability = 'READY' | 'READY_WITH_UNCERTAINTY' | 'MISSING_ITEMS' | 'NOT_PRACTICAL';

export interface CookingSession {
  id: string;
  recipeId: string;
  servings: number;
  status: 'cooking' | 'reviewing' | 'completed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
}

export type RecommendationFeedbackAction = 'not_in_mood' | 'never_recommend' | 'ate_recently' | 'ingredient_wrong';

export interface RecommendationFeedback {
  id: string;
  recipeId: string;
  action: RecommendationFeedbackAction;
  createdAt: string;
  active: boolean;
}

export interface ApprovedRoutine {
  id: string;
  observationId: string;
  type: 'skip_weekday_lunch';
  approvedAt: string;
  active: boolean;
}

export interface AwayMode {
  active: boolean;
  until?: string;
}

export type UsabilityTaskId = 'task-1' | 'task-2' | 'task-3' | 'task-4' | 'task-5' | 'task-6' | 'task-7';

export type UsabilityEventType =
  | 'task_started' | 'task_completed' | 'task_abandoned'
  | 'participant_declared_completion'
  | 'page_visited' | 'primary_cta_clicked' | 'secondary_cta_clicked' | 'back_navigation'
  | 'more_opened' | 'recommendation_explanation_opened' | 'explanatory_disclosure_opened'
  | 'recipe_opened' | 'meal_context_changed'
  | 'uncertainty_prompt_shown' | 'uncertainty_resolved' | 'food_corrected'
  | 'shopping_item_added' | 'duplicate_shopping_attempt'
  | 'shopping_item_reconciled' | 'duplicate_fridge_attempt'
  | 'cooking_started' | 'recipe_correction_opened' | 'cooking_completed'
  | 'leftover_saved' | 'leftover_selected' | 'dead_end_marked'
  | 'ocr_started' | 'ocr_completed' | 'ocr_returned_empty' | 'ocr_text_corrected'
  | 'ocr_parse_reviewed' | 'ocr_fallback_used'
  | 'quick_add_opened' | 'quick_add_parsed' | 'quick_add_item_edited'
  | 'receipt_ocr_used' | 'package_ocr_used';

export interface UsabilityEvent {
  id: string;
  taskId: UsabilityTaskId;
  type: UsabilityEventType;
  at: string;
  path?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface UsabilityTaskRun {
  id: string;
  taskId: UsabilityTaskId;
  status: 'running' | 'completed' | 'abandoned';
  startedAt: string;
  completedAt?: string;
  abandonedAt?: string;
  automaticSuccessAt?: string;
  participantDeclaredAt?: string;
  askPostTaskQuestions: boolean;
}

export interface PostTaskResponse {
  runId: string;
  taskId: UsabilityTaskId;
  ease: 1 | 2 | 3 | 4 | 5;
  confidence: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  submittedAt: string;
}

export interface UsabilitySession {
  id: string;
  mode?: 'researcher' | 'participant';
  participantId?: string;
  startedAt: string;
  completedAt?: string;
  resultsDownloadedAt?: string;
  currentTaskId?: UsabilityTaskId;
  taskRuns: UsabilityTaskRun[];
  events: UsabilityEvent[];
  responses: PostTaskResponse[];
  observations: string[];
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
  schemaVersion: 5;
  experienceMode: 'consumer' | 'demo' | 'research';
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
  mealContexts: DailyMealContext[];
  cookingSession?: CookingSession;
  recommendationFeedback: RecommendationFeedback[];
  approvedRoutines: ApprovedRoutine[];
  substitutions: Record<string, string>;
  awayMode: AwayMode;
  usabilitySessions: UsabilitySession[];
  currentUsabilitySessionId?: string;
  participantStudySessionId?: string;
  researchNow?: string;
  researchScenario: string;
}
