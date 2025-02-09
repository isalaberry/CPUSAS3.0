import React from 'react';
import InputTypeOne from './InputTypeOne';
import ButtonTypeTwo from './ButtonTypeTwo';
import ArrowToUserDataPage from './ArrowToUserDataPage';

const RegisterPage = () => {
    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1>Insert your data</h1>

                <form>
                    <InputTypeOne type="text" placeholder="Username" />
                    <InputTypeOne type="text" placeholder="E-mail" />
                    <InputTypeOne type="password" placeholder="Password" />
                    <InputTypeOne type="password" placeholder="Confirm Password" />
                </form>

                <div>
                    <ButtonTypeTwo>Register</ButtonTypeTwo>
                </div>
                
            </div>
        </div>
    );

};

export default RegisterPage;