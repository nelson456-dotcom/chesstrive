/**
 * Multi-PV Analysis Panel
 * Lichess-style analysis panel with full continuations
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  Play, Square, Copy, ChevronDown, ChevronUp, 
  Settings, X, CheckCircle, AlertCircle 
} from 'lucide-react';
import lichessAnalysisEngine from '../services/LichessAnalysisEngine';

const MultiPVAnalysisPanel = ({
  currentFEN,
  nodeId,
  path,
  onAdoptPV,
  onPreviewPV,
  onInsertVariation,
  isAnalysisEnabled = true,
  onToggleAnalysis,
  settings: externalSettings,
  onSettingsChange
}) => {
  // Ensure pvs is always an array - initialize with empty array
  const [pvs, setPvs] = useState(() => {
    try {
      return [];
    } catch (error) {
      console.error('Error initializing pvs state:', error);
      return [];
    }
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [expandedLines, setExpandedLines] = useState(() => new Set());
  const [hoveredLineIndex, setHoveredLineIndex] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [previewTimeout, setPreviewTimeout] = useState(null);
  
  // Internal settings with defaults - ensure all properties exist
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('chessrep-analysis-settings');
      const defaults = { 
        multiPV: 3, 
        pvLength: 10, 
        depthCap: 20,
        timeLimit: 750
      };
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure all default properties exist
        return { 
          multiPV: typeof parsed.multiPV === 'number' ? parsed.multiPV : defaults.multiPV,
          pvLength: typeof parsed.pvLength === 'number' ? parsed.pvLength : defaults.pvLength,
          depthCap: typeof parsed.depthCap === 'number' ? parsed.depthCap : defaults.depthCap,
          timeLimit: typeof parsed.timeLimit === 'number' ? parsed.timeLimit : defaults.timeLimit
        };
      }
      return defaults;
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      return { 
        multiPV: 3, 
        pvLength: 10, 
        depthCap: 20,
        timeLimit: 750
      };
    }
  });
  
  // Ensure settings object is always valid - use defaults if anything is wrong
  const safeSettings = React.useMemo(() => {
    const defaults = { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
    try {
      if (!settings || typeof settings !== 'object') {
        return defaults;
      }
      const result = {
        multiPV: typeof settings.multiPV === 'number' && !isNaN(settings.multiPV) ? settings.multiPV : defaults.multiPV,
        pvLength: typeof settings.pvLength === 'number' && !isNaN(settings.pvLength) ? settings.pvLength : defaults.pvLength,
        depthCap: typeof settings.depthCap === 'number' && !isNaN(settings.depthCap) ? settings.depthCap : defaults.depthCap,
        timeLimit: typeof settings.timeLimit === 'number' && !isNaN(settings.timeLimit) ? settings.timeLimit : defaults.timeLimit
      };
      // Ensure all properties are valid numbers
      if (typeof result.multiPV !== 'number' || typeof result.pvLength !== 'number' || 
          typeof result.depthCap !== 'number' || typeof result.timeLimit !== 'number') {
        return defaults;
      }
      return result;
    } catch (error) {
      console.warn('Error computing safeSettings:', error);
      return defaults;
    }
  }, [settings]) || { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };

  // Sync with external settings if provided
  useEffect(() => {
    if (externalSettings && typeof externalSettings === 'object') {
      setSettings(prev => {
        const defaults = { 
          multiPV: 3, 
          pvLength: 10, 
          depthCap: 20,
          timeLimit: 750
        };
        return { ...defaults, ...prev, ...externalSettings };
      });
    }
  }, [externalSettings]);

  // Save settings to localStorage
  const updateSettings = useCallback((newSettings) => {
    const defaults = { 
      multiPV: 3, 
      pvLength: 10, 
      depthCap: 20,
      timeLimit: 750
    };
    const currentSettings = settings || defaults;
    const updated = { ...defaults, ...currentSettings, ...newSettings };
    setSettings(updated);
    try {
      localStorage.setItem('chessrep-analysis-settings', JSON.stringify(updated));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
    onSettingsChange?.(updated);
  }, [settings, onSettingsChange]);

  // Subscribe to engine state
  useEffect(() => {
    const unsubscribeState = lichessAnalysisEngine.onStateUpdate((state) => {
      try {
        setIsAnalyzing(state?.isRunning || false);
        // Ensure pvs is always an array
        const pvsArray = (state && state.pvs && Array.isArray(state.pvs)) 
          ? state.pvs.filter(p => p != null && p.lineIndex != null)
          : [];
        setPvs(pvsArray);
        setError(state?.error || null);
      } catch (error) {
        console.error('Error in state update callback:', error);
        setIsAnalyzing(false);
        setPvs([]);
        setError('Error processing analysis state');
      }
    });

    const unsubscribePV = lichessAnalysisEngine.onPVUpdate((pv) => {
      if (!pv || pv.lineIndex == null) return;
      
      setPvs(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        const updated = [...prevArray];
        const index = updated.findIndex(p => p && p.lineIndex === pv.lineIndex);
        if (index >= 0) {
          updated[index] = pv;
        } else {
          updated.push(pv);
          updated.sort((a, b) => {
            if (!a || !b) return 0;
            return (a.lineIndex || 0) - (b.lineIndex || 0);
          });
        }
        return updated.filter(p => p != null);
      });
    });

    const unsubscribeError = lichessAnalysisEngine.onError((err) => {
      setError(err.message);
    });

    return () => {
      unsubscribeState();
      unsubscribePV();
      unsubscribeError();
    };
  }, []);

  // Start/stop analysis when FEN or settings change
  useEffect(() => {
    if (!isAnalysisEnabled || !currentFEN) {
      lichessAnalysisEngine.stopAnalysis();
      return;
    }

    // Ensure safeSettings is valid before using it
    if (!safeSettings || typeof safeSettings !== 'object') {
      console.warn('safeSettings is invalid, skipping analysis start');
      return;
    }

    // Check if we should cancel due to node change
    if (lichessAnalysisEngine.shouldCancelForNode(currentFEN, nodeId, path)) {
      lichessAnalysisEngine.stopAnalysis();
    }

    // Start analysis with safe settings
    try {
      lichessAnalysisEngine.startAnalysis(currentFEN, safeSettings, nodeId, path);
    } catch (error) {
      console.error('Error starting analysis:', error);
      setError('Failed to start analysis');
    }

    return () => {
      lichessAnalysisEngine.stopAnalysis();
    };
  }, [currentFEN, nodeId, path, isAnalysisEnabled, safeSettings?.multiPV, safeSettings?.pvLength, safeSettings?.depthCap, safeSettings?.timeLimit]);

  // Handle click to adopt PV
  const handleAdoptPV = useCallback((pv) => {
    if (!pv || !pv.pv || !Array.isArray(pv.pv)) {
      console.warn('⚠️ Cannot adopt PV: invalid data');
      return;
    }
    if (onAdoptPV) {
      onAdoptPV(pv.pv);
    }
  }, [onAdoptPV]);

  // Handle hover/long-press to preview
  const handleMouseEnter = useCallback((pv) => {
    if (!pv || !pv.pv) return;
    
    if (previewTimeout) {
      clearTimeout(previewTimeout);
    }
    
    const timeout = setTimeout(() => {
      setHoveredLineIndex(pv.lineIndex);
      if (onPreviewPV && Array.isArray(pv.pv)) {
        onPreviewPV(pv.pv);
      }
    }, 300); // 300ms delay for "long-press"
    
    setPreviewTimeout(timeout);
  }, [onPreviewPV, previewTimeout]);

  const handleMouseLeave = useCallback(() => {
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      setPreviewTimeout(null);
    }
    setHoveredLineIndex(null);
    if (onPreviewPV) {
      onPreviewPV(null); // Clear preview
    }
  }, [onPreviewPV, previewTimeout]);

  // Handle touch for mobile
  const handleTouchStart = useCallback((pv) => {
    if (!pv || !pv.pv) return;
    
    const timeout = setTimeout(() => {
      setHoveredLineIndex(pv.lineIndex);
      if (onPreviewPV && Array.isArray(pv.pv)) {
        onPreviewPV(pv.pv);
      }
    }, 300);
    setPreviewTimeout(timeout);
  }, [onPreviewPV]);

  const handleTouchEnd = useCallback(() => {
    if (previewTimeout) {
      clearTimeout(previewTimeout);
      setPreviewTimeout(null);
    }
    setHoveredLineIndex(null);
    if (onPreviewPV) {
      onPreviewPV(null);
    }
  }, [onPreviewPV, previewTimeout]);

  // Toggle line expansion
  const toggleLine = useCallback((lineIndex) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineIndex)) {
        next.delete(lineIndex);
      } else {
        next.add(lineIndex);
      }
      return next;
    });
  }, []);

  // Copy PV to clipboard
  const copyPV = useCallback((pv) => {
    if (!pv || !pv.pv || !Array.isArray(pv.pv)) {
      console.warn('⚠️ Cannot copy PV: invalid data');
      return;
    }
    const pvString = pv.pv.join(' ');
    navigator.clipboard.writeText(pvString).then(() => {
      // Show toast (you can enhance this)
      console.log('✅ PV copied to clipboard');
    }).catch(err => {
      console.error('❌ Failed to copy PV:', err);
    });
  }, []);

  // Insert as variation
  const insertAsVariation = useCallback((pv) => {
    if (!pv || !pv.pv || !Array.isArray(pv.pv)) {
      console.warn('⚠️ Cannot insert variation: invalid data');
      return;
    }
    if (onInsertVariation) {
      onInsertVariation(pv.pv);
    }
  }, [onInsertVariation]);

  // Format evaluation
  const formatEval = (evaluation) => {
    if (evaluation.type === 'mate') {
      const mateValue = evaluation.value > 0 ? Math.ceil(evaluation.value / 10000) : Math.floor(evaluation.value / 10000);
      return `#${mateValue}`;
    }
    const cp = evaluation.value / 100;
    return cp > 0 ? `+${cp.toFixed(2)}` : cp.toFixed(2);
  };

  // Get PV display length (truncate if not expanded)
  const getPVDisplay = (pv, isExpanded) => {
    try {
      if (!pv || !pv.pv) return [];
      const fullPV = Array.isArray(pv.pv) ? pv.pv : [];
      if (fullPV.length === 0) return [];
      
      // Ensure safeSettings is defined and has pvLength
      const pvLength = (safeSettings && typeof safeSettings.pvLength === 'number') 
        ? safeSettings.pvLength 
        : 10;
      
      if (isExpanded || fullPV.length <= pvLength) {
        return fullPV;
      }
      return fullPV.slice(0, pvLength);
    } catch (error) {
      console.error('Error in getPVDisplay:', error);
      return [];
    }
  };

  // Check if position is terminal
  const isTerminal = error && (
    error.includes('Checkmate') || 
    error.includes('Stalemate') || 
    error.includes('Draw') || 
    error.includes('Game over')
  );

  // Final safety check - ensure all critical values are defined before render
  // Use try-catch to prevent any errors during initialization
  let renderPvs;
  let renderSafeSettings;
  
  try {
    renderPvs = Array.isArray(pvs) ? pvs : [];
    if (!renderPvs || typeof renderPvs.length !== 'number') {
      renderPvs = [];
    }
    
    renderSafeSettings = safeSettings || { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
    if (!renderSafeSettings || typeof renderSafeSettings !== 'object') {
      renderSafeSettings = { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
    }
    // Ensure all properties exist
    if (typeof renderSafeSettings.multiPV !== 'number') renderSafeSettings.multiPV = 3;
    if (typeof renderSafeSettings.pvLength !== 'number') renderSafeSettings.pvLength = 10;
    if (typeof renderSafeSettings.depthCap !== 'number') renderSafeSettings.depthCap = 20;
    if (typeof renderSafeSettings.timeLimit !== 'number') renderSafeSettings.timeLimit = 750;
  } catch (error) {
    console.error('Error initializing render values:', error);
    renderPvs = [];
    renderSafeSettings = { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
  }

  // Final validation - if anything is still undefined, use defaults
  if (!renderPvs || !Array.isArray(renderPvs) || typeof renderPvs.length !== 'number') {
    renderPvs = [];
  }
  if (!renderSafeSettings || typeof renderSafeSettings !== 'object') {
    renderSafeSettings = { multiPV: 3, pvLength: 10, depthCap: 20, timeLimit: 750 };
  }
  
  // Ensure renderPvs.length is always accessible
  const renderPvsLength = (renderPvs && Array.isArray(renderPvs) && typeof renderPvs.length === 'number') 
    ? renderPvs.length 
    : 0;

  return (
    <div className="multi-pv-analysis-panel bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">Analysis</h3>
          {isAnalyzing && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Analyzing...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
          {isAnalyzing ? (
            <button
              onClick={() => lichessAnalysisEngine.stopAnalysis()}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Stop Analysis"
            >
              <Square className="w-4 h-4 text-red-600" />
            </button>
          ) : (
            <button
              onClick={() => {
                if (onToggleAnalysis) {
                  onToggleAnalysis(true);
                }
                if (currentFEN && renderSafeSettings) {
                  lichessAnalysisEngine.startAnalysis(currentFEN, renderSafeSettings, nodeId, path);
                }
              }}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Start Analysis"
            >
              <Play className="w-4 h-4 text-green-600" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Multi-PV: {renderSafeSettings.multiPV}
              </label>
              <select
                value={renderSafeSettings.multiPV}
                onChange={(e) => updateSettings({ multiPV: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                PV Length: {renderSafeSettings.pvLength}
              </label>
              <select
                value={renderSafeSettings.pvLength}
                onChange={(e) => updateSettings({ pvLength: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              >
                <option value={6}>6 plies</option>
                <option value={10}>10 plies</option>
                <option value={16}>16 plies</option>
                <option value={24}>24 plies</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Depth Cap: {renderSafeSettings.depthCap}
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={renderSafeSettings.depthCap}
                onChange={(e) => updateSettings({ depthCap: parseInt(e.target.value) || 20 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Time Limit (ms): {renderSafeSettings.timeLimit}
              </label>
              <input
                type="number"
                min="100"
                max="10000"
                step="100"
                value={renderSafeSettings.timeLimit}
                onChange={(e) => updateSettings({ timeLimit: parseInt(e.target.value) || 750 })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Error/Terminal Position */}
      {error && (
        <div className="p-3 border-b border-gray-200 bg-yellow-50">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* PV Lines */}
      <div className="divide-y divide-gray-100">
        {renderPvsLength === 0 && !isAnalyzing && !error && (
          <div className="p-4 text-center text-sm text-gray-500">
            Click "Start Analysis" to begin
          </div>
        )}
        
        {renderPvs && Array.isArray(renderPvs) && renderPvs.filter(pv => pv != null && pv.lineIndex != null).map((pv, index) => {
          const isExpanded = expandedLines.has(pv.lineIndex);
          const displayPV = getPVDisplay(pv, isExpanded);
          const hasMore = (pv && pv.pv && Array.isArray(pv.pv) ? pv.pv : []).length > renderSafeSettings.pvLength;
          const isHovered = hoveredLineIndex === pv.lineIndex;
          
          // Safety checks for evaluation and depth
          const evaluation = pv.evaluation || { type: 'cp', value: 0 };
          const depth = pv.depth || 0;

          return (
            <div
              key={pv.lineIndex}
              className={`p-3 transition-colors ${
                isHovered ? 'bg-blue-50' : 'hover:bg-gray-50'
              } ${index === 0 ? 'bg-green-50/30' : ''}`}
              onMouseEnter={() => handleMouseEnter(pv)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleTouchStart(pv)}
              onTouchEnd={handleTouchEnd}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  {/* Line header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-600">
                      #{(pv.lineIndex || 0) + 1}
                    </span>
                    <span className={`text-sm font-bold ${
                      evaluation.value > 0 ? 'text-green-600' : 
                      evaluation.value < 0 ? 'text-red-600' : 'text-gray-800'
                    }`}>
                      {formatEval(evaluation)}
                    </span>
                    <span className="text-xs text-gray-500">
                      d{depth}
                    </span>
                    {pv.nodes && (
                      <span className="text-xs text-gray-400">
                        {Math.floor(pv.nodes / 1000)}k nodes
                      </span>
                    )}
                  </div>

                  {/* PV continuation */}
                  <div className="text-sm text-gray-800 font-mono">
                    {displayPV && Array.isArray(displayPV) && displayPV.length > 0 ? (
                      <span>{displayPV.join(' ')}</span>
                    ) : (
                      <span className="text-gray-400">No continuation</span>
                    )}
                    {hasMore && !isExpanded && (
                      <span className="text-gray-400"> ...</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasMore && (
                    <button
                      onClick={() => toggleLine(pv.lineIndex)}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title={isExpanded ? "Collapse" : "Expand"}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-600" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => copyPV(pv)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Copy PV"
                  >
                    <Copy className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => insertAsVariation(pv)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Insert as Variation"
                  >
                    <CheckCircle className="w-3 h-3 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleAdoptPV(pv)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    title="Adopt Line"
                  >
                    Adopt
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading state */}
      {isAnalyzing && renderPvsLength === 0 && (
        <div className="p-4 text-center">
          <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-2 text-xs text-gray-500">Analyzing position...</p>
        </div>
      )}
    </div>
  );
};

export default MultiPVAnalysisPanel;

