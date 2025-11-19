const mongoose = require('mongoose');

async function checkAllDatabases() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017', {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected to MongoDB successfully!');
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const dbs = await admin.listDatabases();
    
    console.log('\n📁 Available databases:');
    dbs.databases.forEach(db => {
      console.log(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    // Check each database for users and puzzles
    for (const dbInfo of dbs.databases) {
      if (dbInfo.name === 'admin' || dbInfo.name === 'local') continue;
      
      console.log(`\n🔍 Checking database: ${dbInfo.name}`);
      
      try {
        const db = mongoose.connection.useDb(dbInfo.name);
        
        // Check for users
        const userCount = await db.collection('users').countDocuments();
        console.log(`  👥 Users: ${userCount}`);
        
        // Check for puzzles
        const puzzleCount = await db.collection('puzzles').countDocuments();
        console.log(`  🧩 Puzzles: ${puzzleCount}`);
        
        // If this database has users, show details
        if (userCount > 0) {
          const users = await db.collection('users').find().limit(3).toArray();
          console.log(`  📝 Sample users:`);
          users.forEach((user, index) => {
            console.log(`    ${index + 1}. ${user.username} - Rating: ${user.rating || 'Not set'}`);
          });
        }
        
        // If this database has puzzles, show themes
        if (puzzleCount > 0) {
          const themes = await db.collection('puzzles').distinct('theme');
          console.log(`  🎯 Themes: ${themes.length} (${themes.slice(0, 5).join(', ')}${themes.length > 5 ? '...' : ''})`);
        }
        
      } catch (err) {
        console.log(`  ❌ Error checking ${dbInfo.name}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAllDatabases();


