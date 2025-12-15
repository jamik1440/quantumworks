import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);

        // Call custom error handler
        this.props.onError?.(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    padding: '20px',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                        Something went wrong
                    </h2>
                    <details style={{
                        marginBottom: '2rem',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '8px',
                        maxWidth: '600px',
                    }}>
                        <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                            Error details
                        </summary>
                        <pre style={{
                            textAlign: 'left',
                            overflow: 'auto',
                            fontSize: '0.875rem',
                        }}>
                            {this.state.error?.message}
                        </pre>
                    </details>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        style={{
                            padding: '12px 24px',
                            fontSize: '1rem',
                            background: 'white',
                            color: '#667eea',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                        }}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
