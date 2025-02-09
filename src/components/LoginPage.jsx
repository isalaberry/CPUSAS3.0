import React from 'react';
import ButtonTypeTwo from './ButtonTypeTwo'; 
import InputTypeOne from './InputTypeOne';
import ArrowToUserDataPage from './ArrowToUserDataPage';

const LoginPage = () => {
    return (
        <div>
            <ArrowToUserDataPage />

            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1>Insert your credentials</h1>
                
                <form>
                    <InputTypeOne type="text" placeholder="Username" />
                    <InputTypeOne type="password" placeholder="Password" />
                </form>

                <div>
                    <ButtonTypeTwo>Login</ButtonTypeTwo>
                </div>
                
            </div>
        </div>
    );
};

export default LoginPage;