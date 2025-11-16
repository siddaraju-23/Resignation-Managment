import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-indigo-600">
          Resignation Management
        </Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-600 hidden sm:inline">
                Welcome, {user.username} ({user.role})
              </span>
              {user.role === 'HR' && (
                <Link
                  to="/hr-dashboard"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  HR Dashboard
                </Link>
              )}
              {user.role === 'Employee' && (
                <Link
                  to="/dashboard"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  My Status
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-150"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1 border border-indigo-600 text-indigo-600 rounded-md hover:bg-indigo-50 transition duration-150"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
