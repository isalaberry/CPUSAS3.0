import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import ButtonEndSession from './ButtonEndSession';

const UserTables = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div>
            <h1>Your Tables</h1>
            {/* Aqui você pode adicionar a lógica para exibir as tabelas do usuário */}
                 
            <ButtonEndSession onClick={handleLogout}/>
        </div>
    );
};

export default UserTables;