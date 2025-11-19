const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const ForumTopic = require('../models/ForumTopic');
const auth = require('../middleware/auth');

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users
router.get('/users', auth, isAdmin, async (req, res) => {
  try {
    const { limit = 50, skip = 0, search = '' } = req.query;
    
    const query = search 
      ? { username: { $regex: search, $options: 'i' } }
      : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const totalUsers = await User.countDocuments(query);

    res.json({ success: true, users, total: totalUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments({ isDeleted: false });
    const totalTopics = await ForumTopic.countDocuments({ isDeleted: false });
    
    // Get users registered in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    // Get recent activity
    const recentPosts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username content createdAt')
      .lean();

    const recentTopics = await ForumTopic.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title username createdAt category')
      .lean();

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalPosts,
        totalTopics,
        newUsers,
        recentPosts,
        recentTopics
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin accounts' });
    }

    // Delete user's posts and topics
    await Post.updateMany({ userId: req.params.userId }, { isDeleted: true });
    await ForumTopic.updateMany({ userId: req.params.userId }, { isDeleted: true });

    // Delete the user
    await User.findByIdAndDelete(req.params.userId);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban/Unban user (soft delete - set a banned flag)
router.post('/users/:userId/ban', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot ban admin accounts' });
    }

    // Add banned field if it doesn't exist
    if (user.banned === undefined) {
      user.banned = false;
    }

    user.banned = !user.banned;
    await user.save();

    res.json({ 
      success: true, 
      message: user.banned ? 'User banned' : 'User unbanned',
      banned: user.banned
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role
router.post('/users/:userId/role', auth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['standard', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: 'User role updated', role });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (admin)
router.delete('/posts/:postId', auth, isAdmin, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:userId', auth, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts and topics count
    const postsCount = await Post.countDocuments({ userId: req.params.userId, isDeleted: false });
    const topicsCount = await ForumTopic.countDocuments({ userId: req.params.userId, isDeleted: false });

    res.json({ 
      success: true, 
      user: {
        ...user,
        postsCount,
        topicsCount
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;











