import React from 'react';
import ButtonTypeOne from './ButtonTypeOne';
import '../App.css';
import {auth} from '../config/firebase';
import { useTranslation } from 'react-i18next';

const NotLoggedPage = () => {
    const { t } = useTranslation();
    console.log(auth?.currentUser?.email);
    return (
        <div className='notlp-background'>
                    <h1 className='notlp-title'>{t('notLoggedPage.titleLine1')}<br/> {t('notLoggedPage.titleLine2')}</h1>
            
            <div>
                <ButtonTypeOne to="/login-page">{t('notLoggedPage.loginButton')}</ButtonTypeOne>
            </div>
            <div>
                <ButtonTypeOne to="/register-page">{t('notLoggedPage.registerButton')}</ButtonTypeOne>
            </div>
       
        </div>
    );
};

export default NotLoggedPage;