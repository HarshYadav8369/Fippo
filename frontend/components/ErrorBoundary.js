import React from 'react';
import toast from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught error:', error, info);
    toast.error('Something went wrong. Please refresh.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Oops!</h1>
          <p className="text-gray-600 dark:text-gray-300">An unexpected error occurred.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
