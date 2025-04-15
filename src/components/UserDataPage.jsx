import React, { useEffect, useContext } from 'react'; // Removed useState as it wasn't used directly
import { useNavigate } from 'react-router-dom';       // Import useNavigate
import { signOut } from 'firebase/auth';               // Import signOut
import { auth } from '../config/firebase';             // Ensure auth is imported
import NotLoggedPage from './NotLoggedPage';
import UserTables from './UserTables';
import { UserContext } from './UserContext';
import ButtonEndSession from './ButtonEndSession';   // Keep the button import

const UserDataPage = () => {
    const { user, userProfile, loadingAuth } = useContext(UserContext);
    const navigate = useNavigate(); // Hook for navigation

    // Define the handleLogout function within UserDataPage
    const handleLogout = async () => {
        try {
            await signOut(auth);
            // You might want to clear other states if necessary
            navigate('/'); // Redirect to the home page after logout
        } catch (error) {
            console.error('Error logging out:', error);
            // Handle logout errors, maybe show a message
        }
    };

    if (loadingAuth) {
        return <div style={{marginTop: '20px', marginLeft:'20px', color: '#445cf3'}}>Loading authentication...</div>;
    }

    if (user && userProfile) {
        if (userProfile.status === 'approved') {
            // User logged in AND approved
            // Render UserTables - it has its own internal handleLogout for its button
            return <UserTables user={user} userProfile={userProfile} />;
        } else if (userProfile.status === 'pending') {
            // User logged in but pending approval
            return (
                <div style={{ textAlign: 'center', marginTop: '80px', color: '#445cf3'}}>
                    <h1>Account Pending Approval</h1>
                    <p>Your account registration is awaiting admin approval. Please check back later.</p>
                    {/* This button now correctly calls the handleLogout defined above */}
                    <ButtonEndSession onClick={handleLogout} />
                </div>
            );
        } else {
             // User logged in but rejected or other status
             return (
                <div style={{ textAlign: 'center', marginTop: '80px', color: '#445cf3'}}>
                    <h1>Account Access Denied</h1>
                    <p>There was an issue with your account status ({userProfile.status}). Please contact support.</p>
                     {/* This button now correctly calls the handleLogout defined above */}
                    <ButtonEndSession onClick={handleLogout} />
                </div>
             );
        }
    } else {
        // User is not logged in
        return <NotLoggedPage />;
    }
};

export default UserDataPage;