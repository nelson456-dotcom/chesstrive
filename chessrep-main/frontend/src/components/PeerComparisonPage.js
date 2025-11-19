import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const API_BASE = 'http://localhost:3001';

const PeerComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);

  const username = searchParams.get('username');
  const timeClass = searchParams.get('timeClass') || 'all';
  const platform = searchParams.get('platform') || 'auto';

  useEffect(() => {
    if (!username) {
      setError('Username is required');
      setLoading(false);
      return;
    }

    fetchPeerComparison();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, timeClass, platform]);

  const fetchPeerComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please log in to view peer comparison');
      }

      const response = await fetch(
        `${API_BASE}/api/games/report/peer-comparison?username=${username}&timeClass=${timeClass}&platform=${platform}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'x-auth-token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch peer comparison: ${response.status}`);
      }

      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      console.error('Error fetching peer comparison:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (value) => {
    if (value >= 75) return { Icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' };
    if (value >= 50) return { Icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' };
  };

  const formatRatingSource = (source) => {
    switch (source) {
      case 'rapid':
        return 'Rapid';
      case 'blitz':
        return 'Blitz';
      case 'classical':
        return 'Classical';
      case 'bullet':
        return 'Bullet';
      case 'daily':
        return 'Daily';
      case 'estimated':
        return 'Estimated';
      default:
        return 'Rating';
    }
  };

  const formatPlatform = (value) => {
    if (!value || value === 'auto') return 'Chess.com / Lichess';
    if (value === 'chesscom') return 'Chess.com';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const PlanSection = ({ title, items = [], accent }) => (
    <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 shadow-sm">
      <h4 className={`text-lg font-semibold ${accent}`}>{title}</h4>
      <ul className="mt-3 space-y-2 text-gray-700 list-disc list-inside">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {item}
            </li>
          ))
        ) : (
          <li className="text-gray-500 italic">No items available.</li>
        )}
      </ul>
    </div>
  );

  // Simple radar chart using SVG
  const RadarChart = ({ data }) => {
    const size = 400;
    const center = size / 2;
    const maxRadius = 150;
    const levels = 5;
    
    // Calculate points for a polygon
    const calculatePoint = (value, index, total) => {
      const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
      const radius = (value / 100) * maxRadius;
      return {
        x: center + radius * Math.cos(angle),
        y: center + radius * Math.sin(angle)
      };
    };

    const metrics = [
      { label: 'Opening', you: data.playerStats.opening, peers: data.peerStats.opening },
      { label: 'Tactics', you: data.playerStats.tactics, peers: data.peerStats.tactics },
      { label: 'Ending', you: data.playerStats.ending, peers: data.peerStats.ending },
      { label: 'Advantage\nCapitalization', you: data.playerStats.advantage, peers: data.peerStats.advantage },
      { label: 'Resourcefulness', you: data.playerStats.resourcefulness, peers: data.peerStats.resourcefulness },
      { label: 'Time\nManagement', you: data.playerStats.timeManagement, peers: data.peerStats.timeManagement }
    ];

    const youPoints = metrics.map((m, i) => calculatePoint(m.you, i, metrics.length));
    const peersPoints = metrics.map((m, i) => calculatePoint(m.peers, i, metrics.length));

    const youPath = youPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
    const peersPath = peersPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
      <svg width={size} height={size} className="mx-auto">
        {/* Grid circles */}
        {[...Array(levels)].map((_, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={(maxRadius / levels) * (i + 1)}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Grid lines */}
        {metrics.map((_, i) => {
          const point = calculatePoint(100, i, metrics.length);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Peers polygon */}
        <path d={peersPath} fill="#9ca3af" fillOpacity="0.3" stroke="#9ca3af" strokeWidth="2" />

        {/* You polygon */}
        <path d={youPath} fill="#2563eb" fillOpacity="0.5" stroke="#2563eb" strokeWidth="2" />

        {/* Labels */}
        {metrics.map((metric, i) => {
          const labelPoint = calculatePoint(115, i, metrics.length);
          const lines = metric.label.split('\n');
          return (
            <text
              key={i}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              fontSize="12"
              fill="#6b7280"
            >
              {lines.map((line, j) => (
                <tspan key={j} x={labelPoint.x} dy={j === 0 ? 0 : 14}>
                  {line}
                </tspan>
              ))}
            </text>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Analyzing your performance vs peers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 text-xl font-semibold mb-4">Error</div>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate('/report/40')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!comparisonData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/report/40')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Full Report
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Performance Overview</h1>
          <p className="text-gray-600 mt-2">
            @{comparisonData.username} - {formatRatingSource(comparisonData.ratingSource)} rating{' '}
            {comparisonData.playerRating} on {formatPlatform(comparisonData.platformUsed || platform)} •{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Radar Chart */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Performance Comparison
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Rating Range: {comparisonData.ratingRange}
            </p>
            <RadarChart data={comparisonData} />
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                <span className="text-sm text-gray-600">you</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                <span className="text-sm text-gray-600">peers</span>
              </div>
            </div>
          </div>

          {/* Interpretation */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Interpretation</h2>
            <div className="space-y-4">
              {/* Opening */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(comparisonData.playerStats.opening).bg}`}>
                  {React.createElement(getStatusIcon(comparisonData.playerStats.opening).Icon, {
                    size: 20,
                    className: getStatusIcon(comparisonData.playerStats.opening).color
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Opening: {comparisonData.playerStats.opening}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comparisonData.comparison.opening > 0 
                      ? `+${comparisonData.comparison.opening} vs peers` 
                      : `${comparisonData.comparison.opening} vs peers`}
                  </p>
                </div>
              </div>

              {/* Tactics */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(comparisonData.playerStats.tactics).bg}`}>
                  {React.createElement(getStatusIcon(comparisonData.playerStats.tactics).Icon, {
                    size: 20,
                    className: getStatusIcon(comparisonData.playerStats.tactics).color
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Tactics: {comparisonData.playerStats.tactics}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comparisonData.comparison.tactics > 0 
                      ? `+${comparisonData.comparison.tactics} vs peers` 
                      : `${comparisonData.comparison.tactics} vs peers`}
                  </p>
                </div>
              </div>

              {/* Ending */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(comparisonData.playerStats.ending).bg}`}>
                  {React.createElement(getStatusIcon(comparisonData.playerStats.ending).Icon, {
                    size: 20,
                    className: getStatusIcon(comparisonData.playerStats.ending).color
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Ending: {comparisonData.playerStats.ending}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comparisonData.comparison.ending > 0 
                      ? `+${comparisonData.comparison.ending} vs peers` 
                      : `${comparisonData.comparison.ending} vs peers`}
                  </p>
                </div>
              </div>

              {/* Advantage Capitalization */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(comparisonData.playerStats.advantage).bg}`}>
                  {React.createElement(getStatusIcon(comparisonData.playerStats.advantage).Icon, {
                    size: 20,
                    className: getStatusIcon(comparisonData.playerStats.advantage).color
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Advantage Capitalization: {comparisonData.playerStats.advantage}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comparisonData.comparison.advantage > 0 
                      ? `+${comparisonData.comparison.advantage} vs peers` 
                      : `${comparisonData.comparison.advantage} vs peers`}
                  </p>
                </div>
              </div>

              {/* Resourcefulness */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(comparisonData.playerStats.resourcefulness).bg}`}>
                  {React.createElement(getStatusIcon(comparisonData.playerStats.resourcefulness).Icon, {
                    size: 20,
                    className: getStatusIcon(comparisonData.playerStats.resourcefulness).color
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Resourcefulness: {comparisonData.playerStats.resourcefulness}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comparisonData.comparison.resourcefulness > 0 
                      ? `+${comparisonData.comparison.resourcefulness} vs peers` 
                      : `${comparisonData.comparison.resourcefulness} vs peers`}
                  </p>
                </div>
              </div>

              {/* Time Management */}
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getStatusIcon(comparisonData.playerStats.timeManagement).bg}`}>
                  {React.createElement(getStatusIcon(comparisonData.playerStats.timeManagement).Icon, {
                    size: 20,
                    className: getStatusIcon(comparisonData.playerStats.timeManagement).color
                  })}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-800">Time Management: {comparisonData.playerStats.timeManagement}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {comparisonData.comparison.timeManagement > 0 
                      ? `+${comparisonData.comparison.timeManagement} vs peers` 
                      : `${comparisonData.comparison.timeManagement} vs peers`}
                  </p>
                </div>
              </div>
            </div>

            {/* How to improve section */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">How to improve</h3>
              <button 
                onClick={() => navigate('/training-room')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors cursor-pointer"
              >
                TRY PERSONALIZED LESSONS
              </button>
            </div>
          </div>
        </div>

        {/* Study Plan Section */}
        {comparisonData.studyPlan && (
          <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{comparisonData.studyPlan.title}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                <span>🎯 Rating bracket: {comparisonData.studyPlan.ratingBracket}</span>
                <span>🧭 Focus: {comparisonData.studyPlan.focus}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <PlanSection title="Daily" items={comparisonData.studyPlan.daily} accent="text-blue-600" />
              <PlanSection title="Weekly" items={comparisonData.studyPlan.weekly} accent="text-blue-600" />
              <PlanSection title="Monthly" items={comparisonData.studyPlan.monthly} accent="text-emerald-600" />
              <PlanSection title="Yearly" items={comparisonData.studyPlan.yearly} accent="text-orange-600" />
            </div>

            {/* Recommended Modules (Weaknesses) */}
            {comparisonData.studyPlan.recommendedModules && comparisonData.studyPlan.recommendedModules.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-red-600 mb-4">🚨 Priority Training (Your Weaknesses)</h3>
                <div className="space-y-4">
                  {comparisonData.studyPlan.recommendedModules.map((module, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        module.priority === 'high' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-orange-500 bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{module.title}</h4>
                            <span className={`text-xs px-2 py-1 rounded ${
                              module.priority === 'high' 
                                ? 'bg-red-200 text-red-800' 
                                : 'bg-orange-200 text-orange-800'
                            }`}>
                              {module.gap}% behind peers
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                          <span className="text-xs text-gray-500">⏱️ {module.duration}</span>
                        </div>
                        <button 
                          onClick={() => navigate(module.url)}
                          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                        >
                          Start Module
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Modules */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">📚 Complete Training Plan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparisonData.studyPlan.modules.map((module, index) => {
                  const isWeakness = comparisonData.studyPlan.weaknesses?.includes(module.area);
                  const isStrength = comparisonData.studyPlan.strengths?.includes(module.area);
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border ${
                        isWeakness 
                          ? 'border-red-300 bg-red-50' 
                          : isStrength
                          ? 'border-green-300 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-800">{module.title}</h4>
                        {isWeakness && <span className="text-red-600 text-xs">⚠️ Weak</span>}
                        {isStrength && <span className="text-green-600 text-xs">✓ Strong</span>}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">⏱️ {module.duration}</span>
                        <button 
                          onClick={() => navigate(module.url)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerComparisonPage;

