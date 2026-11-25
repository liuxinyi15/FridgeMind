import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

type RecoveryType = 'recipe' | 'food';
interface Props { children: ReactNode; resetKey: string; recoveryType: RecoveryType; }
interface State { failed: boolean; }

export class ImportFlowErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): Partial<State> { return { failed: true }; }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Keep unexpected render failures local. Participant-safe recovery does not
    // expose error contents or mutate the surrounding usability session.
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.recoveryType === 'food') {
      return <div className="page-stack narrow-page add-food-page"><section className="empty-state"><h1>Something went wrong while reading this image.</h1><p>Nothing was added to your fridge. You can try again or use another way to add your food.</p><div className="button-row"><button className="button primary" onClick={() => this.setState({ failed: false })}>Try again</button><Link className="button secondary" to="/fridge/add?recovery=quick">Quick add foods</Link><Link className="button ghost" to="/fridge">Back to Fridge</Link></div></section></div>;
    }
    return <div className="page-stack narrow-page recipe-import-page"><section className="empty-state"><h1>Something went wrong while reading this recipe.</h1><p>Your image wasn’t saved. You can try again, paste the recipe text, or return to Recipes.</p><div className="button-row"><button className="button primary" onClick={() => this.setState({ failed: false })}>Try again</button><Link className="button secondary" to="/recipes/import?recovery=text">Paste recipe text</Link><Link className="button ghost" to="/recipes">Back to Recipes</Link></div></section></div>;
  }
}
