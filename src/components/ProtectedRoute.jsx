import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // SUPER ADMIN BYPASS
    if (user?.email === '24pa1a45b4@vishnu.edu.in') {
        return children;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userProfile?.role)) {
        console.log('Access Denied. Required:', allowedRoles, 'Current Role:', userProfile?.role);
        return <Navigate to="/" replace />;
    }

    return children;
};
