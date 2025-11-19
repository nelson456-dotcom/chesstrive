import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Theme explanations
const themeExplanations = {
  'fork': 'A tactic where one piece attacks two or more enemy pieces simultaneously',
  'pin': 'A piece is pinned when it cannot move without exposing a more valuable piece behind it',
  'skewer': 'A tactic where a valuable piece is attacked and forced to move, exposing a less valuable piece behind it',
  'discovered_attack': 'Moving one piece to reveal an attack by another piece',
  'deflection': 'Forcing an opponent\'s piece to leave a square where it performs an important function',
  'back_rank_mate': 'Checkmate delivered on the back rank, typically when the king is trapped by its own pieces',
  'mate_in_1': 'Puzzles where you can checkmate in one move',
  'mate_in_2': 'Puzzles where you can checkmate in two moves',
  'endgame': 'Puzzles focusing on endgame techniques and principles',
  'tactic': 'General tactical puzzles covering various tactical motifs',
  'attack': 'Puzzles focusing on attacking patterns and combinations',
  'sacrifice': 'Intentionally giving up material to gain a positional or tactical advantage',
  'double_check': 'A check delivered by two pieces simultaneously',
  'removal_of_defender': 'Capturing or forcing away a piece that defends another piece or square',
  'interference': 'A tactic that blocks the connection between two enemy pieces',
  'overloading': 'A piece is overloaded when it has too many defensive responsibilities',
  'decoy': 'Luring an opponent\'s piece to a disadvantageous square',
  'clearance': 'Moving a piece to clear a square, line, or diagonal for another piece',
  'blocking': 'Placing a piece to block an opponent\'s attack or threat',
  'x_ray': 'An attack through an enemy piece',
  'zwischenzug': 'An in-between move that changes the situation before responding to a threat',
  'windmill': 'A series of discovered checks and captures',
  'smothered_mate': 'A checkmate where the king is surrounded by its own pieces and cannot escape',
  'anastasias_mate': 'A checkmate pattern involving a rook and knight',
  'arabian_mate': 'A checkmate pattern with a knight and rook',
  'bodens_mate': 'A checkmate pattern involving two bishops and a knight',
  'opera_mate': 'A checkmate pattern with a rook on the back rank',
  'swiss_mate': 'A checkmate pattern with a knight and bishop',
  'epaulette_mate': 'A checkmate where the king is trapped by its own rooks',
  'dovetail_mate': 'A checkmate pattern with a queen and pawn',
  'cozios_mate': 'A checkmate pattern with a queen and bishop',
  'grecos_mate': 'A checkmate pattern with a queen and knight',
  'lollis_mate': 'A checkmate pattern with a queen and pawn',
  'blackburnes_mate': 'A checkmate pattern with two bishops',
  'damianos_mate': 'A checkmate pattern with a queen and pawn',
  'pillsburys_mate': 'A checkmate pattern with a queen and rook',
  'retis_mate': 'A checkmate pattern with a queen and bishop',
  'legals_mate': 'A checkmate pattern involving a knight sacrifice',
  'scholars_mate': 'A quick checkmate in the opening, typically in 4 moves',
  'fools_mate': 'The fastest possible checkmate, occurring in 2 moves',
  'suffocation_mate': 'A checkmate where the king is smothered by its own pieces',
  'triangle_mate': 'A checkmate pattern forming a triangle',
  'corridor_mate': 'A checkmate along a file or rank',
  'h_file_mate': 'Checkmate delivered along the h-file',
  'g_file_mate': 'Checkmate delivered along the g-file',
  'f_file_mate': 'Checkmate delivered along the f-file',
  'e_file_mate': 'Checkmate delivered along the e-file',
  'd_file_mate': 'Checkmate delivered along the d-file',
  'c_file_mate': 'Checkmate delivered along the c-file',
  'b_file_mate': 'Checkmate delivered along the b-file',
  'a_file_mate': 'Checkmate delivered along the a-file',
  '7th_rank_mate': 'Checkmate delivered on the 7th rank',
  '6th_rank_mate': 'Checkmate delivered on the 6th rank',
  '5th_rank_mate': 'Checkmate delivered on the 5th rank',
  '4th_rank_mate': 'Checkmate delivered on the 4th rank',
  '3rd_rank_mate': 'Checkmate delivered on the 3rd rank',
  '2nd_rank_mate': 'Checkmate delivered on the 2nd rank',
  '1st_rank_mate': 'Checkmate delivered on the 1st rank',
  '8th_rank_mate': 'Checkmate delivered on the 8th rank'
};

const themes = [
  { label: 'Fork', code: 'fork', explanation: themeExplanations['fork'] },
  { label: 'Pin', code: 'pin', explanation: themeExplanations['pin'] },
  { label: 'Skewer', code: 'skewer', explanation: themeExplanations['skewer'] },
  { label: 'Discovered Attack', code: 'discovered_attack', explanation: themeExplanations['discovered_attack'] },
  { label: 'Back Rank Mate', code: 'back_rank_mate', explanation: themeExplanations['back_rank_mate'] },
  { label: 'Deflection', code: 'deflection', explanation: themeExplanations['deflection'] },
  { label: 'Mate in 1', code: 'mate_in_1', explanation: themeExplanations['mate_in_1'] },
  { label: 'Mate in 2', code: 'mate_in_2', explanation: themeExplanations['mate_in_2'] },
  { label: 'Endgame', code: 'endgame', explanation: themeExplanations['endgame'] },
  { label: 'Tactic', code: 'tactic', explanation: themeExplanations['tactic'] },
  { label: 'Attack', code: 'attack', explanation: themeExplanations['attack'] },
  { label: 'Sacrifice', code: 'sacrifice', explanation: themeExplanations['sacrifice'] },
  { label: 'Double Check', code: 'double_check', explanation: themeExplanations['double_check'] },
  { label: 'Removal of Defender', code: 'removal_of_defender', explanation: themeExplanations['removal_of_defender'] },
  { label: 'Interference', code: 'interference', explanation: themeExplanations['interference'] },
  { label: 'Overloading', code: 'overloading', explanation: themeExplanations['overloading'] },
  { label: 'Decoy', code: 'decoy', explanation: themeExplanations['decoy'] },
  { label: 'Clearance', code: 'clearance', explanation: themeExplanations['clearance'] },
  { label: 'Blocking', code: 'blocking', explanation: themeExplanations['blocking'] },
  { label: 'X-Ray', code: 'x_ray', explanation: themeExplanations['x_ray'] },
  { label: 'Zwischenzug', code: 'zwischenzug', explanation: themeExplanations['zwischenzug'] },
  { label: 'Windmill', code: 'windmill', explanation: themeExplanations['windmill'] },
  { label: 'Smothered Mate', code: 'smothered_mate', explanation: themeExplanations['smothered_mate'] },
  { label: 'Anastasia\'s Mate', code: 'anastasias_mate', explanation: themeExplanations['anastasias_mate'] },
  { label: 'Arabian Mate', code: 'arabian_mate', explanation: themeExplanations['arabian_mate'] },
  { label: 'Boden\'s Mate', code: 'bodens_mate', explanation: themeExplanations['bodens_mate'] },
  { label: 'Opera Mate', code: 'opera_mate', explanation: themeExplanations['opera_mate'] },
  { label: 'Swiss Mate', code: 'swiss_mate', explanation: themeExplanations['swiss_mate'] },
  { label: 'Epaulette Mate', code: 'epaulette_mate', explanation: themeExplanations['epaulette_mate'] },
  { label: 'Dovetail Mate', code: 'dovetail_mate', explanation: themeExplanations['dovetail_mate'] },
  { label: 'Cozio\'s Mate', code: 'cozios_mate', explanation: themeExplanations['cozios_mate'] },
  { label: 'Greco\'s Mate', code: 'grecos_mate', explanation: themeExplanations['grecos_mate'] },
  { label: 'Lolli\'s Mate', code: 'lollis_mate', explanation: themeExplanations['lollis_mate'] },
  { label: 'Blackburne\'s Mate', code: 'blackburnes_mate', explanation: themeExplanations['blackburnes_mate'] },
  { label: 'Damiano\'s Mate', code: 'damianos_mate', explanation: themeExplanations['damianos_mate'] },
  { label: 'Pillsbury\'s Mate', code: 'pillsburys_mate', explanation: themeExplanations['pillsburys_mate'] },
  { label: 'Reti\'s Mate', code: 'retis_mate', explanation: themeExplanations['retis_mate'] },
  { label: 'Legal\'s Mate', code: 'legals_mate', explanation: themeExplanations['legals_mate'] },
  { label: 'Scholar\'s Mate', code: 'scholars_mate', explanation: themeExplanations['scholars_mate'] },
  { label: 'Fool\'s Mate', code: 'fools_mate', explanation: themeExplanations['fools_mate'] },
  { label: 'Suffocation Mate', code: 'suffocation_mate', explanation: themeExplanations['suffocation_mate'] },
  { label: 'Triangle Mate', code: 'triangle_mate', explanation: themeExplanations['triangle_mate'] },
  { label: 'Corridor Mate', code: 'corridor_mate', explanation: themeExplanations['corridor_mate'] },
  { label: 'H-file Mate', code: 'h_file_mate', explanation: themeExplanations['h_file_mate'] },
  { label: 'G-file Mate', code: 'g_file_mate', explanation: themeExplanations['g_file_mate'] },
  { label: 'F-file Mate', code: 'f_file_mate', explanation: themeExplanations['f_file_mate'] },
  { label: 'E-file Mate', code: 'e_file_mate', explanation: themeExplanations['e_file_mate'] },
  { label: 'D-file Mate', code: 'd_file_mate', explanation: themeExplanations['d_file_mate'] },
  { label: 'C-file Mate', code: 'c_file_mate', explanation: themeExplanations['c_file_mate'] },
  { label: 'B-file Mate', code: 'b_file_mate', explanation: themeExplanations['b_file_mate'] },
  { label: 'A-file Mate', code: 'a_file_mate', explanation: themeExplanations['a_file_mate'] },
  { label: '7th Rank Mate', code: '7th_rank_mate', explanation: themeExplanations['7th_rank_mate'] },
  { label: '6th Rank Mate', code: '6th_rank_mate', explanation: themeExplanations['6th_rank_mate'] },
  { label: '5th Rank Mate', code: '5th_rank_mate', explanation: themeExplanations['5th_rank_mate'] },
  { label: '4th Rank Mate', code: '4th_rank_mate', explanation: themeExplanations['4th_rank_mate'] },
  { label: '3rd Rank Mate', code: '3rd_rank_mate', explanation: themeExplanations['3rd_rank_mate'] },
  { label: '2nd Rank Mate', code: '2nd_rank_mate', explanation: themeExplanations['2nd_rank_mate'] },
  { label: '1st Rank Mate', code: '1st_rank_mate', explanation: themeExplanations['1st_rank_mate'] },
  { label: '8th Rank Mate', code: '8th_rank_mate', explanation: themeExplanations['8th_rank_mate'] },
];

const PuzzleThemesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUserRating = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('http://localhost:3001/api/auth/me', {
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

    fetchUserRating();
  }, [user]);

  const handleThemeClick = (themeCode) => {
    navigate(`/puzzles/${encodeURIComponent(themeCode)}`);
  };

  const handleRandomPuzzle = () => {
    const tacticalThemes = themes.filter(t => 
      ['fork', 'pin', 'skewer', 'discovered_attack', 'deflection', 'tactic', 'attack'].includes(t.code)
    );
    const randomTheme = tacticalThemes[Math.floor(Math.random() * tacticalThemes.length)];
    if (randomTheme) navigate(`/puzzles/${encodeURIComponent(randomTheme.code)}`);
  };

  return (
    <div className="min-h-screen text-white py-12 px-4">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
          Tactical Puzzles
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
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

      {/* Quick Start */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <button
          onClick={handleRandomPuzzle}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          🎲 Random Tactical Puzzle
        </button>
      </div>

      {/* Themes Grid */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-300">Choose Your Focus</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {themes.map(theme => (
            <button
              key={theme.code}
              onClick={() => handleThemeClick(theme.code)}
              className="group bg-gradient-to-br from-slate-800/50 to-blue-900/30 backdrop-blur-sm border border-blue-500/20 rounded-xl p-4 text-center hover:border-blue-400/40 transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="text-white font-semibold text-sm group-hover:text-blue-200 transition-colors">
                {theme.label}
              </div>
              {theme.explanation && (
                <div className="mt-2 text-xs text-gray-400 leading-tight">
                  {theme.explanation}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

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
