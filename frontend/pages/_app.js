import { AuthProvider } from '../context/AuthContext';
import '../styles/global.css';
import Navigation from '../components/Navigation';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from '../components/ErrorBoundary';
import { ThemeProvider } from '../context/ThemeContext';

function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <Navigation />
        <main className="flex-1">
          <ErrorBoundary>
            <Component {...pageProps} />
          </ErrorBoundary>
          <Toaster position="top-right" />
        </main>
      </div>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
