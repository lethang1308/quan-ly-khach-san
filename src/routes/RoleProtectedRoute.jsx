import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { canAccess } from '@/constants/hotel';
export default function RoleProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!canAccess(role, allowedRoles))
    return <Navigate to="/403" state={{ from: location.pathname, allowedRoles }} replace />;
  return <Outlet />;
}
