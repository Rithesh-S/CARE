import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('spillit_admin_token');
    const savedUser = localStorage.getItem('spillit_admin_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async ({ email, id_token, name }) => {
    try {
      const response = await client.post('/api/auth/google', {
        email,
        id_token,
        name
      });

      if (response.data.success) {
        const { token: newToken, user: userData } = response.data;
        
        // For admin portal, ensure user is strictly ADMIN
        if (userData.role !== 'ADMIN') {
          throw new Error('Access denied. This portal is strictly restricted to the designated Campus Administrator configured in environment.');
        }

        setToken(newToken);
        setUser(userData);
        localStorage.setItem('spillit_admin_token', newToken);
        localStorage.setItem('spillit_admin_user', JSON.stringify(userData));
        return { success: true, user: userData };
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('spillit_admin_token');
    localStorage.removeItem('spillit_admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!token }}>
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
