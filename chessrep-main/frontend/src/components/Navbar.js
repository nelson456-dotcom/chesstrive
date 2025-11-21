import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Menu, X, Crown, User, LogOut, Bell, ChevronDown } from 'lucide-react';
import { collaborationService } from '../services/collaborationService';
import NotificationCenter from './NotificationCenter';
import MegaMenu from './ui/mega-menu';
import ChessStriveLogo from './ChessStriveLogo';
import {
  Target,
  BookOpen,
  Trophy,
  Brain,
  Clock,
  Zap,
  Eye,
  Shield,
  RefreshCw,
  Settings,
  HelpCircle,
  Mail,
  DollarSign,
  Info,
  LayoutDashboard,
  BarChart2,
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const notificationButtonRef = useRef(null);
  const [expandedMenus, setExpandedMenus] = useState({});

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleMenu = () => {
    console.log('Toggle menu clicked, current state:', isOpen);
    const newState = !isOpen;
    setIsOpen(newState);
    // Prevent body scroll when menu is open
    if (newState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const toggleSubMenuSection = (id) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Close mobile menu and restore scrolling on route change
  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
      document.body.style.overflow = '';
    }
    // Also ensure overflow is reset whenever path changes
    return () => {
      document.body.style.overflow = '';
    };
  }, [location.pathname]); 


  // Load unread notification count
  const loadUnreadNotificationCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await collaborationService.getUnreadNotificationCount();
      if (response.success) {
        setUnreadNotificationCount(response.count);
      }
    } catch (error) {
      console.error('Error loading unread notification count:', error);
    }
  }, [user]);

  // Load notification count on mount and when user changes
  useEffect(() => {
    loadUnreadNotificationCount();
    
    // Set up polling for notifications every 30 seconds
    const interval = setInterval(loadUnreadNotificationCount, 30000);
    
    return () => clearInterval(interval);
  }, [loadUnreadNotificationCount]);

  // Click-outside handler for notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        notificationButtonRef.current &&
        !notificationButtonRef.current.contains(event.target) &&
        !event.target.closest('.notification-center-container')
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const megaMenuItems = [
    {
      id: 1,
      label: "Training",
      subMenus: [
        {
          title: "Core Modules",
          items: [
            {
              label: "Tactical Training",
              description: "Master chess tactics and combinations",
              icon: Target,
              link: "/puzzle-trainer-intro"
            },
            {
              label: "Endgame Mastery",
              description: "Learn essential endgame techniques",
              icon: Trophy,
              link: "/endgame-trainer-intro"
            },
            {
              label: "Guess the Move",
              description: "Practice master games move by move",
              icon: Eye,
              link: "/guess-the-move-intro"
            },
            {
              label: "Opening Theory",
              description: "Build your opening repertoire",
              icon: BookOpen,
              link: "/openings"
            },
            {
              label: "Blunder Prevention",
              description: "Identify and avoid common mistakes",
              icon: Shield,
              link: "/blunder-preventer-intro"
            },
          ],
        },
        {
          title: "Advanced Training",
          items: [
            {
              label: "Bot Training",
              description: "Practice against AI opponents",
              icon: Brain,
              link: "/play-with-bot-intro"
            },
            {
              label: "Advantage Conversion",
              description: "Learn to convert winning positions",
              icon: Zap,
              link: "/advantage-capitalisation-intro"
            },
            {
              label: "Defender",
              description: "Master defensive chess techniques and protect your position",
              icon: Shield,
              link: "/defender-intro"
            },
            {
              label: "Visualization",
              description: "Improve board visualization skills",
              icon: Eye,
              link: "/practice-visualisation-intro"
            },
            {
              label: "Time Management",
              description: "Master time control strategies",
              icon: Clock,
              link: "/puzzle-rush-intro"
            },
          ],
        },
      ],
    },
    {
      id: 2,
      label: "Resources",
      subMenus: [
        {
          title: "Learning",
          items: [
            {
              label: "Chess Lessons",
              description: "Structured learning paths",
              icon: BookOpen,
              link: "/lessons"
            },
          ],
        },
        {
          title: "Analysis Tools",
          items: [
            {
              label: "Board Editor",
              description: "Create custom positions",
              icon: Settings,
              link: "/board-editor"
            },
            {
              label: "Analysis",
              description: "Chess position analysis and evaluation",
              icon: BarChart2,
              link: "/analysis"
            },
            {
              label: "40-Game Report",
              description: "Comprehensive performance analysis",
              icon: RefreshCw,
              link: "/report/40"
            },
          ],
        },
      ],
    },
    {
      id: 3,
      label: "Platform",
      subMenus: [
        {
          title: "Support",
          items: [
            {
              label: "Help Center",
              description: "Get help and tutorials",
              icon: HelpCircle,
              link: "/contact"
            },
            {
              label: "Contact Us",
              description: "Reach out to our team",
              icon: Mail,
              link: "/contact"
            },
            {
              label: "About ChessStrive",
              description: "Learn about our mission",
              icon: Info,
              link: "/about"
            },
          ],
        },
      ],
    },
    { id: 4, label: "Dashboard", link: "/dashboard" },
    { id: 5, label: "Pricing", link: "/pricing" },
    { id: 6, label: "About", link: "/about" },
    { id: 7, label: "Contact", link: "/contact" },
  ];

  // Mobile menu content
  const mobileMenuContent = isOpen ? (
    <>
      <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={toggleMenu}></div>
      <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-50 overflow-hidden bg-gradient-to-b from-slate-900 to-blue-900 shadow-2xl">
        <div className="h-full overflow-y-auto px-4 pt-4 pb-6 space-y-2 border-t border-blue-500/30 backdrop-blur-sm">
          {megaMenuItems.map((section) => (
            <div key={section.id} className="bg-white/5 border border-white/10 rounded-lg">
              {section.subMenus ? (
                <>
                  <button
                    onClick={() => toggleSubMenuSection(section.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-base font-medium text-gray-200 hover:text-white"
                  >
                    <span>{section.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${expandedMenus[section.id] ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {expandedMenus[section.id] && (
                    <div className="space-y-3 pb-4">
                      {section.subMenus.map((group) => (
                        <div key={group.title} className="px-4">
                          <p className="text-xs uppercase tracking-wide text-gray-400 mb-2">
                            {group.title}
                          </p>
                          <div className="space-y-2">
                            {group.items.map((item) => {
                              const isExternal = item.link?.startsWith('http://') || item.link?.startsWith('https://');
                              const linkProps = isExternal
                                ? { href: item.link, target: "_blank", rel: "noopener noreferrer" }
                                : { to: item.link };
                              const LinkComponent = isExternal ? 'a' : Link;
                              return (
                                <LinkComponent
                                  key={item.label}
                                  {...linkProps}
                                  onClick={() => setIsOpen(false)}
                                  className="flex items-start space-x-3 rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
                                >
                                  <item.icon className="h-4 w-4 mt-0.5 text-blue-300" />
                                  <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-xs text-gray-400">{item.description}</p>
                                  </div>
                                </LinkComponent>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link
                  to={section.link}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center space-x-3 px-4 py-3 text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all rounded-lg"
                >
                  <span>{section.label}</span>
                </Link>
              )}
            </div>
          ))}
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
            onClick={() => setIsOpen(false)}
          >
            <Crown className="w-4 h-4" />
            <span>Home</span>
          </Link>
          <Link
            to="/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
            onClick={() => setIsOpen(false)}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/lessons"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
            onClick={() => setIsOpen(false)}
          >
            <BookOpen className="w-4 h-4" />
            <span>Lessons</span>
          </Link>
          <Link
            to="/pricing"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
            onClick={() => setIsOpen(false)}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pricing</span>
          </Link>
          <Link
            to="/about"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
            onClick={() => setIsOpen(false)}
          >
            <Info className="w-4 h-4" />
            <span>About Us</span>
          </Link>
          <Link
            to="/contact"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
            onClick={() => setIsOpen(false)}
          >
            <Mail className="w-4 h-4" />
            <span>Contact</span>
          </Link>
          <div className="border-t border-blue-500/30 pt-4 mt-4">
            {user ? (
              <>
                {user.userType === 'premium' ? (
                  <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 mb-2">
                    <Crown className="w-4 h-4" />
                    <span className="font-semibold">Premium Member</span>
                  </div>
                ) : (
                  <Link
                    to="/upgrade"
                    className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 font-semibold mb-2 hover:from-yellow-500 hover:to-orange-600 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <Crown className="w-4 h-4" />
                    <span>Upgrade to Premium</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setIsOpen(false);
                  }}
                  className="relative flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium text-gray-300 hover:bg-blue-500/20 hover:text-white transition-all"
                >
                  <Bell className="w-4 h-4" />
                  <span>Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>
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
    </>
  ) : null;

  return (
    <nav className="bg-gradient-to-r from-slate-900/90 via-blue-900/90 to-slate-800/90 shadow-2xl fixed top-0 w-full z-50 backdrop-blur-sm border-b border-blue-500/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center flex-shrink-0 min-w-[200px]">
            <Link to="/" className="hover:opacity-80 transition-opacity flex-shrink-0">
              <ChessStriveLogo size={48} />
            </Link>
            {/* Mega Menu - Desktop Only */}
            <div className="hidden lg:block ml-10">
              <MegaMenu items={megaMenuItems} />
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden md:block flex-1">
            <div className="ml-4 flex items-center md:ml-6">
              {user ? (
                <div className="flex items-center space-x-3">
                  {/* Premium Badge or Upgrade Button */}
                  {user.userType === 'premium' ? (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-3 py-1.5 rounded-lg text-sm font-semibold">
                      <Crown className="w-4 h-4" />
                      <span>Premium</span>
                    </div>
                  ) : (
                    <Link
                      to="/upgrade"
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg hover:shadow-xl"
                    >
                      <Crown className="w-4 h-4" />
                      <span>Upgrade</span>
                    </Link>
                  )}
                  
                  {/* Notifications Button */}
                  <button
                    ref={notificationButtonRef}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative flex items-center space-x-2 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-blue-500/20"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Notifications</span>
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  
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
          <div className="md:hidden flex-shrink-0 ml-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMenu();
              }}
              className="inline-flex items-center justify-center p-2 rounded-md bg-white text-slate-900 shadow-lg shadow-black/20 border border-white/40 hover:bg-blue-100 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400 flex-shrink-0 z-50 relative"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              type="button"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu - rendered via portal */}
      {typeof window !== 'undefined' && mobileMenuContent && createPortal(mobileMenuContent, document.body)}

      {/* Notification Center Modal */}
      {showNotifications && (
        <NotificationCenter
          onClose={() => setShowNotifications(false)}
          className="notification-center-container"
        />
      )}

    </nav>
  );
};

export default Navbar; 
