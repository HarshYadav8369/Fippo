import { useState, useEffect } from 'react';
import { useProtectedApi } from '../hooks/useProtectedApi';

export default function JobStatus({ jobId }) {
  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const api = useProtectedApi();

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetchJobStatus();

    // Set up polling
    const interval = setInterval(fetchJobStatus, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJobStatus = async () => {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      const job = response.data;
      setStatus(job.status);
      setProgress(job.progress);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch job status');
    }
  };

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  if (!status) {
    return <div className="animate-pulse">Checking job status...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          status === 'completed'
            ? 'bg-green-100 text-green-800'
            : status === 'failed'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {status.toUpperCase()}
        </span>
        {status === 'processing' && (
          <div className="w-32">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
      {status === 'completed' && (
        <div className="text-sm text-green-600">
          Conversion completed successfully
        </div>
      )}
      {status === 'failed' && (
        <div className="text-sm text-red-600">
          Conversion failed: {error}
        </div>
      )}
    </div>
  );
}
