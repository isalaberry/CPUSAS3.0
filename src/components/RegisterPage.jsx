import React, { useState } from 'react';
import InputTypeOne from './InputTypeOne';
import ButtonTypeTwo from './ButtonTypeTwo';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const register = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing up:', error);
        }
    };

    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1>Insert your data</h1>

                <form>
                    <InputTypeOne type="text" placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} />
                    <InputTypeOne type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                    <InputTypeOne type="password" placeholder="Confirm Password" />
                </form>

                <div>
                    <ButtonTypeTwo onClick={register}>Register</ButtonTypeTwo>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;