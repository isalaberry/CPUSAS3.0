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
            setError(t('adminUserManagementError'));
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
                 setError(t('adminUserManagementCannotChangeOwnStatusOrRole'));
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
            setError(t('adminUserManagementUpdateUserFieldError', { field: t(`adminUserManagement${field.charAt(0).toUpperCase() + field.slice(1)}Header`) || field }));
        }
    };

        // Helper function to get translated status
    const getTranslatedStatus = (statusKey) => {
        const key = `adminUserManagementStatus${statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}`;
        // Fallback to statusKey if translation not found, though ideally all statuses should be translated
        return t(key, { defaultValue: statusKey });
    };

    // Helper function to get translated role
    const getTranslatedRole = (roleKey) => {
        const key = `adminUserManagementRole${roleKey.charAt(0).toUpperCase() + roleKey.slice(1)}`;
        // Fallback to roleKey if translation not found
        return t(key, { defaultValue: roleKey });
    };

    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;
    if (error) return <div className="AdminUserManagement-error-message">{error}</div>;

    return (
        <div className="AdminUserManagement-page">
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 300, margin: 30 }}>{t('adminUserManagementTitle')}</h2>

            <button
                onClick={fetchUsers}
                disabled={loading}
                className="AdminUserManagement-refresh-button"
            >
                {t('adminUserManagementRefreshButton')}
            </button>

            <table className="AdminUserManagement-table">
                <thead>
                    <tr>
                        <th>{t('adminUserManagementEmailHeader')}</th>
                        <th>{t('adminUserManagementRoleHeader')}</th>
                        <th>{t('adminUserManagementStatusHeader')}</th>
                        <th>{t('adminUserManagementActionsHeader')}</th>
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
                                            {t('adminUserManagementApproveButton')}
                                        </button>
                                        <button
                                            onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                            className="AdminUserManagement-action-button reject"
                                        >
                                            {t('adminUserManagementRejectButton')}
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
                                                {t('adminUserManagementMakeAdminButton')}
                                            </button>
                                        )}
                                        {user.role === 'admin' && user.id !== userProfile.uid && (
                                            <button
                                                onClick={() => updateUserField(user.id, 'role', 'user')}
                                                className="AdminUserManagement-action-button demote"
                                            >
                                                {t('adminUserManagementMakeUserButton')}
                                            </button>
                                        )}
                                        {user.role === 'admin' && user.id === userProfile.uid && (
                                            <span className="AdminUserManagement-current-admin-indicator">{t('adminUserManagementYouIndicator')}</span>
                                        )}
                                        {user.id !== userProfile.uid && (
                                            <button
                                                onClick={() => updateUserField(user.id, 'status', 'rejected')}
                                                className="AdminUserManagement-action-button reject"
                                                title={t('adminUserManagementDeactivateTitle')}
                                            >
                                                 {t('adminUserManagementDeactivateButton')}
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
                                        {t('adminUserManagementReconsiderButton')}
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