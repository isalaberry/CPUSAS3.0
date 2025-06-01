import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FaTimes } from 'react-icons/fa';
import ButtonEndSession from './ButtonEndSession';
import Table from './Table';
import { GridProcess } from './GridProcess';
import './../App.css';

const UserTables = ({ user }) => {
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    //const [selectedAlgorithm, setSelectedAlgorithm] = useState('FIFO');
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
        } catch (error) {
            console.error('Error deleting table:', error);
        }
    };
/*
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
*/
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
            console.log('Selected Table for import:', tableToImport);
            setSelectedTable({ 
                processes: tableToImport.processes || [], 
                interruptions: tableToImport.interruptions || [],
                algorithm: tableToImport.algorithm || 'FIFO',
                id: tableToImport.id 
            });
            console.log('Table imported successfully with processes and interruptions');
        } else {
            console.error('Table not found for import');
        }
    };

    if (selectedTable) {
        return (
            <div className='bg-white h-screen p-4'>
                <GridProcess 
                    tableInfos={selectedTable.processes} 
                    interruptionsData={selectedTable.interruptions}
                    algorithm={selectedTable.algorithm} 
                />
                <button onClick={() => setSelectedTable(null)} className="button mt-4">
                    Back to Tables
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className='usertables-title'>Your Saved Scenarios</h2>
            {tables.length === 0 && <p>No scenarios saved yet.</p>}
            {tables.map((table) => (
                <div key={table.id} className="usertables-card">
                    <div className="usertables-card-header">
                        <span>
                            Algorithm: {table.algorithm || 'N/A'} -  Scenario from: {table.timestamp?.toDate().toLocaleString()}
                        </span>

                        <button className="usertables-delete-button" onClick={() => handleDeleteTable(table.id)}>
                            <FaTimes />
                        </button>
                    </div>

                    <h4 className="font-semibold mt-2">Processes:</h4>
                    <Table 
                        processes={table.processes || []} 
                        // Condiciona showPriority com base no algoritmo da tabela
                        showPriority={table.algorithm === 'PP' || table.algorithm === 'PNP'} 
                        // Condiciona showQuantum com base no algoritmo da tabela
                        showQuantum={table.algorithm === 'RR'}
                        readOnly={true} // Adiciona readOnly para visualização
                    />

                    {(table.interruptions && table.interruptions.length > 0) && (
                        <>
                            <h4 className="font-semibold mt-4">Interruptions:</h4>
                            <Table 
                                processes={table.interruptions} 
                                showPriority={false} // Interrupções não têm prioridade
                                showQuantum={false}  // Interrupções não têm quantum
                                idPrefix="I"
                                nameColumnHeader="Interrupt ID"
                                readOnly={true} // Adiciona readOnly para visualização
                            />
                        </>
                    )}
                    
                    <button 
                        className="user-tables-button-import mt-2"
                        onClick={() => handleImportTable(table.id)}
                    >
                        View Scenario
                    </button>
                </div>
            ))}
            <ButtonEndSession onClick={handleLogout} />
        </div>
    );
};

export default UserTables;