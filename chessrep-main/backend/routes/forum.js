const express = require('express');
const router = express.Router();
const ForumTopic = require('../models/ForumTopic');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all topics
router.get('/topics', async (req, res) => {
  try {
    const { category, limit = 20, skip = 0 } = req.query;
    
    const query = { isDeleted: false };
    if (category && category !== 'All') {
      query.category = category;
    }

    const topics = await ForumTopic.find(query)
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'username')
      .lean();

    const transformedTopics = topics.map(topic => ({
      ...topic,
      repliesCount: topic.replies?.length || 0,
      lastReply: topic.replies?.length > 0 
        ? topic.replies[topic.replies.length - 1]
        : null
    }));

    res.json({ success: true, topics: transformedTopics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single topic with replies
router.get('/topics/:topicId', async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId)
      .populate('userId', 'username')
      .lean();

    if (!topic || topic.isDeleted) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Increment views
    await ForumTopic.findByIdAndUpdate(req.params.topicId, {
      $inc: { views: 1 }
    });

    res.json({ success: true, topic });
  } catch (error) {
    console.error('Error fetching topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new topic
router.post('/topics', auth, async (req, res) => {
  try {
    const { title, category, content, tags } = req.body;

    if (!title || !category || !content) {
      return res.status(400).json({ message: 'Title, category, and content are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const topic = new ForumTopic({
      title: title.trim(),
      category,
      userId: req.user.id,
      username: user.username,
      content: content.trim(),
      tags: tags || [],
      replies: [],
      views: 0
    });

    await topic.save();

    res.json({ success: true, topic });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add reply to topic
router.post('/topics/:topicId/reply', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Reply content is required' });
    }

    const topic = await ForumTopic.findById(req.params.topicId);
    
    if (!topic || topic.isDeleted) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (topic.isLocked) {
      return res.status(403).json({ message: 'Topic is locked' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    topic.replies.push({
      userId: req.user.id,
      username: user.username,
      content: content.trim(),
      likes: []
    });

    await topic.save();

    res.json({ 
      success: true, 
      reply: topic.replies[topic.replies.length - 1]
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike a reply
router.post('/topics/:topicId/reply/:replyId/like', auth, async (req, res) => {
  try {
    const topic = await ForumTopic.findById(req.params.topicId);
    
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const reply = topic.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ message: 'Reply not found' });
    }

    const likeIndex = reply.likes.findIndex(
      like => like.userId.toString() === req.user.id
    );

    if (likeIndex > -1) {
      reply.likes.splice(likeIndex, 1);
    } else {
      reply.likes.push({ userId: req.user.id });
    }

    await topic.save();

    res.json({ 
      success: true, 
      likesCount: reply.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error liking reply:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete topic (admin only)
router.delete('/topics/:topicId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    topic.isDeleted = true;
    await topic.save();

    res.json({ success: true, message: 'Topic deleted' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Pin/Unpin topic (admin only)
router.post('/topics/:topicId/pin', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    topic.isPinned = !topic.isPinned;
    await topic.save();

    res.json({ success: true, isPinned: topic.isPinned });
  } catch (error) {
    console.error('Error pinning topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Lock/Unlock topic (admin only)
router.post('/topics/:topicId/lock', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const topic = await ForumTopic.findById(req.params.topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    topic.isLocked = !topic.isLocked;
    await topic.save();

    res.json({ success: true, isLocked: topic.isLocked });
  } catch (error) {
    console.error('Error locking topic:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;











