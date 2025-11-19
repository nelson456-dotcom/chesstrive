import React, { useState } from 'react';
import LichessOpeningTreePage from './LichessOpeningTreePage';
import LichessOpeningTreeIntegration from './LichessOpeningTreeIntegration';

const EnhancedOpeningTreePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'lichess' | 'original'>('lichess');

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Opening Tree Explorer</h1>
          <p className="text-gray-300 text-lg">
            Explore chess openings with real data from Lichess or use the original OpeningTree interface
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 rounded-lg p-1 flex">
            <button
              onClick={() => setActiveTab('lichess')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'lichess'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Lichess Opening Explorer
            </button>
            <button
              onClick={() => setActiveTab('original')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'original'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              Original OpeningTree
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {activeTab === 'lichess' ? (
            <LichessOpeningTreePage />
          ) : (
            <div className="p-8">
              <div className="w-full h-[80vh] flex flex-col items-center">
                <h2 className="text-2xl font-bold mb-4">Original Opening Tree</h2>
                <iframe
                  src="https://www.openingtree.com"
                  title="Opening Tree"
                  width="100%"
                  height="700px"
                  style={{ border: '1px solid #444', borderRadius: '8px' }}
                  allowFullScreen
                />
                <p className="mt-4 text-gray-400 text-sm">
                  Powered by{' '}
                  <a
                    href="https://www.openingtree.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    OpeningTree
                  </a>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Feature Comparison */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-400">Lichess Opening Explorer</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Real data from millions of Lichess games
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Masters database with tournament games
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Player-specific database analysis
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Advanced filtering by rating and time control
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Top games and recent games examples
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Interactive move selection
              </li>
            </ul>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">Original OpeningTree</h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Comprehensive opening database
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Professional opening analysis
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Detailed move explanations
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                ECO code classification
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Opening name identification
              </li>
              <li className="flex items-center">
                <span className="text-green-400 mr-2">✓</span>
                Historical opening theory
              </li>
            </ul>
          </div>
        </div>

        {/* Integration Example */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Integration Example</h3>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-300 mb-4">
              Here's how you can integrate the Lichess Opening Tree into your own chess application:
            </p>
            <LichessOpeningTreeIntegration />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedOpeningTreePage;
