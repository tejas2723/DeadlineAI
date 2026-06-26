import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Sparkles, BarChart3, Target, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Errors are handled globally by Axios interceptor
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL: Branding & Features (hidden on mobile) */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-indigo-600 to-purple-700 p-12 text-white lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Zap className="h-8 w-8 fill-indigo-200 text-indigo-200 animate-pulse" />
          <span className="text-2xl font-bold tracking-tight text-white">DeadlineAI</span>
        </div>

        {/* Branding Message & Features */}
        <div className="my-auto max-w-lg space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight">
              Stop missing deadlines.<br />Start shipping.
            </h1>
            <p className="text-indigo-100 text-lg">
              Manage your tasks with real-time AI prioritizations and analytics designed for high-performance builders.
            </p>
          </div>

          {/* Feature list */}
          <ul className="space-y-4 text-base text-indigo-100">
            <li className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="h-5 w-5 text-indigo-200" />
              </div>
              <div>
                <span className="font-semibold text-white">AI-powered task prioritization</span>
                <p className="text-sm text-indigo-200">Automatically rank tasks using Gemini 2.5 Pro.</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <BarChart3 className="h-5 w-5 text-indigo-200" />
              </div>
              <div>
                <span className="font-semibold text-white">Visual progress tracking</span>
                <p className="text-sm text-indigo-200">See your weekly completion rate with analytics.</p>
              </div>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Target className="h-5 w-5 text-indigo-200" />
              </div>
              <div>
                <span className="font-semibold text-white">Smart deadline reminders</span>
                <p className="text-sm text-indigo-200">Get warnings on critical risk overlaps.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Quote */}
        <div className="border-t border-white/10 pt-6">
          <p className="italic text-indigo-200">
            "The secret of getting ahead is getting started."
          </p>
          <span className="mt-1 block text-sm font-semibold text-white">— Mark Twain</span>
        </div>
      </div>

      {/* RIGHT PANEL: Login Form */}
      <div className="flex w-full items-center justify-center bg-slate-50 p-6 sm:p-12 lg:w-1/2">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl shadow-slate-100 border border-slate-100">
          <div className="space-y-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 lg:hidden">
              <Zap className="h-6 w-6 text-indigo-600 fill-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to your DeadlineAI account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Email field */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white transition-all text-slate-900"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white transition-all text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" color="white" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div className="text-center text-sm">
            <span className="text-slate-500">Don't have an account? </span>
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
