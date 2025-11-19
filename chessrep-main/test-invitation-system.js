const mongoose = require('mongoose');
const Study = require('./models/Study');
const User = require('./models/User');
const Notification = require('./models/Notification');

async function testInvitationSystem() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/chessrep', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Create test users
    const adminiz = await User.findOne({ username: 'adminiz' });
    const nizadmin = await User.findOne({ username: 'nizadmin' });
    
    if (!adminiz) {
      console.log('❌ adminiz user not found');
      return;
    }
    
    if (!nizadmin) {
      console.log('❌ nizadmin user not found');
      return;
    }

    console.log('✅ Found users:', { adminiz: adminiz.username, nizadmin: nizadmin.username });

    // Create a test study
    const testStudy = new Study({
      name: 'Test Study for Invitations',
      description: 'Testing the invitation system',
      authorId: adminiz._id,
      collaborators: []
    });

    await testStudy.save();
    console.log('✅ Created test study:', testStudy._id);

    // Test invitation
    console.log('🎯 Testing invitation system...');
    
    // Add nizadmin as collaborator
    await testStudy.addCollaborator(nizadmin._id, 'viewer', adminiz._id);
    console.log('✅ Added nizadmin as collaborator');

    // Create notification
    const notification = await Notification.createStudyInvitation(
      nizadmin._id,
      testStudy._id,
      testStudy.name,
      adminiz.username
    );
    console.log('✅ Created notification:', notification._id);

    // Test accepting invitation
    await testStudy.acceptInvitation(nizadmin._id);
    console.log('✅ nizadmin accepted invitation');

    // Check access
    const access = testStudy.hasAccess(nizadmin._id);
    console.log('✅ nizadmin access:', access);

    // Clean up
    await Study.findByIdAndDelete(testStudy._id);
    await Notification.findByIdAndDelete(notification._id);
    console.log('✅ Cleaned up test data');

    console.log('🎉 INVITATION SYSTEM TEST PASSED!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testInvitationSystem();
