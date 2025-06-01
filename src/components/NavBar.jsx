import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom"; 
import { UserContext } from './UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../App.css';

export function NavBar() {
    const { userProfile } = useContext(UserContext);
    const [activeItem, setActiveItem] = useState('');
    const [visibility, setVisibility] = useState({
        fifo: true, sjf: true, pnp: true, pp: true, rr: true,
    });
    const [loadingVisibility, setLoadingVisibility] = useState(true);
    const location = useLocation();

    useEffect(() => {
        // Extrai o nome do caminho da URL (ex: "/fifo" -> "fifo")
        // Ou para rotas aninhadas (ex: "/admin/users" -> "admin/users")
        const currentPath = location.pathname.substring(1); 

        // Lógica para definir activeItem com base no currentPath
        if (currentPath === 'fifo' && visibility.fifo) {
            setActiveItem('fifo');
        } else if (currentPath === 'sjf' && visibility.sjf) {
            setActiveItem('sjf');
        } else if (currentPath === 'pnp' && visibility.pnp) {
            setActiveItem('pnp');
        } else if (currentPath === 'pp' && visibility.pp) {
            setActiveItem('pp');
        } else if (currentPath === 'rr' && visibility.rr) {
            setActiveItem('rr');
        } else if (currentPath === 'admin/users' && userProfile?.role === 'admin') {
            setActiveItem('admin-users');
        } else if (currentPath === 'admin/settings' && userProfile?.role === 'admin') {
            setActiveItem('admin-settings');
        } else if (currentPath === '' || currentPath === 'login') { // Exemplo para página inicial ou login
            setActiveItem(''); // Nenhum item ativo ou um item padrão se desejar
        }
        // Adicione mais 'else if' conforme necessário para outras rotas
        // Se nenhuma rota corresponder, activeItem pode permanecer como está ou ser resetado
        // else {
        // setActiveItem(''); // Opcional: resetar se nenhuma rota corresponder
        // }

    }, [location, visibility, userProfile]); // Dependências do useEffect

    useEffect(() => {
        setLoadingVisibility(true);
        const fetchVisibility = async () => {
            const configDocRef = doc(db, "appConfig", "visibility");
            try {
                const docSnap = await getDoc(configDocRef);
                if (docSnap.exists()) {
                    const fetchedData = docSnap.data();
                    setVisibility(prev => ({ ...prev, ...fetchedData }));
                } else {
                    setVisibility({ fifo: true, sjf: true, pnp: true, pp: true, rr: true });
                }
            } catch (error) {
                setVisibility({ fifo: true, sjf: true, pnp: true, pp: true, rr: true });
            } finally {
                 setLoadingVisibility(false);
            }
        };
        fetchVisibility();
    }, []);

    const handleSetActive = (item) => {
        setActiveItem(item);
    };

    if (loadingVisibility) {
        return <nav className="navbar"><ul className="nav-list"><li>Loading Nav...</li></ul></nav>;
     }

    return (
        <nav className="navbar">
            <ul className="nav-list">
                {visibility.fifo && (
                    <li className="nav-item">
                        <Link
                            to="/fifo"
                            className={`nav-link ${activeItem === 'fifo' ? 'active' : ''}`}
                            onClick={() => handleSetActive('fifo')}
                        >
                            First-In-First-Out
                        </Link>
                    </li>
                )}
                {visibility.sjf && (
                    <li className="nav-item">
                        <Link
                            to="/sjf"
                            className={`nav-link ${activeItem === 'sjf' ? 'active' : ''}`}
                            onClick={() => handleSetActive('sjf')}
                        >
                            Shortest Job First
                        </Link>
                    </li>
                 )}
                 {visibility.pnp && (
                    <li className="nav-item">
                         <Link
                            to="/pnp"
                            className={`nav-link ${activeItem === 'pnp' ? 'active' : ''}`}
                            onClick={() => handleSetActive('pnp')}
                        >
                            Priorities no preemptive
                        </Link>
                    </li>
                 )}
                 {visibility.pp && (
                    <li className="nav-item">
                         <Link
                            to="/pp"
                            className={`nav-link ${activeItem === 'pp' ? 'active' : ''}`}
                            onClick={() => handleSetActive('pp')}
                        >
                            Priorities Preemptive
                        </Link>
                    </li>
                 )}
                 {visibility.rr && (
                    <li className="nav-item">
                         <Link
                            to="/rr"
                            className={`nav-link ${activeItem === 'rr' ? 'active' : ''}`}
                            onClick={() => handleSetActive('rr')}
                        >
                            Round Robin
                        </Link>
                    </li>
                 )}

                 {userProfile?.role === 'admin' && (
                    <>
                        <li className="nav-item">
                            <Link
                                to="/admin/users"
                                className={`nav-link ${activeItem === 'admin-users' ? 'active' : ''}`}
                                onClick={() => handleSetActive('admin-users')}
                            >
                                Manage Users
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to="/admin/settings"
                                className={`nav-link ${activeItem === 'admin-settings' ? 'active' : ''}`}
                                onClick={() => handleSetActive('admin-settings')}
                            >
                                Settings
                            </Link>
                        </li>
                    </>
                 )}
            </ul>
        </nav>
    );
}

export default NavBar;