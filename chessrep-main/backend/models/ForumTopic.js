const mongoose = require('mongoose');

const forumTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  category: {
    type: String,
    required: true,
    enum: ['General', 'Openings', 'Tactics', 'Endgames', 'Strategy', 'Analysis', 'Help', 'Off-Topic']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    content: String,
    likes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [String],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
forumTopicSchema.index({ category: 1, createdAt: -1 });
forumTopicSchema.index({ userId: 1 });
forumTopicSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('ForumTopic', forumTopicSchema);











