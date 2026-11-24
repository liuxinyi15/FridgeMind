import { useState } from 'react';
import { useAppState } from '../state/AppState';
import type { ReminderMode } from '../domain/types';
import { Icon } from '../components/Icon';

const steps = ['Welcome', 'Cooking', 'Portions', 'Reminders'];

export function OnboardingPage() {
  const { actions } = useAppState();
  const [step, setStep] = useState(0);
  const [cookingFrequency, setCooking] = useState<'0' | '1-2' | '3-4' | '5-7' | '8+'>('3-4');
  const [typicalServings, setServings] = useState<1 | 2 | 3 | 4>(2);
  const [mode, setMode] = useState<ReminderMode>('actionable');
  const finish = () => actions.completeOnboarding({ cookingFrequency, typicalServings, mode });

  return <main className="onboarding-shell">
    <header className="onboarding-header"><div className="onboarding-brand"><div className="brand-mark large"><Icon name="leaf" size={24} /></div><strong>FridgeMind</strong></div><button className="text-button" onClick={finish}>Skip</button></header>
    <div className="progress-dots" aria-label={`Step ${step + 1} of 4`}>{steps.map((label, index) => <span key={label} className={index <= step ? 'complete' : ''}><span className="sr-only">{label}</span></span>)}</div>
    <section className={`onboarding-card step-${step}`}>
      {step === 0 && <div className="welcome-step"><div className="onboarding-art" aria-hidden="true"><span>🥬</span><span>🍝</span><span>🍅</span></div><span className="overline">Less waste, less wondering</span><h1>Make something good with what you have.</h1><p>FridgeMind keeps track of your food and finds an easy next meal—perfect for cooking for one.</p></div>}
      {step === 1 && <><span className="overline">A quick question</span><h1>How often do you cook at home?</h1><p>We’ll keep suggestions realistic for your routine.</p><ChoiceGroup name="cooking" value={cookingFrequency} options={['0', '1-2', '3-4', '5-7', '8+']} labels={['Not recently', '1–2 times a week', '3–4 times a week', '5–7 times a week', 'More than once a day']} onChange={(v) => setCooking(v as typeof cookingFrequency)} /></>}
      {step === 2 && <><span className="overline">Your usual</span><h1>How many portions do you cook?</h1><p>Choose what you do most often. You can change portions for any recipe.</p><ChoiceGroup name="servings" value={String(typicalServings)} options={['1', '2', '3', '4']} labels={['1 · just for now', '2 · save one for later', '3 · a little meal prep', '4 · batch cooking']} onChange={(v) => setServings(Number(v) as 1 | 2 | 3 | 4)} /></>}
      {step === 3 && <><span className="overline">One last thing</span><h1>Want helpful food reminders?</h1><p>Get a gentle nudge when something needs using. You’re always in control.</p><ChoiceGroup name="mode" value={mode} options={['actionable', 'simple', 'in_app', 'off']} labels={['Yes, with a useful action', 'Simple reminders', 'Only while I’m in the app', 'No reminders']} onChange={(v) => setMode(v as ReminderMode)} /></>}
      <div className="onboarding-actions">{step > 0 && <button className="button secondary" onClick={() => setStep((value) => value - 1)}>Back</button>}{step < 3 ? <button className="button primary" onClick={() => setStep((value) => value + 1)}>{step === 0 ? 'Get started' : 'Continue'}</button> : <button className="button primary" onClick={finish}>Open my kitchen</button>}</div>
    </section>
  </main>;
}

function ChoiceGroup({ name, value, options, labels, onChange }: { name: string; value: string; options: string[]; labels: string[]; onChange: (value: string) => void }) {
  return <div className="choice-list">{options.map((option, index) => <label key={option} className={value === option ? 'selected' : ''}><input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{labels[index]}</span><span aria-hidden="true">{value === option ? '✓' : ''}</span></label>)}</div>;
}
