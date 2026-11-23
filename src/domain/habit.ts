import type { HabitInference } from './types';

export function respondToHabit(habit: HabitInference, action: 'confirm' | 'not_now' | 'disable'): HabitInference {
  return { ...habit, status: action === 'confirm' ? 'confirmed' : action === 'disable' ? 'disabled' : 'not_now' };
}
