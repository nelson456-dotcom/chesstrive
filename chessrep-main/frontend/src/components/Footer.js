import React from 'react';
import { Link } from 'react-router-dom';
import { Crown, Github, Twitter, Mail, Heart, Shield, BookOpen, Target } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-t from-slate-900 via-blue-900 to-slate-800 text-white border-t border-blue-500/20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                ChessStrive
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Your ultimate chess training platform. Master openings, solve puzzles, and elevate your game with cutting-edge tools and analysis.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Training Tools */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Training Tools</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/openings" className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Opening Trainer</span>
                </Link>
              </li>
              <li>
                <Link to="/puzzle-trainer-intro" className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span>Tactical Puzzles</span>
                </Link>
              </li>
              <li>
                <Link to="/live-analysis" className="text-gray-300 hover:text-white transition-colors text-sm flex items-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Live Analysis</span>
                </Link>
              </li>
              <li>
                <Link to="/lessons" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Training Room
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/blunder-preventer-intro" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Blunder Preventer
                </Link>
              </li>
              <li>
                <Link to="/practice-visualisation-intro" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Visualization Practice
                </Link>
              </li>
              <li>
                <Link to="/report/40" className="text-gray-300 hover:text-white transition-colors text-sm">
                  40 Game Report
                </Link>
              </li>
              <li>
                <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-300">Account & Support</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-white transition-colors text-sm">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/signup" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Sign Up
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">
                  Help & Support
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-blue-500/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            <div className="flex items-center space-x-2 text-gray-400 text-sm mb-4 md:mb-0">
              <span>&copy; {new Date().getFullYear()} ChessStrive. All rights reserved.</span>
              <span className="hidden md:inline">|</span>
              <span className="flex items-center space-x-1">
                <span>Made with</span>
                <Heart className="w-4 h-4 text-red-400" />
                <span>for chess players</span>
              </span>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
              <Link 
                to="/privacy-policy" 
                className="text-gray-400 hover:text-white transition-colors cursor-pointer relative z-10"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className="text-gray-400 hover:text-white transition-colors cursor-pointer relative z-10"
              >
                Terms of Service
              </Link>
              <Link 
                to="/contact" 
                className="text-gray-400 hover:text-white transition-colors cursor-pointer relative z-10"
              >
                Contact
              </Link>
              <Link 
                to="/about" 
                className="text-gray-400 hover:text-white transition-colors cursor-pointer relative z-10"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


