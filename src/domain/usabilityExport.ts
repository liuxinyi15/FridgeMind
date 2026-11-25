import type { AppData, UsabilitySession } from './types';
import { calculateTaskMetrics } from './usability';

export const USABILITY_EXPORT_FORMAT = 'fridgemind-usability-v1';

export function sanitiseParticipantId(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);
}

export function createUsabilityExportPayload(sessions: UsabilitySession[]) {
  return {
    format: USABILITY_EXPORT_FORMAT,
    exportedAt: new Date().toISOString(),
    storage: 'local-only',
    sessions: sessions.map((session) => ({
      ...session,
      taskRuns: session.taskRuns.map((run) => ({
        ...run,
        automaticSuccess: Boolean(run.automaticSuccessAt),
        participantDeclaredCompletion: Boolean(run.participantDeclaredAt),
        metrics: calculateTaskMetrics(run, session.events),
      })),
    })),
  };
}

export function participantResultsFilename(participantId: string) {
  return `FridgeMind_${sanitiseParticipantId(participantId) || 'participant'}_results.json`;
}

export function downloadUsabilityResults(payload: ReturnType<typeof createUsabilityExportPayload>, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function participantSessionFromData(data: AppData) {
  return data.usabilitySessions.find((session) => session.id === data.participantStudySessionId);
}
