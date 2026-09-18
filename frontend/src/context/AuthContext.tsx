import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { message } from 'antd';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'project_director' | 'procurement_manager' | 'site_engineer' | 'finance_controller' | 'vendor';
  designation?: string;
  avatar?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchPersona: (roleKey: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_PERSONAS = [
  {
    key: 'director',
    name: 'Meena Iyer',
    role: 'project_director',
    title: 'Project Director',
    email: 'meena.director@constructsync.in',
    tag: 'Portfolio Approver (>₹1L)',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'procurement',
    name: 'Rajesh Sharma',
    role: 'procurement_manager',
    title: 'Procurement Mgr',
    email: 'rajesh.procurement@constructsync.in',
    tag: 'POs & Quotes (<₹1L)',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'site',
    name: 'Ankit Verma',
    role: 'site_engineer',
    title: 'Site Engineer',
    email: 'ankit.site@constructsync.in',
    tag: 'Site Indents & GRN',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'finance',
    name: 'Pooja Agarwal',
    role: 'finance_controller',
    title: 'Finance Controller',
    email: 'finance@constructsync.in',
    tag: '3-Way Match & GST/TDS',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  },
  {
    key: 'admin',
    name: 'System Admin',
    role: 'admin',
    title: 'Administrator',
    email: 'admin@constructsync.in',
    tag: 'Full Access',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('constructsync_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('constructsync_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Session restore failed:', err);
          localStorage.removeItem('constructsync_token');
          setToken(null);
          // Default to Meena (Project Director) for immediate rich view
          await autoLoginDefault();
        }
      } else {
        await autoLoginDefault();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const autoLoginDefault = async () => {
    try {
      const res = await api.post('/auth/login', {
        email: 'meena.director@constructsync.in',
        password: 'Password@123',
      });
      localStorage.setItem('constructsync_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
    } catch (e) {
      console.error('Auto login default failed:', e);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('constructsync_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      message.success(`Logged in as ${res.data.user.name} (${res.data.user.role})`);
      return true;
    } catch (err: any) {
      message.error(err.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('constructsync_token');
    setToken(null);
    setUser(null);
    message.info('Logged out');
  };

  const switchPersona = async (roleKey: string) => {
    const target = DEMO_PERSONAS.find((p) => p.key === roleKey || p.role === roleKey);
    if (!target) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: target.email,
        password: 'Password@123',
      });
      localStorage.setItem('constructsync_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      message.success(`Switched role to: ${target.name} (${target.title})`);
    } catch (err) {
      message.error('Failed to switch persona');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchPersona }}>
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
