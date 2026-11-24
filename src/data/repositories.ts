import type { AppData, FoodItem, Intervention, NotificationPreference, Recipe, UserProfile } from '../domain/types';
import { createSeedData } from './seed';

export interface InventoryRepository { getAll(): FoodItem[]; save(items: FoodItem[]): void; }
export interface RecipeRepository { getAll(): Recipe[]; save(items: Recipe[]): void; }
export interface PreferenceRepository { getProfile(): UserProfile; saveProfile(profile: UserProfile): void; }
export interface InterventionRepository { getAll(): Intervention[]; save(items: Intervention[]): void; savePreferences(preferences: NotificationPreference): void; }

const STORAGE_KEY = 'fridgemind:v0.1:data';

export function loadAppData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateAppData(JSON.parse(saved) as Partial<AppData>);
  } catch {
    // The seed remains a safe fallback if local storage is blocked or corrupted.
  }
  return createSeedData();
}

export function migrateAppData(saved: Partial<AppData>): AppData {
  const seed = createSeedData();
  const inventory = (saved.inventory ?? seed.inventory).map((item) => ({
    ...item,
    kind: item.kind ?? 'ingredient' as const,
    batches: item.batches.map((batch) => ({
      ...batch,
      quantityMode: batch.quantityMode ?? (batch.physicalStock === null ? 'unknown' : batch.confidence === 'estimated' ? 'approximate' : 'exact'),
    })),
  }));
  return {
    ...seed,
    ...saved,
    schemaVersion: 3,
    inventory,
    mealContexts: saved.mealContexts ?? [],
    recommendationFeedback: saved.recommendationFeedback ?? [],
    approvedRoutines: saved.approvedRoutines ?? [],
    substitutions: saved.substitutions ?? {},
    awayMode: saved.awayMode ?? { active: false },
    usabilitySessions: (saved.usabilitySessions ?? []).map((session) => ({
      ...session,
      taskRuns: session.taskRuns.map((run, index) => ({ ...run, id: run.id ?? `migrated-run-${index}-${run.startedAt}` })),
      responses: session.responses.map((response) => ({ ...response, runId: response.runId ?? session.taskRuns.find((run) => run.taskId === response.taskId)?.id ?? `migrated-response-${response.taskId}` })),
    })),
    currentUsabilitySessionId: saved.currentUsabilitySessionId,
    researchNow: saved.researchNow,
  } as AppData;
}

export function saveAppData(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function resetAppData() {
  const data = createSeedData();
  saveAppData(data);
  return data;
}

export const localRepositories = (read: () => AppData, write: (data: AppData) => void) => ({
  inventory: {
    getAll: () => read().inventory,
    save: (inventory: FoodItem[]) => write({ ...read(), inventory }),
  } satisfies InventoryRepository,
  recipes: {
    getAll: () => read().recipes,
    save: (recipes: Recipe[]) => write({ ...read(), recipes }),
  } satisfies RecipeRepository,
  preferences: {
    getProfile: () => read().profile,
    saveProfile: (profile: UserProfile) => write({ ...read(), profile }),
  } satisfies PreferenceRepository,
  interventions: {
    getAll: () => read().interventions,
    save: (interventions: Intervention[]) => write({ ...read(), interventions }),
    savePreferences: (notifications: NotificationPreference) => write({ ...read(), profile: { ...read().profile, notifications } }),
  } satisfies InterventionRepository,
});
