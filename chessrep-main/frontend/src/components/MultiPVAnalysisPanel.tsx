import React, { useState, useCallback, useEffect, useRef } from 'react';
import { EngineMove } from '../types/chess';
import { Chess } from 'chess.js';
import { 
  ChevronDown, ChevronUp, Copy, Plus, Play, Eye, EyeOff, Settings, 
  X, Check, Loader2, AlertCircle, Info, Target
} from 'lucide-react';
import './MultiPVAnalysisPanel.css';

// Chess piece Unicode mappings
const PIECES: Record<string, string> = {
  'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
  'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
};

interface MultiPVAnalysisPanelProps {
  lines: EngineMove[];
  currentFEN: string;
  isAnalyzing: boolean;
  isAnalysisEnabled?: boolean;
  engineError?: string | null;
  onToggleAnalysis?: (enabled: boolean) => void;
  onAdoptLine: (moves: string[]) => void;
  onPreviewLine?: (moves: string[], isPreviewing: boolean) => void;
  onInsertAsVariation?: (moves: string[]) => void;
  onSettingsChange?: (settings: AnalysisSettings) => void;
  className?: string;
}

interface AnalysisSettings {
  multiPV: number;
  pvLength: number; // Number of plies to show by default
  depthCap: number;
  showNodes: boolean;
  showTime: boolean;
}

const DEFAULT_SETTINGS: AnalysisSettings = {
  multiPV: 3,
  pvLength: 10, // 10 plies = 5 moves for each side
  depthCap: 20,
  showNodes: false,
  showTime: false
};

const PV_LENGTH_OPTIONS = [6, 8, 10, 12, 16, 20, 24];

export const MultiPVAnalysisPanel: React.FC<MultiPVAnalysisPanelProps> = ({
  lines,
  currentFEN,
  isAnalyzing,
  isAnalysisEnabled = true,
  engineError,
  onToggleAnalysis,
  onAdoptLine,
  onPreviewLine,
  onInsertAsVariation,
  onSettingsChange,
  className = ''
}) => {
  // Ensure lines is always an array to prevent undefined errors
  const safeLines = Array.isArray(lines) ? lines : [];
  
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());
  const [previewingLine, setPreviewingLine] = useState<number | null>(null);
  const [settings, setSettings] = useState<AnalysisSettings>(() => {
    const saved = localStorage.getItem('chessrep-analysis-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [showSettings, setShowSettings] = useState(false);
  const [copiedLineIndex, setCopiedLineIndex] = useState<number | null>(null);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFENRef = useRef<string>(currentFEN);

  // Save settings to localStorage when they change and notify parent
  useEffect(() => {
    localStorage.setItem('chessrep-analysis-settings', JSON.stringify(settings));
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
  }, [settings, onSettingsChange]);

  // Reset expanded lines when position changes
  useEffect(() => {
    if (currentFEN !== lastFENRef.current) {
      setExpandedLines(new Set());
      setPreviewingLine(null);
      lastFENRef.current = currentFEN;
    }
  }, [currentFEN]);

  // Check if position is terminal (mate/stalemate)
  const isTerminalPosition = useCallback((fen: string): boolean => {
    try {
      const game = new Chess(fen);
      return game.isGameOver();
    } catch {
      return false;
    }
  }, []);

  const isTerminal = isTerminalPosition(currentFEN);

  // Format evaluation (White POV: + = good for White, - = good for Black)
  const formatEvaluation = useCallback((evalData: EngineMove['evaluation']): string => {
    if (evalData.type === 'mate') {
      const mateValue = evalData.value;
      if (mateValue > 0) {
        return `#${mateValue}`; // Mate in N for White
      } else {
        return `#${Math.abs(mateValue)}`; // Mate in N for Black
      }
    } else {
      // Centipawn evaluation (convert to pawns, White POV)
      const pawns = evalData.value / 100;
      if (pawns > 0) {
        return `+${pawns.toFixed(1)}`;
      } else if (pawns < 0) {
        return pawns.toFixed(1);
      } else {
        return '0.0';
      }
    }
  }, []);

  // Format move with piece symbols (Lichess style)
  const formatMoveWithPieces = useCallback((moveSan: string): string => {
    if (!moveSan) return '';
    
    // Skip if it's castling notation
    if (moveSan === 'O-O' || moveSan === 'O-O-O') {
      return moveSan;
    }
    
    // Replace piece letters with Unicode symbols
    // Match piece letters followed by a file (a-h) or capture (x) or equals (= for promotion)
    let formatted = moveSan;
    
    // Replace Q (queen) - matches Q followed by file, x, or =
    formatted = formatted.replace(/Q(?=[a-hx=])/g, PIECES['Q']);
    // Replace R (rook) - matches R followed by file or x, but not in O-O
    formatted = formatted.replace(/\bR(?=[a-hx])/g, PIECES['R']);
    // Replace B (bishop) - matches B followed by file or x
    formatted = formatted.replace(/B(?=[a-hx])/g, PIECES['B']);
    // Replace N (knight) - matches N followed by file or x
    formatted = formatted.replace(/\bN(?=[a-hx])/g, PIECES['N']);
    // Replace K (king) - matches K followed by file or x, but not in O-O
    formatted = formatted.replace(/\bK(?=[a-hx])/g, PIECES['K']);
    
    return formatted;
  }, []);

  // Toggle line expansion
  const toggleLineExpansion = useCallback((lineIndex: number) => {
    setExpandedLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lineIndex)) {
        newSet.delete(lineIndex);
      } else {
        newSet.add(lineIndex);
      }
      return newSet;
    });
  }, []);

  // Handle line click - adopt the line
  const handleLineClick = useCallback((lineIndex: number) => {
    const line = safeLines[lineIndex];
    if (line && line.pv && line.pv.length > 0) {
      onAdoptLine(line.pv);
    }
  }, [safeLines, onAdoptLine]);

  // Handle line hover - DO NOTHING for engine suggestions (no board preview)
  const handleLineHover = useCallback((lineIndex: number, isEntering: boolean) => {
    // Engine suggestions should not show any board preview on hover
    // This function intentionally does nothing to prevent board arrows/preview
  }, []);

  // Handle long press (mobile) - preview
  const handleLineLongPress = useCallback((lineIndex: number) => {
    const line = safeLines[lineIndex];
    if (line && line.pv && line.pv.length > 0 && onPreviewLine) {
      setPreviewingLine(lineIndex);
      onPreviewLine(line.pv, true);
    }
  }, [safeLines, onPreviewLine]);

  // Copy PV to clipboard
  const copyPVToClipboard = useCallback(async (lineIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const line = safeLines[lineIndex];
    if (line && line.pv && line.pv.length > 0) {
      const pvText = line.pv.join(' ');
      try {
        await navigator.clipboard.writeText(pvText);
        setCopiedLineIndex(lineIndex);
        setTimeout(() => setCopiedLineIndex(null), 2000);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    }
  }, [safeLines]);

  // Insert PV as variation
  const insertPVAsVariation = useCallback((lineIndex: number, event: React.MouseEvent) => {
    event.stopPropagation();
    const line = safeLines[lineIndex];
    if (line && line.pv && line.pv.length > 0 && onInsertAsVariation) {
      onInsertAsVariation(line.pv);
    }
  }, [safeLines, onInsertAsVariation]);

  // Format PV moves for display with piece symbols
  const formatPVMoves = useCallback((pv: string[], maxPly: number, isExpanded: boolean): string => {
    if (!pv || pv.length === 0) return '';
    
    const movesToShow = isExpanded ? pv : pv.slice(0, maxPly);
    return movesToShow.map(move => formatMoveWithPieces(move)).join(' ');
  }, [formatMoveWithPieces]);

  // Get visible PV length based on settings
  const getVisiblePVLength = useCallback((isExpanded: boolean): number => {
    return isExpanded ? 999 : settings.pvLength;
  }, [settings.pvLength]);

  if (isTerminal) {
    return (
      <div className={`multi-pv-panel terminal-position ${className}`}>
        <div className="terminal-message">
          <AlertCircle className="terminal-icon" />
          <div>
            <h3>Game Over</h3>
            <p>
              {(() => {
                try {
                  const game = new Chess(currentFEN);
                  if (game.isCheckmate()) {
                    return game.turn() === 'w' ? 'Black wins by checkmate' : 'White wins by checkmate';
                  } else if (game.isStalemate()) {
                    return 'Draw by stalemate';
                  } else if (game.isDraw()) {
                    return 'Draw';
                  }
                  return 'Game over';
                } catch {
                  return 'Invalid position';
                }
              })()}
            </p>
            <p className="terminal-hint">Engine analysis is not available for terminal positions.</p>
          </div>
        </div>
      </div>
    );
  }

  // Get current evaluation from first line
  const currentEval = safeLines.length > 0 && safeLines[0] ? safeLines[0].evaluation : null;
  const currentDepth = safeLines.length > 0 && safeLines[0] 
    ? (safeLines[0].depth || (safeLines[0].evaluation && safeLines[0].evaluation.depth) || 0) 
    : 0;

  return (
    <div className={`multi-pv-panel lichess-style ${className}`}>
      {/* Lichess-style Header */}
      <div className="multi-pv-header-lichess">
        <div className="header-top-row">
          <div 
            className="analysis-toggle"
            onClick={() => {
              if (onToggleAnalysis) {
                onToggleAnalysis(!isAnalysisEnabled);
              }
            }}
            style={{ cursor: onToggleAnalysis ? 'pointer' : 'default' }}
            title={isAnalysisEnabled ? 'Disable analysis' : 'Enable analysis'}
          >
            <div className={`toggle-switch ${isAnalysisEnabled ? 'active' : ''}`}>
              <div className="toggle-indicator"></div>
            </div>
          </div>
          <div className="current-evaluation">
            {currentEval ? (
              <span className={`eval-value ${currentEval.value > 0 ? 'positive' : currentEval.value < 0 ? 'negative' : 'neutral'}`}>
                {currentEval.type === 'mate' 
                  ? `M${Math.abs(currentEval.value)}` 
                  : currentEval.value === 0 
                    ? '0.0' 
                    : `${currentEval.value > 0 ? '+' : ''}${(currentEval.value / 100).toFixed(1)}`
                }
              </span>
            ) : (
              <span className="eval-value neutral">0.0</span>
            )}
          </div>
          <div className="engine-info">
            <span className="engine-name">SF 17.1</span>
            <span className="engine-details">· 7MB NNUE</span>
          </div>
          <div className="header-actions">
            <button className="header-action-btn" title="Focus">
              <Target className="icon-small" />
            </button>
            <button 
              className="header-action-btn" 
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings className="icon-small" />
            </button>
          </div>
        </div>
        <div className="header-bottom-row">
          <span className="depth-info">+ Depth {currentDepth} CLOUD</span>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h4>Analysis Settings</h4>
            <button onClick={() => setShowSettings(false)} className="close-button">
              <X className="icon" />
            </button>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <label>Multi-PV Count</label>
              <select
                value={settings.multiPV}
                onChange={(e) => setSettings(prev => ({ ...prev, multiPV: parseInt(e.target.value) }))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>
            <div className="setting-item">
              <label>PV Length (plies)</label>
              <select
                value={settings.pvLength}
                onChange={(e) => setSettings(prev => ({ ...prev, pvLength: parseInt(e.target.value) }))}
              >
                {PV_LENGTH_OPTIONS.map(len => (
                  <option key={len} value={len}>{len}</option>
                ))}
              </select>
            </div>
            <div className="setting-item">
              <label>Depth Cap</label>
              <input
                type="number"
                min="5"
                max="30"
                value={settings.depthCap}
                onChange={(e) => setSettings(prev => ({ ...prev, depthCap: parseInt(e.target.value) || 20 }))}
              />
            </div>
            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showNodes}
                  onChange={(e) => setSettings(prev => ({ ...prev, showNodes: e.target.checked }))}
                />
                Show Nodes/KNPS
              </label>
            </div>
            <div className="setting-item checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={settings.showTime}
                  onChange={(e) => setSettings(prev => ({ ...prev, showTime: e.target.checked }))}
                />
                Show Time
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Lines */}
      <div className="multi-pv-lines">
        {safeLines.length === 0 && !isAnalyzing && (
          <div className="no-lines">
            <Info className="icon" />
            <p>No analysis available.</p>
            {engineError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                <strong>Error:</strong> {engineError}
              </div>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Make sure the backend server is running on port 3001.
            </p>
            <p className="text-xs text-red-500 mt-1 font-semibold">
              To start the backend: Open a terminal, navigate to the project folder, and run:
            </p>
            <p className="text-xs text-gray-700 mt-1 font-mono bg-gray-100 p-2 rounded">
              cd backend && npm start
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Check browser console (F12) for detailed error messages and telemetry logs (📊 TELEMETRY).
            </p>
          </div>
        )}
        
        {/* Show spinner only when analyzing AND no lines yet */}
        {safeLines.length === 0 && isAnalyzing && (
          <div className="no-lines">
            <Loader2 className="icon spinner" />
            <p>Engine is analyzing...</p>
            <p className="text-xs text-gray-500 mt-2">
              First PV should appear within 2 seconds. If it takes longer, check the backend server.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Check browser console (F12) for detailed logs and telemetry.
            </p>
          </div>
        )}

        {/* Show lines as soon as they arrive - spinner will disappear automatically */}
        {safeLines.length > 0 && safeLines
          .filter((line) => line != null) // Filter out null/undefined lines
          .map((line, index) => {
            const isExpanded = expandedLines.has(index);
            const visibleLength = getVisiblePVLength(isExpanded);
            const pvMoves = (line.pv && Array.isArray(line.pv) ? line.pv : []) || (line.move ? [line.move] : []);
            const hasMoreMoves = pvMoves.length > visibleLength;
            const displayMoves = formatPVMoves(pvMoves, visibleLength, isExpanded);

          return (
            <div
              key={index}
              className={`pv-line ${index === 0 ? 'best-line' : ''} ${previewingLine === index ? 'previewing' : ''}`}
              onClick={() => handleLineClick(index)}
              // Hover handlers removed - engine suggestions should not show board preview on hover
            >
              <div className="pv-line-content-lichess">
                <div className="pv-eval-lichess">
                  {line.evaluation ? formatEvaluation(line.evaluation) : '0.0'}
                </div>
                <div className="pv-moves-lichess">
                  <span className="pv-moves-text">{displayMoves || formatMoveWithPieces(line.move)}</span>
                  {hasMoreMoves && !isExpanded && (
                    <span className="pv-more-indicator">...</span>
                  )}
                </div>
                {hasMoreMoves && (
                  <button
                    className="expand-button-lichess"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLineExpansion(index);
                    }}
                    title={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown className={`icon-tiny ${isExpanded ? 'expanded' : ''}`} />
                  </button>
                )}
              </div>

              {/* Hidden action buttons - show on hover */}
              <div className="pv-line-actions-lichess">
                <button
                  className="action-button-lichess"
                  onClick={(e) => copyPVToClipboard(index, e)}
                  title="Copy PV to clipboard"
                >
                  {copiedLineIndex === index ? (
                    <Check className="icon-tiny success" />
                  ) : (
                    <Copy className="icon-tiny" />
                  )}
                </button>
                {onInsertAsVariation && (
                  <button
                    className="action-button-lichess"
                    onClick={(e) => insertPVAsVariation(index, e)}
                    title="Insert as variation"
                  >
                    <Plus className="icon-tiny" />
                  </button>
                )}
                {/* Preview button removed - engine suggestions should not preview on board */}
                <button
                  className="action-button-lichess primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLineClick(index);
                  }}
                  title="Adopt this line"
                >
                  <Play className="icon-tiny" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default MultiPVAnalysisPanel;

