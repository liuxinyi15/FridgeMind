import { Link } from 'react-router-dom';
import { useAppState } from '../state/AppState';
import { StatusChip } from '../components/StatusChip';

const scenarios = [
  { id: 'A', label: 'A · Fully available', setup: 'All ingredient quantities are exact and confirmed.', outcome: 'READY · Everything you need' },
  { id: 'B', label: 'B · Unknown amount', setup: 'Cream is present with “some left” and no exact quantity.', outcome: 'READY_WITH_UNCERTAINTY · Check 1 item' },
  { id: 'C', label: 'C · Use soon + cooking', setup: 'Spinach needs attention and today is Cooking tonight.', outcome: 'Use-soon recipe ranks higher' },
  { id: 'D', label: 'D · Use soon + eating out', setup: 'Spinach needs attention and today is Eating out.', outcome: 'Cooking suppressed · preservation action remains' },
  { id: 'E', label: 'E · Two portions', setup: 'Cook two portions and choose one to eat now.', outcome: 'One leftover created · Stored today' },
  { id: 'F', label: 'F · Recipe gap', setup: 'Mushroom Pasta is short of mushrooms.', outcome: 'One genuine gap added to Shopping' },
  { id: 'G', label: 'G · Purchase reconciliation', setup: 'Mushrooms are marked purchased with a 250g package suggestion.', outcome: 'Purchase merges into My Fridge' },
  { id: 'H', label: 'H · Unapproved routine', setup: 'Weekday lunch pattern is observed but not approved.', outcome: 'Ranking unchanged until explicit approval' },
] as const;

export function ResearchModePage() {
  const { data, actions } = useAppState();
  const scenario = scenarios.find((item) => item.id === data.researchScenario) ?? scenarios[0];
  return <div className="page-stack narrow-page research-page">
    <section><span className="kicker">Research Mode</span><h1>Deterministic product-loop scenarios</h1><p>These fixtures keep evaluation states reproducible without exposing implementation language in the consumer experience.</p><p className="research-note">Loading a fixture resets the current local evaluation data, then applies the selected state.</p><Link className="button primary" to="/settings/research/usability">Open Usability Test</Link></section>
    <section className="scenario-list" aria-label="Research scenarios">{scenarios.map((item) => <button key={item.id} className={scenario.id === item.id ? 'selected' : ''} onClick={() => actions.setResearchScenario(item.id)}><span aria-hidden="true">{scenario.id === item.id ? '●' : '○'}</span><span><strong>{item.label}</strong><small>{item.setup}</small></span></button>)}</section>
    <section className="decision-card"><div className="section-heading compact"><div><span className="kicker">Loaded product state</span><h2>{scenario.label}</h2></div><StatusChip tone="info">Fixture {scenario.id}</StatusChip></div><p>{scenario.setup}</p><div className="scenario-outcome"><strong>{scenario.outcome}</strong></div><h3>Evaluation checkpoint</h3><p>{checkpoint(scenario.id)}</p></section>
    <aside className="evidence-banner"><strong>Reproducible setup</strong><p>Each selection starts from the same seeded fridge, recipes, mock dates, preferences and unapproved routine observation.</p></aside>
  </div>;
}

function checkpoint(id: string) {
  const checks: Record<string, string> = {
    A: 'The recipe must start without a stock question or shopping gap.',
    B: 'The amount question appears only when the user starts cooking.',
    C: 'The explanation names the actual use-soon ingredient.',
    D: 'No meal reminder is shown; urgent food rescue remains available.',
    E: 'Completing dinner deducts ingredients and creates a one-portion leftover.',
    F: 'Repeated taps must not create duplicate gaps.',
    G: 'The suggested purchase amount is editable and reconciliation avoids duplicate food records.',
    H: 'The observation and approved routine are stored separately and approval is reversible.',
  };
  return checks[id];
}
