import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verify auth session on mount
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('deadlineai_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (error) {
          console.error('Session verification failed, clearing tokens:', error);
          localStorage.removeItem('deadlineai_token');
        }
      }
      setLoading(false);
    };
    verifySession();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, token } = res.data;
      localStorage.setItem('deadlineai_token', token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Registration handler
  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const { user: userData, token } = res.data;
      localStorage.setItem('deadlineai_token', token);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('deadlineai_token');
    setUser(null);
  };

  // Preference / Profile updater callback
  const updateUser = (userData) => {
    setUser((prev) => {
      if (!prev) return null;
      return { ...prev, ...userData };
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
