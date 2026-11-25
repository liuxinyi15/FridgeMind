import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props { children: ReactNode; resetKey: string; }
interface State { failed: boolean; }

export class RecipeImportErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State { return { failed: true }; }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // The recovery UI is deliberately participant-safe. Technical OCR details
    // are captured by the normal Research Mode diagnostics where available.
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="page-stack narrow-page recipe-import-page"><section className="empty-state"><h1>Something went wrong while reading this image.</h1><p>FridgeMind is still available. You can retry or add the recipe another way.</p><div className="button-row"><button className="button primary" onClick={() => this.setState({ failed: false })}>Try again</button><Link className="button secondary" to="/recipes/import?recovery=text">Paste recipe text</Link><Link className="button ghost" to="/recipes">Back to Recipes</Link></div></section></div>;
  }
}
