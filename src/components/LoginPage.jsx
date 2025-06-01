import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonTypeTwo from './ButtonTypeTwo';
import InputTypeOne from './InputTypeOne';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../App.css';
import { useTranslation } from 'react-i18next';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const login = async () => {
        if (!email || !password) {
            alert(t('loginPage.alertEnterEmailPassword'));
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/user-data-page');
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                alert(t('loginPage.alertInvalidEmailPassword'));
            } else if (error.code === 'auth/invalid-email') {
                alert(t('loginPage.alertInvalidEmailFormat'));
            } else {
                alert(t('loginPage.alertLoginError'));
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Evita o comportamento padrão de recarregar a página
        login(); // Chama a função de login
    };

    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1 className='lprp-title'>{t('loginTitle')}</h1>

                <form onSubmit={handleSubmit}>
                    <InputTypeOne
                        type="text"
                        placeholder={t('emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputTypeOne
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <ButtonTypeTwo type="submit">{t('loginButton')}</ButtonTypeTwo>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;