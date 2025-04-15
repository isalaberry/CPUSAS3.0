import React, { useState } from 'react';
import InputTypeOne from './InputTypeOne';
import ButtonTypeTwo from './ButtonTypeTwo';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
// Import doc and setDoc instead of addDoc and collection (if only using for this)
import { doc, setDoc } from 'firebase/firestore';
import '../App.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const register = async () => {
        // Basic validation (add password confirmation check here too)
        if (!email || !password) {
             setError('Email and password are required.');
             return;
        }
        setError(''); // Clear previous errors

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user; // The authenticated user object from Firebase Auth

            // --- Firestore Document Creation ---
            // 1. Create a DocumentReference with the specific Auth UID as the document ID
            const userDocRef = doc(db, 'users', user.uid);

            // 2. Use setDoc to create the document at that reference
            await setDoc(userDocRef, {
                // uid: user.uid, // Optional: You can omit storing uid as a field now
                email: user.email,
                createdAt: new Date(),
                role: "user",       // Default role
                status: "pending"   // Default status
            });

            console.log('User registered and profile created in Firestore with ID:', user.uid);
            // Optionally navigate user or clear form here

        } catch (error) {
            console.error('Error signing up:', error);
            // Provide more specific errors if possible
            if (error.code === 'auth/email-already-in-use') {
                 setError('This email address is already registered.');
            } else if (error.code === 'auth/weak-password') {
                 setError('Password should be at least 6 characters.');
            } else {
                 setError('Error signing up: ' + error.message);
            }
        }
    };

    const closeErrorPopup = () => {
        setError('');
    };

    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1 className='lprp-title'>Insert your data</h1>

                {/* Add password confirmation input and state */}
                <form>
                    <InputTypeOne type="text" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <InputTypeOne type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {/* <InputTypeOne type="password" placeholder="Confirm Password" /> */}
                </form>

                <div>
                    <ButtonTypeTwo onClick={register}>Register</ButtonTypeTwo>
                </div>
            </div>

            {error && (
                <div className="error-popup">
                    <div className="error-popup-content">
                        <span className="error-popup-message">{error}</span>
                        <button className="error-popup-close" onClick={closeErrorPopup}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;