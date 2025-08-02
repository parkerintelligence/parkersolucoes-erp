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
        <Alert className="bg-red-900/20 border-red-800 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar componente. Verifique a conexão e tente novamente.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}