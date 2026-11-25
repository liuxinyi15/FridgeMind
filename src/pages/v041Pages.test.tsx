import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createConsumerData } from '../data/seed';
import { saveAppData } from '../data/repositories';
import { AppStateProvider } from '../state/AppState';
import { TodayPage } from './TodayPage';
import { RecipesPage } from './RecipesPage';

beforeEach(() => localStorage.clear());

function renderPage(node: React.ReactNode) {
  return render(<MemoryRouter><AppStateProvider>{node}</AppStateProvider></MemoryRouter>);
}

describe('V0.4.1 activation states', () => {
  it('does not treat old activity as useful personal state', () => {
    const data = createConsumerData();
    data.profile.onboardingComplete = true;
    data.activity = [{ id: 'old-visit', type: 'visited', at: '2026-01-01T00:00:00Z' }];
    saveAppData(data);
    renderPage(<TodayPage />);
    expect(screen.getByRole('heading', { name: 'Start with something useful.' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Quick add foods' })).toBeVisible();
    expect(screen.queryByLabelText('Today summary')).not.toBeInTheDocument();
    expect(screen.queryByText(/0 foods need attention/)).not.toBeInTheDocument();
  });

  it('does not imply fridge personalisation when inventory is empty', () => {
    const data = createConsumerData(); data.profile.onboardingComplete = true; saveAppData(data);
    renderPage(<RecipesPage />);
    expect(screen.getByRole('heading', { name: 'Simple ideas to explore' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Ideas for your fridge' })).not.toBeInTheDocument();
  });
});
