import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, addDoc, query, where } from 'firebase/firestore';
import { FaTimes } from 'react-icons/fa';
import ButtonEndSession from './ButtonEndSession';
import Table from './Table';
import { GridProcess } from './GridProcess';
import './../App.css';

const UserTables = ({ user }) => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState('FIFO'); // Estado para o algoritmo selecionado
    const navigate = useNavigate();

    useEffect(() => {
        const getTables = async () => {
            try {
                if (user) {
                    const q = query(collection(db, 'tables'), where('userId', '==', user.uid));
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
    }, [user]);

    const handleDeleteTable = async (tableId) => {
        try {
            await deleteDoc(doc(db, 'tables', tableId));
            const q = query(collection(db, 'tables'), where('userId', '==', user.uid));
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
                userId: user.uid,
                timestamp: new Date(),
            };
            await addDoc(collection(db, 'tables'), tableData);
            const q = query(collection(db, 'tables'), where('userId', '==', user.uid));
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

    const handleImportTable = (tableId) => {
        const tableToImport = tables.find(table => table.id === tableId);
        if (tableToImport) {
            console.log('Selected Table:', tableToImport);
            setSelectedTable({ ...tableToImport, algorithm: selectedAlgorithm }); // Inclui o algoritmo selecionado
            console.log('Table imported successfully');
        } else {
            console.error('Table not found for import');
        }
    };

    if (selectedTable) {
        return (
            <div className='bg-white h-screen'>
                <GridProcess tableInfos={selectedTable.processes} algorithm={selectedTable.algorithm} />
                <button onClick={() => setSelectedTable(null)} className="button">
                    Back to Tables
                </button>
            </div>
        );
    }

    return (
        <div>
            <h2 className='usertables-title'>your tables</h2>
            {tables.map((table) => (
                <div key={table.id} className="usertables-card">
                    <div className="usertables-card-header">
                        <button className="usertables-delete-button" onClick={() => handleDeleteTable(table.id)}>
                            <FaTimes />
                        </button>
                    </div>
                    {/* Dropdown para selecionar o algoritmo */}
                    <select
                        value={selectedAlgorithm}
                        onChange={(e) => setSelectedAlgorithm(e.target.value)}
                        className="user-tables-algorithm-dropdown"
                    >
                        <option value="FIFO">FIFO</option>
                        <option value="SJF">SJF</option>
                        <option value="PNP">PNP</option>
                        <option value="PP">PP</option>
                        <option value="RR">RR</option>
                        
                    </select>

                    <button className="user-tables-button-import" onClick={() => handleImportTable(table.id)}>
                        Import
                    </button>
                    
                    <Table processes={table.processes} showPriority={true} showQuantum={true} />

                    
                </div>
            ))}
            <ButtonEndSession onClick={handleLogout} />
        </div>
    );
};

export default UserTables;