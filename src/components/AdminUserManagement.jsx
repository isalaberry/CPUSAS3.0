import React, { useState, useEffect, useCallback, useContext } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { UserContext } from './UserContext';
import '../App.css';
import { useTranslation } from 'react-i18next';

const AdminUserManagement = () => {
    const { t } = useTranslation();
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
            setError(t('adminUserManagement.error'));
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
                 setError(t('adminUserManagement.cannotChangeOwnStatusOrRole'));
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
            setError(t('adminUserManagement.updateUserFieldError', { field: t(`adminUserManagement.${field.charAt(0) + field.slice(1)}Header`) || field }));
        }
    };

        // Helper function to get translated status
    const getTranslatedStatus = (statusKey) => {
        const key = `adminUserManagement.status${statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}`;
        // Fallback to statusKey if translation not found, though ideally all statuses should be translated
        return t(key, { defaultValue: statusKey });
    };

    // Helper function to get translated role
    const getTranslatedRole = (roleKey) => {
        const key = `adminUserManagement.role${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}`;
        // Fallback to roleKey if translation not found
        return t(key, { defaultValue: roleKey });
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
    if (error) return <div className="AdminUserManagement-error-message">{error}</div>;

    return (
        <div className="AdminUserManagement-page">
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 300, margin: 30 }}>{t('adminUserManagement.title')}</h2>

            <button
                onClick={fetchUsers}
                disabled={loading}
                className="AdminUserManagement-refresh-button"
            >
                {t('adminUserManagement.refreshButton')}
            </button>

            <table className="AdminUserManagement-table">
                <thead>
                    <tr>
                        <th>{t('adminUserManagement.emailHeader')}</th>
                        <th>{t('adminUserManagement.roleHeader')}</th>
                        <th>{t('adminUserManagement.statusHeader')}</th>
                        <th>{t('adminUserManagement.actionsHeader')}</th>
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
                                            {t('adminUserManagement.approveButton')}
                                        </button>
                                        <button
                                            onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                            className="AdminUserManagement-action-button reject"
                                        >
                                            {t('adminUserManagement.rejectButton')}
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
                                                {t('adminUserManagement.makeAdminButton')}
                                            </button>
                                        )}
                                        {user.role === 'admin' && user.id !== userProfile.uid && (
                                            <button
                                                onClick={() => updateUserField(user.id, 'role', 'user')}
                                                className="AdminUserManagement-action-button demote"
                                            >
                                                {t('adminUserManagement.makeUserButton')}
                                            </button>
                                        )}
                                        {user.role === 'admin' && user.id === userProfile.uid && (
                                            <span className="AdminUserManagement-current-admin-indicator">{t('adminUserManagement.youIndicator')}</span>
                                        )}
                                        {user.id !== userProfile.uid && (
                                            <button
                                                onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                                className="AdminUserManagement-action-button reject"
                                                title={t('adminUserManagement.deactivateTitle')}
                                            >
                                                 {t('adminUserManagement.deactivateButton')}
                                            </button>
                                        )}
                                    </>
                                )}
                                {user.status === 'rejected' && (
                                    <button
                                        onClick={() => updateUserField(user.id, 'status', 'pending')}
                                        className="AdminUserManagement-action-button reconsider"
                                        title={t('adminUserManagementReconsiderTitle')}
                                    >
                                        {t('adminUserManagement.reconsiderButton')}
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