import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSeedData } from '../data/seed';
import { saveAppData } from '../data/repositories';
import { AppStateProvider } from '../state/AppState';
import { useAppState } from '../state/AppState';
import { UseSoonCard } from './UseSoonCard';
import { HabitInsight } from './HabitInsight';
import { RecipeDetailPage } from '../pages/RecipeDetailPage';
import { ShoppingPage } from '../pages/ShoppingPage';

function renderWithState(ui: React.ReactNode) {
  return render(<MemoryRouter><AppStateProvider>{ui}</AppStateProvider></MemoryRouter>);
}

function UseSoonHarness() {
  const { data } = useAppState();
  return <UseSoonCard food={data.inventory[0]} intervention={data.interventions[0]} />;
}

function HabitHarness() {
  const { data } = useAppState();
  return <HabitInsight habit={data.habits[0]} />;
}

beforeEach(() => {
  const data = createSeedData(); data.profile.onboardingComplete = true; saveAppData(data);
});

describe('Use Soon card', () => {
  it('explains itself and lets the user dismiss it', async () => {
    renderWithState(<UseSoonHarness />);
    await userEvent.click(screen.getByText('Why am I seeing this?'));
    expect(screen.getByText('The use-by date is tomorrow.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByText('Reminder dismissed')).toBeVisible();
  });
});

describe('Habit insight', () => {
  it('requires an explicit confirmation', async () => {
    renderWithState(<HabitHarness />);
    expect(screen.getByText(/Nothing changes until you confirm/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByText('Change confirmed')).toBeVisible();
  });
});

describe('Recipe Match', () => {
  it('shows available, partial and uncertain groups', () => {
    render(<MemoryRouter initialEntries={['/recipes/recipe-mushroom-pasta']}><AppStateProvider><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></AppStateProvider></MemoryRouter>);
    expect(screen.getByText('Already have')).toBeVisible();
    expect(screen.getByText('Partially available')).toBeVisible();
    expect(screen.getByText('Needs confirmation')).toBeVisible();
  });
});

describe('Shopping List', () => {
  it('shows an editable explained item', async () => {
    const data = createSeedData();
    data.profile.onboardingComplete = true;
    data.shopping = [{ id: 'shop-1', ingredientName: 'Mushrooms', canonicalName: 'mushroom', quantity: 80, unit: 'g', recipeId: 'recipe-mushroom-pasta', recipeName: 'Mushroom Pasta', reason: 'Needed for Mushroom Pasta. You have 120g; the recipe requires 200g.', bought: false }];
    saveAppData(data);
    renderWithState(<ShoppingPage />);
    await userEvent.click(screen.getByRole('button', { name: 'Why is this suggested?' }));
    expect(screen.getByText(/You have 120g/)).toBeVisible();
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();
  });
});
