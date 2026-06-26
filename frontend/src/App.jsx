import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Analytics from './pages/Analytics';
import AIAdvisor from './pages/AIAdvisor';
import Opportunities from './pages/Opportunities';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in AppLayout */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <AppLayout pageTitle="Dashboard">
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <PrivateRoute>
                <AppLayout pageTitle="Tasks">
                  <Tasks />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRoute>
                <AppLayout pageTitle="Analytics">
                  <Analytics />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <PrivateRoute>
                <AppLayout pageTitle="Opportunities">
                  <Opportunities />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/ai-advisor"
            element={
              <PrivateRoute>
                <AppLayout pageTitle="AI Advisor">
                  <AIAdvisor />
                </AppLayout>
              </PrivateRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthProvider>
  );
};

export default App;
