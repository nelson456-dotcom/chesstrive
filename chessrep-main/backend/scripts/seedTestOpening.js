// seedTestOpening.js
const mongoose = require('mongoose');
const Opening = require('../models/Opening');

const MONGO_URI = 'mongodb://localhost:27017/chessrep'; // Change if your DB URI is different

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const testOpening = {
    name: "Test Opening",
    description: "A test opening for frontend development.",
    difficulty: "Beginner",
    category: "Test",
    isFree: true,
    lines: [
      {
        name: "Main Line",
        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moves: [
          "e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"
        ],
        moveExplanations: [
          "White plays e4",
          "Black responds e5",
          "White develops knight",
          "Black develops knight",
          "White plays Bb5 (Ruy Lopez)",
          "Black plays a6",
          "White retreats bishop",
          "Black develops knight",
          "White castles",
          "Black develops bishop"
        ]
      }
    ]
  };

  const result = await Opening.create(testOpening);
  console.log('Seeded opening:', result);
  await mongoose.disconnect();
}

seed(); 