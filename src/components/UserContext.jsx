import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                    const profileData = userDocSnap.data();
                    if (profileData.status === 'approved') {
                        setUserProfile({ uid: currentUser.uid, ...profileData });
                    } else {
                        setUserProfile({ uid: currentUser.uid, status: profileData.status });
                    }
                } else {
                    console.error("User profile not found in Firestore!");
                    setUserProfile(null);
                }
            } else {
                setUserProfile(null);
            }
            setLoadingAuth(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <UserContext.Provider value={{ user, userProfile, loadingAuth }}>
            {children}
        </UserContext.Provider>
    );
};