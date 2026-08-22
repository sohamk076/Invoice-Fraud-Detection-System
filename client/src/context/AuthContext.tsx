import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authService } from '../services/auth.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string; department?: string; phone?: string }) => Promise<void>;
  logout: () => void;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('fraudshield_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('fraudshield_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('fraudshield_token');
      if (savedToken) {
        try {
          const res = await authService.getMe();
          setUser(res.data);
          localStorage.setItem('fraudshield_user', JSON.stringify(res.data));
        } catch {
          setUser(null);
          setToken(null);
          localStorage.removeItem('fraudshield_token');
          localStorage.removeItem('fraudshield_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await authService.login(credentials);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('fraudshield_token', res.data.token);
    localStorage.setItem('fraudshield_user', JSON.stringify(res.data.user));
  };

  const register = async (data: { name: string; email: string; password: string; role?: string; department?: string; phone?: string }) => {
    const res = await authService.register(data);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem('fraudshield_token', res.data.token);
    localStorage.setItem('fraudshield_user', JSON.stringify(res.data.user));
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const hasRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        hasRole,
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
