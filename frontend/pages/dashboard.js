import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { useProtectedApi } from '../hooks/useProtectedApi';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

import withAuth from '../utils/withAuth';

function Dashboard() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const api = useProtectedApi();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    const fetchJobs = async () => {
      try {
        const response = await api.get('/conversion-jobs');
        setJobs(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch conversion jobs');
        setLoading(false);
      }
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [user, router, api]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto space-y-4">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="animate-pulse bg-white shadow rounded-lg p-6 h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-red-500">Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Conversion Jobs List */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Recent Conversion Jobs
          </h2>
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No conversion jobs yet. Start one below!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between border-b border-gray-200 py-4"
              >
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {job.type.replace('-', ' ').toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : job.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {job.status.toUpperCase()}
                  </span>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleDownload(job)}
                  >
                    Download
                  </button>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversion Tools */}
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900">Conversion Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ConversionToolCard
              title="PDF to DOCX"
              description="Convert your PDF files to editable DOCX format"
              type="pdf-to-docx"
            />
            <ConversionToolCard
              title="DOCX to PDF"
              description="Convert your DOCX files to PDF format"
              type="docx-to-pdf"
            />
            <ConversionToolCard
              title="PDF Merge"
              description="Combine multiple PDF files into one"
              type="pdf-merge"
            />
            <ConversionToolCard
              title="PDF Compression"
              description="Reduce the size of your PDF files"
              type="pdf-compress"
            />
          </div>
        </div>
      </main>
    </div>
  );

  async function handleDownload(job) {
    if (job.status !== 'completed') {
      toast.error('Conversion not completed yet');
      return;
    }
    try {
      const response = await api.get(`/download/${job.id}`);
      const { url } = response.data;
      if (!url) throw new Error('No download URL received');
      window.open(url, '_blank');
      toast.success('Download started');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Download failed');
    }
  }
}

import FileUpload from '../components/FileUpload';

export default withAuth(Dashboard);

function ConversionToolCard({ title, description, type }) {
  const handleConversionStart = (jobId) => {
    // TODO: Implement job tracking logic
    console.log('Conversion started with jobId:', jobId);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <FileUpload type={type} onConversionStart={handleConversionStart} />
    </div>
  );
}
