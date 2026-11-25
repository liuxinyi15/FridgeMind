import { fireEvent, render, screen } from '@testing-library/react';
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
import { AddFoodPage } from '../pages/AddFoodPage';
import { FridgePage } from '../pages/FridgePage';
import { RecipeArtwork, recipeImageCandidates } from './RecipeArtwork';

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
    await userEvent.click(screen.getByText('More options'));
    expect(screen.getByText('The use-by date is tomorrow.')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.getByText('Reminder dismissed')).toBeVisible();
  });
});

describe('Habit insight', () => {
  it('requires an explicit confirmation', async () => {
    renderWithState(<HabitHarness />);
    await userEvent.click(screen.getByText('What we noticed'));
    expect(screen.getByText(/Nothing changes until you confirm/)).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(screen.getByText('Change confirmed')).toBeVisible();
  });
});

describe('Recipe Match', () => {
  it('shows available, partial and uncertain groups', () => {
    render(<MemoryRouter initialEntries={['/recipes/recipe-mushroom-pasta']}><AppStateProvider><Routes><Route path="/recipes/:recipeId" element={<RecipeDetailPage />} /></Routes></AppStateProvider></MemoryRouter>);
    expect(screen.getByText('In your fridge')).toBeVisible();
    expect(screen.getByText('Running low')).toBeVisible();
    expect(screen.getByText('Check first')).toBeVisible();
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

describe('Add Food permission fallback', () => {
  it('explains image access before continuing and preserves manual entry', async () => {
    render(<MemoryRouter initialEntries={['/fridge/add']}><AppStateProvider><Routes><Route path="/fridge/add" element={<AddFoodPage />} /><Route path="/fridge" element={<div>Fridge</div>} /></Routes></AppStateProvider></MemoryRouter>);
    await userEvent.click(screen.getByRole('button', { name: /Photo \+ item names/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Take a photo' }));
    expect(screen.getByRole('dialog', { name: 'Open your camera?' })).toBeVisible();
    await userEvent.click(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: /Enter manually/ }));
    expect(screen.getByLabelText('Food name')).toBeVisible();
    await userEvent.type(screen.getByLabelText('Food name'), 'Tomatoes');
    expect(screen.getByRole('button', { name: 'Save to My Fridge' })).toBeEnabled();
  });
});

describe('Fridge filters', () => {
  it('searches and filters inventory without losing correction links', async () => {
    renderWithState(<FridgePage />);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search your fridge' }), 'cream');
    expect(screen.getByRole('link', { name: /Cream, amount unknown/ })).toBeVisible();
    expect(screen.queryByText('Spinach')).not.toBeInTheDocument();
    await userEvent.clear(screen.getByRole('searchbox', { name: 'Search your fridge' }));
    await userEvent.click(screen.getByRole('button', { name: /Needs check/ }));
    expect(screen.getByText('Cream')).toBeVisible();
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
  });
});

describe('Recipe artwork fallbacks', () => {
  it('keeps the requested source hierarchy', () => {
    const recipe = { ...createSeedData().recipes[0], image: '/existing.jpg', importedImage: '/imported.jpg', builtInImage: '/built-in.jpg' };
    expect(recipeImageCandidates(recipe)).toEqual(['/existing.jpg', '/imported.jpg', '/built-in.jpg']);
  });

  it('falls through broken sources to complete branded artwork', () => {
    const recipe = { ...createSeedData().recipes[0], image: '/broken-existing.jpg', importedImage: '/broken-import.jpg', builtInImage: '/broken-built-in.jpg' };
    render(<RecipeArtwork recipe={recipe} alt="Mushroom Pasta artwork" />);
    const image = () => screen.queryByRole('img', { name: 'Mushroom Pasta artwork' });
    expect(image()).toHaveAttribute('src', '/broken-existing.jpg');
    fireEvent.error(image()!);
    expect(image()).toHaveAttribute('src', '/broken-import.jpg');
    fireEvent.error(image()!);
    expect(image()).toHaveAttribute('src', '/broken-built-in.jpg');
    fireEvent.error(image()!);
    expect(screen.getByRole('img', { name: 'Mushroom Pasta artwork' })).not.toHaveAttribute('src');
    expect(screen.getByText('Mushroom Pasta')).toBeVisible();
  });

  it('renders imported recipes without an image', () => {
    const recipe = { ...createSeedData().recipes[0], id: 'user-recipe', source: 'imported' as const, image: undefined, importedImage: undefined, builtInImage: undefined };
    render(<RecipeArtwork recipe={recipe} alt="User recipe artwork" />);
    expect(screen.getByRole('img', { name: 'User recipe artwork' })).toBeVisible();
    expect(screen.getByText('Mushroom Pasta')).toBeVisible();
  });
});
