import React from "react";
import { ErrorState, RetryAction } from "./StateStates.jsx";

function areResetKeysEqual(prev = [], next = []) {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i += 1) {
    if (!Object.is(prev[i], next[i])) return false;
  }
  return true;
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.error(`[RICON ErrorBoundary:${this.props.scopeLabel || "app"}]`, error, info?.componentStack || "");
    }
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && !areResetKeysEqual(prevProps.resetKeys || [], this.props.resetKeys || [])) {
      this.setState({ error: null });
    }
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const scope = this.props.scopeLabel || "app section";
    return (
      <div style={{ padding: 20 }}>
        <ErrorState
          title="Something went off script"
          message={`We hit an unexpected issue in the ${scope}. You can retry this section without losing the full experience.`}
          ariaLabel={`${scope} error state`}
          action={<RetryAction label="TRY AGAIN" onRetry={this.reset} ariaLabel={`Retry ${scope}`} />}
        />
      </div>
    );
  }
}
