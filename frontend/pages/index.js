import Head from 'next/head';
import Login from '../components/Auth/Login';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            Welcome to Fippo!
          </h1>
          <p className="text-gray-600">
            You are logged in. Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Head>
        <title>Fippo - PDF and Document Conversion</title>
        <meta name="description" content="Convert, merge, and compress PDFs with ease" />
      </Head>
      <Login />
    </div>
  );
}
