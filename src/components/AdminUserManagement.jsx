import React, { useState, useEffect, useCallback, useContext } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserContext } from './UserContext';
import '../App.css';

const AdminUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { userProfile } = useContext(UserContext);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const usersQuery = query(collection(db, "users"), orderBy("email"));
            const querySnapshot = await getDocs(usersQuery);
            const usersList = querySnapshot.docs.map(docSnapshot => ({
                id: docSnapshot.id,
                ...docSnapshot.data()
            }));
            setUsers(usersList);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError("Falha ao carregar utilizadores.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const updateUserField = async (userId, field, value) => {
        setError('');
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
                [field]: value
            });
            fetchUsers();
        } catch (err) {
            console.error(`Error updating user ${field}:`, err);
            setError(`Falha ao atualizar ${field} do utilizador.`);
        }
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
    if (error) return <div className="AdminUserManagement-error-message">{error}</div>;

    return (
        <div className="AdminUserManagement-page">
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 300, margin: 30 }}>Gestão de Utilizadores</h2>

            <button
                onClick={fetchUsers}
                disabled={loading}
                className="AdminUserManagement-refresh-button"
            >
                Atualizar Lista
            </button>

            <table className="AdminUserManagement-table">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>{user.role}</td>
                            <td>{user.status}</td>
                            <td className="AdminUserManagement-actions-cell">
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
                                {user.status === 'approved' && userProfile && (
                                    <>
                                        {user.role !== 'admin' && (
                                            <button
                                                onClick={() => updateUserField(user.id, 'role', 'admin')}
                                                className="AdminUserManagement-action-button promote"
                                            >
                                                Tornar Admin
                                            </button>
                                        )}
                                        {user.role === 'admin' && user.id !== userProfile.uid && (
                                            <button
                                                onClick={() => updateUserField(user.id, 'role', 'user')}
                                                className="AdminUserManagement-action-button demote"
                                            >
                                                Tornar User
                                            </button>
                                        )}
                                        {user.role === 'admin' && user.id === userProfile.uid && (
                                            <span className="AdminUserManagement-current-admin-indicator">(Você)</span>
                                        )}
                                        {user.id !== userProfile.uid && (
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
                                {user.status === 'rejected' && (
                                    <button
                                        onClick={() => updateUserField(user.id, 'status', 'pending')}
                                        className="AdminUserManagement-action-button reconsider"
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