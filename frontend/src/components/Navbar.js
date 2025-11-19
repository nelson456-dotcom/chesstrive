import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Crown, Zap, Brain, Target, BarChart3, User, LogOut, BookOpen, DollarSign, Info, Mail, LayoutDashboard } from 'lucide-react';
import ChessStriveLogo from './ChessStriveLogo';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Crown className="w-4 h-4" /> },
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Lessons', path: '/lessons', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <BarChart3 className="w-4 h-4" /> },
    { name: 'Pricing', path: '/pricing', icon: <DollarSign className="w-4 h-4" /> },
    { name: 'About Us', path: '/about', icon: <Info className="w-4 h-4" /> },
    { name: 'Contact', path: '/contact', icon: <Mail className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-gradient-to-r from-slate-900/90 via-blue-900/90 to-slate-800/90 shadow-2xl fixed top-0 w-full z-50 backdrop-blur-sm border-b border-blue-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-white font-bold text-lg sm:text-xl hover:text-blue-300 transition-colors">
              <ChessStriveLogo size={28} />
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      location.pathname === link.path
                        ? 'bg-blue-600/80 text-white shadow-lg backdrop-blur-sm'
                        : 'text-gray-300 hover:bg-blue-500/20 hover:text-white hover:shadow-md'
                    }`}
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-blue-500/20"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-blue-500/20"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-4 pt-4 pb-6 space-y-2 bg-gradient-to-b from-slate-900 to-blue-900 border-t border-blue-500/30 backdrop-blur-sm">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                  location.pathname === link.path
                    ? 'bg-blue-600/80 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-blue-500/20 hover:text-white'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            <div className="border-t border-blue-500/30 pt-4 mt-4">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-4 py-3 rounded-lg text-base font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 shadow-lg transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 
