import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Without this, an uncaught error thrown during render unmounts the entire
 * React tree — since the window's own background color is a near-black
 * (#080b11), the result looks exactly like a "black screen" crash, even
 * though it's really just an unhandled JS exception, not a GPU/renderer
 * process failure. This catches that class of bug and shows a real,
 * recoverable error screen instead, and persists the crash detail to disk
 * (via the main process) so it can actually be diagnosed afterward.
 */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const detail = `${error.stack || error.message}\n\nComponent stack:${info.componentStack}`;
    console.error('[ErrorBoundary] Caught render crash:', detail);
    try {
      (window as any).anydl?.logRendererError?.(detail);
    } catch { /* best-effort logging only */ }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#080b11', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif', padding: 32
        }}>
          <div style={{ maxWidth: 560, textAlign: 'center' }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Something crashed</h1>
            <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6, marginBottom: 20 }}>
              The app hit an unexpected error instead of a real crash. This has been logged
              to a file so it can be fixed properly. Reloading should recover the app —
              your download queue and settings are safe.
            </p>
            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(90deg,#06b6d4,#3b82f6)', color: '#04141a',
                fontWeight: 800, padding: '12px 28px', borderRadius: 999, border: 'none',
                cursor: 'pointer', fontSize: 14
              }}
            >
              Reload App
            </button>
            <pre style={{
              marginTop: 24, textAlign: 'left', fontSize: 10, color: '#64748b',
              background: '#05070a', padding: 12, borderRadius: 8, maxHeight: 160, overflow: 'auto'
            }}>
              {this.state.error?.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
