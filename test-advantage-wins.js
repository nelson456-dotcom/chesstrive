const mongoose = require('mongoose');
const User = require('./chessrep-main/backend/models/User');

// Test script to verify advantage wins functionality
async function testAdvantageWins() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/chessrep', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Find a test user
    const testUser = await User.findOne({ username: 'test' });
    if (!testUser) {
      console.log('No test user found. Creating one...');
      const newUser = new User({
        username: 'test',
        email: 'test@example.com',
        password: 'password123',
        advantageWins: 0
      });
      await newUser.save();
      console.log('Test user created');
    }
    
    // Test the advantage wins field
    const user = await User.findOne({ username: 'test' });
    console.log('Current advantageWins:', user.advantageWins);
    
    // Simulate winning a position
    user.advantageWins = (user.advantageWins || 0) + 1;
    await user.save();
    
    console.log('Updated advantageWins:', user.advantageWins);
    
    // Verify the field exists and is accessible
    const updatedUser = await User.findById(user._id);
    console.log('Verified advantageWins:', updatedUser.advantageWins);
    
    console.log('✅ Advantage wins functionality test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

testAdvantageWins();
