import React from 'react';
import ButtonTypeOne from './ButtonTypeOne';
import './../App.css';

const NotLoggedPage = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                
            <h1>You are not logged yet! Please, login or register:</h1>
            
            <div>
                <ButtonTypeOne to="/login-page">Login</ButtonTypeOne>
            </div>
            <div>
                <ButtonTypeOne to="/register-page">Register</ButtonTypeOne>
            </div>
       
        </div>
    );
};

export default NotLoggedPage;