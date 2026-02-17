import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, user, loading } = useAuth();
    // Show loading state while checking auth
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>);
    }
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace/>;
    }
    // Check role-based access
    if (allowedRoles && allowedRoles.length > 0) {
        const hasAllowedRole = allowedRoles.some(role => user?.role === role);
        if (!hasAllowedRole) {
            const roleRedirects = {
                super_admin: '/admin',
                admin: '/admin',
                admin_fakultas: '/fakultas',
                admin_unit: '/fakultas',
                fakultas: '/fakultas',
            };
            const fallback = roleRedirects[user?.role] || '/';
            return <Navigate to={fallback} replace/>;
        }
    }
    return <>{children}</>;
};
export default ProtectedRoute;
