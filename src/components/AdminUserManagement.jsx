import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path if needed
import '../App.css';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Function to fetch users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // Query users, optionally order them (e.g., by email or creation date)
            const usersQuery = query(collection(db, "users"), orderBy("email"));
            const querySnapshot = await getDocs(usersQuery);
            const usersList = querySnapshot.docs.map(doc => ({
                id: doc.id, // Use the document ID (which should be the Auth UID)
                ...doc.data()
            }));
            setUsers(usersList);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Failed to load users.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch users on component mount
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Function to update user status or role
    const updateUserField = async (userId, field, value) => {
        setError('');
        try {
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                [field]: value // Use computed property name
            });
            // Refresh the user list after update
            fetchUsers();
        } catch (err) {
            console.error(`Error updating user ${field}:`, err);
            setError(`Failed to update user ${field}.`);
        }
    };


    if (loading) return <div>Loading users...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="admin-page">
            <h2>User Management</h2>
            <button onClick={fetchUsers} disabled={loading} className="refresh-button">Refresh List</button>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.status}</td>
                            <td className="actions-cell">
                                {user.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => updateUserField(user.id, 'status', 'approved')}
                                            className="action-button approve"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                            className="action-button reject"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {/* Add buttons for role change or disable/delete (status change) */}
                                {user.status === 'approved' && (
                                    <button
                                         onClick={() => updateUserField(user.id, 'role', user.role === 'admin' ? 'user' : 'admin')}
                                         className={`action-button role ${user.role === 'admin' ? 'demote' : 'promote'}`}
                                     >
                                         {user.role === 'admin' ? 'Make User' : 'Make Admin'}
                                    </button>
                                )}
                                 {/* Example: Disable button (sets status to 'rejected') */}
                                 {user.status !== 'rejected' && user.status !== 'pending' && (
                                     <button
                                         onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                         className="action-button reject"
                                         title="Sets status to rejected, preventing login"
                                    >
                                        Disable User
                                    </button>
                                 )}

                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminUserManagement;