import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { createConsumerData } from '../data/seed';
import { saveAppData } from '../data/repositories';
import { AppStateProvider } from '../state/AppState';

const importRoute = vi.hoisted(() => ({ shouldThrow: true }));

vi.mock('../pages/RecipeImportPage', async () => {
  const { useSearchParams } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    RecipeImportPage: () => {
      const [params] = useSearchParams();
      if (importRoute.shouldThrow) throw new Error('controlled recipe import render failure');
      if (params.get('recovery') === 'text') return <section><h1>Add a recipe</h1><label>Recipe text<textarea /></label></section>;
      return <section aria-label="Recipe import options"><h1>Add a recipe</h1></section>;
    },
  };
});

function renderApp(path = '/recipes/import', data = createConsumerData()) {
  data.profile.onboardingComplete = true;
  saveAppData(data);
  return render(<MemoryRouter initialEntries={[path]}><AppStateProvider><App /></AppStateProvider></MemoryRouter>);
}

beforeEach(() => {
  importRoute.shouldThrow = true;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

it('preserves the FridgeMind shell and returns to fresh import choices on retry', async () => {
  renderApp();
  expect(screen.getByText('FridgeMind')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Something went wrong while reading this recipe.' })).toBeVisible();
  expect(screen.getByText(/image wasn’t saved/i)).toBeVisible();
  importRoute.shouldThrow = false;
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('region', { name: 'Recipe import options' })).toBeVisible();
});

it('routes recovery directly into the existing text import mode', async () => {
  renderApp();
  importRoute.shouldThrow = false;
  await userEvent.click(screen.getByRole('link', { name: 'Paste recipe text' }));
  expect(await screen.findByLabelText('Recipe text')).toBeVisible();
});

it('navigates back to Recipes without relying on browser history', async () => {
  renderApp();
  await userEvent.click(screen.getByRole('link', { name: 'Back to Recipes' }));
  expect(await screen.findByRole('heading', { name: 'Recipes' })).toBeVisible();
});

it('preserves a participant Task 3 session and its prior events through recovery', async () => {
  const data = createConsumerData();
  data.experienceMode = 'research';
  data.currentUsabilitySessionId = 'participant-session';
  data.participantStudySessionId = 'participant-session';
  data.usabilitySessions = [{
    id: 'participant-session', mode: 'participant', participantId: 'P03', startedAt: '2026-11-25T10:00:00.000Z', currentTaskId: 'task-3',
    taskRuns: [{ id: 'task-3-run', taskId: 'task-3', status: 'running', startedAt: '2026-11-25T10:05:00.000Z', askPostTaskQuestions: true }],
    events: [{ id: 'prior-task-event', taskId: 'task-3', type: 'task_started', at: '2026-11-25T10:05:00.000Z' }],
    responses: [], observations: [],
  }];
  renderApp('/recipes/import', data);

  expect(screen.getByRole('button', { name: 'I can’t complete this task' })).toBeVisible();
  importRoute.shouldThrow = false;
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('region', { name: 'Recipe import options' })).toBeVisible();

  await waitFor(() => {
    const saved = JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!);
    const session = saved.usabilitySessions.find((entry: { id: string }) => entry.id === 'participant-session');
    expect(saved.currentUsabilitySessionId).toBe('participant-session');
    expect(saved.participantStudySessionId).toBe('participant-session');
    expect(session.participantId).toBe('P03');
    expect(session.currentTaskId).toBe('task-3');
    expect(session.taskRuns).toContainEqual(expect.objectContaining({ id: 'task-3-run', taskId: 'task-3', status: 'running' }));
    expect(session.events).toContainEqual(expect.objectContaining({ id: 'prior-task-event', type: 'task_started' }));
  });
});
