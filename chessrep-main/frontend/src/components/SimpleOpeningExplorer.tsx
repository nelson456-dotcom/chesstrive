import React, { useState, useEffect } from 'react';
import { OpeningTreeService, OpeningMove } from '../services/OpeningTreeService';
import { Chess } from 'chess.js';

// Using OpeningMove from OpeningTreeService

interface SimpleOpeningExplorerProps {
  currentFEN: string;
  onMoveClick: (from: string, to: string, promotion?: string) => void;
  className?: string;
}

// Initialize the opening tree service
const openingService = new OpeningTreeService();

const SimpleOpeningExplorer: React.FC<SimpleOpeningExplorerProps> = ({
  currentFEN,
  onMoveClick,
  className = ''
}) => {
  const [openingMoves, setOpeningMoves] = useState<OpeningMove[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);

  useEffect(() => {
    loadOpeningMoves();
  }, [currentFEN]);

  const loadOpeningMoves = async () => {
    setIsLoading(true);
    
    try {
      console.log('SimpleOpeningExplorer: Loading opening moves for FEN:', currentFEN);
      // Get opening moves from the service (synchronous call)
      const moves = openingService.getOpeningMoves(currentFEN);
      console.log('SimpleOpeningExplorer: Received moves:', moves);
      setOpeningMoves(moves);
    } catch (error) {
      console.error('Error loading opening moves:', error);
      setOpeningMoves([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveClick = (move: OpeningMove) => {
    setSelectedMove(move.uci);
    const from = move.from;
    const to = move.to;
    const promotion = move.uci.length > 4 ? move.uci.substring(4) : undefined;
    onMoveClick(from, to, promotion);
  };

  const getMoveColor = (winRate: { white: number; draws: number; black: number }) => {
    const totalWinRate = winRate.white + winRate.draws * 0.5; // Count draws as half wins
    if (totalWinRate >= 55) return '#10b981'; // green
    if (totalWinRate >= 50) return '#3b82f6'; // blue
    if (totalWinRate >= 45) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getFrequencyColor = (frequency: number) => {
    if (frequency >= 40) return '#3b82f6';
    if (frequency >= 20) return '#8b5cf6';
    if (frequency >= 10) return '#06b6d4';
    return '#6b7280';
  };

  return (
    <div className={`simple-opening-explorer ${className}`}>
      <div style={{
        padding: '12px',
        backgroundColor: 'rgba(249, 250, 251, 0.8)',
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151'
        }}>
          📚 Opening Database
        </h3>
        <p style={{
          margin: 0,
          fontSize: '11px',
          color: '#6b7280'
        }}>
          Based on master games and popular variations
        </p>
      </div>

      {isLoading ? (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          🔄 Loading moves...
        </div>
      ) : openingMoves.length > 0 ? (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {openingMoves.map((move, index) => (
            <div
              key={move.uci}
              onClick={() => handleMoveClick(move)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                marginBottom: '4px',
                backgroundColor: selectedMove === move.uci ? '#dbeafe' : 'transparent',
                borderRadius: '6px',
                cursor: 'pointer',
                border: selectedMove === move.uci ? '1px solid #3b82f6' : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                if (selectedMove !== move.uci) {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                }
              }}
              onMouseOut={(e) => {
                if (selectedMove !== move.uci) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{
                width: '32px',
                height: '24px',
                backgroundColor: getFrequencyColor(move.frequency),
                color: 'white',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: '600',
                marginRight: '12px',
                minWidth: '32px'
              }}>
                {move.san}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#374151'
                  }}>
                    {move.san}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: getMoveColor(move.winRate),
                    fontWeight: '600'
                  }}>
                    {move.winRate.white.toFixed(1)}%
                  </span>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  color: '#6b7280'
                }}>
                  <span>{move.frequency.toFixed(1)}% frequency</span>
                  <span>{move.totalGames.toLocaleString()} games</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: '#6b7280',
          fontSize: '12px'
        }}>
          📝 No opening data available for this position
        </div>
      )}
    </div>
  );
};

export default SimpleOpeningExplorer;
