const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

async function testAuthAndRating() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chessrep');
    console.log('✅ Connected to MongoDB');
    
    // Find the test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('👤 Test user found:', user.username);
    console.log('📊 Current rating:', user.rating);
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'chessrep_secret_key_2024');
    console.log('🔑 Generated token:', token.substring(0, 20) + '...');
    
    // Test rating update
    const http = require('http');
    
    const postData = JSON.stringify({
      solved: true,
      puzzleRating: 1500,
      theme: 'mate'
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/puzzles/stats/puzzle',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    };

    const req = http.request(options, (res) => {
      console.log(`\n📊 Rating Update Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          console.log('📊 Rating Update Response:');
          console.log(JSON.stringify(result, null, 2));
          
          // Check updated user rating
          User.findById(user._id).then(updatedUser => {
            console.log('\n📈 Updated user rating:', updatedUser.rating);
            console.log('📊 User stats:', updatedUser.stats);
          });
          
        } catch (err) {
          console.log('❌ Error parsing response:', err.message);
          console.log('Raw response:', data);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ Request error:', err.message);
    });

    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAuthAndRating();


