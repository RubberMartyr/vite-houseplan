import React from 'react';
import type { RenderModel } from '../model/normalizeHouseViewerModel';

type Props = {
  renderModel: RenderModel;
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  componentStack?: string;
};

export class HouseViewerErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, componentStack: info.componentStack ?? undefined });
    console.error('HouseViewer render error', error, info, this.props.renderModel.diagnostics);
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.renderModel !== this.props.renderModel && this.state.error) {
      this.setState({ error: null, componentStack: undefined });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const diagnostics = this.props.renderModel.diagnostics;

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 360,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
          background: '#f8fafc',
          color: '#0f172a',
        }}
      >
        <div
          style={{
            maxWidth: 760,
            padding: 20,
            borderRadius: 16,
            background: '#fff',
            border: '1px solid #fecaca',
            boxShadow: '0 20px 50px rgba(15, 23, 42, 0.14)',
          }}
        >
          <h2 style={{ margin: '0 0 8px' }}>HouseViewer could not render this model</h2>
          <p style={{ margin: '0 0 12px' }}>Open Preview JSON to inspect the input model.</p>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#991b1b' }}>{this.state.error.message}</pre>
          <div>
            <strong>Diagnostics</strong>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto' }}>
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
          {this.state.componentStack && (
            <details>
              <summary>Component stack</summary>
              <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto' }}>{this.state.componentStack}</pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
