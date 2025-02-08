import React from 'react';

const UserDataPage = () => {

    return (
        <div>
            <button style={{ position: 'absolute', top: 10, left: 10 }} onClick={() => navigate('/')}>
                Home
            </button>
            <h1>User Data Page</h1>
            <p>Aqui, se o user estiver logado, estará uma lista com todas as tabelas de processos que ele salvou</p>
            <p>Adicionarei também na gridprocess um botao para salvar a tabela na database.</p>
            <p>Se o user nao estiver logado, aparecerá um botão para logar ou registrar. Por enquanto eu vou usar firebase para armazenar os dados do usuario</p>

            database de tabelas de processos: firebase
            database de users: firebase
        </div>
    );
};

export default UserDataPage;