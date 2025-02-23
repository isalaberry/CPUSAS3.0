import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, query, where } from 'firebase/firestore'; // ADICIONADO QUERY E WHERE
import { FaTimes } from 'react-icons/fa';
import ButtonEndSession from './ButtonEndSession';
import Table from './Table';
import './../App.css';

const UserTables = ({ user }) => {
    const [tables, setTables] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const getTables = async () => {
            try {
                if (user) { // VERIFICA SE HÁ UM USUÁRIO LOGADO
                    const q = query(collection(db, 'tables'), where('userId', '==', user.uid)); // FILTRA AS TABELAS PELO userId
                    const querySnapshot = await getDocs(q);
                    const filteredData = querySnapshot.docs.map(doc => ({
                        ...doc.data(),
                        id: doc.id,
                    }));
                    setTables(filteredData);
                    console.log(filteredData);
                }
            } catch (error) {
                console.error('Error getting tables:', error);
            }
        };

        getTables();
    }, [user]); // ADICIONADO user COMO DEPENDÊNCIA

    const handleDeleteTable = async (tableId) => {
        try {
            await deleteDoc(doc(db, 'tables', tableId));
            const q = query(collection(db, 'tables'), where('userId', '==', user.uid)); // FILTRA AS TABELAS PELO userId
            const querySnapshot = await getDocs(q);
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

    const handleAddTable = async (newTableData) => {
        if (!user) {
            console.error('No user logged in. Cannot add table.');
            return;
        }

        try {
            const tableData = {
                ...newTableData,
                userId: user.uid, // ADICIONADO userId AO tableData
                timestamp: new Date(),
            };
            await addDoc(collection(db, 'tables'), tableData);
            const q = query(collection(db, 'tables'), where('userId', '==', user.uid)); // FILTRA AS TABELAS PELO userId
            const querySnapshot = await getDocs(q);
            const filteredData = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
            }));
            setTables(filteredData);
            console.log('Table added and data reloaded');
        } catch (error) {
            console.error('Error adding table:', error);
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