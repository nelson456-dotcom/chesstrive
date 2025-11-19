import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { useAuth } from '../contexts/AuthContext';
import OpenInLiveAnalysisButton from './OpenInLiveAnalysisButton';

const PositionAnalysis = () => {
  const { user } = useAuth();
  const [game, setGame] = useState(new Chess());
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [depth, setDepth] = useState(20);
  const [engineEnabled, setEngineEnabled] = useState(false);

  useEffect(() => {
    if (engineEnabled) {
      analyzePosition();
    }
  }, [game.fen(), depth, engineEnabled]);

  const analyzePosition = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fen: game.fen(),
          depth
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      setError('Error analyzing position');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = (move) => {
    try {
      const newGame = new Chess(game.fen());
      newGame.move(move);
      setGame(newGame);
    } catch (error) {
      console.error('Invalid move:', error);
    }
  };

  const handleUndo = () => {
    const newGame = new Chess(game.fen());
    newGame.undo();
    setGame(newGame);
  };

  const handleReset = () => {
    setGame(new Chess());
    setAnalysis(null);
  };
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Position Analysis</h1>
        <OpenInLiveAnalysisButton fen={game.fen()} label="Open in Live Analysis" />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Chess Board */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="aspect-square bg-gray-100 rounded mb-4">
            {/* Add your chess board component here */}
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              Chess Board Visualization
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <button
              onClick={handleUndo}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Undo Move
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Reset Position
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={engineEnabled}
                onChange={(e) => setEngineEnabled(e.target.checked)}
                className="mr-2"
              />
              Enable Engine
            </label>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="p-2 border rounded"
              disabled={!engineEnabled}
            >
              <option value="10">Depth 10</option>
              <option value="15">Depth 15</option>
              <option value="20">Depth 20</option>
              <option value="25">Depth 25</option>
            </select>
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Engine Analysis</h2>

          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : analysis ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Evaluation</h3>
                <p className="text-lg">
                  {analysis.evaluation > 0 ? '+' : ''}
                  {analysis.evaluation.toFixed(2)}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Best Moves</h3>
                <div className="space-y-2">
                  {analysis.bestMoves.map((move, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleMove(move.move)}
                    >
                      <span>{index + 1}. {move.move}</span>
                      <span className="text-gray-600">
                        {move.evaluation > 0 ? '+' : ''}
                        {move.evaluation.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded">
                <h3 className="font-semibold mb-2">Analysis Details</h3>
                <p>Depth: {analysis.depth}</p>
                <p>Nodes: {analysis.nodes.toLocaleString()}</p>
                <p>Time: {analysis.time}ms</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">
              {engineEnabled
                ? 'Enable the engine to start analysis'
                : 'No analysis available'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionAnalysis; 
