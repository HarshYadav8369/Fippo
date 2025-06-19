import { useEffect, useState } from 'react';
import withAuth from '../utils/withAuth';
import { useProtectedApi } from '../hooks/useProtectedApi';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

function Profile() {
  const api = useProtectedApi();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/auth/user');
        setUserData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api]);

  if (loading) return <div className="p-8">Loading…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 mt-8 rounded-lg dark:bg-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <p><span className="font-medium">Full name:</span> {userData.full_name}</p>
      <p><span className="font-medium">Email:</span> {userData.email}</p>
      <p><span className="font-medium">Credits:</span> {userData.credits}</p>

      <div className="mt-6 flex space-x-4">
        <Link href="/dashboard" className="px-4 py-2 bg-indigo-600 text-white rounded">Back</Link>
        <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded">Logout</button>
      </div>
    </div>
  );
}

export default withAuth(Profile);
