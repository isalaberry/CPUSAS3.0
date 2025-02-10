import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import NotLoggedPage from './NotLoggedPage';
import UserTables from './UserTables';

const UserDataPage = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div>
            {user ? <UserTables /> : <NotLoggedPage />}
        </div>
    );
};

export default UserDataPage;
//            isLogged? <UserTables /> : <NotLoggedPage/>
