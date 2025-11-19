// updateSicilianOrientation.js
const mongoose = require('mongoose');
const Opening = require('../models/Opening');

const MONGO_URI = 'mongodb://localhost:27017/chessrep'; // Change if your DB URI is different

async function updateSicilian() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const openings = await Opening.find({ name: /sicilian defense/i });
  for (const opening of openings) {
    let updated = false;
    for (const line of opening.lines) {
      if (line.orientation !== 'black') {
        line.orientation = 'black';
        updated = true;
      }
    }
    if (updated) {
      await opening.save();
      console.log('Updated orientation for:', opening.name);
    }
  }
  await mongoose.disconnect();
  console.log('Done.');
}

updateSicilian(); 