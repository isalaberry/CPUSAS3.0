import React from 'react';
import initialpage from '/assets/initialpage.jpg';
import ButtonTypeOne from './ButtonTypeOne';
import { useTranslation } from 'react-i18next';
import './../App.css';

const UniversalInitial = () => {
    const { t } = useTranslation();
    return (
        <div className="universalinitial-image-container">
            <ButtonTypeOne to="/user-data-page" className="universalinitial-login-button">Login</ButtonTypeOne>
        </div>
    );
};

export default UniversalInitial;