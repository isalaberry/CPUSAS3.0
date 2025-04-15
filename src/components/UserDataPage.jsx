import React, { useEffect, useState, useContext } from 'react'; // Import useContext
// Remove onAuthStateChanged import here if using context primarily
import { auth } from '../config/firebase';
import NotLoggedPage from './NotLoggedPage';
import UserTables from './UserTables';
import { UserContext } from './UserContext'; // Import UserContext

const UserDataPage = () => {
    const { user, userProfile, loadingAuth } = useContext(UserContext); // Use context

    if (loadingAuth) {
        return <div style={{marginTop: '20px', marginLeft:'20px', color: '#445cf3'}}>Loading authentication...</div>;
    }

    if (user && userProfile) {
        if (userProfile.status === 'approved') {
            // User logged in AND approved
            return <UserTables user={user} userProfile={userProfile} />; // Pass profile down if needed
        } else if (userProfile.status === 'pending') {
            // User logged in but pending approval
            return (
                <div style={{ textAlign: 'center', marginTop: '80px', color: '#445cf3'}}>
                    <h1>Account Pending Approval</h1>
                    <p>Your account registration is awaiting admin approval. Please check back later.</p>
                    {/* Optional: Add logout button */}
                </div>
            );
        } else {
             // User logged in but rejected or other status
             return (
                <div style={{ textAlign: 'center', marginTop: '80px', color: '#445cf3'}}>
                    <h1>Account Access Denied</h1>
                    <p>There was an issue with your account status ({userProfile.status}). Please contact support.</p>
                     {/* Optional: Add logout button */}
                </div>
            );
        }
    } else {
        // User is not logged in
        return <NotLoggedPage />;
    }
};

export default UserDataPage;