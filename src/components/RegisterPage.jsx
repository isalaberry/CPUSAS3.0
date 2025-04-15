import React, { useState } from 'react';
import InputTypeOne from './InputTypeOne';
import ButtonTypeTwo from './ButtonTypeTwo';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth, db } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import '../App.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const register = async () => {
        if (!email || !password || !confirmPassword) {
            alert('Please enter your email address and password.');
            return;
        }
        if (password !== confirmPassword) {
            alert('Passwords don\'t match.');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                createdAt: new Date(),
                role: "user",
                status: "pending"
            });

            alert('Registration successful! Your account is pending approval.');
            navigate('/user-data-page');
        } catch (error) {
            console.error('Error signing up:', error);
            if (error.code === 'auth/email-already-in-use') {
                alert('This e-mail address is already registered.');
            } else if (error.code === 'auth/weak-password') {
                alert('The password must be at least 6 characters long.');
            } else if (error.code === 'auth/invalid-email') {
                alert('Invalid email format.');
            } else {
                alert('Registration error: ' + error.message);
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault(); // Evita o comportamento padrão de recarregar a página
        register(); // Chama a função de registro
    };

    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1 className='lprp-title'>Insira os seus dados</h1>

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
                    <InputTypeOne
                        type="password"
                        placeholder="Confirmar Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <ButtonTypeTwo type="submit">Registar</ButtonTypeTwo>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;