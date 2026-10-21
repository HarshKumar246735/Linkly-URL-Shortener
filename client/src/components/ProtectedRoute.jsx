import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/** Redirects visitors who are not logged in to /login, remembering where they were going. */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingSpinner fullPage label="Checking your session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

/** Keeps logged-in users away from the login and register pages. */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage label="Checking your session" />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default ProtectedRoute;
