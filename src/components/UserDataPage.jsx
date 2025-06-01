import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import NotLoggedPage from './NotLoggedPage';
import UserTables from './UserTables';
import { UserContext } from './UserContext';
import ButtonEndSession from './ButtonEndSession';
import { useTranslation } from 'react-i18next';

const UserDataPage = () => {
    const { t } = useTranslation();
    const { user, userProfile, loadingAuth } = useContext(UserContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    if (loadingAuth) {
        return <div style={{marginTop: '20px', marginLeft:'20px', color: '#445cf3'}}>{t('userDataPage.loadingAuth')}</div>;
    }

    if (user && userProfile) {
        if (userProfile.status === 'approved') {
            return <UserTables user={user} userProfile={userProfile} />;
        } else if (userProfile.status === 'pending') {
            return (
                <div style={{ textAlign: 'center', marginTop: '80px', color: '#445cf3'}}>
                    <h1>{t('userDataPage.pendingTitle')}</h1>
                    <p>{t('userDataPage.pendingMessage')}</p>
                    <ButtonEndSession onClick={handleLogout} />
                </div>
            );
        } else {
             return (
                <div style={{ textAlign: 'center', marginTop: '80px', color: '#445cf3'}}>
                    <h1>{t('userDataPage.deniedTitle')}</h1>
                    <p>{t('userDataPage.deniedMessage', { status: userProfile.status })}</p>
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