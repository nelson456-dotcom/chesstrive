import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Statistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [timeRange, setTimeRange] = useState('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/stats`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeRange]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!stats) {
    return <div className="text-center text-gray-600">No statistics available</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Statistics Dashboard</h1>
      
      {/* Time Range Selector */}
      <div className="mb-8">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
          <option value="all">All Time</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Practice Time</h3>
          <p className="text-2xl font-bold">{formatDistanceToNow(new Date(Date.now() - stats.totalTimeSpent))}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Success Rate</h3>
          <p className="text-2xl font-bold">{stats.successRate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Openings Practiced</h3>
          <p className="text-2xl font-bold">{stats.totalOpenings}</p>
        </div>
      </div>

      {/* Time Spent Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-semibold mb-4">Time Spent per Opening</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.timePerOpening}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="time" fill="#8884d8" name="Time Spent (minutes)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Success Rate Chart */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-semibold mb-4">Success Rate per Opening</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.successRatePerOpening}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="rate" stroke="#8884d8" name="Success Rate (%)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-xl font-semibold mb-4">Common Mistakes</h3>
        <div className="space-y-4">
          {stats.commonMistakes.map((mistake, index) => (
            <div key={index} className="border-b pb-4">
              <h4 className="font-semibold">{mistake.opening}</h4>
              <p className="text-gray-600">{mistake.description}</p>
              <p className="text-sm text-gray-500 mt-2">Frequency: {mistake.frequency}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {stats.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-4">
              <div>
                <p className="font-semibold">{activity.opening}</p>
                <p className="text-sm text-gray-600">{activity.type}</p>
              </div>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(activity.timestamp))} ago
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Statistics; 
