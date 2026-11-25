import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { createConsumerData } from '../data/seed';
import { saveAppData } from '../data/repositories';
import { AppStateProvider } from '../state/AppState';

const importRoute = vi.hoisted(() => ({ recipeShouldThrow: true, foodShouldThrow: true }));

vi.mock('../pages/RecipeImportPage', async () => {
  const { useSearchParams } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    RecipeImportPage: () => {
      const [params] = useSearchParams();
      if (importRoute.recipeShouldThrow) throw new Error('controlled recipe import render failure');
      if (params.get('recovery') === 'text') return <section><h1>Add a recipe</h1><label>Recipe text<textarea /></label></section>;
      return <section aria-label="Recipe import options"><h1>Add a recipe</h1></section>;
    },
  };
});

vi.mock('../pages/AddFoodPage', async () => {
  const { useSearchParams } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    AddFoodPage: () => {
      const [params] = useSearchParams();
      if (importRoute.foodShouldThrow) throw new Error('controlled add food render failure');
      if (params.get('recovery') === 'quick') return <section><h1>Quick add foods</h1><label>Food names<textarea /></label></section>;
      return <section aria-label="Add food options"><h1>Add what you bought</h1></section>;
    },
  };
});

function renderApp(path = '/recipes/import', data = createConsumerData()) {
  data.profile.onboardingComplete = true;
  saveAppData(data);
  return render(<MemoryRouter initialEntries={[path]}><AppStateProvider><App /></AppStateProvider></MemoryRouter>);
}

beforeEach(() => {
  importRoute.recipeShouldThrow = true;
  importRoute.foodShouldThrow = true;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

it('preserves the FridgeMind shell and returns to fresh import choices on retry', async () => {
  renderApp();
  expect(screen.getByText('FridgeMind')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Something went wrong while reading this recipe.' })).toBeVisible();
  expect(screen.getByText(/image wasn’t saved/i)).toBeVisible();
  importRoute.recipeShouldThrow = false;
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('region', { name: 'Recipe import options' })).toBeVisible();
});

it('routes recovery directly into the existing text import mode', async () => {
  renderApp();
  importRoute.recipeShouldThrow = false;
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
  importRoute.recipeShouldThrow = false;
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

it('keeps the shell visible and returns Add Food to fresh choices on retry', async () => {
  renderApp('/fridge/add');
  expect(screen.getByText('FridgeMind')).toBeVisible();
  expect(screen.getByRole('heading', { name: 'Something went wrong while reading this image.' })).toBeVisible();
  expect(screen.getByText(/Nothing was added to your fridge/i)).toBeVisible();
  importRoute.foodShouldThrow = false;
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('region', { name: 'Add food options' })).toBeVisible();
});

it('routes Add Food recovery directly into Quick Add', async () => {
  renderApp('/fridge/add');
  importRoute.foodShouldThrow = false;
  await userEvent.click(screen.getByRole('link', { name: 'Quick add foods' }));
  expect(await screen.findByLabelText('Food names')).toBeVisible();
});

it('navigates Add Food recovery directly back to My Fridge', async () => {
  renderApp('/fridge/add');
  await userEvent.click(screen.getByRole('link', { name: 'Back to Fridge' }));
  expect(await screen.findByRole('heading', { name: 'My Fridge' })).toBeVisible();
});

it('preserves a participant Task 2 session and prior events through Add Food recovery', async () => {
  const data = createConsumerData();
  data.experienceMode = 'research';
  data.currentUsabilitySessionId = 'food-participant-session';
  data.participantStudySessionId = 'food-participant-session';
  data.usabilitySessions = [{
    id: 'food-participant-session', mode: 'participant', participantId: 'P02', startedAt: '2026-11-25T09:00:00.000Z', currentTaskId: 'task-2',
    taskRuns: [{ id: 'task-2-run', taskId: 'task-2', status: 'running', startedAt: '2026-11-25T09:05:00.000Z', askPostTaskQuestions: true }],
    events: [{ id: 'prior-food-event', taskId: 'task-2', type: 'task_started', at: '2026-11-25T09:05:00.000Z' }],
    responses: [], observations: [],
  }];
  renderApp('/fridge/add', data);

  expect(screen.getByRole('button', { name: 'I can’t complete this task' })).toBeVisible();
  importRoute.foodShouldThrow = false;
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(await screen.findByRole('region', { name: 'Add food options' })).toBeVisible();
  await waitFor(() => {
    const saved = JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!);
    const session = saved.usabilitySessions.find((entry: { id: string }) => entry.id === 'food-participant-session');
    expect(saved.currentUsabilitySessionId).toBe('food-participant-session');
    expect(saved.participantStudySessionId).toBe('food-participant-session');
    expect(session.participantId).toBe('P02');
    expect(session.currentTaskId).toBe('task-2');
    expect(session.taskRuns).toContainEqual(expect.objectContaining({ id: 'task-2-run', taskId: 'task-2', status: 'running' }));
    expect(session.events).toContainEqual(expect.objectContaining({ id: 'prior-food-event', type: 'task_started' }));
  });
});
