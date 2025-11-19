const mongoose=require('mongoose');
const Puzzle=require('./models/Puzzle');
const { Chess } = require('chess.js');

(async () => {
  await mongoose.connect('mongodb://localhost:27017/chessrep');
  const fen = 'r1bq1rk1/ppp2ppp/2n2n2/3pp3/3P4/2N1PN2/PPP2PPP/R1BQ1RK1 w - - 0 7';
  const moves = ['dxe5','Ng4','Qxd5','Qxd5','Nxd5'];
  const chess=new Chess(fen);
  let valid=true;
  for(const m of moves){ if(!chess.move(m,{sloppy:true})){valid=false;break;} }
  if(!valid){console.log('Moves invalid');process.exit(1);}  
  await Puzzle.create({
    fen,
    moves,
    rating:1200,
    ratingDeviation:80,
    popularity:50,
    nbPlays:100,
    theme:'fork',
    themes:['fork'],
    url:'local'
  });
  console.log('fork puzzle inserted');
  process.exit(0);
})(); 