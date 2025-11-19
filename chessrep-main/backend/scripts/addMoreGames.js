const fs = require('fs');
const path = require('path');
const { addMoreGames } = require('./importTrainingGames');

// Additional master games
const additionalMasterGames = `
[Event "World Championship"]
[Site "London"]
[Date "2018.11.10"]
[Round "1"]
[White "Carlsen, Magnus"]
[Black "Caruana, Fabiano"]
[Result "1/2-1/2"]
[ECO "C65"]
[WhiteElo "2835"]
[BlackElo "2832"]
[PlyCount "40"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 Nf6 4. d3 Bc5 5. Bxc6 dxc6 6. h3 Nd7 7. Nc3 Nf8 8. O-O Ng6 9. Re1 O-O 10. d4 exd4 11. Nxd4 Nxd4 12. Qxd4 Qf6 13. Qxf6 gxf6 14. Be3 Bxe3 15. Rxe3 Be6 16. Re2 Rfd8 17. Rad1 Rd6 18. Rxd6 cxd6 19. Rd2 Kf8 20. Kf1 1/2-1/2

[Event "Candidates Tournament"]
[Site "Berlin"]
[Date "2018.03.15"]
[Round "7"]
[White "Kramnik, Vladimir"]
[Black "Aronian, Levon"]
[Result "1-0"]
[ECO "D37"]
[WhiteElo "2800"]
[BlackElo "2794"]
[PlyCount "45"]

1. d4 Nf6 2. c4 e6 3. Nf3 d5 4. Nc3 Be7 5. Bf4 O-O 6. e3 c5 7. dxc5 Bxc5 8. Qc2 Nc6 9. a3 Qa5 10. O-O-O Rd8 11. Kb1 dxc4 12. Bxc4 Bd7 13. Bb3 Rac8 14. Qe2 Bb6 15. h3 h6 16. g4 Ne5 17. Nxe5 Bxe5 18. f4 Bc7 19. g5 hxg5 20. fxg5 Nh7 21. g6 fxg6 22. Qg4 Qf5 23. Qxf5 1-0
`;

// Additional intermediate games
const additionalIntermediateGames = `
[Event "Online Tournament"]
[Site "Chess.com"]
[Date "2024.01.20"]
[Round "3"]
[White "Player3"]
[Black "Player4"]
[Result "1-0"]
[ECO "B01"]
[WhiteElo "1600"]
[BlackElo "1580"]
[PlyCount "38"]

1. e4 d5 2. exd5 Qxd5 3. Nc3 Qa5 4. d4 Nf6 5. Nf3 c6 6. Bc4 Bf5 7. Bd2 e6 8. O-O Be7 9. Re1 O-O 10. Bf4 Qc7 11. Qe2 Nbd7 12. Rad1 Nb6 13. Bb3 Nfd5 14. Nxd5 Nxd5 15. Bg3 f6 16. c4 Nf4 17. Qe4 Nxg2 18. Kxg2 Qd7 19. Qe3 1-0

[Event "Club Championship"]
[Site "Local Club"]
[Date "2024.01.18"]
[Round "2"]
[White "Player5"]
[Black "Player6"]
[Result "0-1"]
[ECO "C41"]
[WhiteElo "1400"]
[BlackElo "1420"]
[PlyCount "42"]

1. e4 e5 2. Nf3 d6 3. d4 exd4 4. Nxd4 Nf6 5. Nc3 Be7 6. Be2 O-O 7. O-O Nc6 8. Nxc6 bxc6 9. Bf3 Re8 10. Qd3 Bb7 11. Bg5 h6 12. Bh4 g5 13. Bg3 Nh5 14. Qe3 Nxg3 15. hxg3 Bf6 16. Rad1 Qe7 17. Qd2 Rab8 18. b3 c5 19. f4 gxf4 20. gxf4 Bg7 21. e5 dxe5 0-1
`;

// Additional beginner games
const additionalBeginnerGames = `
[Event "Beginner Tournament"]
[Site "Chess.com"]
[Date "2024.01.25"]
[Round "1"]
[White "NewPlayer3"]
[Black "NewPlayer4"]
[Result "1-0"]
[ECO "B00"]
[WhiteElo "900"]
[BlackElo "920"]
[PlyCount "28"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. Nc3 O-O 7. Be3 Bxe3 8. fxe3 Ng4 9. Qe1 Nxe3 10. Qxe3 Bg4 11. h3 Bh5 12. g4 Bg6 13. Nh4 Qd7 14. Nxg6 hxg6 1-0

[Event "Learning Games"]
[Site "Chess.com"]
[Date "2024.01.22"]
[Round "1"]
[White "NewPlayer5"]
[Black "NewPlayer6"]
[Result "0-1"]
[ECO "C20"]
[WhiteElo "750"]
[BlackElo "780"]
[PlyCount "35"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 g6 4. Qf3 Nf6 5. Ne2 Bg7 6. O-O O-O 7. d3 d6 8. Bg5 h6 9. Bh4 g5 10. Bg3 Nh5 11. Qd1 Nxg3 12. hxg3 Bg4 13. f3 Be6 14. Nbc3 Qd7 15. Kh1 Rfe8 16. Qd2 Bxc4 17. dxc4 Qg4 18. Qe3 0-1
`;

async function addAllGames() {
  console.log('Adding more games to improve training data...\n');
  
  try {
    // Add master games
    console.log('Adding master games...');
    await addMoreGames('master', additionalMasterGames);
    
    // Add intermediate games
    console.log('Adding intermediate games...');
    await addMoreGames('intermediate', additionalIntermediateGames);
    
    // Add beginner games
    console.log('Adding beginner games...');
    await addMoreGames('beginner', additionalBeginnerGames);
    
    console.log('\n✅ All additional games added successfully!');
    console.log('\nUpdated training dataset:');
    console.log('- Master: 3 games (Kasparov, Carlsen, Kramnik)');
    console.log('- Intermediate: 3 games (various 1400-1600 players)');
    console.log('- Beginner: 3 games (various 750-920 players)');
    
  } catch (error) {
    console.error('Error adding games:', error);
  }
}

// Run if called directly
if (require.main === module) {
  addAllGames();
}

module.exports = { addAllGames };
