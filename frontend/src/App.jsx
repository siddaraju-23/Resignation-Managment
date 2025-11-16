import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';
import Navbar from './components/Navabar';
import LoginPage from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import HRDashboard from './pages/HRDashboard';
import NotFoundPage from './pages/LoginPage';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center p-8">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <div className="container mx-auto p-4">
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* Redirect to dashboard based on role or login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              {/* Employee Route */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['Employee']}>
                    <EmployeeDashboard />
                  </ProtectedRoute>
                }
              />

              {/* HR Route */}
              <Route
                path="/hr-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['HR']}>
                    <HRDashboard />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
