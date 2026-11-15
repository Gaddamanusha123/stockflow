import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('stockflow_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem('stockflow_user');
      return null;
    }
  });

  const [organization, setOrganization] = useState(() => {
    try {
      const saved = localStorage.getItem('stockflow_org');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch (e) {
      localStorage.removeItem('stockflow_org');
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('stockflow_access_token');
    return (saved && saved !== 'undefined' && saved !== 'null') ? saved : null;
  });

  const [loading, setLoading] = useState(true);

  const performLogout = () => {
    localStorage.removeItem('stockflow_access_token');
    localStorage.removeItem('stockflow_refresh_token');
    localStorage.removeItem('stockflow_user');
    localStorage.removeItem('stockflow_org');
    setUser(null);
    setOrganization(null);
    setToken(null);
  };

  // Sync user and organization data on mount if token is present
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_access_token');
      if (storedToken && storedToken !== 'undefined' && storedToken !== 'null') {
        try {
          const profile = await authAPI.getProfile();
          if (isMounted) {
            const userData = { id: profile.id, email: profile.email };
            const orgData = profile.organization;
            setUser(userData);
            setOrganization(orgData);
            localStorage.setItem('stockflow_user', JSON.stringify(userData));
            localStorage.setItem('stockflow_org', JSON.stringify(orgData));
          }
        } catch (err) {
          console.error('Session validation error:', err);
          if (isMounted) {
            performLogout();
          }
        }
      } else {
        if (isMounted) {
          performLogout();
        }
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const data = await authAPI.login(credentials);
    const userData = data.user;
    const orgData = data.organization || data.user?.organization || null;
    const tokens = data.tokens;

    if (tokens?.access) {
      localStorage.setItem('stockflow_access_token', tokens.access);
      localStorage.setItem('stockflow_refresh_token', tokens.refresh || '');
    }
    if (userData) {
      localStorage.setItem('stockflow_user', JSON.stringify(userData));
    }
    if (orgData) {
      localStorage.setItem('stockflow_org', JSON.stringify(orgData));
    }

    setUser(userData);
    setOrganization(orgData);
    setToken(tokens?.access || null);
    return data;
  };

  const signup = async (formData) => {
    const data = await authAPI.signup(formData);
    const userData = data.user;
    const orgData = data.organization || data.user?.organization || null;
    const tokens = data.tokens;

    if (tokens?.access) {
      localStorage.setItem('stockflow_access_token', tokens.access);
      localStorage.setItem('stockflow_refresh_token', tokens.refresh || '');
    }
    if (userData) {
      localStorage.setItem('stockflow_user', JSON.stringify(userData));
    }
    if (orgData) {
      localStorage.setItem('stockflow_org', JSON.stringify(orgData));
    }

    setUser(userData);
    setOrganization(orgData);
    setToken(tokens?.access || null);
    return data;
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('stockflow_refresh_token');
    if (refreshToken && refreshToken !== 'undefined') {
      try {
        await authAPI.logout(refreshToken);
      } catch (e) {
        // Ignore logout errors
      }
    }
    performLogout();
  };

  const updateOrganization = (newOrgData) => {
    setOrganization(newOrgData);
    if (newOrgData) {
      localStorage.setItem('stockflow_org', JSON.stringify(newOrgData));
    }
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

