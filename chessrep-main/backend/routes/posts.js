const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all posts (feed)
router.get('/', async (req, res) => {
  try {
    const { limit = 20, skip = 0 } = req.query;
    
    const posts = await Post.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'username profileIcon')
      .lean();

    // Transform posts to include like count and profileIcon
    const transformedPosts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0,
      profileIcon: post.userId?.profileIcon || 'user'
    }));

    res.json({ success: true, posts: transformedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new post
router.post('/', auth, async (req, res) => {
  try {
    const { content, imageUrl, achievement } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const post = new Post({
      userId: req.user.id,
      username: user.username,
      content: content.trim(),
      imageUrl: imageUrl || null,
      achievement: achievement || null,
      likes: [],
      comments: [],
      shares: 0
    });

    await post.save();

    res.json({ 
      success: true, 
      post: {
        ...post.toObject(),
        likesCount: 0,
        commentsCount: 0
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike a post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.findIndex(
      like => like.userId.toString() === req.user.id
    );

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push({ userId: req.user.id });
    }

    await post.save();

    res.json({ 
      success: true, 
      likesCount: post.likes.length,
      isLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post
router.post('/:postId/comment', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    post.comments.push({
      userId: req.user.id,
      username: user.username,
      content: content.trim()
    });

    await post.save();

    res.json({ 
      success: true, 
      comment: post.comments[post.comments.length - 1],
      commentsCount: post.comments.length
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (user or admin)
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.user.id);
    
    // Check if user is post owner or admin
    if (post.userId.toString() !== req.user.id && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ 
      userId: req.params.userId,
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const transformedPosts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      commentsCount: post.comments?.length || 0
    }));

    res.json({ success: true, posts: transformedPosts });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

