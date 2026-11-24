import { describe, expect, it } from 'vitest';
import type { UsabilityEvent, UsabilityTaskRun } from './types';
import { calculateTaskMetrics, taskCompletesFromEvent, usabilityTasks } from './usability';

describe('usability task definitions', () => {
  it('provides all seven deterministic tasks', () => {
    expect(usabilityTasks.map((task) => task.id)).toEqual(['task-1', 'task-2', 'task-3', 'task-4', 'task-5', 'task-6', 'task-7']);
  });

  it('uses distinct success events for each product-loop task', () => {
    expect(taskCompletesFromEvent('task-1', 'recipe_opened')).toBe(true);
    expect(taskCompletesFromEvent('task-1', 'meal_context_changed', { choice: 'eating_out' })).toBe(true);
    expect(taskCompletesFromEvent('task-2', 'uncertainty_resolved')).toBe(true);
    expect(taskCompletesFromEvent('task-3', 'shopping_item_added')).toBe(true);
    expect(taskCompletesFromEvent('task-4', 'shopping_item_reconciled')).toBe(true);
    expect(taskCompletesFromEvent('task-5', 'cooking_completed')).toBe(true);
    expect(taskCompletesFromEvent('task-6', 'leftover_saved', { portions: 1 })).toBe(true);
    expect(taskCompletesFromEvent('task-7', 'leftover_selected')).toBe(true);
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
