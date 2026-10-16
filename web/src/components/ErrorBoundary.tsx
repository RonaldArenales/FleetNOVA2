import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error no controlado en la aplicación:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: undefined });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-white/5 p-6">
          <div className="w-full max-w-md rounded-xl bg-ink-900 p-8 text-center shadow-lg">
            <h1 className="mb-2 text-xl font-semibold text-white">Algo salió mal</h1>
            <p className="mb-4 text-sm text-zinc-400">
              Ocurrió un error inesperado en la aplicación. Intenta recargar la página.
            </p>
            {this.state.message && (
              <p className="mb-4 rounded bg-red-500/10 p-2 text-xs text-red-400">{this.state.message}</p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="btn-primary"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
