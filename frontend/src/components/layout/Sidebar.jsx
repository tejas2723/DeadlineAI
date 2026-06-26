import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, LayoutDashboard, CheckSquare, BarChart2, Sparkles, LogOut, X, Briefcase } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * Sidebar component handles main navigation options on desktop and mobile.
 */
const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', path: '/tasks', icon: CheckSquare },
    { label: 'Analytics', path: '/analytics', icon: BarChart2 },
    { label: 'AI Advisor', path: '/ai-advisor', icon: Sparkles },
    { label: 'Opportunities', path: '/opportunities', icon: Briefcase },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-40 transition-transform duration-300 md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header/Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-indigo-600 fill-indigo-600" />
          <span className="text-xl font-bold tracking-tight text-slate-900">DeadlineAI</span>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden focus:outline-none"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Menu Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-7">
        <div className="space-y-2">
          <span className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Menu
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Profile Section */}
      {user && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
              {getInitials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors focus:outline-none"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
