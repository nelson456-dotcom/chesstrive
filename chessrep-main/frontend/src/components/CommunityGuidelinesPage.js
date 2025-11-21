import React from 'react';
import { Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CommunityGuidelinesPage = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Community Guidelines</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-sm text-gray-500 mb-8">Last updated: {currentDate}</p>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Be Respectful</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ChessStrive is a community for chess players of all levels. We expect all members to treat each other with respect and kindness, regardless of skill level, background, or experience.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Use respectful language in all interactions</li>
                <li>Be supportive of players who are learning</li>
                <li>Constructive criticism is welcome; personal attacks are not</li>
                <li>Respect different opinions and playing styles</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. No Harassment or Bullying</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We have zero tolerance for harassment, bullying, or discrimination of any kind. This includes:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Threats, intimidation, or stalking</li>
                <li>Hate speech or discriminatory language</li>
                <li>Sexual harassment or inappropriate content</li>
                <li>Targeting individuals based on protected characteristics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. No Cheating or Unfair Play</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Maintain the integrity of the game and platform:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Do not use chess engines or assistance during games</li>
                <li>Do not create multiple accounts to gain unfair advantages</li>
                <li>Do not manipulate ratings or game results</li>
                <li>Report suspected cheating to our support team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Content Guidelines</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When posting content (games, analysis, comments):
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Share only content you have the right to share</li>
                <li>Do not post spam, advertisements, or self-promotion</li>
                <li>Keep content relevant to chess and the community</li>
                <li>Do not share personal information of others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Consequences of Violations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Violations of these guidelines may result in:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                <li>Warning or temporary suspension</li>
                <li>Permanent account ban for severe violations</li>
                <li>Removal of inappropriate content</li>
                <li>Legal action in cases of illegal activity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Reporting Violations</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you witness violations of these guidelines, please report them to <a href="mailto:support@chesstrive.com" className="text-blue-600 hover:underline">support@chesstrive.com</a>. We take all reports seriously and will investigate promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Questions about these guidelines? Contact us at <a href="mailto:support@chesstrive.com" className="text-blue-600 hover:underline">support@chesstrive.com</a>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelinesPage;

