import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Trash2,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Search,
  BarChart3,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertCircle,
  Activity,
  Database,
  Server,
  UserPlus,
  Clock
} from 'lucide-react';

const AdminPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/');
        return;
      }
      
      // Fetch fresh user data to check role
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:3001/api/auth/me', {
          headers: {
            'x-auth-token': token
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          if (userData.role !== 'admin') {
            alert('Access denied. Admin privileges required.');
            navigate('/');
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/');
      }
    };
    
    checkAdmin();
  }, [user, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  // Fetch users
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab, searchTerm]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:3001/api/admin/users?search=${searchTerm}&limit=100`,
        {
          headers: {
            'x-auth-token': token
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Fetched users:', data.users); // Debug log
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', response.status);
        alert('Failed to fetch users. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error fetching users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        alert('User deleted successfully');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error deleting user');
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'x-auth-token': token
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to ban/unban user');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert('Error banning user');
    }
  };

  const handleMakeAdmin = async (userId) => {
    if (!window.confirm('Are you sure you want to make this user an admin?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ role: 'admin' })
      });

      if (response.ok) {
        alert('User promoted to admin');
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error updating user role');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, content, and platform settings</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5 inline mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === 'users'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-5 h-5 inline mr-2" />
            Users
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            {/* System Status Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 mb-8 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Server className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">System Status: Online</h2>
                    <p className="text-green-100">All services operational</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <div className="text-green-100">Active Users</div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <UserPlus className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalUsers}</div>
                <div className="text-sm text-gray-600 mb-2">Total Users</div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-green-600 font-medium">+{stats.newUsers} this week</div>
                  <div className="text-xs text-gray-400">|</div>
                  <div className="text-xs text-gray-500">{Math.round((stats.newUsers / stats.totalUsers) * 100)}% growth</div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalPosts}</div>
                <div className="text-sm text-gray-600 mb-2">Total Posts</div>
                <div className="text-xs text-gray-500">Community engagement</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <MessageSquare className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalTopics}</div>
                <div className="text-sm text-gray-600 mb-2">Forum Topics</div>
                <div className="text-xs text-gray-500">Active discussions</div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <Clock className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {stats.totalUsers > 0 ? Math.round((stats.newUsers / stats.totalUsers) * 100) : 0}%
                </div>
                <div className="text-sm text-gray-600 mb-2">Weekly Growth</div>
                <div className="text-xs text-gray-500">User acquisition rate</div>
              </div>
            </div>

            {/* Database Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Database className="w-6 h-6 text-purple-600" />
                <h3 className="text-xl font-semibold text-gray-800">Database Overview</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
                  <div className="text-sm text-gray-600">Users Collection</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalPosts}</div>
                  <div className="text-sm text-gray-600">Posts Collection</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.totalTopics}</div>
                  <div className="text-sm text-gray-600">Topics Collection</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.totalUsers + stats.totalPosts + stats.totalTopics}
                  </div>
                  <div className="text-sm text-gray-600">Total Documents</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Posts</h3>
                <div className="space-y-3">
                  {stats.recentPosts?.map((post, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-800">{post.username}</div>
                      <div className="text-sm text-gray-600 truncate">{post.content}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Forum Topics</h3>
                <div className="space-y-3">
                  {stats.recentTopics?.map((topic, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-800">{topic.title}</div>
                      <div className="text-sm text-gray-600">by {topic.username}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                          {topic.category}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(topic.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rating
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-800">{u.username}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {u.rating || 1200}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {u.banned ? (
                              <span className="flex items-center text-red-600 text-sm">
                                <XCircle className="w-4 h-4 mr-1" />
                                Banned
                              </span>
                            ) : (
                              <span className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Active
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {u.role !== 'admin' && (
                                <>
                                  <button
                                    onClick={() => handleBanUser(u._id)}
                                    className="text-orange-600 hover:text-orange-700"
                                    title={u.banned ? 'Unban' : 'Ban'}
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMakeAdmin(u._id)}
                                    className="text-purple-600 hover:text-purple-700"
                                    title="Make Admin"
                                  >
                                    <Shield className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteUser(u._id)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

