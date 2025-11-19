const mongoose = require('mongoose');
const Opening = require('../models/Opening');

mongoose.connect('mongodb://localhost:27017/chessrep', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  try {
    // Check if we can find any openings
    const openings = await Opening.find();
    console.log(`Found ${openings.length} openings in the database`);
    
    // Log the first opening's details
    if (openings.length > 0) {
      console.log('\nFirst opening details:');
      console.log(JSON.stringify(openings[0], null, 2));
      
      // Try to find a specific opening by ID
      const firstOpeningId = openings[0]._id;
      console.log('\nTrying to find opening by ID:', firstOpeningId);
      const openingById = await Opening.findById(firstOpeningId);
      console.log('Found opening by ID:', openingById ? 'Yes' : 'No');
      if (openingById) {
        console.log('Opening details:', JSON.stringify(openingById, null, 2));
      }
    }
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error checking openings:', err);
    mongoose.connection.close();
  }
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
}); 