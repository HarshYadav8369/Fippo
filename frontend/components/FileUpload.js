import { useState } from 'react';
import { useProtectedApi } from '../hooks/useProtectedApi';
import { useAuth } from '../context/AuthContext';

import JobStatus from './JobStatus';

export default function FileUpload({ type, onConversionStart }) {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentJobId, setCurrentJobId] = useState(null);
  const api = useProtectedApi();
  const { user } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setCurrentJobId(null); // Reset job status when new file is selected
    }
  };

  const handleFilesChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to use this feature');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      
      if (type === 'pdf-merge') {
        if (files.length < 2) {
          throw new Error('Please select at least 2 PDF files');
        }
        files.forEach((file, index) => {
          formData.append('files', file, file.name);
        });
      } else {
        if (!file) {
          throw new Error('Please select a file');
        }
        formData.append('file', file, file.name);
      }

      const response = await api.post(`/convert/${type}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setCurrentJobId(response.data.jobId);
      onConversionStart(response.data.jobId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">
        {type.replace('-', ' ').toUpperCase()}
      </h3>
      
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {currentJobId && (
        <div className="mb-4">
          <JobStatus jobId={currentJobId} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          {type === 'pdf-merge' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select PDF files (up to 5)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="files"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="files"
                        name="files"
                        type="file"
                        className="sr-only"
                        accept="application/pdf"
                        multiple
                        onChange={handleFilesChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PDF files up to 50MB
                  </p>
                </div>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-500">{file.name}</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setFiles(files.filter((_, i) => i !== index));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select a file
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file"
                        name="file"
                        type="file"
                        className="sr-only"
                        accept={
                          type.includes('pdf')
                            ? 'application/pdf'
                            : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        }
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {type.includes('pdf') ? 'PDF' : 'DOCX'} files up to 50MB
                  </p>
                </div>
              </div>
              
              {file && (
                <div className="mt-4 p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-500">{file.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || (!file && !files.length)}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              loading || (!file && !files.length) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Processing...' : 'Start Conversion'}
          </button>
        </div>
      </form>
    </div>
  );
}
