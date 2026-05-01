import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';

export function Layout() {
  return (
    <div className="min-vh-100">
      <Outlet />
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
