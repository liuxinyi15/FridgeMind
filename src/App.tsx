import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { useAppState } from './state/AppState';
import { OnboardingPage } from './pages/OnboardingPage';
import { TodayPage } from './pages/TodayPage';
import { FridgePage } from './pages/FridgePage';
import { FoodDetailPage } from './pages/FoodDetailPage';
import { AddFoodPage } from './pages/AddFoodPage';
import { RecipesPage } from './pages/RecipesPage';
import { RecipeImportPage } from './pages/RecipeImportPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { CookingPage } from './pages/CookingPage';
import { SettingsPage } from './pages/SettingsPage';
import { ResearchModePage } from './pages/ResearchModePage';
import { UsabilityTestPage } from './pages/UsabilityTestPage';
import { ParticipantStudyPage } from './pages/ParticipantStudyPage';
import { isParticipantStudy } from './domain/usability';
import { ImportFlowErrorBoundary } from './components/ImportFlowErrorBoundary';

export function App() {
  const { data } = useAppState();
  const location = useLocation();
  const participantStudy = isParticipantStudy(data);
  if (location.pathname === '/test') return <Routes><Route path="test" element={<ParticipantStudyPage />} /></Routes>;
  if (!data.profile.onboardingComplete) return <Routes><Route path="*" element={<OnboardingPage />} /></Routes>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<TodayPage />} />
        <Route path="fridge" element={<FridgePage />} />
        <Route path="fridge/add" element={<ImportFlowErrorBoundary resetKey={location.key} recoveryType="food"><AddFoodPage /></ImportFlowErrorBoundary>} />
        <Route path="fridge/:foodId" element={<FoodDetailPage />} />
        <Route path="recipes" element={<RecipesPage />} />
        <Route path="recipes/import" element={<ImportFlowErrorBoundary resetKey={location.key} recoveryType="recipe"><RecipeImportPage /></ImportFlowErrorBoundary>} />
        <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
        <Route path="recipes/:recipeId/cook" element={<CookingPage />} />
        <Route path="shopping" element={<ShoppingPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="settings/research" element={participantStudy ? <Navigate to="/" replace /> : <ResearchModePage />} />
        <Route path="settings/research/usability" element={participantStudy ? <Navigate to="/" replace /> : <UsabilityTestPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
