import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { canonicalise, deductIngredient, matchRecipe, scaleIngredients } from '../domain/inventory';
import { respondToHabit as applyHabitResponse } from '../domain/habit';
import type { AppData, FoodItem, NotificationPreference, Recipe, ShoppingItem, Unit } from '../domain/types';
import { loadAppData, resetAppData, saveAppData } from '../data/repositories';

interface FoodDraft {
  name: string;
  quantity: number | null;
  unit: Unit;
  relevantDate?: string;
  dateType: 'use_by' | 'best_before' | 'unknown';
  storage: 'fridge' | 'freezer' | 'cupboard';
  note?: string;
}

interface AppActions {
  completeOnboarding: (changes: Partial<AppData['profile']['routine']> & { mode?: NotificationPreference['mode'] }) => void;
  addFood: (draft: FoodDraft, demoRecognition?: boolean) => void;
  correctFood: (foodId: string, amount: number | null, unit: Unit) => void;
  addRecipe: (recipe: Recipe) => void;
  addRecipeGapsToShopping: (recipe: Recipe, servings: number) => void;
  updateShopping: (id: string, change: Partial<ShoppingItem>) => void;
  removeShopping: (id: string) => void;
  completeCooking: (recipe: Recipe, servings: number, factors: Record<string, number>) => void;
  respondToIntervention: (id: string, action: 'snoozed' | 'dismissed' | 'corrected' | 'accepted') => void;
  respondToHabit: (id: string, action: 'confirm' | 'not_now' | 'disable') => void;
  updateNotifications: (change: Partial<NotificationPreference>) => void;
  setResearchScenario: (scenario: string) => void;
  resetDemo: () => void;
}

const AppContext = createContext<{ data: AppData; actions: AppActions } | null>(null);

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
    addFood: (draft, demoRecognition = false) => setData((current) => {
      const canonicalName = canonicalise(draft.name);
      const item: FoodItem = {
        id: `food-${Date.now()}`,
        name: draft.name,
        canonicalName,
        batches: [{
          id: `batch-${Date.now()}`,
          physicalStock: draft.quantity,
          reservedStock: 0,
          unit: draft.unit,
          relevantDate: draft.relevantDate,
          dateType: draft.dateType,
          storage: draft.storage,
          confidence: demoRecognition ? 'estimated' : draft.quantity === null ? 'needs_confirmation' : 'confirmed',
          state: 'fresh',
          note: draft.note,
        }],
      };
      return { ...current, inventory: [...current.inventory, item], inventoryEvents: [...current.inventoryEvents, { id: `event-${Date.now()}`, foodId: item.id, type: 'added', amount: draft.quantity ?? undefined, unit: draft.unit, at: new Date().toISOString() }] };
    }),
    correctFood: (foodId, amount, unit) => setData((current) => ({
      ...current,
      inventory: current.inventory.map((item) => item.id !== foodId ? item : {
        ...item,
        batches: item.batches.map((batch, index) => index ? batch : { ...batch, physicalStock: amount, unit, confidence: amount === null ? 'needs_confirmation' : 'confirmed' }),
      }),
      inventoryEvents: [...current.inventoryEvents, { id: `event-${Date.now()}`, foodId, type: 'corrected', amount: amount ?? undefined, unit, at: new Date().toISOString() }],
    })),
    addRecipe: (recipe) => setData((current) => ({ ...current, recipes: [...current.recipes, recipe] })),
    addRecipeGapsToShopping: (recipe, servings) => setData((current) => {
      const gaps = matchRecipe(recipe, servings, current.inventory).filter((match) => match.status !== 'available');
      const newItems: ShoppingItem[] = gaps.map((match) => ({
        id: `shop-${recipe.id}-${match.ingredient.id}-${servings}`,
        ingredientName: match.ingredient.name,
        canonicalName: match.ingredient.canonicalName,
        quantity: match.gap || match.ingredient.quantity,
        unit: match.ingredient.unit,
        recipeId: recipe.id,
        recipeName: recipe.name,
        reason: match.status === 'partial'
          ? `Needed for ${recipe.name}. You have ${match.available}${match.ingredient.unit}; the ${servings}-serving recipe requires ${match.ingredient.quantity}${match.ingredient.unit}.`
          : match.status === 'uncertain'
            ? `Needed for ${recipe.name}, but your current amount is uncertain. Please check before buying.`
            : `Needed for ${recipe.name}; none is currently confirmed in your fridge.`,
        bought: false,
      }));
      const withoutRecipe = current.shopping.filter((item) => item.recipeId !== recipe.id);
      return { ...current, shopping: [...withoutRecipe, ...newItems] };
    }),
    updateShopping: (id, change) => setData((current) => ({ ...current, shopping: current.shopping.map((item) => item.id === id ? { ...item, ...change } : item) })),
    removeShopping: (id) => setData((current) => ({ ...current, shopping: current.shopping.filter((item) => item.id !== id) })),
    completeCooking: (recipe, servings, factors) => setData((current) => {
      const ingredients = scaleIngredients(recipe, servings);
      let inventory = current.inventory;
      ingredients.forEach((ingredient) => {
        const factor = factors[ingredient.id] ?? 1;
        if (factor <= 0) return;
        inventory = inventory.map((item) => item.canonicalName === ingredient.canonicalName ? deductIngredient(item, ingredient.quantity * factor, ingredient.unit) : item);
      });
      return {
        ...current,
        inventory,
        mealPlans: [...current.mealPlans, { id: `meal-${Date.now()}`, recipeId: recipe.id, servings, status: 'cooked' }],
        activity: [...current.activity, { id: `activity-${Date.now()}`, type: 'cooking_completed', at: new Date().toISOString(), metadata: { recipe: recipe.name, servings } }],
      };
    }),
    respondToIntervention: (id, action) => setData((current) => ({
      ...current,
      interventions: current.interventions.map((item) => item.id !== id ? item : {
        ...item,
        ...(action === 'snoozed' ? { snoozedUntil: new Date(Date.now() + 86_400_000).toISOString(), decision: 'stay_silent' as const } : {}),
        ...(action === 'dismissed' ? { dismissedAt: new Date().toISOString(), decision: 'stay_silent' as const } : {}),
      }),
      interventionFeedback: [...current.interventionFeedback, { id: `feedback-${Date.now()}`, interventionId: id, action, at: new Date().toISOString() }],
    })),
    respondToHabit: (id, action) => setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => habit.id === id ? applyHabitResponse(habit, action) : habit),
      profile: action === 'confirm' ? { ...current.profile, routine: { ...current.profile.routine, weekdayLunchAtHome: false } } : current.profile,
    })),
    updateNotifications: (change) => setData((current) => ({ ...current, profile: { ...current.profile, notifications: { ...current.profile.notifications, ...change } } })),
    setResearchScenario: (researchScenario) => setData((current) => ({ ...current, researchScenario })),
    resetDemo: () => setData(resetAppData()),
  }), []);

  return <AppContext.Provider value={{ data, actions }}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
