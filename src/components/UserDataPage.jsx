import React from 'react';
import { useNavigate } from 'react-router-dom';
import ButtonTypeOne from './ButtonTypeOne';

const UserDataPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            logado: sim - mostrar tabelas do usuário

            logado: nao - botao para logar e botao para registrar

            import ButtonTypeOne from './ButtonTypeOne';

            <div>
                <ButtonTypeOne to="/login-page">Login</ButtonTypeOne>
            </div>
            <div>   
                <ButtonTypeOne to="/register-page">Register</ButtonTypeOne>
            </div>


            
        </div>
    );
};

export default UserDataPage;