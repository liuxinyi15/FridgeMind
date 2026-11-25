import { describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import { createUsabilityExportPayload, participantResultsFilename, sanitiseParticipantId } from './usabilityExport';

describe('participant usability export', () => {
  it('sanitises anonymous IDs and creates the requested filename', () => {
    expect(sanitiseParticipantId('  P03 <script> ')).toBe('P03script');
    expect(participantResultsFilename('P03')).toBe('FridgeMind_P03_results.json');
  });

  it('exports one local participant session with completion evidence and metrics', () => {
    const data = createSeedData();
    data.usabilitySessions = [{
      id: 'session-1', mode: 'participant', participantId: 'P01', startedAt: '2026-11-24T10:00:00Z',
      taskRuns: [{ id: 'run-1', taskId: 'task-1', status: 'completed', startedAt: '2026-11-24T10:01:00Z', completedAt: '2026-11-24T10:02:00Z', automaticSuccessAt: '2026-11-24T10:01:30Z', participantDeclaredAt: '2026-11-24T10:02:00Z', askPostTaskQuestions: true }],
      events: [], responses: [], observations: [],
    }];
    const payload = createUsabilityExportPayload(data.usabilitySessions);
    expect(payload.format).toBe('fridgemind-usability-v1');
    expect(payload.storage).toBe('local-only');
    expect(payload.sessions).toHaveLength(1);
    expect(payload.sessions[0].participantId).toBe('P01');
    expect(payload.sessions[0].taskRuns[0]).toMatchObject({ automaticSuccess: true, participantDeclaredCompletion: true, metrics: { completion: true } });
  });
});
