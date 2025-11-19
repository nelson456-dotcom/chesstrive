const mongoose = require('mongoose');
const Study = require('../models/Study');
const Chapter = require('../models/Chapter');

async function verifyDifferentChapters() {
  try {
    await mongoose.connect('mongodb://localhost:27017/chessrep');
    console.log('✅ Connected to MongoDB\n');

    const ponziani = await Study.findOne({ name: 'The Poisonous Ponziani!' });
    const scotch = await Study.findOne({ name: /Storm With The Scotch/i });

    console.log('=== Ponziani Study ===');
    console.log('Study ID:', ponziani._id.toString());
    console.log('First 3 chapter IDs:', ponziani.chapters.slice(0, 3).map(id => id.toString()));

    const ponzianiChapters = await Chapter.find({ _id: { $in: ponziani.chapters.slice(0, 3) } });
    console.log('Chapter names:');
    ponzianiChapters.forEach(ch => console.log('  -', ch.name, '(ID:', ch._id.toString(), ')'));

    console.log('\n=== Scotch Study ===');
    console.log('Study ID:', scotch._id.toString());
    console.log('First 3 chapter IDs:', scotch.chapters.slice(0, 3).map(id => id.toString()));

    const scotchChapters = await Chapter.find({ _id: { $in: scotch.chapters.slice(0, 3) } });
    console.log('Chapter names:');
    scotchChapters.forEach(ch => console.log('  -', ch.name, '(ID:', ch._id.toString(), ')'));

    console.log('\n=== Verification ===');
    const sameIds = ponziani.chapters[0].toString() === scotch.chapters[0].toString();
    console.log('Do they have the same first chapter ID?', sameIds);
    
    if (sameIds) {
      console.log('❌ ERROR: Studies are sharing the same chapters!');
    } else {
      console.log('✅ Studies have different chapters');
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
  }
}

verifyDifferentChapters();










