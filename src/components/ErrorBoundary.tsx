import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-destructive mb-2">
              Algo deu errado
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'Erro desconhecido'}
            </p>
            <button 
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}