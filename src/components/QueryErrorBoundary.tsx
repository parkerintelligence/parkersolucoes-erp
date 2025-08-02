import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class QueryErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QueryErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Alert className="bg-amber-900/20 border-amber-800 text-amber-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="space-y-2">
            <p>Problema ao carregar dados do servidor. Os dados podem estar temporariamente indisponíveis.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-sm underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}