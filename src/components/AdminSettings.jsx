import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../App.css';
import { useTranslation } from 'react-i18next';

const AdminSettings = () => {
    console.log("AdminSettings: Component rendering or re-rendering.");

    const initialSettings = useMemo(() => ({
        fifo: true,
        sjf: true,
        pnp: true,
        pp: true,
        rr: true,
    }), []);

    const settingKeys = useMemo(() => Object.keys(initialSettings), [initialSettings]);

    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { t } = useTranslation();

    const settingsDocRef = useMemo(() => doc(db, "appConfig", "visibility"), []);

    const fetchSettings = async () => {
        console.log("AdminSettings: fetchSettings called.");
        setError('');
        setMessage('');
        try {
            const docSnap = await getDoc(settingsDocRef);

            if (docSnap.exists()) {
                const fetchedData = docSnap.data();
                const completeSettings = { ...initialSettings };
                settingKeys.forEach(key => {
                    if (fetchedData.hasOwnProperty(key) && typeof fetchedData[key] === 'boolean') {
                        completeSettings[key] = fetchedData[key];
                    }
                });
                setSettings(completeSettings);
            } else {
                setSettings(initialSettings);
            }
        } catch (err) {
            setError(t('adminSettingsErrorLoad'));
            setSettings(initialSettings);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: checked
        }));
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await setDoc(settingsDocRef, settings);
            setMessage(t('adminSettingsSuccessSave'));
        } catch (err) {
            setError(t('adminSettingsErrorSave'));
        } finally {
            setSaving(false);
        }
    };


    if (loading) return <div className="loading-container"><div className="loading-spinner"></div></div>;


    return (
        <div className="AdminSettings-page">
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 300, margin: 30 }}>{t('adminSettingsTitle')}</h2>
            <h3 style={{ marginTop: '70px'}}>{t('adminSettingsVisibilityTitle')}</h3>

            {error && <div className="AdminSettings-error-message">{error}</div>}
            {message && <div className="AdminSettings-success-message">{message}</div>}

            <div className="AdminSettings-settings-form">
                {settingKeys.map(key => (
                    <div key={key} className="AdminSettings-setting-item">
                        <label>
                            <input
                                type="checkbox"
                                name={key}
                                checked={settings[key] === true}
                                onChange={handleCheckboxChange}
                                disabled={saving}
                            />
                            {t('adminSettingsShowLabel', { algorithm: key.toUpperCase() })}
                        </label>
                    </div>
                ))}
            </div>

            <button
                onClick={handleSaveChanges}
                disabled={saving || loading}
                className="AdminSettings-save-button"
            >
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
};

export default AdminSettings;