const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Opening = require('../models/Opening');
require('dotenv').config();

async function importOpenings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep');
    console.log('Connected to MongoDB');

    // Read the openings data
    const openingsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/openings.json'), 'utf8'));
    console.log(`Found ${openingsData.length} openings to import`);

    // Clear existing openings
    await Opening.deleteMany({});
    console.log('Cleared existing openings');

    // Import new openings
    for (const openingData of openingsData) {
      const opening = new Opening(openingData);
      await opening.save();
      console.log(`Imported: ${opening.name}`);
    }

    console.log('All openings imported successfully!');
    mongoose.connection.close();
  } catch (error) {
    console.error('Error importing openings:', error);
    mongoose.connection.close();
  }
}

importOpenings();
