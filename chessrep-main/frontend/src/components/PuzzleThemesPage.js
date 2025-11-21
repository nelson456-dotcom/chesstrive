import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';

// Theme mapping for display names
const themeDisplayNames = {
  'fork': 'Fork',
  'pin': 'Pin', 
  'skewer': 'Skewer',
  'discovered_attack': 'Discovered Attack',
  'deflection': 'Deflection',
  'sacrifice': 'Sacrifice',
  'back_rank_mate': 'Back Rank Mate',
  'mate_in_1': 'Mate in 1',
  'mate_in_2': 'Mate in 2',
  'endgame': 'Endgame',
  'tactic': 'Tactic',
  'interference': 'Interference',
  'attraction': 'Attraction',
  'smothered_mate': 'Smothered Mate',
  'boden_mate': 'Boden\'s Mate',
  'mate_in_3': 'Mate in 3',
  'mate': 'Mate',
  'pawn_endgame': 'Pawn Endgame',
  'rook_endgame': 'Rook Endgame',
  'bishop_endgame': 'Bishop Endgame',
  'queen_endgame': 'Queen Endgame',
  'queen_rook_endgame': 'Queen Rook Endgame',
  'advanced_pawn': 'Advanced Pawn',
  'hanging_piece': 'Hanging Piece',
  'exposed_king': 'Exposed King',
  'promotion': 'Promotion',
  'zugzwang': 'Zugzwang',
  'kingside_attack': 'Kingside Attack',
  'queenside_attack': 'Queenside Attack',
  'attacking_f2_f7': 'Attacking F2/F7',
  'opening': 'Opening',
  'middlegame': 'Middlegame',
  'one_move': 'One Move',
  'short': 'Short',
  'long': 'Long',
  'very_long': 'Very Long',
  'quiet_move': 'Quiet Move',
  'defensive_move': 'Defensive Move',
  'master': 'Master',
  'master_vs_master': 'Master vs Master',
  'super_gm': 'Super GM',
  'crushing': 'Crushing',
  'advantage': 'Advantage',
  'rook_endgame': 'Rook Endgame',
  'pawn_endgame': 'Pawn Endgame',
  'bishop_endgame': 'Bishop Endgame',
  'queen_endgame': 'Queen Endgame',
  'queen_rook_endgame': 'Queen Rook Endgame',
  'smothered_mate': 'Smothered Mate',
  'boden_mate': 'Boden\'s Mate',
  'mate_in_3': 'Mate in 3',
  'mate': 'Mate',
  'one_move': 'One Move',
  'very_long': 'Very Long',
  'quiet_move': 'Quiet Move',
  'defensive_move': 'Defensive Move',
  'master_vs_master': 'Master vs Master',
  'super_gm': 'Super GM',
  // CamelCase mappings (for current database)
  'advancedPawn': 'Advanced Pawn',
  'attackingF2F7': 'Attacking F2/F7',
  'backRankMate': 'Back Rank Mate',
  'bishopEndgame': 'Bishop Endgame',
  'bodenMate': 'Boden\'s Mate',
  'defensiveMove': 'Defensive Move',
  'discoveredAttack': 'Discovered Attack',
  'exposedKing': 'Exposed King',
  'hangingPiece': 'Hanging Piece',
  'kingsideAttack': 'Kingside Attack'
};

// Theme explanations
const themeExplanations = {
  'fork': 'A tactic where one piece attacks two or more enemy pieces simultaneously',
  'pin': 'A piece is pinned when it cannot move without exposing a more valuable piece behind it',
  'skewer': 'A tactic where a valuable piece is attacked and forced to move, exposing a less valuable piece behind it',
  'discovered_attack': 'Moving one piece to reveal an attack by another piece',
  'deflection': 'Forcing an opponent\'s piece to leave a square where it performs an important function',
  'sacrifice': 'Intentionally giving up material to gain a positional or tactical advantage',
  'back_rank_mate': 'Checkmate delivered on the back rank, typically when the king is trapped by its own pieces',
  'mate_in_1': 'Puzzles where you can checkmate in one move',
  'mate_in_2': 'Puzzles where you can checkmate in two moves',
  'mate_in_3': 'Puzzles where you can checkmate in three moves',
  'endgame': 'Puzzles focusing on endgame techniques and principles',
  'tactic': 'General tactical puzzles covering various tactical motifs',
  'interference': 'A tactic that blocks the connection between two enemy pieces',
  'attraction': 'Luring an opponent\'s piece to a disadvantageous square',
  'smothered_mate': 'A checkmate where the king is surrounded by its own pieces and cannot escape',
  'boden_mate': 'A checkmate pattern involving two bishops and a knight',
  'mate': 'General checkmate puzzles',
  'pawn_endgame': 'Endgame puzzles focusing on pawn play and promotion',
  'rook_endgame': 'Endgame puzzles featuring rook and pawn endgames',
  'bishop_endgame': 'Endgame puzzles with bishops and pawns',
  'queen_endgame': 'Endgame puzzles with queens and pawns',
  'queen_rook_endgame': 'Endgame puzzles with queens, rooks, and pawns',
  'advanced_pawn': 'Puzzles involving advanced pawns and their promotion potential',
  'hanging_piece': 'Puzzles where pieces are left undefended and can be captured',
  'exposed_king': 'Puzzles where the king is vulnerable to attack',
  'promotion': 'Puzzles focusing on pawn promotion tactics',
  'zugzwang': 'A situation where any move worsens the position',
  'kingside_attack': 'Attacking patterns directed at the opponent\'s kingside',
  'queenside_attack': 'Attacking patterns directed at the opponent\'s queenside',
  'attacking_f2_f7': 'Attacks targeting the vulnerable f2 and f7 squares',
  'opening': 'Puzzles from the opening phase of the game',
  'middlegame': 'Puzzles from the middlegame phase',
  'one_move': 'Single-move tactical puzzles',
  'short': 'Short tactical sequences',
  'long': 'Longer tactical sequences',
  'very_long': 'Complex tactical sequences requiring deep calculation',
  'quiet_move': 'Non-forcing moves that improve the position',
  'defensive_move': 'Puzzles requiring defensive techniques',
  'master': 'Puzzles from master-level games',
  'master_vs_master': 'Puzzles from games between masters',
  'super_gm': 'Puzzles from games involving super grandmasters',
  'crushing': 'Puzzles featuring decisive tactical blows',
  'advantage': 'Puzzles where you convert an advantage',
  // CamelCase mappings
  'advancedPawn': 'Puzzles involving advanced pawns and their promotion potential',
  'attackingF2F7': 'Attacks targeting the vulnerable f2 and f7 squares',
  'backRankMate': 'Checkmate delivered on the back rank, typically when the king is trapped by its own pieces',
  'bishopEndgame': 'Endgame puzzles with bishops and pawns',
  'bodenMate': 'A checkmate pattern involving two bishops and a knight',
  'defensiveMove': 'Puzzles requiring defensive techniques',
  'discoveredAttack': 'Moving one piece to reveal an attack by another piece',
  'exposedKing': 'Puzzles where the king is vulnerable to attack',
  'hangingPiece': 'Puzzles where pieces are left undefended and can be captured',
  'kingsideAttack': 'Attacking patterns directed at the opponent\'s kingside'
};

const PuzzleThemesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(false);
  const [randomPuzzleLoading, setRandomPuzzleLoading] = useState(false);
  const [availableThemes, setAvailableThemes] = useState([]);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(getApiUrl('/auth/me'), {
          headers: { 'x-auth-token': token }
        });
        
        if (response.ok) {
          const data = await response.json();
          setUserRating(data?.rating || 1200);
        }
      } catch (err) {
        console.error('Error fetching user rating:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailableThemes = async () => {
      try {
        console.log('[PuzzleThemes] Fetching themes from:', getApiUrl('/puzzles/themes'));
        const response = await fetch(getApiUrl('/puzzles/themes'), {
          credentials: 'include' // Include cookies for CORS
        });
        console.log('[PuzzleThemes] Response status:', response.status);
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[PuzzleThemes] Error response:', errorText);
          throw new Error(`Failed to fetch themes: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log('[PuzzleThemes] Received themes:', data.themes?.length || 0);
        
        // Use the themes directly from the backend (already have code and label)
        const themesWithLabels = data.themes.map(theme => {
          const normalizedCode = theme.code.replace(/([A-Z])/g, '_$1').toLowerCase();
          return {
            label: themeDisplayNames[theme.code] || themeDisplayNames[normalizedCode] || theme.label,
            code: theme.code,
            explanation: themeExplanations[theme.code] || themeExplanations[normalizedCode] || themeExplanations[theme.code.replace(/([A-Z])/g, '_$1').toLowerCase()] || ''
          };
        });
        
        setAvailableThemes(themesWithLabels);
      } catch (err) {
        console.error('[PuzzleThemes] Error fetching themes:', err);
        console.error('[PuzzleThemes] Error details:', err.message, err.stack);
        // Fallback to current database themes
        const fallbackThemes = [
          'back_rank_mate', 'deflection', 'discovered_attack', 'endgame', 'fork',
          'mate_in_1', 'mate_in_2', 'pin', 'sacrifice', 'skewer', 'tactic'
        ].map(themeCode => ({
          label: themeDisplayNames[themeCode] || themeCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          code: themeCode,
          explanation: themeExplanations[themeCode] || ''
        }));
        setAvailableThemes(fallbackThemes);
      }
    };

    fetchUserRating();
    fetchAvailableThemes();
  }, [user]);

  const handleThemeClick = (themeCode) => {
    navigate(`/puzzles/${encodeURIComponent(themeCode)}`);
  };

  const handleRandomPuzzle = async () => {
    setRandomPuzzleLoading(true);
    try {
      // Fetch a random puzzle from the API
      console.log('[PuzzleThemes] Fetching random puzzle from:', getApiUrl('/puzzles/random'));
      const response = await fetch(getApiUrl('/puzzles/random'), {
        credentials: 'include' // Include cookies for CORS
      });
      console.log('[PuzzleThemes] Random puzzle response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        if (data?.puzzles && data.puzzles.length > 0) {
          // Select a random puzzle from the returned puzzles
          const randomIndex = Math.floor(Math.random() * data.puzzles.length);
          const selectedPuzzle = data.puzzles[randomIndex];
          // Navigate to the puzzle solve page with the puzzle data
          navigate(`/puzzles/random`, { state: { puzzle: selectedPuzzle } });
        } else if (data?.puzzle) {
          // Fallback for old format
          navigate(`/puzzles/random`, { state: { puzzle: data.puzzle } });
        } else {
          // Fallback to theme-based random puzzle using available themes
          if (availableThemes.length > 0) {
            const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
            navigate(`/puzzles/${encodeURIComponent(randomTheme.code)}`);
          }
        }
      } else {
        // Fallback to theme-based random puzzle if API fails
        if (availableThemes.length > 0) {
          const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
          navigate(`/puzzles/${encodeURIComponent(randomTheme.code)}`);
        }
      }
    } catch (error) {
      console.error('Error loading random puzzle:', error);
      // Fallback to theme-based random puzzle
      if (availableThemes.length > 0) {
        const randomTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
        navigate(`/puzzles/${encodeURIComponent(randomTheme.code)}`);
      }
    } finally {
      setRandomPuzzleLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white py-12 px-4">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Tactical Puzzles
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-4">
          Quality puzzles to help you improve fast. Real life puzzles taken from real games.
        </p>
        <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed mb-8">
          Sharpen your tactical vision with thousands of chess puzzles. Choose a theme to focus on specific patterns and improve your calculation skills.
        </p>

        {/* User Rating Display */}
        {loading ? (
          <div className="inline-block bg-slate-800/50 backdrop-blur-sm border border-blue-500/30 px-6 py-3 rounded-xl">
            <p className="text-gray-300">Loading rating...</p>
          </div>
        ) : userRating ? (
          <div className="inline-block bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 px-6 py-4 rounded-xl">
            <p className="text-lg text-gray-300">
              Your Puzzle Rating: <span className="font-bold text-blue-300 text-2xl">{userRating}</span>
            </p>
          </div>
        ) : user ? (
          <div className="inline-block bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 px-6 py-3 rounded-xl">
            <p className="text-yellow-300">Unable to load rating</p>
          </div>
        ) : (
          <div className="inline-block bg-red-500/10 backdrop-blur-sm border border-red-500/30 px-6 py-3 rounded-xl">
            <p className="text-red-300">Login to track your puzzle rating</p>
          </div>
        )}
      </div>

      {/* Quick Start - Enhanced */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-white">🚀 Quick Start</h2>
          <p className="text-gray-300 mb-6">Jump right into a random puzzle and start improving your tactical skills!</p>
          <button
            onClick={handleRandomPuzzle}
            disabled={randomPuzzleLoading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
          >
            {randomPuzzleLoading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Loading Random Puzzle...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎲</span>
                <span>Start Random Puzzle</span>
              </div>
            )}
          </button>
          <p className="text-sm text-gray-400 mt-4">Get a random tactical puzzle from our collection</p>
        </div>
      </div>

      {/* Themes Grid */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-300">Choose Your Focus</h2>
        {availableThemes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {availableThemes.map(theme => (
              <button
                key={theme.code}
                onClick={() => handleThemeClick(theme.code)}
                className="group bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-center hover:border-blue-400/40 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10 cursor-pointer"
              >
                <div className="text-white font-semibold text-sm group-hover:text-blue-200 transition-colors">
                  {theme.label}
                </div>
                <div className="mt-2 text-xs text-green-400">
                  ✓ Available
                </div>
                {theme.explanation && (
                  <div className="mt-2 text-xs text-gray-400 leading-tight">
                    {theme.explanation}
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <div className="text-xl text-white font-semibold mb-2">No themes available</div>
              <div className="text-gray-300">Unable to load puzzle themes. Please try again later.</div>
            </div>
          </div>
        )}
      </div>

      {/* Available Themes Summary */}
      {availableThemes.length > 0 && (
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white text-center">📊 Available Themes</h3>
            <div className="text-center">
              <div className="text-green-400 font-semibold mb-3 flex items-center justify-center">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                {availableThemes.length} themes with puzzles available
              </div>
              <div className="text-gray-300 text-sm">
                All themes shown below have puzzles ready for training
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Info */}
      <div className="max-w-4xl mx-auto mt-16 text-center">
        <div className="bg-gradient-to-r from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4 text-white">💡 Puzzle Training Tips</h3>
          <div className="grid md:grid-cols-3 gap-6 text-gray-300">
            <div>
              <div className="text-blue-400 font-semibold mb-2">🎯 Focus</div>
              <p className="text-sm">Choose specific themes to target your weaknesses</p>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-2">⚡ Speed</div>
              <p className="text-sm">Try to solve puzzles quickly to improve pattern recognition</p>
            </div>
            <div>
              <div className="text-yellow-400 font-semibold mb-2">📈 Progress</div>
              <p className="text-sm">Your rating adapts based on puzzle difficulty and success rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PuzzleThemesPage; 
