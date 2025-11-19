import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LichessLikeEditor from './LichessLikeEditor';

const BoardEditorPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentFen, setCurrentFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  // Get FEN from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const fenFromUrl = urlParams.get('fen');
    
    if (fenFromUrl) {
      // Decode the FEN from URL (replace underscores with spaces)
      const decodedFen = decodeURIComponent(fenFromUrl).replace(/_/g, ' ');
      setCurrentFen(decodedFen);
    }
  }, [location.search]);

  const handleFenChange = (newFen: string) => {
    setCurrentFen(newFen);
  };

  const handleClose = () => {
    // Navigate back to the main analysis page with the current FEN
    const encodedFen = encodeURIComponent(currentFen).replace(/ /g, '_');
    navigate(`/analysis?fen=${encodedFen}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <LichessLikeEditor
        initialFen={currentFen}
        onFenChange={handleFenChange}
        onClose={handleClose}
      />
    </div>
  );
};

export default BoardEditorPage;



