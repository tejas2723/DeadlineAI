import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, Search, Bell, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';

/**
 * Navbar component for mobile hamburger toggles, titles, global search, and user profile menus.
 */
const Navbar = ({ onMenuToggle, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);

  const dropdownRef = useRef(null);

  // Fetch task stats periodically to update the notification bell overdue badge
  useEffect(() => {
    const fetchOverdueCount = async () => {
      try {
        const res = await api.get('/tasks/stats');
        setOverdueCount(res.data.overdue || 0);
      } catch (err) {
        console.error('Navbar failed to load stats context:', err);
      }
    };
    if (user) {
      fetchOverdueCount();
    }
  }, [user]);

  // Click outside listener to dismiss the avatar dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="fixed top-0 left-0 right-0 md:left-64 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 z-30">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-slate-900 md:hidden focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-bold text-slate-900 md:text-xl">{pageTitle}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search bar expander */}
        <div className="relative flex items-center">
          {searchOpen && (
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mr-2 w-40 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-slate-800 focus:border-transparent focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all md:w-56"
              autoFocus
            />
          )}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-slate-900 focus:outline-none transition-colors"
          >
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
        </div>

        {/* Notifications Icon (Bell) */}
        <div className="relative">
          <button className="relative rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-slate-900 focus:outline-none transition-colors">
            <Bell className="h-5 w-5" />
            {overdueCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                {overdueCount}
              </span>
            )}
          </button>
        </div>

        {/* User profile avatar and dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm shadow hover:bg-indigo-700 transition-colors focus:outline-none"
            >
              {getInitials(user.name)}
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50 border border-slate-100">
                <div className="border-b border-gray-100 px-4 py-2.5 text-xs text-gray-500">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="truncate mt-0.5">{user.email}</p>
                </div>
                <div className="py-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Preferences
                  </Link>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
