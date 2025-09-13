import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} retry={this.retry} />;
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, retry }: { error?: Error; retry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Произошла ошибка</h2>
          <p className="text-gray-600">
            Что-то пошло не так. Попробуйте перезагрузить приложение.
          </p>
          
          {error && (
            <details className="text-left mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Техническая информация
              </summary>
              <pre className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Перезагрузить
          </Button>
          <Button
            onClick={retry}
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          >
            Попробовать снова
          </Button>
        </div>
      </Card>
    </div>
  );
}