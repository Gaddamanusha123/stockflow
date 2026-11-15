import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [organization, setOrganization] = useState(() => {
    const saved = localStorage.getItem('stockflow_org');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockflow_access_token'));
  const [loading, setLoading] = useState(true);

  // Sync user and organization data on mount if token is present
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_access_token');
      if (storedToken) {
        try {
          const profile = await authAPI.getProfile();
          setUser({ id: profile.id, email: profile.email });
          setOrganization(profile.organization);
          localStorage.setItem('stockflow_user', JSON.stringify({ id: profile.id, email: profile.email }));
          localStorage.setItem('stockflow_org', JSON.stringify(profile.organization));
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    const { user: userData, organization: orgData, tokens } = data;
    
    localStorage.setItem('stockflow_access_token', tokens.access);
    localStorage.setItem('stockflow_refresh_token', tokens.refresh);
    localStorage.setItem('stockflow_user', JSON.stringify(userData));
    localStorage.setItem('stockflow_org', JSON.stringify(orgData));

    setUser(userData);
    setOrganization(orgData);
    setToken(tokens.access);
    return data;
  };

  const signup = async (formData) => {
    const data = await authAPI.signup(formData);
    const { user: userData, organization: orgData, tokens } = data;

    localStorage.setItem('stockflow_access_token', tokens.access);
    localStorage.setItem('stockflow_refresh_token', tokens.refresh);
    localStorage.setItem('stockflow_user', JSON.stringify(userData));
    localStorage.setItem('stockflow_org', JSON.stringify(orgData));

    setUser(userData);
    setOrganization(orgData);
    setToken(tokens.access);
    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('stockflow_refresh_token');
    if (refreshToken) {
      await authAPI.logout(refreshToken);
    }
    localStorage.removeItem('stockflow_access_token');
    localStorage.removeItem('stockflow_refresh_token');
    localStorage.removeItem('stockflow_user');
    localStorage.removeItem('stockflow_org');
    setUser(null);
    setOrganization(null);
    setToken(null);
  };

  const updateOrganization = (newOrgData) => {
    setOrganization(newOrgData);
    localStorage.setItem('stockflow_org', JSON.stringify(newOrgData));
  };

  const value = {
    user,
    organization,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    signup,
    logout,
    updateOrganization,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

