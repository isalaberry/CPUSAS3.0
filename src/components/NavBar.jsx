import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from "react-router-dom"; 
import { UserContext } from './UserContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../App.css';
import { useTranslation } from 'react-i18next';

export function NavBar() {
    const { t } = useTranslation(); 
    const { userProfile } = useContext(UserContext);
    const [activeItem, setActiveItem] = useState('');
    const defaultVisibility = {
        fcfs: true, sjf: true, sjfp: true, pnp: true, pp: true, rr: true,
    };
    const [visibility, setVisibility] = useState(defaultVisibility);
    const [loadingVisibility, setLoadingVisibility] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const currentPath = location.pathname.substring(1); 

        if (currentPath === 'fcfs' && visibility.fcfs) {
            setActiveItem('fcfs');
        } else if (currentPath === 'sjf' && visibility.sjf) {
            setActiveItem('sjf');
        } else if (currentPath === 'sjfp' && visibility.sjfp) {
            setActiveItem('sjfp');
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
        } else if (currentPath === '' || currentPath === 'login') {
            setActiveItem('');
        }

    }, [location, visibility, userProfile]);

    useEffect(() => {
        setLoadingVisibility(true);
        const configDocRef = doc(db, "appConfig", "visibility");
        const unsubscribe = onSnapshot(configDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const fetchedData = docSnap.data();
                // Garante que todos os campos estejam presentes
                setVisibility({
                    ...defaultVisibility,
                    ...fetchedData
                });
            } else {
                setVisibility(defaultVisibility);
            }
            setLoadingVisibility(false);
        }, (error) => {
            setVisibility(defaultVisibility);
            setLoadingVisibility(false);
        });

        return () => unsubscribe();
    }, [userProfile]);

    const handleSetActive = (item) => {
        setActiveItem(item);
    };

    if (loadingVisibility) {
        return <nav className="navbar"><ul className="nav-list"><li>{t('navLoading', 'Loading Nav...')}</li></ul></nav>;
    }

    return (
        <nav className="navbar">
            <ul className="nav-list">
                {visibility.fcfs && (
                    <li className="nav-item">
                        <Link
                            to="/fcfs"
                            className={`nav-link ${activeItem === 'fcfs' ? 'active' : ''}`}
                            onClick={() => handleSetActive('fcfs')}
                        >
                            {t('navFcfs')}
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
                            {t('navSjf')}
                        </Link>
                    </li>
                )}
                {visibility.sjfp && (
                    <li className="nav-item">
                        <Link
                            to="/sjfp"
                            className={`nav-link ${activeItem === 'sjfp' ? 'active' : ''}`}
                            onClick={() => handleSetActive('sjfp')}
                        >
                            {t('navSjfp')}
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
                            {t('navPnp')}
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
                            {t('navPp')}
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
                            {t('navRr')}
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
                                {t('navAdminUsers')}
                            </Link>
                        </li>
                        <li className="nav-item">
                            <Link
                                to="/admin/settings"
                                className={`nav-link ${activeItem === 'admin-settings' ? 'active' : ''}`}
                                onClick={() => handleSetActive('admin-settings')}
                            >
                                {t('navAdminSettings')}
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    );
}

export default NavBar;