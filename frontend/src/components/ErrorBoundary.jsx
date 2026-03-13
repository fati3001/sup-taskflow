import { Component } from "react";
import "./ErrorBoundary.scss";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Non-critical logging only — no console.error in production
    if (import.meta.env.DEV) {
      console.warn("[ErrorBoundary]", error, info);
    }
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="error-boundary">
        <div className="error-boundary-card">
          <div className="error-boundary-icon">✗</div>
          <h1 className="error-boundary-title">Une erreur est survenue</h1>
          <p className="error-boundary-subtitle">
            L'application a rencontré un problème inattendu.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="error-boundary-detail">
              {this.state.error.message}
            </pre>
          )}
          <button className="error-boundary-btn" onClick={() => this.handleReset()}>
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }
}