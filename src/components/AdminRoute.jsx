import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { UserContext } from './UserContext';
import '../App.css';


const AdminRoute = () => {
    const { userProfile, loadingAuth } = useContext(UserContext);

    if (loadingAuth) return <div className="loading-container"><div className="loading-spinner"></div></div>;


    if (!userProfile || userProfile.role !== 'admin') {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminRoute;


