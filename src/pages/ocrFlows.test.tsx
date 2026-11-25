import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { createConsumerData, createSeedData } from '../data/seed';
import { saveAppData } from '../data/repositories';
import { AppStateProvider } from '../state/AppState';
import { AddFoodPage } from './AddFoodPage';
import { RecipeImportPage } from './RecipeImportPage';
import { recogniseImageText, recogniseRecipeDocument } from '../platform/ocr/browserOcr';
import { OcrProcessingError } from '../platform/ocr/prepareOcrImage';

vi.mock('../platform/ocr/browserOcr', () => ({ recogniseImageText: vi.fn(), recogniseRecipeDocument: vi.fn() }));
const recognise = vi.mocked(recogniseImageText);
const recogniseRecipe = vi.mocked(recogniseRecipeDocument);
const image = new File(['image'], 'scan.png', { type: 'image/png' });
const recipeResult = (text: string, quality: 'good' | 'review_needed' | 'poor' = 'good') => ({ rawText: text, text, meanConfidence: quality === 'poor' ? 20 : 88, lines: [], qualityScore: quality === 'poor' ? 12 : 84, quality, pass: 'primary' as const, psm: '3', discardedLines: [] });

function renderRoute(path: string, element: React.ReactNode) {
  return render(<MemoryRouter initialEntries={[path]}><AppStateProvider><Routes><Route path={path.split('?')[0]} element={element} /></Routes></AppStateProvider></MemoryRouter>);
}

beforeEach(() => {
  const data = createConsumerData(); data.profile.onboardingComplete = true; saveAppData(data);
  recognise.mockReset();
  recogniseRecipe.mockReset();
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn() });
});

describe('browser OCR integration boundary', () => {
  it('passes recipe OCR text into parseRecipeText and preserves the raw result', async () => {
    recogniseRecipe.mockResolvedValue(recipeResult('Spinach pasta\nServes 2\n20 minutes\nIngredients\n180g pasta\n150g spinach\nMethod\n1. Cook and combine.'));
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    await screen.findByRole('heading', { name: 'Review what we found' });
    expect(screen.getByLabelText('Recipe name')).toHaveValue('Spinach pasta');
    expect(screen.queryByText('OCR diagnostics')).not.toBeInTheDocument();
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
    recogniseRecipe.mockResolvedValue(recipeResult('', 'poor'));
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    expect(await screen.findByRole('heading', { name: /couldn’t read this recipe clearly enough/i })).toBeVisible();
  });

  it('keeps a visible recovery page when preprocessing fails', async () => {
    recogniseRecipe.mockRejectedValue(new OcrProcessingError('preprocessing_failed'));
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    expect(await screen.findByRole('heading', { name: /couldn’t read this recipe clearly enough/i })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try another image' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Paste recipe text' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create manually' })).toBeVisible();
  });

  it('never substitutes a consumer image with the deterministic recipe fixture', async () => {
    recogniseRecipe.mockResolvedValue(recipeResult('Tomato toast\nIngredients\n2 tomatoes\n2 bread slices\nMethod\n1. Toast and serve.'));
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
    expect(recogniseRecipe).not.toHaveBeenCalled();
  });

  it('fails safely instead of rendering structured garbage', async () => {
    recogniseRecipe.mockResolvedValue({ ...recipeResult('ANC AK\n:\\\nRE CIPI\n+ ec\n---\n|', 'poor'), discardedLines: [':\\', 'RE CIPI', '+ ec', '---', '|'] });
    renderRoute('/recipes/import', <RecipeImportPage />);
    await userEvent.upload(screen.getByLabelText('Choose recipe image'), image);
    expect(await screen.findByRole('heading', { name: /couldn’t read this recipe clearly enough/i })).toBeVisible();
    expect(screen.queryByLabelText('Recipe name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review extracted text' })).toBeVisible();
  });
});
