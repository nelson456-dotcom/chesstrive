const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';

async function testPostAPI() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find admin user
    const admin = await User.findOne({ username: 'adminiz1' });
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }

    console.log('✅ Found user:', admin.username);

    // Create a test post
    const testPost = new Post({
      userId: admin._id,
      username: admin.username,
      content: 'This is a test post from the backend! 🎉',
      likes: [],
      comments: [],
      shares: 0
    });

    await testPost.save();
    console.log('✅ Test post created:', testPost._id);

    // Fetch all posts
    const allPosts = await Post.find({ isDeleted: false }).sort({ createdAt: -1 });
    console.log(`\n📋 Total posts in database: ${allPosts.length}\n`);

    allPosts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.username}: ${post.content.substring(0, 50)}...`);
      console.log(`   Created: ${post.createdAt}`);
      console.log(`   Likes: ${post.likes?.length || 0}, Comments: ${post.comments?.length || 0}\n`);
    });

    mongoose.connection.close();
    console.log('✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
  }
}

testPostAPI();











