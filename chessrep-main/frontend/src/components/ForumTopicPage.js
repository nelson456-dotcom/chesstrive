import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RichTextEditor from './RichTextEditor';
import MarkdownRenderer from './MarkdownRenderer';
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  ThumbsUp,
  Send,
  Pin,
  Lock,
  MoreHorizontal,
  User,
  Clock
} from 'lucide-react';

const ForumTopicPage = () => {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [topic, setTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopic();
  }, [topicId]);

  const fetchTopic = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/forum/topics/${topicId}`);
      if (response.ok) {
        const data = await response.json();
        setTopic(data.topic);
      } else {
        alert('Topic not found');
        navigate('/forum');
      }
    } catch (error) {
      console.error('Error fetching topic:', error);
      alert('Error loading topic');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim()) {
      alert('Please write a reply');
      return;
    }

    if (!user) {
      alert('You must be logged in to reply');
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/forum/topics/${topicId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ content: replyContent.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        // Add the new reply to the topic
        setTopic({
          ...topic,
          replies: [...topic.replies, data.reply]
        });
        setReplyContent('');
        alert('Reply posted successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to post reply: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Error posting reply: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeReply = async (replyId) => {
    if (!user) {
      alert('You must be logged in to like');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/forum/topics/${topicId}/reply/${replyId}/like`,
        {
          method: 'POST',
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update the reply likes count
        setTopic({
          ...topic,
          replies: topic.replies.map(reply =>
            reply._id === replyId
              ? { ...reply, likes: Array(data.likesCount).fill({}) }
              : reply
          )
        });
      }
    } catch (error) {
      console.error('Error liking reply:', error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Topic not found</h2>
          <button
            onClick={() => navigate('/forum')}
            className="text-purple-600 hover:text-purple-700"
          >
            Back to Forum
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/forum')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Forum
        </button>

        {/* Topic Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {topic.isPinned && (
                  <Pin className="w-4 h-4 text-purple-600" />
                )}
                {topic.isLocked && (
                  <Lock className="w-4 h-4 text-gray-400" />
                )}
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {topic.category}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">{topic.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="font-medium">{topic.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{getTimeAgo(topic.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  <span>{topic.views} views</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>{topic.replies?.length || 0} replies</span>
                </div>
              </div>
            </div>
          </div>

          {/* Topic Content */}
          <div className="mt-4">
            <MarkdownRenderer content={topic.content} />
          </div>

          {/* Tags */}
          {topic.tags && topic.tags.length > 0 && (
            <div className="flex gap-2 mt-4">
              {topic.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Replies */}
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Replies ({topic.replies?.length || 0})
          </h2>

          {topic.replies && topic.replies.length > 0 ? (
            topic.replies.map((reply, index) => (
              <div
                key={reply._id || index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-800">{reply.username}</span>
                        <span className="text-sm text-gray-500">{getTimeAgo(reply.createdAt)}</span>
                      </div>
                      <button
                        onClick={() => handleLikeReply(reply._id)}
                        className="flex items-center gap-1 text-gray-600 hover:text-purple-600 transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span className="text-sm">{reply.likes?.length || 0}</span>
                      </button>
                    </div>
                    <div className="mt-2">
                      <MarkdownRenderer content={reply.content} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              No replies yet. Be the first to reply!
            </div>
          )}
        </div>

        {/* Reply Form */}
        {!topic.isLocked ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Post a Reply</h3>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <RichTextEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  placeholder="Write your reply... Use formatting buttons for bold, italic, etc."
                  rows={4}
                  disabled={submitting}
                />
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleReply}
                    disabled={submitting || !replyContent.trim()}
                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {submitting ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <Lock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-800 font-medium">This topic is locked</p>
            <p className="text-yellow-600 text-sm">No new replies can be posted</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumTopicPage;

