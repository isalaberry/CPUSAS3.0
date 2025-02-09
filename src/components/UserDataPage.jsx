import React from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonTypeOne from './ButtonTypeOne';
import LoginPage from './LoginPage';
import NotLoggedPage from './NotLoggedPage';

const UserDataPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            logado: sim - mostrar tabelas do usuário

            logado: nao - botao para logar e botao para registrar

            import ButtonTypeOne from './ButtonTypeOne';
            
           <NotLoggedPage />


            
        </div>
    );
};

export default UserDataPage;