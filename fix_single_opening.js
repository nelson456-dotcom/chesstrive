const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/chessrep';
const openingId = '6851d32530e5d83614a94039';

async function fixSingleOpening() {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const Opening = mongoose.connection.collection('openings');
  const opening = await Opening.findOne({ _id: mongoose.Types.ObjectId(openingId) });

  if (opening && opening.fen && opening.moves && opening.moves.length > 0) {
    await Opening.updateOne(
      { _id: mongoose.Types.ObjectId(openingId) },
      {
        $set: {
          lines: [{
            name: 'Main Line',
            fen: opening.fen,
            moves: opening.moves,
            moveExplanations: opening.moveExplanations || []
          }]
        },
        $unset: { fen: "", moves: "", moveExplanations: "" }
      }
    );
    console.log('Opening fixed!');
  } else {
    console.log('No fix needed or opening not found.');
  }
  await mongoose.disconnect();
}

fixSingleOpening(); 