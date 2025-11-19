import React from 'react';

// Engine Suggestions Component
const EngineSuggestionsPanel = ({ 
  engineSuggestions, 
  engineStatus, 
  engineDebug, 
  onInitializeEngine, 
  onAnalyzePosition, 
  currentFen 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold">Engine Analysis</h3>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium">{engineStatus}</span>
        </div>
      </div>
      
      {/* Engine Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => onAnalyzePosition(currentFen)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
        >
          Analyze
        </button>
        <button
          onClick={onInitializeEngine}
          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
        >
          Restart Engine
        </button>
      </div>
      
      {/* Suggestions */}
      <div className="space-y-3">
        {engineSuggestions.length === 0 ? (
          <div className="text-gray-500 italic text-center py-4">
            <div>No engine suggestions available</div>
          </div>
        ) : (
          engineSuggestions.map((suggestion, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-lg font-bold">{suggestion.move}</span>
                <span className="font-bold text-green-600">
                  {suggestion.evaluation}
                </span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div>Depth: {suggestion.depth} | Nodes: {suggestion.nodes?.toLocaleString()}</div>
                <div className="font-mono">Line: {suggestion.pv.join(' ')}</div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Debug Toggle */}
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-gray-600">Debug Console</summary>
        <div className="mt-2 bg-black text-green-400 p-3 rounded text-xs font-mono h-32 overflow-y-auto">
          {engineDebug.map((log, index) => (
            <div key={index} className="text-gray-300">
              [{log.timestamp}] {log.message}
            </div>
          ))}
        </div>
      </details>
    </div>
  );
};

export default EngineSuggestionsPanel;