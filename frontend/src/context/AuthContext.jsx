import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();
// const API_URL = 'http://localhost:3001/api/auth';
const API_URL = 'https://resignation-managment-backend.vercel.app';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Simple token check (could be improved with a server endpoint)
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        // Check if token is expired
        if (payload.exp * 1000 > Date.now()) {
          setUser({
            id: payload.user.id,
            role: payload.user.role,
            username: payload.user.username,
          });
          axios.defaults.headers.common['x-auth-token'] = token;
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('Invalid token format:', error);
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { username, password });
      localStorage.setItem('token', res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      setUser({
        id: res.data.id,
        role: res.data.role,
        username: res.data.username,
      });
      return res.data.role;
    } catch (err) {
      throw err.response.data.msg || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
