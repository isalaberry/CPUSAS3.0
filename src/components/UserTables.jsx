import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { FaTimes } from 'react-icons/fa';
import ButtonEndSession from './ButtonEndSession';
import Table from './Table';
import './../App.css';

const UserTables = () => {
    const [tables, setTables] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getTables = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'tables'));
                const filteredData = querySnapshot.docs.map(doc => ({
                    ...doc.data(),
                    id: doc.id,
                }));
                setTables(filteredData);
                console.log(filteredData);
            } catch (error) {
                console.error('Error getting tables:', error);
            }
        };

        getTables();
    }, []);

    const handleDeleteTable = async (tableId) => {
        try {
            await deleteDoc(doc(db, 'tables', tableId));
            const querySnapshot = await getDocs(collection(db, 'tables'));
            const filteredData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            }));
            setTables(filteredData);
            console.log('Table deleted and data reloaded');
        } catch (error) {
            console.error('Error deleting table:', error);
        }
    };

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
            <h2 className='usertables-title'>your tables</h2>
            {tables.map((table, index) => (
                <div key={table.id} className="usertables-card">
                    <div className="usertables-card-header">
                    
                        <button className="usertables-delete-button" onClick={() => handleDeleteTable(table.id)}>
                            <FaTimes />
                        </button>
                    </div>
                    <Table processes={table.processes} showPriority={true} showQuantum={true} />
                </div>
            ))}
            <ButtonEndSession onClick={handleLogout} />
        </div>
    );
};

export default UserTables;