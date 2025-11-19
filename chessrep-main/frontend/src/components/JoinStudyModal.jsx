import React, { useState } from 'react';
import { Share2, Check, X, AlertCircle } from 'lucide-react';
import { collaborationService } from '../services/collaborationService';

const JoinStudyModal = ({ onJoin, onClose }) => {
  const [shareCode, setShareCode] = useState('');
  const [permission, setPermission] = useState('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinStudy = async (e) => {
    e.preventDefault();
    if (!shareCode.trim()) {
      setError('Please enter a share code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await collaborationService.joinByCode(shareCode, permission);
      
      if (response.success) {
        onJoin && onJoin(response.study);
        onClose && onClose();
        alert(`Successfully joined study: ${response.study.name}`);
      }
    } catch (error) {
      console.error('Error joining study:', error);
      setError(error.message || 'Failed to join study');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Share2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold">Join Study</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleJoinStudy} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share Code
              </label>
              <input
                type="text"
                value={shareCode}
                onChange={(e) => setShareCode(e.target.value.toUpperCase())}
                placeholder="Enter share code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permission Level
              </label>
              <select
                value={permission}
                onChange={(e) => setPermission(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="view">View Only</option>
                <option value="edit">Can Edit</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                The study owner will determine your final permission level
              </p>
            </div>

            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Join Study</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JoinStudyModal;

