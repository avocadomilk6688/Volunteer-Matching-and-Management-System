import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: ('admin' | 'volunteer' | 'organization')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === 'admin') {
            return <Navigate to="/manage-user-account" replace />;
        } else if (user.role === 'volunteer') {
            return <Navigate to="/volunteer-home" replace />;
        } else if (user.role === 'organization') {
            return <Navigate to="/manage-listing" replace />;
        }
        return <Navigate to="/login" replace />;
    }

    // Organization Verification Guard
    if (user.role === 'organization') {
        const registrationStatus = user.organization?.registrationRecord?.status?.trim().toLowerCase();
        const isApproved = registrationStatus === 'approved';

        const isUnverifiedPath = location.pathname === '/organization-verification' || location.pathname === '/pending-approval';

        if (!isApproved) {
            if (!isUnverifiedPath) {
                if (registrationStatus === 'pending') {
                    return <Navigate to="/pending-approval" replace />;
                } else {
                    return <Navigate to="/organization-verification" replace />;
                }
            }
        } else {
            if (isUnverifiedPath) {
                return <Navigate to="/manage-listing" replace />;
            }
        }
    }

    return <>{children}</>;
};
