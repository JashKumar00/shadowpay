import { Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: "#080C18", color: "#F1F5F9", fontFamily: "system-ui, sans-serif",
          padding: "2rem", textAlign: "center"
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            ShadowPay failed to load
          </div>
          <div style={{ fontSize: "0.95rem", color: "#64748B", maxWidth: "500px", marginBottom: "2rem" }}>
            {this.state.error.message}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#7C3AED", color: "#fff", border: "none",
              borderRadius: "0.75rem", padding: "0.75rem 2rem",
              fontSize: "1rem", fontWeight: 600, cursor: "pointer"
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
