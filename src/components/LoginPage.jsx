import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonTypeTwo from './ButtonTypeTwo';
import InputTypeOne from './InputTypeOne';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../App.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const login = async () => {
        if (!email || !password) {
            alert('Please enter your email address and password.');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/user-data-page');
        } catch (error) {
            console.error('Error logging in:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                alert('Invalid email or password.');
            } else if (error.code === 'auth/invalid-email') {
                alert('Invalid email format.');
            } else {
                alert('Error logging in. Please try again.');
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
                <h1 className='lprp-title'>Enter your credentials</h1>

                <form onSubmit={handleSubmit}>
                    <InputTypeOne
                        type="text"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <InputTypeOne
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <ButtonTypeTwo type="submit">Login</ButtonTypeTwo>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;