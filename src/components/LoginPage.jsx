import React from 'react';
import ButtonTypeTwo from './ButtonTypeTwo'; 
import InputTypeOne from './InputTypeOne';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import {auth} from '../config/firebase';
import {createUserWithEmailAndPassword} from 'firebase/auth';


const LoginPage = () => {
    

    return (
        <div>
            <ArrowToUserDataPage />

            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1>Insert your credentials</h1>
                
                <form>
                    <InputTypeOne type="text" placeholder="E-mail" />
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