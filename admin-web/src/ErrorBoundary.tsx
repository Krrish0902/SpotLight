import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#09090b',
          color: '#71717a',
          textAlign: 'center',
        }}>
          <h2 style={{ color: '#fafafa', marginBottom: 8, fontSize: 16, fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ marginBottom: 20, fontSize: 14 }}>Try refreshing the page.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              background: '#fafafa',
              color: '#09090b',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
