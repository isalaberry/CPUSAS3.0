import React from 'react';
import ButtonTypeOne from './ButtonTypeOne'; 
import InputTypeOne from './InputTypeOne';

const LoginPage = () => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <h1>Insert your credentials</h1>

            <form>
                <InputTypeOne type="text" placeholder="Username" />
                <InputTypeOne type="password" placeholder="Password" />
                <InputTypeOne type="password" placeholder="Confirm Password" />
            </form>

            <div>
                <ButtonTypeOne to="/login-page">Login</ButtonTypeOne>
            </div>
            
        </div>
    );
};

export default LoginPage;