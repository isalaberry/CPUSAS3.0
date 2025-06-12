import React, { useState } from 'react';
import InputTypeOne from './InputTypeOne';
import ButtonTypeTwo from './ButtonTypeTwo';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth, db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import '../App.css';

const RegisterPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const register = async () => {
        if (!email || !password || !confirmPassword) {
            alert(t('registerPage.alertAllFieldsRequired'));
            return;
        }
        if (password !== confirmPassword) {
            alert(t('registerPage.alertPasswordsNoMatch'));
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                createdAt: new Date(),
                role: "user",
                status: "pending"
            });

            alert('Registration successful! Your account is pending approval.');
            navigate('/user-data-page');
        } catch (error) {
            console.error('Error signing up:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert(t('registerPage.alertEmailInUse'));
            } else if (error.code === 'auth/weak-password') {
                alert(t('registerPage.alertWeakPassword'));
            } else if (error.code === 'auth/invalid-email') {
                alert(t('registerPage.alertInvalidEmail'));
            } else {
                alert(t('registerPage.alertRegistrationError', { message: error.message }));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        register();
    };

    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1 className='lprp-title'>{t('registerPage.title')}</h1>

                <form onSubmit={handleSubmit}>
                    <InputTypeOne
                        type="text"
                        placeholder={t('registerPage.placeholderEmail')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputTypeOne
                        type="password"
                        placeholder={t('registerPage.placeholderPassword')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputTypeOne
                        type="password"
                        placeholder={t('registerPage.placeholderConfirmPassword')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <ButtonTypeTwo type="submit">{t('registerPage.buttonRegister')}</ButtonTypeTwo>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;