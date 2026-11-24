import type { UsabilityEvent, UsabilityEventType, UsabilityTaskId, UsabilityTaskRun } from './types';

export interface UsabilityTaskDefinition {
  id: UsabilityTaskId;
  title: string;
  scenario: string;
  prompt: string;
  success: string;
  startPath: string;
  capture: string[];
}

export const usabilityTasks: UsabilityTaskDefinition[] = [
  {
    id: 'task-1',
    title: 'Decide what to cook',
    scenario: 'Evening; mushrooms and spinach need attention, and cream quantity is unknown.',
    prompt: "You've just got home and want to make dinner. Use FridgeMind to decide what you would make.",
    success: 'A recipe is opened, or the participant explicitly chooses not to cook.',
    startPath: '/',
    capture: ['Recipe opened', 'Explanation opened', 'Meal context changed', 'Steps', 'Backtracking'],
  },
  {
    id: 'task-2',
    title: 'Handle uncertain stock',
    scenario: 'Mushroom Pasta requires cream; cream exists but its quantity is unknown.',
    prompt: 'Continue preparing this meal.',
    success: 'The cream uncertainty is resolved and recipe feasibility becomes clear.',
    startPath: '/recipes/recipe-mushroom-pasta',
    capture: ['Prompt response', 'Cancellation/backtracking', 'Manual fridge edit'],
  },
  {
    id: 'task-3',
    title: 'Resolve a missing ingredient',
    scenario: 'Mushroom Pasta has one genuine shopping gap.',
    prompt: 'You still want to make this meal. Work out what you need to buy.',
    success: 'The missing item reaches Shopping.',
    startPath: '/recipes/recipe-mushroom-pasta',
    capture: ['Missing-state understanding', 'Ingredients opened', 'Add missing items', 'Duplicate attempts'],
  },
  {
    id: 'task-4',
    title: 'Add purchased food back',
    scenario: 'The missing mushrooms have supposedly been purchased.',
    prompt: "You've returned from the shop. Update FridgeMind.",
    success: 'The purchased item is reconciled into inventory.',
    startPath: '/',
    capture: ['Route taken', 'Purchased amount understanding', 'Manual duplicate attempt', 'Amount edited'],
  },
  {
    id: 'task-5',
    title: 'Cook and update inventory',
    scenario: 'Mushroom Pasta is feasible for two portions.',
    prompt: "Now cook the meal and tell FridgeMind when you're done.",
    success: 'The cooking session completes and inventory updates.',
    startPath: '/recipes/recipe-mushroom-pasta',
    capture: ['Start cooking', 'Instructions expectation', 'Completion understanding', 'Recipe correction'],
  },
  {
    id: 'task-6',
    title: 'Save leftovers',
    scenario: 'Mushroom Pasta makes two portions.',
    prompt: "You've eaten one portion and want to keep the other for tomorrow.",
    success: 'One leftover portion is saved.',
    startPath: '/recipes/recipe-mushroom-pasta',
    capture: ['Leftover action discovery', '1 now + 1 later understanding', 'Manual leftover expectation'],
  },
  {
    id: 'task-7',
    title: 'Return the next day',
    scenario: 'Research date advances by one day; one Mushroom Pasta portion is in the fridge.',
    prompt: "It's the next evening. Decide what to eat.",
    success: 'The participant selects or explicitly recognises the existing leftover.',
    startPath: '/',
    capture: ['Leftover priority understanding', 'Direct Recipes navigation', 'Today usefulness'],
  },
];

export const observationOptions = [
  'Hesitated on Today',
  'Did not notice meal context',
  'Misunderstood uncertainty',
  'Misunderstood missing ingredient',
  'Could not find Shopping',
  'Added duplicate fridge item',
  'Confused cooking completion',
  'Missed leftover flow',
  'Ignored recommendation explanation',
  'Notification/rescue felt intrusive',
  'Inventory maintenance felt burdensome',
  'Other',
] as const;

export const interviewPrompts = [
  'What did you think FridgeMind was mainly trying to help you with?',
  'Was there anything you felt you had to update too manually?',
  'Did any recommendation feel surprising or confusing?',
  'Did you understand when FridgeMind was unsure about your fridge?',
  'How did you feel about the reminders to use food soon?',
  'Would you normally keep your fridge this up to date?',
  'Was saving leftovers useful or unnecessary?',
  'When would you stop using this app?',
  'What would make you trust its recommendations more?',
  'If you could remove one step, which would it be?',
];

export function taskCompletesFromEvent(taskId: UsabilityTaskId, type: UsabilityEventType, metadata?: UsabilityEvent['metadata']) {
  if (taskId === 'task-1') return type === 'recipe_opened' || (type === 'meal_context_changed' && metadata?.choice === 'eating_out');
  if (taskId === 'task-2') return type === 'uncertainty_resolved';
  if (taskId === 'task-3') return type === 'shopping_item_added';
  if (taskId === 'task-4') return type === 'shopping_item_reconciled';
  if (taskId === 'task-5') return type === 'cooking_completed';
  if (taskId === 'task-6') return type === 'leftover_saved' && metadata?.portions === 1;
  if (taskId === 'task-7') return type === 'leftover_selected';
  return false;
}

export function calculateTaskMetrics(run: UsabilityTaskRun, events: UsabilityEvent[]) {
  const endedAt = run.completedAt ?? run.abandonedAt;
  const taskEvents = events.filter((event) => {
    const eventTime = new Date(event.at).getTime();
    return event.taskId === run.taskId && eventTime >= new Date(run.startedAt).getTime() && (!endedAt || eventTime <= new Date(endedAt).getTime());
  });
  const interactionTypes: UsabilityEventType[] = ['primary_cta_clicked', 'secondary_cta_clicked', 'back_navigation', 'more_opened', 'recommendation_explanation_opened', 'explanatory_disclosure_opened', 'recipe_opened', 'meal_context_changed', 'uncertainty_resolved', 'food_corrected', 'shopping_item_added', 'duplicate_shopping_attempt', 'shopping_item_reconciled', 'duplicate_fridge_attempt', 'cooking_started', 'recipe_correction_opened', 'cooking_completed', 'leftover_saved', 'leftover_selected', 'dead_end_marked'];
  return {
    completion: run.status === 'completed',
    interactions: taskEvents.filter((event) => interactionTypes.includes(event.type)).length,
    backNavigations: taskEvents.filter((event) => event.type === 'back_navigation').length,
    seconds: endedAt ? Math.max(0, Math.round((new Date(endedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)) : null,
    corrections: taskEvents.filter((event) => event.type === 'food_corrected' || event.type === 'recipe_correction_opened').length,
    deadEnds: taskEvents.filter((event) => event.type === 'dead_end_marked').length,
    disclosures: taskEvents.filter((event) => event.type === 'more_opened' || event.type === 'recommendation_explanation_opened' || event.type === 'explanatory_disclosure_opened').length,
  };
}
