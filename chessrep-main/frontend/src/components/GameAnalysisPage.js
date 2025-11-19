import React, { useState } from 'react';

const API_URL = 'http://localhost:3001/api/analysis/game';

const GameAnalysisPage = () => {
  const [pgn, setPgn] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    setAnalysis(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ pgn })
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Error analyzing game');
        setLoading(false);
        return;
      }
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError('Error analyzing game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Game Analysis</h1>
      <textarea
        className="w-full h-40 p-3 border rounded mb-4"
        placeholder="Paste your PGN here..."
        value={pgn}
        onChange={e => setPgn(e.target.value)}
      />
      <button
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        onClick={handleAnalyze}
        disabled={loading || !pgn.trim()}
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      {error && <div className="mt-4 text-red-600">{error}</div>}
      {analysis && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Move-by-move Analysis</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="border px-2 py-1">#</th>
                  <th className="border px-2 py-1">Move</th>
                  <th className="border px-2 py-1">Evaluation</th>
                  <th className="border px-2 py-1">Best Move</th>
                </tr>
              </thead>
              <tbody>
                {analysis.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{item.move}</td>
                    <td className="border px-2 py-1">{item.evaluation !== null ? item.evaluation : 'N/A'}</td>
                    <td className="border px-2 py-1">{item.bestMove || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameAnalysisPage; 
