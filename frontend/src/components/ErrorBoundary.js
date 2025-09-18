import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI that matches the app's beautiful floating design
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          padding: '40px 20px',
          fontFamily: "'Courier New', monospace"
        }}>
          <div style={{
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '1.8rem',
              fontWeight: '300',
              letterSpacing: '2px',
              textShadow: '0 0 20px rgba(255,255,255,0.3)'
            }}>
              Something went wrong
            </h2>

            <p style={{
              margin: '0 0 30px 0',
              fontSize: '1rem',
              opacity: '0.9',
              lineHeight: '1.6',
              letterSpacing: '1px'
            }}>
              Don't worry, your data is safe. Please refresh the page to continue studying.
            </p>

            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '25px',
                padding: '12px 30px',
                color: 'white',
                fontFamily: "'Courier New', monospace",
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                letterSpacing: '1px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.7)';
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                e.target.style.background = 'transparent';
              }}
            >
              Refresh Page
            </button>

            {process.env.NODE_ENV === 'development' && (
              <details style={{
                marginTop: '30px',
                textAlign: 'left',
                fontSize: '0.8rem',
                opacity: '0.7'
              }}>
                <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                  Error Details (Development)
                </summary>
                <pre style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '15px',
                  borderRadius: '8px',
                  overflow: 'auto',
                  fontSize: '0.7rem',
                  lineHeight: '1.4'
                }}>
                  {this.state.error && this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    // No error - render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;