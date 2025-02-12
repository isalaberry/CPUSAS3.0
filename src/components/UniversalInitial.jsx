import React from 'react';
import initialpage from '../assets/initialpage.jpg';
import ButtonTypeOne from './ButtonTypeOne';
import './../App.css';

const UniversalInitial = () => {
    return (
        <div className="universalinitial-image-container">
            <ButtonTypeOne to="/user-data-page" className="universalinitial-login-button">Login</ButtonTypeOne>
        </div>
    );
};

export default UniversalInitial;