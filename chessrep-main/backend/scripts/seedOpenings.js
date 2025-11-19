const mongoose = require('mongoose');
const Opening = require('../models/Opening');

const sampleOpenings = [
  {
    name: "Sicilian Defense - Najdorf Variation",
    description: "One of the most popular and aggressive variations of the Sicilian Defense. It's characterized by the moves 1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6.",
    fen: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 1",
    moves: [
      "e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6",
      "Be3", "e5", "Nb3", "Be6", "f3", "Be7", "Qd2", "O-O", "O-O-O", "Nbd7"
    ],
    moveExplanations: [
      "White establishes central control with e4",
      "Black challenges the center with c5, creating an asymmetrical position",
      "White develops the knight and attacks e5",
      "Black prepares to develop the dark-squared bishop",
      "White opens the center with d4",
      "Black captures the pawn",
      "White recaptures with the knight",
      "Black develops the knight and attacks e4",
      "White defends e4 and develops the knight",
      "Black prepares to castle queenside with a6",
      "White develops the bishop to control the center",
      "Black gains space in the center with e5",
      "White retreats the knight to b3",
      "Black develops the bishop to e6",
      "White secures the center with f3",
      "Black develops the bishop to e7",
      "White prepares to castle queenside",
      "Black castles kingside",
      "White castles queenside",
      "Black develops the knight to d7"
    ],
    difficulty: "Advanced",
    category: "Semi-Open Game",
    isFree: true
  },
  {
    name: "Ruy Lopez - Closed Variation",
    description: "A classical opening that begins with 1.e4 e5 2.Nf3 Nc6 3.Bb5. The Closed Variation is one of the most solid lines.",
    fen: "r1bqk2r/pppp1ppp/2n2n2/1B2p3/1b2P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 0 1",
    moves: [
      "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7",
      "Re1", "b5", "Bb3", "O-O", "c3", "d6", "h3", "Na5", "Bc2", "c5"
    ],
    moveExplanations: [
      "White establishes central control with e4",
      "Black mirrors White's central control",
      "White develops the knight and attacks e5",
      "Black defends e5 with the knight",
      "White pins the knight with the bishop",
      "Black challenges the bishop with a6",
      "White retreats the bishop to a4",
      "Black develops the knight to f6",
      "White castles kingside",
      "Black develops the bishop to e7",
      "White connects the rooks",
      "Black gains space on the queenside",
      "White retreats the bishop to b3",
      "Black castles kingside",
      "White prepares to support d4",
      "Black prepares to develop the dark-squared bishop",
      "White prevents Bg4",
      "Black attacks the bishop",
      "White retreats the bishop to c2",
      "Black gains space in the center"
    ],
    difficulty: "Intermediate",
    category: "Open Game",
    isFree: true
  },
  {
    name: "Queen's Gambit - Classical Variation",
    description: "A solid and classical opening that begins with 1.d4 d5 2.c4. The Classical Variation is one of the most popular lines.",
    fen: "r1bqk2r/ppp1bppp/2n2n2/3p4/2PP4/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 1",
    moves: [
      "d4", "d5", "c4", "e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O",
      "Nf3", "Nbd7", "Rc1", "c6", "Bd3", "dxc4", "Bxc4", "b5", "Bd3", "Bb7"
    ],
    moveExplanations: [
      "White establishes central control with d4",
      "Black mirrors White's central control",
      "White offers a pawn to gain central control",
      "Black prepares to develop the light-squared bishop",
      "White develops the knight",
      "Black develops the knight",
      "White pins the knight",
      "Black develops the bishop",
      "White supports the center",
      "Black castles kingside",
      "White develops the knight",
      "Black develops the knight",
      "White connects the rooks",
      "Black prepares to develop the light-squared bishop",
      "White develops the bishop",
      "Black captures the pawn",
      "White recaptures with the bishop",
      "Black gains space on the queenside",
      "White retreats the bishop",
      "Black develops the bishop to b7"
    ],
    difficulty: "Intermediate",
    category: "Closed Game",
    isFree: false
  },
  // French Defense
  {
    name: "French Defense",
    description: "A solid response to 1.e4, focusing on counterattacking the center.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    moves: ["e4", "e6", "d4", "d5"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black responds with e6, preparing d5.",
      "White plays d4, taking more space.",
      "Black challenges the center with d5."
    ],
    difficulty: "Beginner",
    category: "Closed Game",
    isFree: true
  },
  // Caro-Kann Defense
  {
    name: "Caro-Kann Defense",
    description: "A solid and resilient defense for Black, starting with 1.e4 c6.",
    fen: "rnbqkbnr/pp2pppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    moves: ["e4", "c6", "d4", "d5"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black responds with c6, preparing d5.",
      "White plays d4, taking more space.",
      "Black challenges the center with d5."
    ],
    difficulty: "Beginner",
    category: "Semi-Open Game",
    isFree: true
  },
  // King's Indian Defense
  {
    name: "King's Indian Defense",
    description: "A dynamic and aggressive defense for Black, allowing White to build a center before counterattacking.",
    fen: "rnbqkb1r/pppppp1p/5np1/8/2PPP3/5N2/PP2BPPP/RNBQK2R b KQkq - 0 5",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "Bg7", "e4", "d6"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black develops the knight to f6.",
      "White expands with c4.",
      "Black prepares to fianchetto with g6.",
      "White develops the knight to c3.",
      "Black completes the fianchetto with Bg7.",
      "White establishes a strong center with e4.",
      "Black supports the center with d6."
    ],
    difficulty: "Advanced",
    category: "Indian Game",
    isFree: false
  },
  // Nimzo-Indian Defense
  {
    name: "Nimzo-Indian Defense",
    description: "A hypermodern defense for Black, challenging White's center with piece play.",
    fen: "rnbqk2r/ppp1ppbp/6p1/3p4/2PP4/2N1PN2/PP2BPPP/R1BQK2R b KQkq - 0 6",
    moves: ["d4", "Nf6", "c4", "e6", "Nc3", "Bb4"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black develops the knight to f6.",
      "White expands with c4.",
      "Black plays e6, preparing Bb4.",
      "White develops the knight to c3.",
      "Black pins the knight with Bb4."
    ],
    difficulty: "Advanced",
    category: "Indian Game",
    isFree: false
  },
  // English Opening
  {
    name: "English Opening",
    description: "A flexible opening for White, starting with 1.c4.",
    fen: "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1",
    moves: ["c4"],
    moveExplanations: [
      "White plays c4, controlling the d5 square."
    ],
    difficulty: "Beginner",
    category: "Flank Opening",
    isFree: true
  },
  // Scandinavian Defense
  {
    name: "Scandinavian Defense",
    description: "An immediate challenge to White's center with 1...d5.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    moves: ["e4", "d5"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black immediately challenges with d5."
    ],
    difficulty: "Beginner",
    category: "Semi-Open Game",
    isFree: true
  },
  // Pirc Defense
  {
    name: "Pirc Defense",
    description: "A flexible defense for Black, allowing White to occupy the center.",
    fen: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    moves: ["e4", "d6", "d4", "Nf6"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black plays d6, preparing Nf6 and g6.",
      "White plays d4, taking more space.",
      "Black develops the knight to f6."
    ],
    difficulty: "Intermediate",
    category: "Semi-Open Game",
    isFree: true
  },
  // Alekhine's Defense
  {
    name: "Alekhine's Defense",
    description: "A provocative defense, inviting White to advance their pawns early.",
    fen: "rnbqkb1r/pppppppp/5n2/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 1 2",
    moves: ["e4", "Nf6"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black develops the knight to f6, attacking e4."
    ],
    difficulty: "Intermediate",
    category: "Semi-Open Game",
    isFree: true
  },
  // Dutch Defense
  {
    name: "Dutch Defense",
    description: "A fighting defense for Black, starting with 1...f5.",
    fen: "rnbqkbnr/pppppppp/8/5p2/3P4/8/PPP1PPPP/RNBQKBNR w KQkq - 0 2",
    moves: ["d4", "f5"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black plays f5, aiming for kingside activity."
    ],
    difficulty: "Intermediate",
    category: "Flank Opening",
    isFree: true
  },
  // Benko Gambit
  {
    name: "Benko Gambit",
    description: "A dynamic gambit for Black, sacrificing a pawn for queenside play.",
    fen: "rnbqkbnr/ppp1pppp/8/3p4/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 2",
    moves: ["d4", "Nf6", "c4", "c5", "d5", "b5"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black develops the knight to f6.",
      "White expands with c4.",
      "Black plays c5, challenging the center.",
      "White advances d5, gaining space.",
      "Black gambits the b-pawn with b5."
    ],
    difficulty: "Advanced",
    category: "Gambit",
    isFree: false
  },
  // Benoni Defense
  {
    name: "Benoni Defense",
    description: "A sharp and dynamic defense for Black, leading to imbalanced positions.",
    fen: "rnbqkbnr/pp3ppp/4p3/2ppP3/2P5/8/PP1P1PPP/RNBQKBNR w KQkq - 0 5",
    moves: ["d4", "Nf6", "c4", "c5", "d5", "e6"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black develops the knight to f6.",
      "White expands with c4.",
      "Black plays c5, challenging the center.",
      "White advances d5, gaining space.",
      "Black plays e6, preparing exd5."
    ],
    difficulty: "Advanced",
    category: "Indian Game",
    isFree: false
  },
  // Vienna Game
  {
    name: "Vienna Game",
    description: "A flexible opening for White, starting with 1.e4 e5 2.Nc3.",
    fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/2N5/PPPP1PPP/R1BQKBNR b KQkq - 2 2",
    moves: ["e4", "e5", "Nc3"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black responds with e5.",
      "White develops the knight to c3."
    ],
    difficulty: "Beginner",
    category: "Open Game",
    isFree: true
  },
  // Scotch Game
  {
    name: "Scotch Game",
    description: "An open and tactical opening for White, starting with 1.e4 e5 2.Nf3 Nc6 3.d4.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3",
    moves: ["e4", "e5", "Nf3", "Nc6", "d4"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black responds with e5.",
      "White develops the knight to f3.",
      "Black develops the knight to c6.",
      "White plays d4, opening the center."
    ],
    difficulty: "Beginner",
    category: "Open Game",
    isFree: true
  },
  // Italian Game
  {
    name: "Italian Game",
    description: "A classical opening for White, starting with 1.e4 e5 2.Nf3 Nc6 3.Bc4.",
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 2 3",
    moves: ["e4", "e5", "Nf3", "Nc6", "Bc4"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black responds with e5.",
      "White develops the knight to f3.",
      "Black develops the knight to c6.",
      "White develops the bishop to c4."
    ],
    difficulty: "Beginner",
    category: "Open Game",
    isFree: true
  },
  // Four Knights Game
  {
    name: "Four Knights Game",
    description: "A symmetrical opening for both sides, starting with 1.e4 e5 2.Nf3 Nc6 3.Nc3 Nf6.",
    fen: "r1bqkb1r/pppp1ppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4",
    moves: ["e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black responds with e5.",
      "White develops the knight to f3.",
      "Black develops the knight to c6.",
      "White develops the knight to c3.",
      "Black develops the knight to f6."
    ],
    difficulty: "Beginner",
    category: "Open Game",
    isFree: true
  },
  // London System
  {
    name: "London System",
    description: "A solid and flexible opening for White, starting with 1.d4 and 2.Nf3 and 3.Bf4.",
    fen: "rnbqkb1r/pppppppp/8/8/5B2/5N2/PPPPPPPP/RN1QKB1R b KQkq - 2 3",
    moves: ["d4", "d5", "Nf3", "Nf6", "Bf4"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black responds with d5.",
      "White develops the knight to f3.",
      "Black develops the knight to f6.",
      "White develops the bishop to f4."
    ],
    difficulty: "Beginner",
    category: "Closed Game",
    isFree: true
  },
  // Catalan Opening
  {
    name: "Catalan Opening",
    description: "A hypermodern opening for White, fianchettoing the light-squared bishop.",
    fen: "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 5",
    moves: ["d4", "Nf6", "c4", "e6", "g3", "d5", "Bg2"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black develops the knight to f6.",
      "White expands with c4.",
      "Black plays e6, preparing d5.",
      "White prepares to fianchetto with g3.",
      "Black plays d5, challenging the center.",
      "White fianchettos the bishop with Bg2."
    ],
    difficulty: "Advanced",
    category: "Closed Game",
    isFree: false
  },
  // Grunfeld Defense
  {
    name: "Grunfeld Defense",
    description: "A hypermodern defense for Black, challenging White's center with d5 and g6.",
    fen: "rnbqkb1r/ppp1pppp/5n2/3p4/2PP4/2N1PN2/PP3PPP/R1BQKB1R w KQkq - 0 5",
    moves: ["d4", "Nf6", "c4", "g6", "Nc3", "d5"],
    moveExplanations: [
      "White plays d4, controlling the center.",
      "Black develops the knight to f6.",
      "White expands with c4.",
      "Black prepares to fianchetto with g6.",
      "White develops the knight to c3.",
      "Black challenges the center with d5."
    ],
    difficulty: "Advanced",
    category: "Indian Game",
    isFree: false
  },
  // Bird's Opening
  {
    name: "Bird's Opening",
    description: "A flank opening for White, starting with 1.f4.",
    fen: "rnbqkbnr/pppppppp/8/8/5P2/8/PPPPP1PP/RNBQKBNR b KQkq - 0 1",
    moves: ["f4"],
    moveExplanations: [
      "White plays f4, aiming for kingside control."
    ],
    difficulty: "Beginner",
    category: "Flank Opening",
    isFree: true
  },
  // Modern Defense
  {
    name: "Modern Defense",
    description: "A hypermodern defense for Black, starting with 1...g6.",
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    moves: ["e4", "g6"],
    moveExplanations: [
      "White plays e4, controlling the center.",
      "Black plays g6, preparing to fianchetto the bishop."
    ],
    difficulty: "Intermediate",
    category: "Semi-Open Game",
    isFree: true
  }
];

mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    // Clear existing openings
    await Opening.deleteMany({});
    console.log('Cleared existing openings');
    
    // Insert new openings
    const openings = await Opening.insertMany(sampleOpenings);
    console.log(`Successfully added ${openings.length} openings`);
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding openings:', err);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
}); 