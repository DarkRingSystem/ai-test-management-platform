import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from '../utils/store';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRoles = [] }) => {
  const { isLoggedIn, user } = useUserStore();
  const location = useLocation();

  // 检查是否已登录
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查角色权限
  if (requiredRoles.length > 0) {
    const hasPermission = requiredRoles.includes(user.role) || user.is_superuser;
    if (!hasPermission) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute;
