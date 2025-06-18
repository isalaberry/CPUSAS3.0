import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { FaTimes } from 'react-icons/fa';
import ButtonEndSession from './ButtonEndSession';
import Table from './Table';
import { GridProcess } from './GridProcess';
import { useTranslation } from 'react-i18next'; 
import './../App.css';

const UserTables = ({ user }) => {
    const { t } = useTranslation();
    const [tables, setTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
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
                alert(t('userTables.alertErrorGetTables', { message: error.message }));
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
            alert(t('userTables.alertErrorDeleteTable', { message: error.message }));
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            alert(t('userTables.alertErrorLogout', { message: error.message }));
        }
    };

   const handleImportTable = (tableId) => {
        const tableToImport = tables.find(table => table.id === tableId);
        if (tableToImport) {
            console.log('Selected Table for import:', tableToImport);
            setSelectedTable({ 
                processes: tableToImport.processes || [], 
                interruptions: tableToImport.interruptions || [],
                algorithm: tableToImport.algorithm,
                id: tableToImport.id 
            });
            console.log('Table imported successfully with processes and interruptions');
        } else {
            alert(t('userTables.alertErrorTableNotFound'));
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
                    {t('userTables.buttonBackToTables')}
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className='usertables-title'>{t('userTables.title')}</h2>
            {tables.length === 0 && <p>{t('userTables.noScenariosSaved')}</p>}
            {tables.map((table) => (
                <div key={table.id} className="usertables-card">
                    <div className="usertables-card-header">
                        <span>
                            {t('userTables.algorithmLabel')}: {table.algorithm || t('userTables.notAvailable')} - {t('userTables.scenarioFromLabel')}: {table.timestamp?.toDate().toLocaleString()}
                        </span>

                        <button className="usertables-delete-button" onClick={() => handleDeleteTable(table.id)}>
                            <FaTimes />
                        </button>
                    </div>

                    <h4 className="font-semibold mt-2">{t('userTables.processesLabel')}</h4>
                    <Table 
                        processes={table.processes || []} 
                        showPriority={table.algorithm === 'PP' || table.algorithm === 'PNP'} 
                        showQuantum={table.algorithm === 'RR'}
                        //readOnly={true}
                    />

                    {(table.interruptions && table.interruptions.length > 0) && (
                        <>
                            <h4 className="font-semibold mt-4">{t('userTables.interruptionsLabel')}:</h4>
                            <Table 
                                processes={table.interruptions} 
                                showPriority={false} // Interrupções não têm prioridade
                                showQuantum={false}  // Interrupções não têm quantum
                                idPrefix="I"
                               // readOnly={true}
                            />
                        </>
                    )}
                    
                    <button 
                        className="user-tables-button-import mt-2"
                        onClick={() => handleImportTable(table.id)}
                    >
                        {t('userTables.buttonViewScenario')}
                    </button>
                </div>
            ))}
            <ButtonEndSession onClick={handleLogout} />
        </div>
    );
};

export default UserTables;