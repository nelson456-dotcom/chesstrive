const { spawn } = require('child_process');

console.log('Testing Stockfish...');

const stockfish = spawn('./engines/stockfish.exe');
let isReady = false;
let output = '';

stockfish.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    console.log(`[Stockfish] ${line}`);
    if (line.includes('readyok')) {
      isReady = true;
    }
    if (line.includes('bestmove')) {
      output += line + '\n';
    }
  }
});

stockfish.stderr.on('data', (data) => {
  console.log(`[Stockfish stderr] ${data}`);
});

stockfish.on('error', (error) => {
  console.log(`[Stockfish error] ${error.message}`);
});

// Test basic Stockfish functionality
setTimeout(() => {
  if (!isReady) {
    console.log('Stockfish not ready, killing...');
    stockfish.kill();
    process.exit(1);
  }
  
  console.log('Stockfish is ready, testing analysis...');
  stockfish.stdin.write('uci\n');
  stockfish.stdin.write('isready\n');
  stockfish.stdin.write('position startpos\n');
  stockfish.stdin.write('go depth 10\n');
  
  setTimeout(() => {
    console.log('Analysis output:', output);
    stockfish.kill();
    process.exit(0);
  }, 3000);
}, 2000);

