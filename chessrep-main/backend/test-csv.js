const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

console.log('Testing CSV parsing...');

const CSV_PATH = path.join(__dirname, 'data/puzzles.csv');
console.log('CSV path:', CSV_PATH);
console.log('CSV exists:', fs.existsSync(CSV_PATH));

let count = 0;
let puzzles = [];

fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (row) => {
    count++;
    if (count <= 5) {
      console.log('Row', count, ':', {
        FEN: row.FEN,
        Rating: row.Rating,
        Moves: row.Moves,
        Themes: row.Themes
      });
    }
    
    const rating = parseInt(row.Rating) || 600;
    if (rating < 1500) {
      puzzles.push({
        fen: row.FEN,
        rating: rating,
        moves: row.Moves ? row.Moves.split(' ').slice(0, 3) : []
      });
    }
  })
  .on('end', () => {
    console.log(`\nTotal rows processed: ${count}`);
    console.log(`Puzzles with rating < 1500: ${puzzles.length}`);
    if (puzzles.length > 0) {
      console.log('Sample puzzle:', puzzles[0]);
    }
  })
  .on('error', (error) => {
    console.error('Error:', error);
  });

