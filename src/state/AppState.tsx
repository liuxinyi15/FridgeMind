import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { canonicalise, deductIngredient, matchRecipe, scaleIngredients } from '../domain/inventory';
import { respondToHabit as applyHabitResponse } from '../domain/habit';
import type { AppData, FoodItem, ImportSource, MealContextChoice, NotificationPreference, QuantityMode, Recipe, RecommendationFeedbackAction, ShoppingItem, Unit, UsabilityEventType, UsabilityTaskId } from '../domain/types';
import { taskCompletesFromEvent } from '../domain/usability';
import { sanitiseParticipantId } from '../domain/usabilityExport';
import { loadAppData, resetAppData, saveAppData } from '../data/repositories';
import { createSeedData } from '../data/seed';

interface FoodDraft {
  name: string;
  quantity: number | null;
  unit: Unit;
  quantityMode: QuantityMode;
  quantityDescription?: string;
  relevantDate?: string;
  dateType: 'use_by' | 'best_before' | 'unknown';
  storage: 'fridge' | 'freezer' | 'cupboard';
  note?: string;
  source?: ImportSource;
  category?: FoodItem['category'];
}

interface AddFoodOptions { source?: ImportSource; mergeExisting?: boolean; }

interface AppActions {
  completeOnboarding: (changes: Partial<AppData['profile']['routine']> & { mode?: NotificationPreference['mode'] }) => void;
  addFood: (draft: FoodDraft, options?: boolean | AddFoodOptions) => void;
  correctFood: (foodId: string, amount: number | null, unit: Unit, mode?: QuantityMode, description?: string) => void;
  resolveIngredientAmount: (foodId: string, required: number, answer: 'enough' | 'not_enough' | 'none') => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (recipeId: string) => void;
  toggleSavedRecipe: (recipeId: string) => void;
  addRecipeGapsToShopping: (recipe: Recipe, servings: number) => void;
  updateShopping: (id: string, change: Partial<ShoppingItem>) => void;
  reconcileShopping: (id: string, amount: number | null, unit: Unit) => void;
  removeShopping: (id: string) => void;
  startCooking: (recipe: Recipe, servings: number) => void;
  markCookingReview: () => void;
  completeCooking: (recipe: Recipe, servings: number, factors: Record<string, number>, eatNow: number) => void;
  setMealContext: (choice: MealContextChoice) => void;
  setAwayMode: (active: boolean, until?: string) => void;
  addRecommendationFeedback: (recipeId: string, action: RecommendationFeedbackAction) => void;
  undoRecommendationFeedback: (id: string) => void;
  confirmSubstitution: (recipeId: string, ingredientId: string, canonicalName: string) => void;
  consumeLeftover: (foodId: string) => void;
  handleFood: (foodId: string, outcome: 'used' | 'frozen' | 'still' | 'remove') => void;
  useSomeFood: (foodId: string, amount: 'little' | 'half' | 'most') => void;
  respondToIntervention: (id: string, action: 'snoozed' | 'dismissed' | 'corrected' | 'accepted') => void;
  respondToHabit: (id: string, action: 'confirm' | 'not_now' | 'disable') => void;
  revokeRoutine: (id: string) => void;
  updateNotifications: (change: Partial<NotificationPreference>) => void;
  setResearchScenario: (scenario: string) => void;
  startUsabilitySession: () => void;
  startParticipantStudy: (participantId: string) => void;
  launchUsabilityTask: (taskId: UsabilityTaskId, askPostTaskQuestions: boolean) => void;
  logUsabilityEvent: (type: UsabilityEventType, metadata?: Record<string, string | number | boolean>, path?: string) => void;
  completeUsabilityTask: () => void;
  abandonUsabilityTask: () => void;
  submitPostTaskResponse: (runId: string, taskId: UsabilityTaskId, ease: 1 | 2 | 3 | 4 | 5, confidence: 1 | 2 | 3 | 4 | 5, comment?: string) => void;
  toggleUsabilityObservation: (observation: string) => void;
  endUsabilitySession: () => void;
  markParticipantResultsDownloaded: () => void;
  clearParticipantStudyData: () => void;
  resetDemo: () => void;
}

const AppContext = createContext<{ data: AppData; actions: AppActions } | null>(null);
const todayKey = () => {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
};
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const v02RecipeIds = new Set(['recipe-mushroom-pasta', 'recipe-chicken-stir-fry', 'recipe-spinach-pasta', 'recipe-rice-bowl', 'recipe-vegetable-soup']);

function recordUsabilityEvent(current: AppData, type: UsabilityEventType, metadata?: Record<string, string | number | boolean>, path?: string): AppData {
  const sessionId = current.currentUsabilitySessionId;
  if (!sessionId) return current;
  const session = current.usabilitySessions.find((entry) => entry.id === sessionId);
  const taskId = session?.currentTaskId;
  const run = taskId ? [...(session?.taskRuns ?? [])].reverse().find((entry) => entry.taskId === taskId) : undefined;
  const postCompletionCapture = type === 'duplicate_shopping_attempt' || type === 'duplicate_fridge_attempt' || type === 'primary_cta_clicked' || type === 'secondary_cta_clicked';
  if (!session || !taskId || !run || (run.status !== 'running' && !(run.status === 'completed' && postCompletionCapture))) return current;
  const at = new Date().toISOString();
  const event = { id: id('usability-event'), taskId, type, at, metadata, path };
  const meetsSuccess = run.status === 'running' && !run.automaticSuccessAt && taskCompletesFromEvent(taskId, type, metadata);
  const completes = meetsSuccess && session.mode !== 'participant';
  return {
    ...current,
    usabilitySessions: current.usabilitySessions.map((entry) => entry.id !== sessionId ? entry : {
      ...entry,
      events: [...entry.events, event, ...(completes ? [{ id: id('usability-event'), taskId, type: 'task_completed' as const, at, metadata: { automatic: true } }] : [])],
      taskRuns: meetsSuccess ? entry.taskRuns.map((taskRun) => taskRun === run ? {
        ...taskRun,
        automaticSuccessAt: at,
        ...(completes ? { status: 'completed' as const, completedAt: at } : {}),
      } : taskRun) : entry.taskRuns,
    }),
  };
}

function createUsabilityFixture(taskId: UsabilityTaskId, current: AppData): AppData {
  const fixture = createSeedData();
  fixture.recipes = fixture.recipes.filter((recipe) => v02RecipeIds.has(recipe.id));
  fixture.savedRecipes = fixture.savedRecipes.filter((saved) => v02RecipeIds.has(saved.recipeId));
  fixture.profile.onboardingComplete = true;
  fixture.usabilitySessions = current.usabilitySessions;
  fixture.currentUsabilitySessionId = current.currentUsabilitySessionId;
  fixture.participantStudySessionId = current.participantStudySessionId;
  const makeMushroomPastaReady = () => {
    const mushrooms = fixture.inventory.find((item) => item.canonicalName === 'mushroom')!;
    mushrooms.batches[0].physicalStock = 250;
    const cream = fixture.inventory.find((item) => item.canonicalName === 'cream')!;
    cream.batches[0] = { ...cream.batches[0], physicalStock: 200, quantityMode: 'exact', confidence: 'confirmed', quantityDescription: undefined };
  };
  if (taskId === 'task-2') {
    fixture.inventory.find((item) => item.canonicalName === 'mushroom')!.batches[0].physicalStock = 250;
  }
  if (taskId === 'task-3') {
    const cream = fixture.inventory.find((item) => item.canonicalName === 'cream')!;
    cream.batches[0] = { ...cream.batches[0], physicalStock: 200, quantityMode: 'exact', confidence: 'confirmed', quantityDescription: undefined };
  }
  if (taskId === 'task-4') {
    fixture.shopping = [{
      id: 'usability-purchased-mushrooms',
      ingredientName: 'Mushrooms',
      canonicalName: 'mushroom',
      quantity: 80,
      suggestedPurchaseQuantity: 250,
      unit: 'g',
      recipeId: 'recipe-mushroom-pasta',
      recipeName: 'Mushroom Pasta',
      reason: 'Needed for Mushroom Pasta. You have 120g; the recipe needs 200g.',
      bought: true,
      purchasedAt: new Date().toISOString(),
    }];
  }
  if (taskId === 'task-5' || taskId === 'task-6') makeMushroomPastaReady();
  if (taskId === 'task-7') {
    const base = new Date();
    const nextDay = new Date(base.getTime() + 86_400_000);
    fixture.researchNow = nextDay.toISOString();
    fixture.inventory.push({
      id: 'usability-leftover-mushroom-pasta',
      name: 'Mushroom Pasta',
      canonicalName: 'leftover:recipe-mushroom-pasta',
      kind: 'leftover',
      portions: 1,
      cookedAt: base.toISOString(),
      sourceRecipeId: 'recipe-mushroom-pasta',
      batches: [{ id: 'usability-leftover-batch', physicalStock: 1, reservedStock: 0, unit: 'portion', dateType: 'unknown', storage: 'fridge', confidence: 'confirmed', quantityMode: 'exact', state: 'fresh', note: 'Stored yesterday' }],
    });
  }
  return fixture;
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadAppData());
  useEffect(() => saveAppData(data), [data]);

  const actions = useMemo<AppActions>(() => ({
    completeOnboarding: (changes) => setData((current) => ({
      ...current,
      profile: {
        ...current.profile,
        onboardingComplete: true,
        routine: { ...current.profile.routine, ...changes },
        notifications: changes.mode ? { ...current.profile.notifications, mode: changes.mode, proactiveEnabled: changes.mode !== 'off' } : current.profile.notifications,
      },
    })),
    addFood: (draft, rawOptions = false) => setData((current) => {
      const options: AddFoodOptions = typeof rawOptions === 'boolean' ? { source: rawOptions ? 'photo' : 'manual' } : rawOptions;
      const source = draft.source ?? options.source ?? 'manual';
      const canonicalName = canonicalise(draft.name);
      const itemId = id('food');
      const batchId = id('batch');
      const item: FoodItem = {
        id: itemId,
        name: draft.name,
        canonicalName,
        kind: 'ingredient',
        category: draft.category,
        batches: [{
          id: batchId,
          physicalStock: draft.quantityMode === 'unknown' ? null : draft.quantity,
          reservedStock: 0,
          unit: draft.unit,
          relevantDate: draft.relevantDate,
          dateType: draft.dateType,
          storage: draft.storage,
          confidence: draft.quantityMode === 'exact' && rawOptions !== true ? 'confirmed' : draft.quantityMode === 'unknown' ? 'needs_confirmation' : 'estimated',
          quantityMode: draft.quantityMode,
          quantityDescription: draft.quantityDescription,
          state: 'fresh',
          note: draft.note,
          source,
        }],
      };
      const existing = current.inventory.find((food) => food.kind !== 'leftover' && food.canonicalName === canonicalName);
      const inventory = existing && options.mergeExisting
        ? current.inventory.map((food) => food.id !== existing.id ? food : {
          ...food,
          batches: food.batches.map((batch, index) => {
            if (index) return batch;
            const canAddExactly = batch.quantityMode === 'exact' && draft.quantityMode === 'exact' && batch.unit === draft.unit && batch.physicalStock !== null && draft.quantity !== null;
            return canAddExactly
              ? { ...batch, physicalStock: batch.physicalStock! + draft.quantity!, source }
              : { ...batch, physicalStock: null, quantityMode: 'unknown' as const, confidence: 'needs_confirmation' as const, quantityDescription: 'combined stock; amount needs a check', source };
          }),
        })
        : existing
          ? current.inventory.map((food) => food.id === existing.id ? { ...food, batches: [...food.batches, item.batches[0]] } : food)
        : [...current.inventory, item];
      const updated = { ...current, inventory, inventoryEvents: [...current.inventoryEvents, { id: id('event'), foodId: existing?.id ?? item.id, type: options.mergeExisting ? 'merged' as const : 'added' as const, amount: draft.quantity ?? undefined, unit: draft.unit, at: new Date().toISOString(), note: `Added from ${source}` }] };
      const boughtDuplicateAttempt = current.shopping.some((shoppingItem) => shoppingItem.bought && !shoppingItem.addedToFridge && shoppingItem.canonicalName === canonicalName);
      return boughtDuplicateAttempt ? recordUsabilityEvent(updated, 'duplicate_fridge_attempt', { matchedPurchasedItem: true }) : updated;
    }),
    correctFood: (foodId, amount, unit, mode, description) => setData((current) => {
      const updated: AppData = {
        ...current,
        inventory: current.inventory.map((item) => item.id !== foodId ? item : {
        ...item,
        batches: item.batches.map((batch, index) => index ? batch : {
          ...batch,
          physicalStock: (mode ?? (amount === null ? 'unknown' : 'exact')) === 'unknown' ? null : amount,
          unit,
          quantityMode: mode ?? (amount === null ? 'unknown' : 'exact'),
          quantityDescription: description,
          confidence: mode === 'approximate' ? 'estimated' : amount === null ? 'needs_confirmation' : 'confirmed',
          minimumStockConfirmed: undefined,
        }),
      }),
        inventoryEvents: [...current.inventoryEvents, { id: id('event'), foodId, type: 'corrected', amount: amount ?? undefined, unit, at: new Date().toISOString() }],
      };
      return recordUsabilityEvent(updated, 'food_corrected', { mode: mode ?? 'exact' });
    }),
    resolveIngredientAmount: (foodId, required, answer) => setData((current) => {
      const updated: AppData = {
        ...current,
        inventory: current.inventory.map((item) => item.id !== foodId ? item : {
        ...item,
        batches: item.batches.map((batch, index) => index ? batch : answer === 'none'
          ? { ...batch, physicalStock: 0, minimumStockConfirmed: undefined, insufficientFor: undefined, quantityMode: 'exact', confidence: 'confirmed' }
          : answer === 'enough'
            ? { ...batch, minimumStockConfirmed: required, insufficientFor: undefined, confidence: batch.quantityMode === 'unknown' ? 'needs_confirmation' : batch.confidence }
            : { ...batch, minimumStockConfirmed: undefined, insufficientFor: required, quantityDescription: 'not enough for the planned recipe', confidence: 'needs_confirmation' }),
        }),
      };
      return recordUsabilityEvent(updated, 'uncertainty_resolved', { answer, required });
    }),
    addRecipe: (recipe) => setData((current) => ({ ...current, recipes: [...current.recipes, { ...recipe, ownership: recipe.ownership ?? 'personal', createdAt: recipe.createdAt ?? new Date().toISOString() }] })),
    updateRecipe: (recipe) => setData((current) => ({ ...current, recipes: current.recipes.map((item) => item.id === recipe.id && item.ownership === 'personal' ? { ...recipe, ownership: 'personal' } : item) })),
    deleteRecipe: (recipeId) => setData((current) => {
      const recipe = current.recipes.find((item) => item.id === recipeId);
      if (!recipe || recipe.ownership !== 'personal') return current;
      return { ...current, recipes: current.recipes.filter((item) => item.id !== recipeId), savedRecipes: current.savedRecipes.filter((item) => item.recipeId !== recipeId) };
    }),
    toggleSavedRecipe: (recipeId) => setData((current) => {
      const existing = current.savedRecipes.find((item) => item.recipeId === recipeId);
      return { ...current, savedRecipes: existing ? current.savedRecipes.filter((item) => item.recipeId !== recipeId) : [...current.savedRecipes, { recipeId, savedAt: new Date().toISOString(), preference: 1 }] };
    }),
    addRecipeGapsToShopping: (recipe, servings) => setData((current) => {
      const gaps = matchRecipe(recipe, servings, current.inventory, current.substitutions).filter((match) => match.status === 'missing' || match.status === 'partial');
      let shopping = [...current.shopping];
      let addedCount = 0;
      let duplicateCount = 0;
      for (const match of gaps) {
        const existing = shopping.find((item) => !item.bought && item.canonicalName === match.ingredient.canonicalName && item.unit === match.ingredient.unit);
        const needed = match.gap || match.ingredient.quantity;
        const reason = match.status === 'partial'
          ? `Needed for ${recipe.name}. You have ${match.available}${match.ingredient.unit}; the recipe needs ${match.ingredient.quantity}${match.ingredient.unit}.`
          : `Needed for ${recipe.name}; none is currently confirmed in your fridge.`;
        if (existing) {
          duplicateCount += 1;
          shopping = shopping.map((item) => item.id === existing.id ? { ...item, quantity: Math.max(item.quantity, needed), reason: item.reason.includes(recipe.name) ? item.reason : `${item.reason} Also needed for ${recipe.name}.` } : item);
        } else {
          addedCount += 1;
          shopping.push({
            id: id('shop'),
            ingredientName: match.ingredient.name,
            canonicalName: match.ingredient.canonicalName,
            quantity: needed,
            suggestedPurchaseQuantity: match.ingredient.defaultPackageQuantity ?? needed,
            unit: match.ingredient.unit,
            recipeId: recipe.id,
            recipeName: recipe.name,
            reason,
            bought: false,
          });
        }
      }
      let updated: AppData = { ...current, shopping };
      if (addedCount) updated = recordUsabilityEvent(updated, 'shopping_item_added', { count: addedCount, recipeId: recipe.id });
      if (duplicateCount) updated = recordUsabilityEvent(updated, 'duplicate_shopping_attempt', { count: duplicateCount, recipeId: recipe.id });
      return updated;
    }),
    updateShopping: (shoppingId, change) => setData((current) => ({
      ...current,
      shopping: current.shopping.map((item) => item.id === shoppingId ? { ...item, ...change, ...(change.bought === true && !item.bought ? { purchasedAt: new Date().toISOString() } : {}) } : item),
    })),
    reconcileShopping: (shoppingId, amount, unit) => setData((current) => {
      const shoppingItem = current.shopping.find((item) => item.id === shoppingId);
      if (!shoppingItem || shoppingItem.addedToFridge) return current;
      const existing = current.inventory.find((item) => item.kind !== 'leftover' && item.canonicalName === shoppingItem.canonicalName);
      let inventory: FoodItem[];
      if (existing) {
        inventory = current.inventory.map((item) => {
          if (item.id !== existing.id) return item;
          const compatible = item.batches.findIndex((batch) => batch.unit === unit && batch.quantityMode === 'exact' && amount !== null);
          if (compatible >= 0) return { ...item, batches: item.batches.map((batch, index) => index === compatible ? { ...batch, physicalStock: Math.max(0, (batch.physicalStock ?? 0) + (amount ?? 0)) } : batch) };
          return { ...item, batches: [...item.batches, { id: id('batch'), physicalStock: amount, reservedStock: 0, unit, dateType: 'unknown', storage: 'fridge', confidence: amount === null ? 'needs_confirmation' : 'confirmed', quantityMode: amount === null ? 'unknown' : 'exact', quantityDescription: amount === null ? 'some purchased' : undefined, state: 'fresh', source: 'shopping' }] };
        });
      } else {
        inventory = [...current.inventory, {
          id: id('food'), name: shoppingItem.ingredientName, canonicalName: shoppingItem.canonicalName, kind: 'ingredient',
          batches: [{ id: id('batch'), physicalStock: amount, reservedStock: 0, unit, dateType: 'unknown', storage: 'fridge', confidence: amount === null ? 'needs_confirmation' : 'confirmed', quantityMode: amount === null ? 'unknown' : 'exact', quantityDescription: amount === null ? 'some purchased' : undefined, state: 'fresh', source: 'shopping' }],
        }];
      }
      const updated: AppData = { ...current, inventory, shopping: current.shopping.map((item) => item.id === shoppingId ? { ...item, bought: true, addedToFridge: true } : item), inventoryEvents: [...current.inventoryEvents, { id: id('event'), foodId: existing?.id ?? inventory.at(-1)!.id, type: 'added', amount: amount ?? undefined, unit, at: new Date().toISOString(), note: 'Added from shopping' }] };
      return recordUsabilityEvent(updated, 'shopping_item_reconciled', { amountUnknown: amount === null, amountEdited: amount !== null && amount !== shoppingItem.suggestedPurchaseQuantity });
    }),
    removeShopping: (shoppingId) => setData((current) => ({ ...current, shopping: current.shopping.filter((item) => item.id !== shoppingId) })),
    startCooking: (recipe, servings) => setData((current) => recordUsabilityEvent({ ...current, cookingSession: { id: id('cook'), recipeId: recipe.id, servings, status: 'cooking', startedAt: new Date().toISOString() } }, 'cooking_started', { recipeId: recipe.id, servings })),
    markCookingReview: () => setData((current) => current.cookingSession ? { ...current, cookingSession: { ...current.cookingSession, status: 'reviewing' } } : current),
    completeCooking: (recipe, servings, factors, eatNow) => setData((current) => {
      const ingredients = scaleIngredients(recipe, servings);
      let inventory = current.inventory;
      const cookingEvents: AppData['inventoryEvents'] = [];
      ingredients.forEach((ingredient) => {
        const factor = factors[ingredient.id] ?? 1;
        if (factor <= 0) return;
        const canonicalName = current.substitutions[`${recipe.id}:${ingredient.id}`] ?? ingredient.canonicalName;
        const matchedFood = inventory.find((item) => item.canonicalName === canonicalName);
        if (matchedFood) cookingEvents.push({ id: id('event'), foodId: matchedFood.id, type: 'consumed', amount: ingredient.quantity * factor, unit: ingredient.unit, at: new Date().toISOString(), note: `Used in ${recipe.name}` });
        inventory = inventory.map((item) => item.canonicalName === canonicalName ? deductIngredient(item, ingredient.quantity * factor, ingredient.unit) : item);
      });
      inventory = inventory.filter((item) => item.kind === 'leftover' || item.batches.some((batch) => batch.physicalStock === null || batch.quantityMode !== 'exact' || (batch.physicalStock ?? 0) > 0));
      const leftoverPortions = Math.max(0, servings - eatNow);
      if (leftoverPortions) {
        const leftover: FoodItem = {
          id: id('leftover'),
          name: recipe.name,
          canonicalName: `leftover:${recipe.id}`,
          kind: 'leftover',
          portions: leftoverPortions,
          cookedAt: new Date().toISOString(),
          sourceRecipeId: recipe.id,
          batches: [{ id: id('batch'), physicalStock: leftoverPortions, reservedStock: 0, unit: 'portion', dateType: 'unknown', storage: 'fridge', confidence: 'confirmed', quantityMode: 'exact', state: 'fresh', note: 'Stored today', source: 'cooking' }],
        };
        inventory = [...inventory, leftover];
        cookingEvents.push({ id: id('event'), foodId: leftover.id, type: 'leftover_created', amount: leftoverPortions, unit: 'portion', at: new Date().toISOString(), note: `Converted from ${recipe.name}` });
      }
      let updated: AppData = {
        ...current,
        inventory,
        cookingSession: current.cookingSession ? { ...current.cookingSession, status: 'completed', completedAt: new Date().toISOString() } : undefined,
        mealPlans: [...current.mealPlans, { id: id('meal'), recipeId: recipe.id, servings, status: 'cooked' }],
        activity: [...current.activity, { id: id('activity'), type: 'cooking_completed', at: new Date().toISOString(), metadata: { recipe: recipe.name, recipeId: recipe.id, servings, leftoverPortions } }],
        inventoryEvents: [...current.inventoryEvents, ...cookingEvents],
      };
      updated = recordUsabilityEvent(updated, 'cooking_completed', { recipeId: recipe.id, servings });
      if (leftoverPortions) updated = recordUsabilityEvent(updated, 'leftover_saved', { recipeId: recipe.id, portions: leftoverPortions });
      return updated;
    }),
    setMealContext: (choice) => setData((current) => recordUsabilityEvent({ ...current, mealContexts: [...current.mealContexts.filter((entry) => entry.date !== todayKey()), { date: todayKey(), choice }] }, 'meal_context_changed', { choice })),
    setAwayMode: (active, until) => setData((current) => ({ ...current, awayMode: { active, until } })),
    addRecommendationFeedback: (recipeId, action) => setData((current) => ({ ...current, recommendationFeedback: [...current.recommendationFeedback, { id: id('rec-feedback'), recipeId, action, createdAt: new Date().toISOString(), active: true }] })),
    undoRecommendationFeedback: (feedbackId) => setData((current) => ({ ...current, recommendationFeedback: current.recommendationFeedback.map((entry) => entry.id === feedbackId ? { ...entry, active: false } : entry) })),
    confirmSubstitution: (recipeId, ingredientId, canonicalName) => setData((current) => ({ ...current, substitutions: { ...current.substitutions, [`${recipeId}:${ingredientId}`]: canonicalName } })),
    consumeLeftover: (foodId) => setData((current) => {
      const leftover = current.inventory.find((item) => item.id === foodId && item.kind === 'leftover');
      if (!leftover) return current;
      if ((leftover.portions ?? 0) <= 1) return recordUsabilityEvent({ ...current, inventory: current.inventory.filter((item) => item.id !== foodId) }, 'leftover_selected', { foodId });
      return recordUsabilityEvent({
        ...current,
        inventory: current.inventory.map((item) => item.id !== foodId ? item : {
          ...item,
          portions: Math.max(0, (item.portions ?? 0) - 1),
          batches: item.batches.map((batch, index) => index ? batch : { ...batch, physicalStock: Math.max(0, (batch.physicalStock ?? 0) - 1) }),
        }),
      }, 'leftover_selected', { foodId });
    }),
    handleFood: (foodId, outcome) => setData((current) => {
      const food = current.inventory.find((item) => item.id === foodId);
      if (!food || outcome === 'still') return current;
      const inventory = outcome === 'used' || outcome === 'remove'
        ? current.inventory.filter((item) => item.id !== foodId)
        : current.inventory.map((item) => item.id !== foodId ? item : outcome === 'frozen'
          ? { ...item, batches: item.batches.map((batch) => ({ ...batch, storage: 'freezer' as const, state: 'frozen' as const })) }
          : item);
      const eventType = outcome === 'frozen' ? 'frozen' as const : outcome === 'used' ? 'finished' as const : 'discarded' as const;
      return { ...current, inventory, inventoryEvents: [...current.inventoryEvents, { id: id('event'), foodId, type: eventType, at: new Date().toISOString() }] };
    }),
    useSomeFood: (foodId, amount) => setData((current) => {
      const factor = amount === 'little' ? .85 : amount === 'half' ? .5 : .2;
      const descriptions = { little: 'most of it left', half: 'about half left', most: 'a little left' };
      return {
        ...current,
        inventory: current.inventory.map((item) => item.id !== foodId ? item : {
          ...item,
          batches: item.batches.map((batch, index) => index ? batch : batch.quantityMode === 'exact' && batch.physicalStock !== null
            ? { ...batch, physicalStock: Math.max(0, Number((batch.physicalStock * factor).toFixed(2))) }
            : { ...batch, quantityMode: batch.quantityMode, confidence: batch.confidence, quantityDescription: descriptions[amount] }),
        }),
        inventoryEvents: [...current.inventoryEvents, { id: id('event'), foodId, type: 'partially_used' as const, at: new Date().toISOString(), note: amount }],
      };
    }),
    respondToIntervention: (interventionId, action) => setData((current) => ({
      ...current,
      interventions: current.interventions.map((item) => item.id !== interventionId ? item : {
        ...item,
        ...(action === 'snoozed' ? { snoozedUntil: new Date(Date.now() + 86_400_000).toISOString(), decision: 'stay_silent' as const } : {}),
        ...(action === 'dismissed' ? { dismissedAt: new Date().toISOString(), decision: 'stay_silent' as const } : {}),
      }),
      interventionFeedback: [...current.interventionFeedback, { id: id('feedback'), interventionId, action, at: new Date().toISOString() }],
    })),
    respondToHabit: (habitId, action) => setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => habit.id === habitId ? applyHabitResponse(habit, action) : habit),
      approvedRoutines: action === 'confirm' && !current.approvedRoutines.some((routine) => routine.observationId === habitId && routine.active)
        ? [...current.approvedRoutines, { id: id('routine'), observationId: habitId, type: 'skip_weekday_lunch', approvedAt: new Date().toISOString(), active: true }]
        : current.approvedRoutines,
    })),
    revokeRoutine: (routineId) => setData((current) => ({ ...current, approvedRoutines: current.approvedRoutines.map((routine) => routine.id === routineId ? { ...routine, active: false } : routine), habits: current.habits.map((habit) => current.approvedRoutines.find((routine) => routine.id === routineId)?.observationId === habit.id ? { ...habit, status: 'pending' } : habit) })),
    updateNotifications: (change) => setData((current) => ({ ...current, profile: { ...current.profile, notifications: { ...current.profile.notifications, ...change } } })),
    setResearchScenario: (researchScenario) => setData((current) => {
      const fixture = createSeedData();
      if (!researchScenario.startsWith('V3-')) {
        fixture.recipes = fixture.recipes.filter((recipe) => v02RecipeIds.has(recipe.id));
        fixture.savedRecipes = fixture.savedRecipes.filter((saved) => v02RecipeIds.has(saved.recipeId));
      }
      fixture.profile.onboardingComplete = current.profile.onboardingComplete;
      fixture.usabilitySessions = current.usabilitySessions;
      fixture.participantStudySessionId = current.participantStudySessionId;
      fixture.researchScenario = researchScenario;
      if (researchScenario === 'A' || researchScenario === 'E') {
        const mushrooms = fixture.inventory.find((item) => item.canonicalName === 'mushroom')!;
        mushrooms.batches[0].physicalStock = 250;
        const cream = fixture.inventory.find((item) => item.canonicalName === 'cream')!;
        cream.batches[0] = { ...cream.batches[0], physicalStock: 200, quantityMode: 'exact', confidence: 'confirmed', quantityDescription: undefined };
      }
      if (researchScenario === 'C') fixture.mealContexts = [{ date: todayKey(), choice: 'cooking' }];
      if (researchScenario === 'D') fixture.mealContexts = [{ date: todayKey(), choice: 'eating_out' }];
      if (researchScenario === 'G' || researchScenario === 'V3-F') fixture.shopping = [{
        id: 'research-purchased-mushrooms',
        ingredientName: 'Mushrooms',
        canonicalName: 'mushroom',
        quantity: 80,
        suggestedPurchaseQuantity: 250,
        unit: 'g',
        recipeId: 'recipe-mushroom-pasta',
        recipeName: 'Mushroom Pasta',
        reason: 'Needed for Mushroom Pasta. You have 120g; the recipe needs 200g.',
        bought: true,
        purchasedAt: new Date().toISOString(),
      }];
      return fixture;
    }),
    startUsabilitySession: () => setData((current) => {
      const sessionId = id('usability-session');
      return {
        ...current,
        currentUsabilitySessionId: sessionId,
        usabilitySessions: [...current.usabilitySessions, { id: sessionId, mode: 'researcher', startedAt: new Date().toISOString(), taskRuns: [], events: [], responses: [], observations: [] }],
      };
    }),
    startParticipantStudy: (participantId) => setData((current) => {
      const safeParticipantId = sanitiseParticipantId(participantId);
      if (!safeParticipantId) return current;
      const sessionId = id('usability-session');
      const session = { id: sessionId, mode: 'participant' as const, participantId: safeParticipantId, startedAt: new Date().toISOString(), taskRuns: [], events: [], responses: [], observations: [] };
      return {
        ...current,
        currentUsabilitySessionId: sessionId,
        participantStudySessionId: sessionId,
        usabilitySessions: [...current.usabilitySessions, session],
      };
    }),
    launchUsabilityTask: (taskId, askPostTaskQuestions) => setData((current) => {
      const at = new Date().toISOString();
      let sessionId = current.currentUsabilitySessionId;
      let sessions = current.usabilitySessions;
      if (!sessionId || !sessions.some((session) => session.id === sessionId && !session.completedAt)) {
        sessionId = id('usability-session');
        sessions = [...sessions, { id: sessionId, mode: 'researcher', startedAt: at, taskRuns: [], events: [], responses: [], observations: [] }];
      }
      const prepared = createUsabilityFixture(taskId, { ...current, usabilitySessions: sessions, currentUsabilitySessionId: sessionId });
      prepared.usabilitySessions = prepared.usabilitySessions.map((session) => {
        if (session.id !== sessionId) return session;
        const abandonedTask = session.currentTaskId
          ? [...session.taskRuns].reverse().find((run) => run.taskId === session.currentTaskId && run.status === 'running')
          : undefined;
        return {
          ...session,
          currentTaskId: taskId,
          taskRuns: [
            ...session.taskRuns.map((run) => run === abandonedTask ? { ...run, status: 'abandoned' as const, abandonedAt: at } : run),
            { id: id('usability-run'), taskId, status: 'running' as const, startedAt: at, askPostTaskQuestions },
          ],
          events: [
            ...session.events,
            ...(abandonedTask ? [{ id: id('usability-event'), taskId: abandonedTask.taskId, type: 'task_abandoned' as const, at }] : []),
            { id: id('usability-event'), taskId, type: 'task_started' as const, at },
          ],
        };
      });
      return prepared;
    }),
    logUsabilityEvent: (type, metadata, path) => setData((current) => recordUsabilityEvent(current, type, metadata, path)),
    completeUsabilityTask: () => setData((current) => {
      const sessionId = current.currentUsabilitySessionId;
      const session = current.usabilitySessions.find((entry) => entry.id === sessionId);
      const taskId = session?.currentTaskId;
      if (!sessionId || !taskId) return current;
      const run = [...session.taskRuns].reverse().find((entry) => entry.taskId === taskId && entry.status === 'running');
      if (!run) return current;
      const at = new Date().toISOString();
      return {
        ...current,
        usabilitySessions: current.usabilitySessions.map((entry) => entry.id !== sessionId ? entry : {
          ...entry,
          taskRuns: entry.taskRuns.map((taskRun) => taskRun === run ? { ...taskRun, status: 'completed' as const, completedAt: at, participantDeclaredAt: entry.mode === 'participant' ? at : taskRun.participantDeclaredAt } : taskRun),
          events: [...entry.events,
            ...(entry.mode === 'participant' ? [{ id: id('usability-event'), taskId, type: 'participant_declared_completion' as const, at }] : []),
            { id: id('usability-event'), taskId, type: 'task_completed' as const, at, metadata: { participantDeclared: entry.mode === 'participant', researcherMarked: entry.mode !== 'participant' } },
          ],
        }),
      };
    }),
    abandonUsabilityTask: () => setData((current) => {
      const sessionId = current.currentUsabilitySessionId;
      const session = current.usabilitySessions.find((entry) => entry.id === sessionId);
      const taskId = session?.currentTaskId;
      if (!sessionId || !taskId) return current;
      const run = [...session.taskRuns].reverse().find((entry) => entry.taskId === taskId && entry.status === 'running');
      if (!run) return current;
      const at = new Date().toISOString();
      return {
        ...current,
        usabilitySessions: current.usabilitySessions.map((entry) => entry.id !== sessionId ? entry : {
          ...entry,
          taskRuns: entry.taskRuns.map((taskRun) => taskRun === run ? { ...taskRun, status: 'abandoned' as const, abandonedAt: at } : taskRun),
          events: [...entry.events, { id: id('usability-event'), taskId, type: 'task_abandoned' as const, at }],
        }),
      };
    }),
    submitPostTaskResponse: (runId, taskId, ease, confidence, comment) => setData((current) => {
      const sessionId = current.currentUsabilitySessionId;
      if (!sessionId) return current;
      return {
        ...current,
        usabilitySessions: current.usabilitySessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          responses: [...session.responses.filter((response) => response.runId !== runId), { runId, taskId, ease, confidence, comment: comment?.trim() || undefined, submittedAt: new Date().toISOString() }],
        }),
      };
    }),
    toggleUsabilityObservation: (observation) => setData((current) => {
      const sessionId = current.currentUsabilitySessionId;
      if (!sessionId) return current;
      return {
        ...current,
        usabilitySessions: current.usabilitySessions.map((session) => session.id !== sessionId ? session : {
          ...session,
          observations: session.observations.includes(observation) ? session.observations.filter((item) => item !== observation) : [...session.observations, observation],
        }),
      };
    }),
    endUsabilitySession: () => setData((current) => {
      const sessionId = current.currentUsabilitySessionId;
      if (!sessionId) return current;
      const at = new Date().toISOString();
      return {
        ...current,
        currentUsabilitySessionId: undefined,
        usabilitySessions: current.usabilitySessions.map((session) => {
          if (session.id !== sessionId) return session;
          const running = session.currentTaskId ? [...session.taskRuns].reverse().find((run) => run.taskId === session.currentTaskId && run.status === 'running') : undefined;
          return {
            ...session,
            completedAt: at,
            currentTaskId: undefined,
            taskRuns: session.taskRuns.map((run) => run === running ? { ...run, status: 'abandoned' as const, abandonedAt: at } : run),
            events: running ? [...session.events, { id: id('usability-event'), taskId: running.taskId, type: 'task_abandoned' as const, at, metadata: { sessionEnded: true } }] : session.events,
          };
        }),
      };
    }),
    markParticipantResultsDownloaded: () => setData((current) => {
      const sessionId = current.participantStudySessionId;
      if (!sessionId) return current;
      return {
        ...current,
        usabilitySessions: current.usabilitySessions.map((session) => session.id === sessionId ? { ...session, resultsDownloadedAt: new Date().toISOString() } : session),
      };
    }),
    clearParticipantStudyData: () => setData((current) => {
      const participantSessionIds = new Set(current.usabilitySessions.filter((session) => session.mode === 'participant').map((session) => session.id));
      const seed = createSeedData();
      seed.profile.onboardingComplete = current.profile.onboardingComplete;
      seed.usabilitySessions = current.usabilitySessions.filter((session) => !participantSessionIds.has(session.id));
      seed.currentUsabilitySessionId = current.currentUsabilitySessionId && !participantSessionIds.has(current.currentUsabilitySessionId) ? current.currentUsabilitySessionId : undefined;
      seed.participantStudySessionId = undefined;
      return seed;
    }),
    resetDemo: () => setData(resetAppData()),
  }), []);

  return <AppContext.Provider value={{ data, actions }}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
