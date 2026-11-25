import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createConsumerData, createSeedData } from '../data/seed';
import { saveAppData } from '../data/repositories';
import { AppStateProvider } from '../state/AppState';
import { AddFoodPage } from './AddFoodPage';
import { RecipeImportPage } from './RecipeImportPage';
import { recogniseImageText } from '../platform/ocr/browserOcr';

vi.mock('../platform/ocr/browserOcr', () => ({ recogniseImageText: vi.fn() }));
const recognise = vi.mocked(recogniseImageText);
const image = new File(['image'], 'scan.png', { type: 'image/png' });

function renderRoute(path: string, element: React.ReactNode) {
  return render(<MemoryRouter initialEntries={[path]}><AppStateProvider><Routes><Route path={path.split('?')[0]} element={element} /></Routes></AppStateProvider></MemoryRouter>);
}

beforeEach(() => {
  const data = createConsumerData(); data.profile.onboardingComplete = true; saveAppData(data);
  recognise.mockReset();
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() });
});

describe('browser OCR integration boundary', () => {
  it('passes recipe OCR text into parseRecipeText and preserves the raw result', async () => {
    recognise.mockResolvedValue('Spinach pasta\nServes 2\n20 minutes\nIngredients\n180g pasta\n150g spinach\nMethod\n1. Cook and combine.');
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    await screen.findByRole('heading', { name: 'Review what we found' });
    expect(screen.getByLabelText('Recipe name')).toHaveValue('Spinach pasta');
    await userEvent.click(screen.getByText('Original text'));
    expect(screen.getByText(/150g spinach/)).toBeVisible();
  });

  it('offers image-library or file selection without forcing the rear camera', () => {
    renderRoute('/recipes/import', <RecipeImportPage />);
    const input = screen.getByLabelText('Choose recipe image');
    expect(input).toHaveAttribute('accept', 'image/*');
    expect(input).not.toHaveAttribute('capture');
  });

  it('passes receipt OCR text to conservative grocery proposals', async () => {
    recognise.mockResolvedValue('TESCO\nMUSHROOMS 250G\nBABY SPINACH');
    renderRoute('/fridge/add', <AddFoodPage />);
    await userEvent.click(screen.getByRole('button', { name: /Scan receipt/ }));
    await userEvent.upload(screen.getByLabelText('Choose image to scan'), image);
    await screen.findByRole('heading', { name: 'Review receipt items' });
    expect(screen.getByDisplayValue('Mushrooms')).toBeVisible();
    expect(screen.getByDisplayValue('Spinach')).toBeVisible();
  });

  it('shows honest fallback when OCR returns empty', async () => {
    recognise.mockResolvedValue('');
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    expect(await screen.findByRole('heading', { name: /couldn’t read enough text/i })).toBeVisible();
  });

  it('never substitutes a consumer image with the deterministic recipe fixture', async () => {
    recognise.mockResolvedValue('Tomato toast\nIngredients\n2 tomatoes\n2 bread slices\nMethod\n1. Toast and serve.');
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    await waitFor(() => expect(screen.getByLabelText('Recipe name')).toHaveValue('Tomato toast'));
    expect(screen.queryByDisplayValue('Mushroom Pasta')).not.toBeInTheDocument();
  });

  it('keeps the deterministic image fixture available only in Research Mode', async () => {
    const data = createSeedData(); data.profile.onboardingComplete = true; data.experienceMode = 'research'; saveAppData(data);
    render(<MemoryRouter initialEntries={['/recipes/import?fixture=image']}><AppStateProvider><Routes><Route path="/recipes/import" element={<RecipeImportPage />} /></Routes></AppStateProvider></MemoryRouter>);
    expect(await screen.findByText(/simulated recognition fixture/i)).toBeVisible();
    expect(screen.getByLabelText('Recipe name')).toHaveValue('Mushroom Pasta');
    expect(recognise).not.toHaveBeenCalled();
  });
});
