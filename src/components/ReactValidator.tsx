import * as React from 'react';

interface ReactValidationState {
  isReady: boolean;
  error: string | null;
  attempts: number;
}

// Non-hook based React validation using class component
export class ReactValidator extends React.Component<
  { children: React.ReactNode; onValidated: (isReady: boolean, error?: string) => void },
  ReactValidationState
> {
  private validationTimer: NodeJS.Timeout | null = null;
  private maxAttempts = 10;

  constructor(props: any) {
    super(props);
    this.state = {
      isReady: false,
      error: null,
      attempts: 0
    };
  }

  componentDidMount() {
    this.validateReact();
  }

  componentWillUnmount() {
    if (this.validationTimer) {
      clearTimeout(this.validationTimer);
    }
  }

  validateReact = () => {
    try {
      // Check if React and its hooks are available
      if (
        React && 
        typeof React.useState === 'function' &&
        typeof React.useEffect === 'function' &&
        typeof React.useContext === 'function'
      ) {
        console.log('React validation successful');
        this.setState({ isReady: true, error: null });
        this.props.onValidated(true);
        return;
      }

      // If not ready and haven't exceeded max attempts, try again
      if (this.state.attempts < this.maxAttempts) {
        console.log(`React not ready, attempt ${this.state.attempts + 1}/${this.maxAttempts}`);
        this.setState({ attempts: this.state.attempts + 1 });
        
        this.validationTimer = setTimeout(() => {
          this.validateReact();
        }, 100); // Try again in 100ms
        return;
      }

      // Max attempts reached
      throw new Error('React hooks not available after maximum attempts');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'React validation failed';
      console.error('React validation error:', errorMsg);
      this.setState({ error: errorMsg, isReady: false });
      this.props.onValidated(false, errorMsg);
    }
  };

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md">
            <h1 className="text-xl font-bold text-destructive mb-4">Erro de React</h1>
            <p className="text-muted-foreground mb-4">{this.state.error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    if (!this.state.isReady) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Inicializando React... ({this.state.attempts}/{this.maxAttempts})</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}