import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from './RichTextEditor';
import MarkdownRenderer from './MarkdownRenderer';
import ProfileIcon from './ProfileIcon';
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
  User,
  Settings,
  LogOut,
  Crown,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Image as ImageIcon,
  Send,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  Sparkles
} from 'lucide-react';

const FeedPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [commentContent, setCommentContent] = useState('');

  const menuItems = [
    { icon: Home, label: 'Home', path: '/dashboard-home' },
    { icon: BookOpen, label: 'Training Room', path: '/lessons' },
    { icon: Users, label: 'Feed', path: '/feed', active: true },
    { icon: BarChart3, label: 'My Statistics', path: '/profile' },
    { icon: Target, label: '40 Game Report', path: '/report/40' }
  ];

  // Fetch posts from database
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/posts');
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handlePost = async () => {
    if (!newPost.trim()) {
      alert('Please write something before posting!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('You must be logged in to post!');
        navigate('/login');
        return;
      }

      console.log('Posting:', { content: newPost, token: token ? 'exists' : 'missing' });

      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ content: newPost.trim() })
      });

      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Post created:', data);
        
        // Add the new post to the top of the feed
        setPosts([data.post, ...posts]);
        setNewPost('');
        alert('Post published successfully!');
      } else {
        // Try to parse error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Failed to create post:', errorData);
          alert('Failed to create post: ' + (errorData.message || 'Unknown error'));
        } else {
          // Server returned HTML instead of JSON - likely route not found
          console.error('Server returned HTML instead of JSON. Backend may need restart.');
          alert('⚠️ Backend server error!\n\nThe backend server needs to be restarted to load new routes.\n\nPlease:\n1. Stop the backend (Ctrl+C)\n2. Restart it: npm start\n3. Try posting again');
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.message.includes('JSON')) {
        alert('⚠️ Backend server error!\n\nThe server returned HTML instead of JSON.\n\nPlease restart the backend server:\n1. Stop backend (Ctrl+C)\n2. Run: npm start\n3. Try again');
      } else {
        alert('Error creating post: ' + error.message);
      }
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      alert('Please log in to like posts');
      navigate('/login');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in to like posts');
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, likesCount: data.likesCount, isLiked: data.isLiked }
            : post
        ));
      } else {
        const errorData = await response.json();
        alert('Failed to like post: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      alert('Error liking post: ' + error.message);
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      alert('Please log in to comment');
      navigate('/login');
      return;
    }

    if (!commentContent.trim()) {
      alert('Please write a comment');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ content: commentContent.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(posts.map(post => 
          post._id === postId 
            ? { ...post, commentsCount: data.commentsCount }
            : post
        ));
        setCommentContent('');
        setCommentingPostId(null);
        alert('Comment added successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to add comment: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment: ' + error.message);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">Chess Upgrade</span>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  item.active
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Menu */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Feed</h1>
            <p className="text-gray-600">Share your chess journey and connect with other players</p>
          </div>

          {/* Create Post */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex gap-4">
              <ProfileIcon iconId={user?.profileIcon || 'user'} size="md" className="flex-shrink-0" />
              <div className="flex-1">
                <RichTextEditor
                  value={newPost}
                  onChange={setNewPost}
                  placeholder="Share your chess achievements, insights, or questions... Use formatting buttons for bold, italic, etc."
                  rows={4}
                />
                <div className="flex items-center justify-end mt-3 gap-3">
                  <button
                    onClick={handlePost}
                    disabled={!newPost.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Send className="w-4 h-4" />
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Feed */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No posts yet. Be the first to post!</div>
            ) : (
              posts.map((post) => (
              <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <ProfileIcon iconId={post.profileIcon || 'user'} size="md" />
                  <div>
                    <div className="font-semibold text-gray-800">{post.username}</div>
                    <div className="text-sm text-gray-500">{getTimeAgo(post.createdAt)}</div>
                  </div>
                </div>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <MarkdownRenderer content={post.content} />
              </div>

                {/* Achievement Badge (if exists) */}
                {post.achievement && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                        <post.achievement.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-600 font-medium">Achievement Unlocked!</div>
                        <div className="font-semibold text-gray-800">
                          {post.achievement.type}: {post.achievement.value}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Post Actions */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.isLiked 
                          ? 'text-red-500' 
                          : 'text-gray-600 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm font-medium">{post.likesCount || 0}</span>
                    </button>
                    <button 
                      onClick={() => setCommentingPostId(commentingPostId === post._id ? null : post._id)}
                      className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.commentsCount || 0}</span>
                    </button>
                    <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 transition-colors">
                      <Share2 className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.shares || 0}</span>
                    </button>
                  </div>

                  {/* Comment Input */}
                  {commentingPostId === post._id && (
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(post._id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleComment(post._id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Post
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )))}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-80 bg-white border-l border-gray-200 p-6">
        {/* User Profile Card */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold">{user?.username || 'Player'}</div>
              <div className="text-purple-100 text-sm flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                FREE
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-all"
          >
            GET PREMIUM
          </button>
        </div>

        {/* Trending Topics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-800">Trending Topics</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
              <div className="font-medium text-gray-800">#SicilianDefense</div>
              <div className="text-sm text-gray-500">234 posts</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
              <div className="font-medium text-gray-800">#EndgameMastery</div>
              <div className="text-sm text-gray-500">189 posts</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer">
              <div className="font-medium text-gray-800">#TacticsTraining</div>
              <div className="text-sm text-gray-500">156 posts</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/dashboard-home')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          <button
            onClick={() => navigate('/lessons')}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-medium"
          >
            <BookOpen className="w-5 h-5" />
            <span>Training Room</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default FeedPage;

