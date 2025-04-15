import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from './UserContext';

const AdminRoute = () => {
    const { userProfile, loadingAuth } = useContext(UserContext);

    if (loadingAuth) {
        return <div>Loading...</div>; // Or a proper loading spinner
    }

    // Redirect if not loading, not logged in, or not an admin
    if (!userProfile || userProfile.role !== 'admin') {
        return <Navigate to="/" replace />; // Or to login page
    }

    // Render child route if user is an admin
    return <Outlet />;
};

export default AdminRoute;


