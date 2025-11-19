import React, { useState } from 'react';
import { X, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { lichessStudyService } from '../services/lichessStudyService';

const LichessImportModal = ({ isOpen, onClose, onImport }) => {
  const [studyUrl, setStudyUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [importedStudy, setImportedStudy] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  const handleClose = () => {
    setStudyUrl('');
    setError('');
    setImportedStudy(null);
    setPreviewData(null);
    onClose();
  };

  const handleImport = async () => {
    if (!studyUrl.trim()) {
      setError('Please enter a Lichess study URL');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log('🔍 Starting Lichess study import:', studyUrl);
      
      // Extract study ID from URL
      const studyId = extractStudyId(studyUrl);
      if (!studyId) {
        throw new Error('Invalid Lichess study URL. Please use a URL like: https://lichess.org/study/ABC123');
      }

      // Fetch the study
      const lichessStudy = await lichessStudyService.fetchStudy(studyId);
      if (!lichessStudy) {
        throw new Error('Study not found or could not be parsed');
      }

      // Convert to our format
      const internalStudy = lichessStudyService.convertToInternalFormat(lichessStudy);
      
      console.log('✅ Successfully imported study:', internalStudy);
      
      setImportedStudy(internalStudy);
      setPreviewData({
        name: lichessStudy.name,
        description: lichessStudy.description,
        chapters: lichessStudy.chapters.length,
        owner: lichessStudy.owner.name
      });

    } catch (error) {
      console.error('❌ Import error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmImport = () => {
    if (importedStudy) {
      onImport(importedStudy);
      handleClose();
    }
  };

  const extractStudyId = (url) => {
    // Extract study ID from various Lichess URL formats
    const patterns = [
      /lichess\.org\/study\/([a-zA-Z0-9]+)/,
      /lichess\.org\/study\/([a-zA-Z0-9]+)\/.*/,
      /^([a-zA-Z0-9]+)$/ // Just the study ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Import from Lichess</h2>
              <p className="text-sm text-gray-600">Import studies with chapters and moves</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lichess Study URL
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={studyUrl}
                onChange={(e) => setStudyUrl(e.target.value)}
                placeholder="https://lichess.org/study/ABC123 or just ABC123"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              <button
                onClick={handleImport}
                disabled={isLoading || !studyUrl.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Importing...' : 'Import'}</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Enter a public Lichess study URL or study ID
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Import Failed</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Preview Data */}
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-green-800">Study Ready to Import</h4>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Name:</span>
                      <span className="text-sm font-medium text-gray-800">{previewData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chapters:</span>
                      <span className="text-sm font-medium text-gray-800">{previewData.chapters}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Owner:</span>
                      <span className="text-sm font-medium text-gray-800">{previewData.owner}</span>
                    </div>
                    {previewData.description && (
                      <div className="mt-2">
                        <span className="text-sm text-gray-600">Description:</span>
                        <p className="text-sm text-gray-700 mt-1">{previewData.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 flex items-center space-x-2 transition-all duration-200"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Import Study</span>
                </button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">How to Import</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Copy the URL from any public Lichess study</li>
              <li>• Paste it above and click Import</li>
              <li>• All chapters and moves will be imported</li>
              <li>• You can then edit and organize as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LichessImportModal;

