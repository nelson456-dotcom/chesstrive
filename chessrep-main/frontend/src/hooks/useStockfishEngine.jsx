import { useState, useEffect, useRef, useCallback } from 'react';

// Custom Hook for UCI Engine Management
const useStockfishEngine = () => {
  const [engineSuggestions, setEngineSuggestions] = useState([]);
  const [engineStatus, setEngineStatus] = useState('disconnected'); // disconnected, initializing, ready, analyzing
  const [engineDebug, setEngineDebug] = useState([]);
  
  const workerRef = useRef(null);
  const engineLinesRef = useRef(new Map());
  const analysisTimeoutRef = useRef(null);

  // Debug logging
  const logDebug = useCallback((message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setEngineDebug(prev => [...prev.slice(-10), { timestamp, message, type }]);
    console.log(`[UCI ${type.toUpperCase()}] ${message}`);
  }, []);

  // Parse engine info messages
  const parseEngineInfo = useCallback((infoMsg) => {
    const parts = infoMsg.split(' ');
    const info = {};
    
    for (let i = 1; i < parts.length; i++) {
      switch (parts[i]) {
        case 'depth':
          info.depth = parseInt(parts[i + 1]);
          i++;
          break;
        case 'multipv':
          info.multipv = parseInt(parts[i + 1]);
          i++;
          break;
        case 'score':
          if (parts[i + 1] === 'cp') {
            info.score = parseInt(parts[i + 2]) / 100;
            i += 2;
          } else if (parts[i + 1] === 'mate') {
            info.score = `M${parts[i + 2]}`;
            i += 2;
          }
          break;
        case 'nodes':
          info.nodes = parseInt(parts[i + 1]);
          i++;
          break;
        case 'pv':
          info.pv = parts.slice(i + 1);
          i = parts.length;
          break;
      }
    }
    
    if (info.pv && info.pv.length > 0 && info.depth >= 10) {
      const lineKey = info.multipv || 1;
      const suggestion = {
        move: info.pv[0],
        san: info.pv[0], // You can add SAN conversion here
        evaluation: formatScore(info.score),
        depth: info.depth,
        pv: info.pv.slice(0, 5),
        nodes: info.nodes,
        multipv: lineKey
      };
      
      engineLinesRef.current.set(lineKey, suggestion);
      const allSuggestions = Array.from(engineLinesRef.current.values())
        .sort((a, b) => parseFloat(b.evaluation) - parseFloat(a.evaluation));
      
      setEngineSuggestions(allSuggestions);
    }
  }, []);

  // Handle engine messages
  const handleEngineMessage = useCallback((message) => {
    const msg = message.trim();
    
    if (msg === 'uciok') {
      logDebug('UCI protocol confirmed', 'success');
      setEngineStatus('initializing');
      workerRef.current.postMessage('setoption name Threads value 1');
      workerRef.current.postMessage('setoption name Hash value 16');
      workerRef.current.postMessage('isready');
      
    } else if (msg === 'readyok') {
      logDebug('Engine ready', 'success');
      setEngineStatus('ready');
      
    } else if (msg.startsWith('info')) {
      parseEngineInfo(msg);
      
    } else if (msg.startsWith('bestmove')) {
      const bestMove = msg.split(' ')[1];
      if (bestMove && bestMove !== '(none)') {
        logDebug(`Analysis complete: ${bestMove}`, 'success');
      }
      setEngineStatus('ready');
    }
  }, [parseEngineInfo, logDebug]);

  // Format score display
  const formatScore = (score) => {
    if (typeof score === 'string') return score;
    const formatted = score?.toFixed(2) || '0.00';
    return parseFloat(formatted) > 0 ? `+${formatted}` : formatted;
  };

  // Initialize engine
  const initializeEngine = useCallback(() => {
    logDebug('Initializing Stockfish...', 'info');
    
    if (workerRef.current) {
      workerRef.current.terminate();
    }
    
    const workerSources = [
      { path: '/stockfish.js', name: 'Local' },
      { path: '/js/stockfish.js', name: 'JS folder' },
      { path: 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js', name: 'CDN' }
    ];
    
    let currentIndex = 0;
    
    const tryWorker = () => {
      if (currentIndex >= workerSources.length) {
        logDebug('All sources failed, using mock engine', 'error');
        initializeMockEngine();
        return;
      }
      
      const source = workerSources[currentIndex++];
      logDebug(`Trying ${source.name}...`, 'info');
      
      try {
        const worker = new Worker(source.path);
        let responded = false;
        
        const timeout = setTimeout(() => {
          if (!responded) {
            worker.terminate();
            tryWorker();
          }
        }, 3000);
        
        worker.onmessage = (e) => {
          responded = true;
          clearTimeout(timeout);
          workerRef.current = worker;
          worker.onmessage = (e) => handleEngineMessage(e.data);
          handleEngineMessage(e.data);
        };
        
        worker.onerror = () => {
          responded = true;
          clearTimeout(timeout);
          worker.terminate();
          tryWorker();
        };
        
        setEngineStatus('initializing');
        worker.postMessage('uci');
        
      } catch (error) {
        tryWorker();
      }
    };
    
    tryWorker();
  }, [handleEngineMessage, logDebug]);

  // Mock engine for fallback
  const initializeMockEngine = useCallback(() => {
    logDebug('Initializing mock engine...', 'info');
    setEngineStatus('initializing');
    
    setTimeout(() => {
      logDebug('Mock engine ready', 'success');
      setEngineStatus('ready');
    }, 1000);
  }, [logDebug]);

  // Analyze position
  const analyzePosition = useCallback((fen, depth = 15) => {
    if (!workerRef.current || engineStatus !== 'ready') {
      logDebug('Engine not ready, using mock analysis', 'warning');
      // Use mock analysis as fallback
      const mockSuggestions = [
        {
          move: 'e2e4',
          san: 'e4',
          evaluation: '+0.3',
          depth: 15,
          pv: ['e2e4', 'e7e5', 'g1f3'],
          nodes: 150000,
          multipv: 1
        },
        {
          move: 'd2d4',
          san: 'd4',
          evaluation: '+0.2',
          depth: 15,
          pv: ['d2d4', 'd7d5', 'c2c4'],
          nodes: 140000,
          multipv: 2
        },
        {
          move: 'g1f3',
          san: 'Nf3',
          evaluation: '+0.1',
          depth: 15,
          pv: ['g1f3', 'd7d5', 'd2d4'],
          nodes: 130000,
          multipv: 3
        }
      ];
      setEngineSuggestions(mockSuggestions);
      return;
    }
    
    setEngineStatus('analyzing');
    setEngineSuggestions([]);
    engineLinesRef.current.clear();
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
    
    workerRef.current.postMessage('stop');
    
    setTimeout(() => {
      workerRef.current.postMessage('setoption name MultiPV value 3');
      workerRef.current.postMessage(`position fen ${fen}`);
      workerRef.current.postMessage(`go depth ${depth}`);
      
      analysisTimeoutRef.current = setTimeout(() => {
        workerRef.current.postMessage('stop');
        setEngineStatus('ready');
      }, 8000);
    }, 100);
  }, [engineStatus, logDebug]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  return {
    engineSuggestions,
    engineStatus,
    engineDebug,
    initializeEngine,
    analyzePosition
  };
};

export default useStockfishEngine;