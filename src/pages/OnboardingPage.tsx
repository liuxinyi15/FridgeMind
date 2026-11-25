import { useNavigate } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { Icon } from '../components/Icon';

export function OnboardingPage() {
  const { actions } = useAppState();
  const navigate = useNavigate();
  const start = (path: string) => { actions.completeOnboarding({}); navigate(path); };

  return <main className="onboarding-shell">
    <header className="onboarding-header"><div className="onboarding-brand"><div className="brand-mark large"><Icon name="leaf" size={24} /></div><strong>FridgeMind</strong></div><button className="text-button" onClick={() => start('/')}>Skip</button></header>
    <section className="onboarding-card value-onboarding">
      <div className="welcome-step"><div className="onboarding-art onboarding-value-art" aria-hidden="true"><Icon name="fridge" size={34} /><Icon name="recipes" size={34} /><Icon name="servings" size={34} /></div><span className="overline">Your food, easier to use</span><h1>Remember what needs using. Make more from what you have.</h1><p>FridgeMind helps you notice food before it is forgotten, find meals without unnecessary shopping, and keep your list updated as you cook.</p></div>
      <div className="onboarding-choice-actions"><button className="button primary full" onClick={() => start('/fridge/add')}>Add what I bought</button><button className="button secondary full" onClick={() => start('/recipes/import')}>Add a recipe I like</button><button className="button ghost full" onClick={() => start('/recipes')}>Explore ideas</button></div>
      <button className="text-button demo-entry" onClick={actions.enterDemo}>Explore a separate demo fridge</button>
    </section>
  </main>;
}
