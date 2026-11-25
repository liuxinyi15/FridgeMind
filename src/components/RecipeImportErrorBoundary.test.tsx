import { expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RecipeImportErrorBoundary } from './RecipeImportErrorBoundary';

function BrokenImport(): never { throw new Error('render failed'); }

it('keeps recovery actions visible when the import flow throws during render', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  render(<MemoryRouter><RecipeImportErrorBoundary resetKey="first"><BrokenImport /></RecipeImportErrorBoundary></MemoryRouter>);
  expect(screen.getByRole('heading', { name: /Something went wrong while reading this image/i })).toBeVisible();
  expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Paste recipe text' })).toHaveAttribute('href', '/recipes/import?recovery=text');
  expect(screen.getByRole('link', { name: 'Back to Recipes' })).toHaveAttribute('href', '/recipes');
  consoleError.mockRestore();
});
