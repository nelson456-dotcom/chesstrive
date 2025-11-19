const { MongoClient } = require('mongodb');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = 'mongodb://localhost:27017/chessrep';

async function fixOpeningsData() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB successfully!');

    const db = client.db();
    const openingsCollection = db.collection('openings');

    // Find all openings that need to be fixed
    const openings = await openingsCollection.find({
      $or: [
        { fen: { $exists: true } },
        { moves: { $exists: true } },
        { moveExplanations: { $exists: true } }
      ]
    }).toArray();

    console.log(`Found ${openings.length} openings to fix...`);

    for (const opening of openings) {
      console.log(`\nProcessing opening: ${opening.name || opening._id}`);
      
      // Check if it already has the correct structure
      if (opening.lines && Array.isArray(opening.lines) && opening.lines.length > 0) {
        console.log('  ✓ Already has correct lines structure, skipping...');
        continue;
      }

      // Create the new lines structure
      const newLines = [];
      
      // If opening has top-level fen, moves, moveExplanations, move them to lines
      if (opening.fen || opening.moves || opening.moveExplanations) {
        const line = {
          name: 'Main Line',
          fen: opening.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moves: opening.moves || [],
          moveExplanations: opening.moveExplanations || []
        };
        newLines.push(line);
        console.log(`  ✓ Created main line with ${line.moves.length} moves`);
      }

      // If opening has multiple lines as strings, parse them
      if (opening.lines && Array.isArray(opening.lines)) {
        for (let i = 0; i < opening.lines.length; i++) {
          const lineData = opening.lines[i];
          
          if (typeof lineData === 'string') {
            try {
              // Try to parse as JSON
              const parsedLine = JSON.parse(lineData);
              if (parsedLine.fen || parsedLine.moves) {
                newLines.push({
                  name: parsedLine.name || `Line ${i + 1}`,
                  fen: parsedLine.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                  moves: parsedLine.moves || [],
                  moveExplanations: parsedLine.moveExplanations || []
                });
                console.log(`  ✓ Parsed line ${i + 1} with ${parsedLine.moves?.length || 0} moves`);
              }
            } catch (e) {
              console.log(`  ⚠ Could not parse line ${i + 1} as JSON: ${e.message}`);
            }
          } else if (typeof lineData === 'object' && lineData !== null) {
            // Already an object, use it directly
            newLines.push({
              name: lineData.name || `Line ${i + 1}`,
              fen: lineData.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
              moves: lineData.moves || [],
              moveExplanations: lineData.moveExplanations || []
            });
            console.log(`  ✓ Used existing line ${i + 1} with ${lineData.moves?.length || 0} moves`);
          }
        }
      }

      // If no lines were created, create a default one
      if (newLines.length === 0) {
        newLines.push({
          name: 'Main Line',
          fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
          moves: [],
          moveExplanations: []
        });
        console.log('  ✓ Created default line (no moves)');
      }

      // Update the opening document
      const updateResult = await openingsCollection.updateOne(
        { _id: opening._id },
        {
          $set: {
            lines: newLines
          },
          $unset: {
            fen: "",
            moves: "",
            moveExplanations: ""
          }
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`  ✓ Successfully updated opening with ${newLines.length} lines`);
      } else {
        console.log(`  ⚠ No changes made to opening`);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log(`Fixed ${openings.length} openings`);

  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed.');
    }
  }
}

// Run the migration
fixOpeningsData().catch(console.error); 