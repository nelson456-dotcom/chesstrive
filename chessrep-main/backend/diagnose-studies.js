const mongoose = require('mongoose');
const Study = require('./models/Study');
const User = require('./models/User');
const Chapter = require('./models/Chapter');
require('dotenv').config();

async function diagnoseStudies() {
  try {
    console.log('🔍 Starting Studies Diagnosis...\n');
    
    // 1. Check MongoDB connection
    console.log('1️⃣ Checking MongoDB connection...');
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chessrep';
    console.log('   URI:', mongoURI.replace(/\/\/.*@/, '//<credentials>@'));
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('   ✅ MongoDB Connected');
    console.log('   Database:', mongoose.connection.db.databaseName);
    console.log('');
    
    // 2. Check if there are any studies
    console.log('2️⃣ Checking studies in database...');
    const allStudies = await Study.find({}).populate('user', 'username email');
    console.log(`   Found ${allStudies.length} total studies in database`);
    
    if (allStudies.length > 0) {
      console.log('\n   📚 All Studies:');
      allStudies.forEach((study, index) => {
        console.log(`   ${index + 1}. "${study.name}"`);
        console.log(`      - ID: ${study._id}`);
        console.log(`      - Owner: ${study.user?.username || study.user?.email || study.user || 'Unknown'}`);
        console.log(`      - Owner ID: ${study.user?._id || study.user}`);
        console.log(`      - Created: ${study.createdAt}`);
        console.log('');
      });
    }
    console.log('');
    
    // 3. Check users
    console.log('3️⃣ Checking users...');
    const allUsers = await User.find({}).select('username email _id');
    console.log(`   Found ${allUsers.length} users`);
    
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username || user.email}`);
      console.log(`      - ID: ${user._id}`);
      console.log(`      - Email: ${user.email}`);
      console.log('');
    });
    
    // 4. Check studies for specific user if username provided
    const targetUsername = process.argv[2];
    if (targetUsername) {
      console.log(`4️⃣ Checking studies for user: ${targetUsername}...`);
      const targetUser = await User.findOne({ 
        $or: [
          { username: targetUsername },
          { email: targetUsername }
        ]
      });
      
      if (!targetUser) {
        console.log(`   ❌ User "${targetUsername}" not found`);
      } else {
        console.log(`   ✅ User found: ${targetUser.username || targetUser.email}`);
        console.log(`   User ID: ${targetUser._id}`);
        
        const userStudies = await Study.find({ user: targetUser._id });
        console.log(`   📚 Found ${userStudies.length} studies for this user`);
        
        if (userStudies.length > 0) {
          userStudies.forEach((study, index) => {
            console.log(`\n   ${index + 1}. "${study.name}"`);
            console.log(`      - ID: ${study._id}`);
            console.log(`      - Created: ${study.createdAt}`);
            console.log(`      - Updated: ${study.updatedAt}`);
          });
        }
      }
    }
    console.log('');
    
    // 5. Check chapters
    console.log('5️⃣ Checking chapters...');
    const allChapters = await Chapter.find({}).populate('study', 'name');
    console.log(`   Found ${allChapters.length} total chapters`);
    
    if (allChapters.length > 0) {
      console.log('\n   📄 Sample chapters:');
      allChapters.slice(0, 5).forEach((chapter, index) => {
        console.log(`   ${index + 1}. "${chapter.name}"`);
        console.log(`      - Study: ${chapter.study?.name || 'Unknown'}`);
        console.log(`      - Study ID: ${chapter.study?._id || chapter.study}`);
        console.log('');
      });
    }
    
    console.log('\n✅ Diagnosis complete!');
    console.log('\n💡 To diagnose a specific user, run:');
    console.log('   node diagnose-studies.js <username or email>');
    console.log('   Example: node diagnose-studies.js adminiz1');
    
  } catch (error) {
    console.error('\n❌ Error during diagnosis:', error.message);
    console.error('Error name:', error.name);
    
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
      console.log('\n💡 MongoDB is not running or not accessible!');
      console.log('   To fix this:');
      console.log('   1. Start MongoDB: mongod --dbpath <your-data-path>');
      console.log('   2. Or install MongoDB: https://www.mongodb.com/try/download/community');
      console.log('   3. Check MONGODB_URI in .env file');
    }
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

// Run the diagnosis
diagnoseStudies();




