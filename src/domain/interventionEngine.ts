import type { InterventionDecision, InventoryConfidence, NotificationPreference } from './types';

export interface InterventionInput {
  foodUrgency: 'high' | 'medium' | 'low';
  inventoryConfidence: InventoryConfidence;
  preferences: NotificationPreference;
  isQuietHours: boolean;
  recentDismissals: number;
  actionability: 'high' | 'low';
  recipeAvailable: boolean;
}

export interface InterventionResult {
  decision: InterventionDecision;
  reasons: string[];
}

export function decideIntervention(input: InterventionInput): InterventionResult {
  if (!input.preferences.proactiveEnabled || input.preferences.mode === 'off' || !input.preferences.useSoon) {
    return { decision: 'show_in_app', reasons: ['Proactive notifications are off, so this stays available in the app.'] };
  }
  if (input.recentDismissals > 0) {
    return { decision: 'stay_silent', reasons: ['A similar reminder was recently dismissed, so it will not repeat now.'] };
  }
  if (input.isQuietHours && input.preferences.quietHoursEnabled) {
    return { decision: 'show_in_app', reasons: ['Quiet hours are active, so no notification is sent.'] };
  }
  if (input.inventoryConfidence === 'needs_confirmation') {
    return { decision: 'ask_for_confirmation', reasons: ['The quantity is uncertain; correction is needed before a stronger suggestion.'] };
  }
  if (input.foodUrgency === 'high' && input.actionability === 'high' && input.recipeAvailable) {
    return {
      decision: input.preferences.mode === 'in_app' ? 'show_in_app' : 'notify',
      reasons: ['The food needs attention soon.', 'A practical recipe or storage action is available.'],
    };
  }
  return { decision: 'show_in_app', reasons: ['The information may help, but it is not urgent or actionable enough to interrupt you.'] };
}
