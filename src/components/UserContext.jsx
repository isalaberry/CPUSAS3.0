import React, { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '../config/firebase';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Firebase Auth user
    const [userProfile, setUserProfile] = useState(null); // Firestore user profile (role, status, etc.)
    const [loadingAuth, setLoadingAuth] = useState(true); // Loading state

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
                        // Optional: Sign out user automatically if not approved
                        // await signOut(auth);
                        // setUser(null);
                    }
                } else {
                    // User logged in via Auth but no profile found in Firestore (edge case?)
                    console.error("User profile not found in Firestore!");
                    setUserProfile(null);
                    // Optional: Sign out user
                    // await signOut(auth);
                    // setUser(null);
                }
            } else {
                // User is logged out
                setUserProfile(null);
            }
            setLoadingAuth(false); // Finished loading auth state
        });

        return () => unsubscribe();
    }, []);

    // Pass down user (Auth), userProfile (Firestore), and loading state
    return (
        <UserContext.Provider value={{ user, userProfile, loadingAuth }}>
            {children}
        </UserContext.Provider>
    );
};