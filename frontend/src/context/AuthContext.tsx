/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { client } from '../lib/apollo';
import { LOGIN_MUTATION, GET_ME } from '../lib/queries';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  dateJoined?: string;
  groups: { id: string; name: string }[];
  permissionsList: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const token = localStorage.getItem('jwt_token');
    if (!token) {
      setLoading(false);
      return;
    }

    client.query({ query: GET_ME, fetchPolicy: 'network-only' })
      .then(({ data }) => {
        if (data?.me) {
          setUser(data.me);
        } else {
          localStorage.removeItem('jwt_token');
        }
      })
      .catch(() => {
        localStorage.removeItem('jwt_token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await client.mutate({
      mutation: LOGIN_MUTATION,
      variables: { username, password },
    });
    if (data?.tokenAuth?.token) {
      localStorage.setItem('jwt_token', data.tokenAuth.token);
      const { data: userData } = await client.query({ query: GET_ME, fetchPolicy: 'network-only' });
      if (userData?.me) {
        setUser(userData.me);
      }
    } else {
      throw new Error('Credenciales inválidas');
    }
  };

  const logout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    client.resetStore();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
