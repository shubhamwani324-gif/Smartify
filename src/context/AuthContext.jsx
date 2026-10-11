// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('smartify_token') || localStorage.getItem('gharva_token') || null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid token.');
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('smartify_token', data.token);
    localStorage.setItem('gharva_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);
    return data;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem('smartify_token', data.token);
    localStorage.setItem('gharva_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setIsAuthModalOpen(false);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('smartify_token');
    localStorage.removeItem('gharva_token');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user && user.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
