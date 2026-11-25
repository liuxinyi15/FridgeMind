import { matchRecipe, recipeAvailability } from './inventory';
import type { AppData, UsabilityEvent, UsabilityEventType, UsabilityTaskId, UsabilityTaskRun } from './types';

export interface UsabilityStudyAsset {
  type: 'image';
  path: string;
  label: string;
}

export interface UsabilityTaskDefinition {
  id: UsabilityTaskId;
  title: string;
  scenario: string;
  prompt: string;
  success: string;
  startPath: string;
  capture: string[];
  studyAsset?: UsabilityStudyAsset;
}

export const usabilityTasks: UsabilityTaskDefinition[] = [
  {
    id: 'task-1',
    title: 'Activation',
    scenario: 'A genuine empty first run with built-in ideas but no personal food or recipes.',
    prompt: "You've just started using FridgeMind. Set it up so that it could help you decide what to eat later.",
    success: 'Food is parsed, a recipe import reaches review, or an idea is meaningfully explored.',
    startPath: '/',
    capture: ['Activation choice', 'Value comprehension', 'Where they begin', 'Backtracking'],
  },
  {
    id: 'task-2',
    title: 'Low-friction food entry',
    scenario: 'The participant has just bought spinach, mushrooms, chicken and pasta.',
    prompt: "You've just bought spinach, mushrooms, chicken and pasta. Add enough information for FridgeMind to be useful later.",
    success: 'Quick Add parses the foods for review.',
    startPath: '/fridge/add',
    capture: ['Quick Add discovery', 'Details entered', 'Unknown quantity acceptance', 'Perceived burden'],
  },
  {
    id: 'task-3',
    title: 'Personal recipe import',
    scenario: 'A readable Creamy Spinach Pasta screenshot is provided inside the import flow.',
    prompt: 'This is a recipe you already like. Add it to FridgeMind.',
    success: 'OCR output reaches structured review.',
    startPath: '/recipes/import',
    capture: ['OCR discovery', 'Review and correction', 'Fallback behaviour', 'Perceived effort'],
    studyAsset: { type: 'image', path: '/study/recipe-screenshot.png', label: 'Test recipe' },
  },
  {
    id: 'task-4',
    title: 'No-shopping decision',
    scenario: 'The fridge and a personal Mushroom Pasta recipe form a genuinely READY match.',
    prompt: "You don't want to buy anything else tonight. Find something you could make with what you already have.",
    success: 'A READY recipe is opened.',
    startPath: '/',
    capture: ['Today discovery', 'No-shopping semantics', 'Personal recipe visibility', 'Meal choice'],
  },
  {
    id: 'task-5',
    title: 'Food attention',
    scenario: 'Spinach is visibly in Needs attention with rescue and handling options.',
    prompt: 'One of your foods may be forgotten soon. Decide what you would do.',
    success: 'A rescue recipe is opened or the food is handled.',
    startPath: '/',
    capture: ['Attention discovery', 'Recipe rescue', 'Storage option', 'Dismissal or handling'],
  },
  {
    id: 'task-6',
    title: 'Cooking loop',
    scenario: 'A READY personal Mushroom Pasta recipe makes two portions.',
    prompt: "You've chosen dinner. Use FridgeMind while you make it and keep the app up to date when you're finished.",
    success: 'Cooking completes and inventory is updated, with the leftover choice observed.',
    startPath: '/recipes/recipe-mushroom-pasta',
    capture: ['Cooking start', 'Uncertainty', 'Completion', 'Deduction', 'Leftover creation'],
  },
  {
    id: 'task-7',
    title: 'Return the next day',
    scenario: 'Research date advances by one day; a leftover and personal recipes are available.',
    prompt: "It's the next day. Use FridgeMind to decide what makes sense for your next meal.",
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

export function taskCompletesFromEvent(taskId: UsabilityTaskId, type: UsabilityEventType, _metadata?: UsabilityEvent['metadata']) {
  if (taskId === 'task-1') return type === 'quick_add_parsed' || type === 'ocr_parse_reviewed' || type === 'recipe_opened';
  if (taskId === 'task-2') return type === 'quick_add_parsed';
  if (taskId === 'task-3') return type === 'ocr_parse_reviewed';
  if (taskId === 'task-4') return type === 'recipe_opened' && _metadata?.availability === 'READY';
  if (taskId === 'task-5') return (type === 'recipe_opened' && _metadata?.usesAttentionFood === true) || type === 'food_attention_handled';
  if (taskId === 'task-6') return type === 'cooking_completed';
  if (taskId === 'task-7') return type === 'leftover_selected';
  return false;
}

export function activeUsabilitySession(data: Pick<AppData, 'currentUsabilitySessionId' | 'usabilitySessions'>) {
  return data.usabilitySessions.find((session) => session.id === data.currentUsabilitySessionId && !session.completedAt);
}

export function isParticipantStudy(data: Pick<AppData, 'currentUsabilitySessionId' | 'usabilitySessions'>) {
  return activeUsabilitySession(data)?.mode === 'participant';
}

export function showsResearchUi(data: Pick<AppData, 'experienceMode' | 'currentUsabilitySessionId' | 'usabilitySessions'>) {
  return data.experienceMode === 'research' && !isParticipantStudy(data);
}

export function recipeOpenedMetadata(data: AppData, recipeId: string) {
  const recipe = data.recipes.find((item) => item.id === recipeId);
  if (!recipe) return { recipeId, availability: 'NOT_PRACTICAL' as const, usesAttentionFood: false };
  const matches = matchRecipe(recipe, data.profile.routine.typicalServings, data.inventory, data.substitutions);
  const attentionFoods = new Set(data.inventory.filter((food) => food.kind !== 'leftover' && food.batches.some((batch) => batch.state === 'use_soon')).map((food) => food.canonicalName));
  const usesAttentionFood = recipe.ingredients.some((ingredient) => attentionFoods.has(data.substitutions[`${recipe.id}:${ingredient.id}`] ?? ingredient.canonicalName));
  return { recipeId, availability: recipeAvailability(matches, recipe.minutes), usesAttentionFood };
}

export function studyAssetUrl(path: string, baseUrl: string) {
  return `${baseUrl.replace(/\/?$/, '/')}${path.replace(/^\/+/, '')}`;
}

export function calculateTaskMetrics(run: UsabilityTaskRun, events: UsabilityEvent[]) {
  const endedAt = run.completedAt ?? run.abandonedAt;
  const taskEvents = events.filter((event) => {
    const eventTime = new Date(event.at).getTime();
    return event.taskId === run.taskId && eventTime >= new Date(run.startedAt).getTime() && (!endedAt || eventTime <= new Date(endedAt).getTime());
  });
  const interactionTypes: UsabilityEventType[] = ['primary_cta_clicked', 'secondary_cta_clicked', 'back_navigation', 'more_opened', 'recommendation_explanation_opened', 'explanatory_disclosure_opened', 'recipe_opened', 'meal_context_changed', 'uncertainty_resolved', 'food_corrected', 'food_attention_handled', 'shopping_item_added', 'duplicate_shopping_attempt', 'shopping_item_reconciled', 'duplicate_fridge_attempt', 'cooking_started', 'recipe_correction_opened', 'cooking_completed', 'leftover_saved', 'leftover_selected', 'dead_end_marked', 'ocr_started', 'ocr_completed', 'ocr_returned_empty', 'ocr_text_corrected', 'ocr_parse_reviewed', 'ocr_fallback_used', 'quick_add_opened', 'quick_add_parsed', 'quick_add_item_edited', 'receipt_ocr_used', 'package_ocr_used'];
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
