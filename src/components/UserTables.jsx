import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ButtonEndSession from './ButtonEndSession';

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
            <h1>Your Tables</h1>
            {tables.map((table, index) => (
                <div key={table.id}>
                    <h2>Table {index+1}</h2>
                    {table.processes.map((process, index) => (
                        <div key={index}>
                            <p>Name: {process.name}</p>
                            <p>Arrival Time: {process.arrivalTime}</p>
                            <p>Running Time: {process.runningTime}</p>
                            <p>Priority: {process.priority}</p>
                            <p>Quantum: {process.quantum}</p>
                        </div>
                    ))}
                </div>
            ))}
            <ButtonEndSession onClick={handleLogout} />
        </div>
    );
};

export default UserTables;