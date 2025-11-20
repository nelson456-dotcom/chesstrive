import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Home,
  BookOpen,
  Users,
  BarChart3,
  User,
  Settings,
  LogOut,
  Trophy,
  Target,
  Zap,
  Brain,
  Crown,
  Shield,
  Eye,
  Swords,
  ChevronRight,
  Calendar,
  TrendingUp,
  Menu,
  X
} from 'lucide-react';
import CoachStudentPanel from './CoachStudentPanel';
import { getApiUrl, getAuthHeaders } from '../config/api';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [todayProgress, setTodayProgress] = useState({
    tactics: { completed: 0, total: 5 },
    blunderPreventer: { completed: 0, total: 6 },
    intuitionTrainer: { completed: 0, total: 1 },
    defender: { completed: 0, total: 1 },
    endgame: { completed: 0, total: 1 },
    visualization: { completed: 0, total: 1 }
  });
  const [loading, setLoading] = useState(true);

  // Fetch daily progress from backend
  useEffect(() => {
    const fetchDailyProgress = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(getApiUrl('daily-progress'), {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.progress) {
            setTodayProgress(data.progress);
          }
        }
      } catch (error) {
        console.error('Error fetching daily progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyProgress();
  }, []);

  const menuItems = [
    { icon: Home, label: 'Home', path: '/dashboard-home', active: true },
    { icon: BookOpen, label: 'Training Room', path: '/lessons' },
    { icon: Users, label: 'Feed', path: '/feed' },
    { icon: BarChart3, label: 'My Statistics', path: '/profile' },
    { icon: Target, label: '40 Game Report', path: '/report/40' }
  ];

  const trainingModules = [
    {
      icon: Target,
      label: 'Tactics',
      path: '/puzzles/random',
      progress: todayProgress.tactics,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      icon: Shield,
      label: 'Blunder Preventer',
      path: '/blunder-preventer',
      progress: todayProgress.blunderPreventer,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    {
      icon: Brain,
      label: 'Intuition Trainer',
      path: '/guess-the-move',
      progress: todayProgress.intuitionTrainer,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      icon: Swords,
      label: 'Defender',
      path: '/defender',
      progress: todayProgress.defender,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      icon: Crown,
      label: 'Endgame',
      path: '/endgame-trainer',
      progress: todayProgress.endgame,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    {
      icon: Eye,
      label: 'Practice visualization',
      path: '/practice-visualisation',
      progress: todayProgress.visualization,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  const calculateTotalProgress = () => {
    const total = Object.values(todayProgress).reduce((sum, item) => sum + item.total, 0);
    const completed = Object.values(todayProgress).reduce((sum, item) => sum + item.completed, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="relative" style={{ width: 28, height: 28 }}>
            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full"
            >
              <rect x="10" y="10" width="35" height="35" rx="4" fill="#3B82F6" />
              <rect x="55" y="10" width="35" height="35" rx="4" fill="#334155" />
              <rect x="10" y="55" width="35" height="35" rx="4" fill="#334155" />
              <rect x="55" y="55" width="35" height="35" rx="4" fill="#2563EB" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 leading-none">ChessStrive</span>
            <span className="text-xs text-gray-600 leading-none mt-0.5">Strive. Improve. Win</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <User className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 lg:z-auto w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative" style={{ width: 28, height: 28 }}>
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <rect x="10" y="10" width="35" height="35" rx="4" fill="#3B82F6" />
                <rect x="55" y="10" width="35" height="35" rx="4" fill="#334155" />
                <rect x="10" y="55" width="35" height="35" rx="4" fill="#334155" />
                <rect x="55" y="55" width="35" height="35" rx="4" fill="#2563EB" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-none">ChessStrive</span>
              <span className="text-xs text-gray-600 leading-none mt-0.5">Strive. Improve. Win</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
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
            onClick={() => {
              navigate('/profile');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => {
              navigate('/profile');
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => {
              handleLogout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2 truncate">
                  Welcome back, {user?.username || 'Player'}!
                </h1>
                <p className="text-sm sm:text-base text-purple-100">
                  Continue your chess journey with today's training
                </p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl font-bold">{calculateTotalProgress()}%</div>
                <div className="text-purple-100 text-xs sm:text-sm">Today's Progress</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto p-4 sm:p-6">
          {/* Link Account Banner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">
                    Link your online chess account to track your gaming performance
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Connect Chess.com or Lichess to get personalized insights
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/report/40')}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all font-medium text-sm sm:text-base whitespace-nowrap"
              >
                Link account
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'daily'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              DAILY PLAN
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-3 sm:px-4 py-2 sm:py-3 font-medium transition-all text-sm sm:text-base whitespace-nowrap ${
                activeTab === 'weekly'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              WEEKLY GOALS
            </button>
          </div>

          {/* Date Selector */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h2>
            <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-2">
              {[...Array(7)].map((_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - 3 + i);
                const isToday = i === 3;
                return (
                  <button
                    key={i}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-medium transition-all text-sm sm:text-base flex-shrink-0 ${
                      isToday
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Progress Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Today's progress</h3>
              <span className="text-xl sm:text-2xl font-bold text-gray-800">
                {calculateTotalProgress()}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${calculateTotalProgress()}%` }}
              />
            </div>
          </div>

          {/* Training Modules Grid */}
          <div className="space-y-4">
            {trainingModules.map((module, index) => {
              const ModuleIcon = module.icon;
              const progressPercent = module.progress.total > 0
                ? Math.round((module.progress.completed / module.progress.total) * 100)
                : 0;

              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => navigate(module.path)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${module.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <ModuleIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${module.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base truncate">{module.label}</h4>
                        <div className="flex items-center gap-2 sm:gap-4">
                          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            {module.progress.completed} / {module.progress.total}
                          </span>
                          <div className="flex-1 min-w-0 bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${module.color} h-2 rounded-full transition-all duration-500`}
                              style={{ width: `${progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-10">
            <CoachStudentPanel />
          </div>
        </div>
      </main>

      {/* Mobile Right Sidebar Overlay */}
      {rightSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setRightSidebarOpen(false)}
        />
      )}

      {/* Right Sidebar */}
      <aside className={`${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0 fixed lg:static inset-y-0 right-0 z-50 lg:z-auto w-80 bg-white border-l border-gray-200 p-4 sm:p-6 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto`}>
        {/* Mobile Close Button */}
        <div className="lg:hidden flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Quick Actions</h3>
          <button
            onClick={() => setRightSidebarOpen(false)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile Card */}
        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm sm:text-base truncate">{user?.username || 'Player'}</div>
              <div className="text-purple-100 text-xs sm:text-sm flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                {user?.userType === 'premium' ? (
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    PREMIUM
                  </span>
                ) : (
                  'FREE'
                )}
              </div>
            </div>
          </div>
          {user?.userType !== 'premium' && (
            <button
              onClick={() => {
                navigate('/pricing');
                setRightSidebarOpen(false);
              }}
              className="w-full bg-white text-purple-600 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-all text-sm sm:text-base"
            >
              GET PREMIUM
            </button>
          )}
        </div>

        {/* Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-800">0</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Streak</div>
        </div>

        {/* Free Lessons */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            <span className="text-xl sm:text-2xl font-bold text-gray-800">15</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">Free lessons</div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2 sm:space-y-3">
          <button
            onClick={() => {
              navigate('/report/40');
              setRightSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-all font-medium text-sm sm:text-base"
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>My statistics</span>
          </button>
          <button
            onClick={() => {
              navigate('/lessons');
              setRightSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm sm:text-base"
          >
            <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Training Room</span>
          </button>
          <button
            onClick={() => {
              navigate('/feed');
              setRightSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm sm:text-base"
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Community Feed</span>
          </button>
        </div>
      </aside>
    </div>
  );
};

export default DashboardHome;

