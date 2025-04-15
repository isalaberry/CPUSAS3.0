// src/components/AdminUserManagement.js
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase'; // Ajuste o caminho se necessário
import { UserContext } from './UserContext'; // Ajuste o caminho se necessário
import '../App.css'; // Certifique-se que App.css está a ser importado algures

const AdminUserManagement = () => {
    // State for storing users list, loading status, and errors
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get the currently logged-in user's profile from context
    const { userProfile } = useContext(UserContext);

    // Function to fetch all users from Firestore, ordered by email
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(''); // Clear previous errors on fetch
        try {
            const usersQuery = query(collection(db, "users"), orderBy("email"));
            const querySnapshot = await getDocs(usersQuery);
            const usersList = querySnapshot.docs.map(docSnapshot => ({
                id: docSnapshot.id, // The user's Auth UID, used as document ID
                ...docSnapshot.data() // Spread the rest of the user data (email, role, status, etc.)
            }));
            setUsers(usersList);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Falha ao carregar utilizadores.");
        } finally {
            setLoading(false); // Stop loading indicator regardless of success/failure
        }
    }, []); // Empty dependency array means this function doesn't change between renders

    // Fetch users when the component mounts for the first time
    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // Dependency array includes fetchUsers (defined with useCallback)

    // Function to update a specific field (like 'status' or 'role') for a user
    const updateUserField = async (userId, field, value) => {
        setError(''); // Clear previous errors
        // Prevent updating if it's the logged-in admin trying to modify their own crucial fields
        if (userProfile && userId === userProfile.uid) {
             if ((field === 'status' && value !== 'approved') || (field === 'role' && value !== 'admin')) {
                 console.warn("Admin attempted to modify own status/role in an invalid way.");
                 setError("Não pode alterar o seu próprio estado (exceto para 'approved') ou remover a sua função de admin aqui.");
                 return;
             }
        }

        try {
            const userDocRef = doc(db, "users", userId);
            await updateDoc(userDocRef, {
                [field]: value // Use computed property name to set the field dynamically
            });
            // Refresh the user list view after a successful update
            fetchUsers();
        } catch (err) {
            console.error(`Error updating user ${field}:`, err);
            setError(`Falha ao atualizar ${field} do utilizador.`);
        }
    };

    // Render loading state
    if (loading) return <div>A carregar utilizadores...</div>;

    // Render error message if something went wrong
    if (error) return <div className="AdminUserManagement-error-message">{error}</div>;

    // Render the main component UI
    return (
        <div className="AdminUserManagement-page"> {/* Use prefixed class */}
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 300, margin: 30 }}>Gestão de Utilizadores</h2>

            {/* Refresh Button */}
            <button
                onClick={fetchUsers}
                disabled={loading}
                className="AdminUserManagement-refresh-button" /* Use prefixed class */
            >
                Atualizar Lista
            </button>

            {/* Users Table */}
            <table className="AdminUserManagement-table"> {/* Use prefixed class */}
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Map through the users array to create table rows */}
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.status}</td>
                            <td className="AdminUserManagement-actions-cell"> {/* Use prefixed class */}

                                {/* === Action Buttons based on Status === */}

                                {/* == Status: PENDING == */}
                                {user.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => updateUserField(user.id, 'status', 'approved')}
                                            className="AdminUserManagement-action-button approve"
                                        >
                                            Aprovar
                                        </button>
                                        <button
                                            onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                            className="AdminUserManagement-action-button reject"
                                        >
                                            Rejeitar
                                        </button>
                                    </>
                                )}

                                {/* == Status: APPROVED == */}
                                {user.status === 'approved' && userProfile && (
                                    <>
                                        {/* Make Admin Button */}
                                        {user.role !== 'admin' && (
                                             <button
                                                 onClick={() => updateUserField(user.id, 'role', 'admin')}
                                                 className="AdminUserManagement-action-button promote"
                                            >
                                                Tornar Admin
                                            </button>
                                        )}

                                        {/* Make User Button */}
                                        {user.role === 'admin' && user.id !== userProfile.uid && (
                                             <button
                                                 onClick={() => updateUserField(user.id, 'role', 'user')}
                                                 className="AdminUserManagement-action-button demote"
                                            >
                                                Tornar User
                                            </button>
                                        )}
                                         {/* Indicator for the currently logged-in admin */}
                                        {user.role === 'admin' && user.id === userProfile.uid && (
                                            <span className="AdminUserManagement-current-admin-indicator">(Você)</span>
                                         )}


                                        {/* Disable Button */}
                                        {user.id !== userProfile.uid && ( // Check it's not the admin themselves
                                             <button
                                                onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                                className="AdminUserManagement-action-button reject"
                                                title="Define o estado como rejeitado, impedindo o login"
                                             >
                                                 Desativar Utilizador
                                             </button>
                                         )}
                                    </>
                                )}

                                {/* == Status: REJECTED == */}
                                {user.status === 'rejected' && ( // NEW BLOCK
                                    <button
                                        onClick={() => updateUserField(user.id, 'status', 'pending')}
                                        className="AdminUserManagement-action-button reconsider" // New class for styling
                                        title="Volta a colocar o utilizador no estado pendente para aprovação"
                                    >
                                        Reconsiderar
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