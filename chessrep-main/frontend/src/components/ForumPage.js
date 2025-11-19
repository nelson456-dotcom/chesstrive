import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from './RichTextEditor';
import {
  MessageSquare,
  Plus,
  Eye,
  MessageCircle,
  Pin,
  Lock,
  Search,
  Filter
} from 'lucide-react';

const ForumPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', category: 'General', content: '' });

  const categories = ['All', 'General', 'Openings', 'Tactics', 'Endgames', 'Strategy', 'Analysis', 'Help', 'Off-Topic'];

  useEffect(() => {
    fetchTopics();
  }, [selectedCategory]);

  const fetchTopics = async () => {
    try {
      const url = selectedCategory === 'All' 
        ? 'http://localhost:3001/api/forum/topics'
        : `http://localhost:3001/api/forum/topics?category=${selectedCategory}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopic.title.trim() || !newTopic.content.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/forum/topics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(newTopic)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTopic({ title: '', category: 'General', content: '' });
        fetchTopics();
      }
    } catch (error) {
      console.error('Error creating topic:', error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Community Forum</h1>
            <p className="text-gray-600">Discuss chess strategies, openings, and more</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all font-medium shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Topic
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Topics List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading topics...</div>
          ) : topics.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No topics yet. Start a discussion!</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {topics.map((topic) => (
                <div
                  key={topic._id}
                  onClick={() => navigate(`/forum/topic/${topic._id}`)}
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {topic.isPinned && <Pin className="w-4 h-4 text-purple-600" />}
                        {topic.isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                        <h3 className="text-lg font-semibold text-gray-800 hover:text-purple-600">
                          {topic.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{topic.username}</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                          {topic.category}
                        </span>
                        <span>{getTimeAgo(topic.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {topic.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {topic.repliesCount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Topic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Create New Topic</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter topic title..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={newTopic.category}
                  onChange={(e) => setNewTopic({ ...newTopic, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {categories.filter(c => c !== 'All').map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <RichTextEditor
                  value={newTopic.content}
                  onChange={(content) => setNewTopic({ ...newTopic, content })}
                  placeholder="Write your post... Use formatting buttons for bold, italic, etc."
                  rows={6}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTopic}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                Create Topic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumPage;

