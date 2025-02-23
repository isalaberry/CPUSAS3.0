import React, { useState } from 'react';
import InputTypeOne from './InputTypeOne';
import ButtonTypeTwo from './ButtonTypeTwo';
import ArrowToUserDataPage from './ArrowToUserDataPage';
import { auth, db } from '../config/firebase'; // IMPORTADO db
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore'; // IMPORTADO collection E addDoc
import '../App.css';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // ADICIONADO ESTADO PARA MENSAGEM DE ERRO

    const register = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ADICIONADO CÓDIGO PARA SALVAR O USUÁRIO NO FIRESTORE
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                createdAt: new Date(),
            });

            console.log('User registered and added to Firestore:', user);
        } catch (error) {
            console.error('Error signing up:', error);
            setError('Error signing up: ' + error.message); // DEFINE A MENSAGEM DE ERRO
        }
    };

    const closeErrorPopup = () => {
        setError(''); // LIMPA A MENSAGEM DE ERRO
    };

    return (
        <div>
            <ArrowToUserDataPage />
            <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                <h1 className='lprp-title'>Insert your data</h1>

                <form>
                    <InputTypeOne type="text" placeholder="E-mail" onChange={(e) => setEmail(e.target.value)} />
                    <InputTypeOne type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                    <InputTypeOne type="password" placeholder="Confirm Password" />
                </form>

                <div>
                    <ButtonTypeTwo onClick={register}>Register</ButtonTypeTwo>
                </div>
            </div>

            {error && ( // EXIBE O POPUP DE ERRO SE HOUVER UMA MENSAGEM DE ERRO
                <div className="error-popup">
                    <div className="error-popup-content">
                        <span className="error-popup-message">{error}</span>
                        <button className="error-popup-close" onClick={closeErrorPopup}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterPage;