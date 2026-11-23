import { useState } from 'react';
import { useAppState } from '../state/AppState';
import type { ReminderMode } from '../domain/types';

const steps = ['Cooking', 'Shopping', 'Portions', 'Reminders'];

export function OnboardingPage() {
  const { actions } = useAppState();
  const [step, setStep] = useState(0);
  const [cookingFrequency, setCooking] = useState<'0' | '1-2' | '3-4' | '5-7' | '8+'>('3-4');
  const [shoppingFrequency, setShopping] = useState<'0' | '1-2' | '3-4' | '5-7' | '8+'>('1-2');
  const [typicalServings, setServings] = useState<1 | 2 | 3 | 4>(2);
  const [mode, setMode] = useState<ReminderMode>('actionable');
  const finish = () => actions.completeOnboarding({ cookingFrequency, shoppingFrequency, typicalServings, mode });
  return (
    <main className="onboarding-shell">
      <div className="onboarding-brand"><div className="brand-mark large">F</div><strong>FridgeMind</strong></div>
      <div className="progress-dots" aria-label={`Step ${step + 1} of 4`}>{steps.map((label, index) => <span key={label} className={index <= step ? 'complete' : ''}><span className="sr-only">{label}</span></span>)}</div>
      <section className="onboarding-card">
        <span className="kicker">A quick setup · {step + 1} of 4</span>
        {step === 0 && <>
          <h1>How often do you cook at home?</h1><p>This helps us avoid assuming everyone cooks every day.</p>
          <ChoiceGroup name="cooking" value={cookingFrequency} options={['0', '1-2', '3-4', '5-7', '8+']} labels={['Not recently', '1–2 times', '3–4 times', '5–7 times', '8+ times']} onChange={(v) => setCooking(v as typeof cookingFrequency)} />
        </>}
        {step === 1 && <>
          <h1>How often do you usually shop?</h1><p>There is no assumed weekly schedule.</p>
          <ChoiceGroup name="shopping" value={shoppingFrequency} options={['0', '1-2', '3-4', '5-7', '8+']} labels={['Not weekly', '1–2 times', '3–4 times', '5–7 times', '8+ times']} onChange={(v) => setShopping(v as typeof shoppingFrequency)} />
        </>}
        {step === 2 && <>
          <h1>How many portions do you usually cook?</h1><p>Living alone does not always mean cooking one portion.</p>
          <ChoiceGroup name="servings" value={String(typicalServings)} options={['1', '2', '3', '4']} labels={['1 · just now', '2 · save one', '3 · meal prep', '4 · batch cook']} onChange={(v) => setServings(Number(v) as 1 | 2 | 3 | 4)} />
        </>}
        {step === 3 && <>
          <h1>How should useful reminders appear?</h1><p>You can change this later. In-app information remains available even when notifications are off.</p>
          <ChoiceGroup name="mode" value={mode} options={['actionable', 'simple', 'in_app', 'off']} labels={['Action + reminder', 'Simple reminder', 'In-app only', 'No proactive reminders']} onChange={(v) => setMode(v as ReminderMode)} />
        </>}
        <div className="onboarding-actions">
          {step > 0 && <button className="button secondary" onClick={() => setStep((value) => value - 1)}>Back</button>}
          {step < 3 ? <button className="button primary" onClick={() => setStep((value) => value + 1)}>Continue</button> : <button className="button primary" onClick={finish}>Start planning</button>}
        </div>
        <p className="research-note center">Demo scenario persona — for prototype walkthrough only. All choices stay editable.</p>
      </section>
    </main>
  );
}

function ChoiceGroup({ name, value, options, labels, onChange }: { name: string; value: string; options: string[]; labels: string[]; onChange: (value: string) => void }) {
  return <div className="choice-list">{options.map((option, index) => <label key={option} className={value === option ? 'selected' : ''}><input type="radio" name={name} value={option} checked={value === option} onChange={() => onChange(option)} /><span>{labels[index]}</span><span aria-hidden="true">{value === option ? '✓' : ''}</span></label>)}</div>;
}
