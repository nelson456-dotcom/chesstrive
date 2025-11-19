const mongoose = require('mongoose');
const User = require('./chessrep-main/backend/models/User');
const Study = require('./chessrep-main/backend/models/Study');
const Notification = require('./chessrep-main/backend/models/Notification');

async function testInvitation() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB');

    // Find the inviter (adminiz)
    const inviter = await User.findOne({ username: 'adminiz' });
    console.log('👤 Inviter found:', inviter ? inviter.username : 'NOT FOUND');

    // Find the invitee (adminiz1)
    const invitee = await User.findOne({ username: 'adminiz1' });
    console.log('👤 Invitee found:', invitee ? invitee.username : 'NOT FOUND');

    if (!inviter || !invitee) {
      console.log('❌ Missing users for test');
      return;
    }

    // Create a test study
    const testStudy = new Study({
      authorId: inviter._id,
      name: 'Test Study for Invitation',
      description: 'Testing invitation system',
      isPublic: false
    });
    await testStudy.save();
    console.log('📚 Test study created:', testStudy._id);

    // Create invitation notification
    const notification = await Notification.createStudyInvitation(
      invitee._id,
      testStudy._id,
      testStudy.name,
      inviter.username
    );
    console.log('📧 Notification created:', notification._id);

    // Check if notification exists
    const savedNotification = await Notification.findById(notification._id);
    console.log('📧 Notification saved:', savedNotification ? 'YES' : 'NO');
    if (savedNotification) {
      console.log('📧 Notification details:', {
        title: savedNotification.title,
        message: savedNotification.message,
        isRead: savedNotification.isRead,
        user: savedNotification.user
      });
    }

    // Check notifications for invitee
    const userNotifications = await Notification.find({ user: invitee._id });
    console.log('📧 Total notifications for invitee:', userNotifications.length);
    userNotifications.forEach(n => {
      console.log(`  - ${n.title}: ${n.message} (read: ${n.isRead})`);
    });

    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testInvitation();

