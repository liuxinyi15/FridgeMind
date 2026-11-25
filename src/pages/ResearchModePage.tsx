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
  { id: 'V3-A', label: 'V0.3 A · Grocery photo', setup: 'Three groceries are proposed for batch review.', outcome: 'Editable photo import draft', href: '/fridge/add?fixture=grocery' },
  { id: 'V3-B', label: 'V0.3 B · Receipt', setup: 'Four receipt items are proposed with conservative quantities.', outcome: 'Receipt batch review', href: '/fridge/add?fixture=receipt' },
  { id: 'V3-C', label: 'V0.3 C · Recipe screenshot', setup: 'A recipe image produces an editable recipe proposal.', outcome: 'Recipe image review', href: '/recipes/import?fixture=image' },
  { id: 'V3-D', label: 'V0.3 D · Recipe text', setup: 'Free-form text is ready for extraction and review.', outcome: 'Recipe text import', href: '/recipes/import?fixture=text' },
  { id: 'V3-E', label: 'V0.3 E · Duplicate grocery', setup: 'Detected groceries match existing fridge items.', outcome: 'Merge or new-purchase choice', href: '/fridge/add?fixture=duplicate' },
  { id: 'V3-F', label: 'V0.3 F · Shopping receipt', setup: 'Receipt mushrooms match an existing Shopping item.', outcome: 'One-step shopping reconciliation', href: '/fridge/add?fixture=receipt' },
  { id: 'V3-G', label: 'V0.3 G · Use Soon recipes', setup: 'Spinach needs attention and recipe results are focused on it.', outcome: 'Ranked spinach recipes', href: '/recipes?uses=spinach' },
  { id: 'V3-H', label: 'V0.3 H · Quick correction', setup: 'Spinach can be updated with a low-effort Used some action.', outcome: 'Approximate state preserved', href: '/fridge' },
] as const;

export function ResearchModePage() {
  const { data, actions } = useAppState();
  const scenario = scenarios.find((item) => item.id === data.researchScenario) ?? scenarios[0];
  return <div className="page-stack narrow-page research-page">
    <section><span className="kicker">Research Mode</span><h1>Deterministic product-loop scenarios</h1><p>These fixtures keep evaluation states reproducible without exposing implementation language in the consumer experience.</p><p className="research-note">Loading a fixture resets the current local evaluation data, then applies the selected state.</p><Link className="button primary" to="/settings/research/usability">Open Usability Test</Link></section>
    <section className="scenario-list" aria-label="Research scenarios">{scenarios.map((item) => <button key={item.id} className={scenario.id === item.id ? 'selected' : ''} onClick={() => actions.setResearchScenario(item.id)}><span aria-hidden="true">{scenario.id === item.id ? '●' : '○'}</span><span><strong>{item.label}</strong><small>{item.setup}</small></span></button>)}</section>
    <section className="decision-card"><div className="section-heading compact"><div><span className="kicker">Loaded product state</span><h2>{scenario.label}</h2></div><StatusChip tone="info">Fixture {scenario.id}</StatusChip></div><p>{scenario.setup}</p><div className="scenario-outcome"><strong>{scenario.outcome}</strong></div>{'href' in scenario && <Link className="button primary full" to={scenario.href}>Open scenario</Link>}<h3>Evaluation checkpoint</h3><p>{checkpoint(scenario.id)}</p></section>
    <section><div className="section-heading"><div><span className="kicker">Optional V0.3 evaluation</span><h2>Exploratory scenarios</h2></div></div><ol className="interview-guide"><li>“You’ve just come home with groceries. Add them to FridgeMind.”</li><li>“You found a recipe online that you’d like to keep. Add it to FridgeMind.”</li><li>“You used some spinach without following a FridgeMind recipe. Update the app.”</li><li>“Find something you can cook using the spinach that needs attention.”</li></ol></section>
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
    'V3-A': 'Every proposed food remains editable and nothing is committed before Add items.',
    'V3-B': 'Unknown receipt amounts and dates remain unknown until the user changes them.',
    'V3-C': 'The proposed recipe can be corrected and the original image can be used as its cover.',
    'V3-D': 'Flexible text is preserved while extracted fields remain editable.',
    'V3-E': 'Existing uncertain stock is never merged without an explicit choice.',
    'V3-F': 'The matching Shopping item is marked purchased and only one fridge record is created.',
    'V3-G': 'Every result uses spinach, then ranks by availability, urgency and preparation fit.',
    'V3-H': 'A rough correction must not turn approximate stock into false precision.',
  };
  return checks[id];
}
