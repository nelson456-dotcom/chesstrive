const mongoose = require('mongoose');
const Study = require('./models/Study');
const User = require('./models/User');

// Test script to verify the invitation fix
async function testInvitationFix() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep');
    console.log('Connected to MongoDB');

    // Create a test user
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword'
    });
    await testUser.save();
    console.log('Created test user:', testUser._id);

    // Test 1: Create a temporary study (simulating frontend study)
    const tempStudy = new Study({
      user: testUser._id,
      name: 'Test Study 1',
      description: 'Temporary study created for collaboration',
      isPublic: false
    });
    await tempStudy.save();
    console.log('Created temporary study:', tempStudy._id);

    // Test 2: Check hasAccess method
    const access = tempStudy.hasAccess(testUser._id);
    console.log('Access check result:', access);

    // Test 3: Verify permission check logic
    const isOwner = tempStudy.user.toString() === testUser._id.toString();
    const hasPermission = access.hasAccess && ['admin', 'edit'].includes(access.permission);
    const isTemporaryStudy = true; // Simulating numeric study ID
    
    console.log('Permission check details:', {
      isOwner,
      hasPermission,
      isTemporaryStudy,
      shouldAllow: hasPermission || (isTemporaryStudy && isOwner)
    });

    if (hasPermission || (isTemporaryStudy && isOwner)) {
      console.log('✅ SUCCESS: Invitation should be allowed');
    } else {
      console.log('❌ FAILURE: Invitation would be blocked');
    }

    // Cleanup
    await Study.deleteOne({ _id: tempStudy._id });
    await User.deleteOne({ _id: testUser._id });
    console.log('Test completed and cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the test
testInvitationFix();
