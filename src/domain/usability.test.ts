import { describe, expect, it } from 'vitest';
import type { UsabilityEvent, UsabilityTaskRun } from './types';
import { createSeedData } from '../data/seed';
import { calculateTaskMetrics, recipeOpenedMetadata, showsResearchUi, studyAssetUrl, taskCompletesFromEvent, usabilityTasks } from './usability';

describe('usability task definitions', () => {
  it('provides all seven deterministic tasks', () => {
    expect(usabilityTasks.map((task) => task.id)).toEqual(['task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7']);
  });

  it('uses distinct success events for each current-value task', () => {
    expect(taskCompletesFromEvent('task-1', 'quick_add_parsed')).toBe(true);
    expect(taskCompletesFromEvent('task-2', 'quick_add_parsed')).toBe(false);
    expect(taskCompletesFromEvent('task-2', 'food_batch_added', { count: 4, source: 'quick' })).toBe(true);
    expect(taskCompletesFromEvent('task-2', 'food_batch_added', { count: 0, source: 'quick' })).toBe(false);
    expect(taskCompletesFromEvent('task-2', 'food_batch_added', { count: 4, source: 'receipt' })).toBe(false);
    expect(taskCompletesFromEvent('task-3', 'ocr_parse_reviewed')).toBe(false);
    expect(taskCompletesFromEvent('task-3', 'personal_recipe_saved', { recipeId: 'recipe-1', source: 'ocr' })).toBe(true);
    expect(taskCompletesFromEvent('task-3', 'personal_recipe_saved', { recipeId: 'recipe-2', source: 'manual' })).toBe(false);
    expect(taskCompletesFromEvent('task-3', 'ocr_fallback_used', { fallback: 'manual' })).toBe(false);
    expect(taskCompletesFromEvent('task-4', 'recipe_opened', { availability: 'READY' })).toBe(true);
    expect(taskCompletesFromEvent('task-4', 'recipe_opened', { availability: 'MISSING_ITEMS' })).toBe(false);
    expect(taskCompletesFromEvent('task-5', 'recipe_opened', { usesAttentionFood: true })).toBe(true);
    expect(taskCompletesFromEvent('task-5', 'recipe_opened', { usesAttentionFood: false })).toBe(false);
    expect(taskCompletesFromEvent('task-5', 'food_attention_handled')).toBe(true);
    expect(taskCompletesFromEvent('task-6', 'cooking_completed')).toBe(true);
    expect(taskCompletesFromEvent('task-7', 'leftover_selected')).toBe(true);
  });

  it('provides Task 3 material through a base-path-safe definition', () => {
    expect(usabilityTasks[2].studyAsset).toEqual({ type: 'image', path: '/study/recipe-screenshot.png', label: 'Test recipe' });
    expect(studyAssetUrl(usabilityTasks[2].studyAsset!.path, '/FridgeMind/')).toBe('/FridgeMind/study/recipe-screenshot.png');
  });
});

describe('usability evidence metadata', () => {
  it('derives recipe availability and attention relevance from domain state', () => {
    const data = createSeedData();
    const spinach = recipeOpenedMetadata(data, 'recipe-spinach-pasta');
    const tomato = recipeOpenedMetadata(data, 'recipe-tomato-pasta');
    expect(spinach).toMatchObject({ availability: 'READY_WITH_UNCERTAINTY', usesAttentionFood: true });
    expect(tomato.usesAttentionFood).toBe(false);
  });

  it('hides research UI only for active participant sessions', () => {
    const data = createSeedData(); data.experienceMode = 'research';
    data.currentUsabilitySessionId = 'participant';
    data.usabilitySessions = [{ id: 'participant', mode: 'participant', startedAt: new Date().toISOString(), taskRuns: [], events: [], responses: [], observations: [] }];
    expect(showsResearchUi(data)).toBe(false);
    data.usabilitySessions[0].mode = 'researcher';
    expect(showsResearchUi(data)).toBe(true);
  });
});

describe('usability metrics', () => {
  it('counts friction indicators without creating a quality score', () => {
    const run: UsabilityTaskRun = { id: 'run-1', taskId: 'task-2', status: 'completed', startedAt: '2026-11-24T18:00:00Z', completedAt: '2026-11-24T18:00:30Z', askPostTaskQuestions: true };
    const events: UsabilityEvent[] = [
      { id: 'e1', taskId: 'task-2', type: 'page_visited', at: '2026-11-24T18:00:01Z' },
      { id: 'e2', taskId: 'task-2', type: 'back_navigation', at: '2026-11-24T18:00:05Z' },
      { id: 'e3', taskId: 'task-2', type: 'food_corrected', at: '2026-11-24T18:00:10Z' },
      { id: 'e4', taskId: 'task-2', type: 'explanatory_disclosure_opened', at: '2026-11-24T18:00:15Z' },
      { id: 'e5', taskId: 'task-2', type: 'dead_end_marked', at: '2026-11-24T18:00:20Z' },
      { id: 'e6', taskId: 'task-2', type: 'uncertainty_resolved', at: '2026-11-24T18:00:29Z' },
    ];
    expect(calculateTaskMetrics(run, events)).toEqual({
      completion: true,
      interactions: 5,
      backNavigations: 1,
      seconds: 30,
      corrections: 1,
      deadEnds: 1,
      disclosures: 1,
    });
  });
});
