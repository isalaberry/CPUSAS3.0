import React, { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path if needed
import '../App.css';

const AdminSettings = () => {
    const initialSettings = {
        fifoVisible: true,
        sjfVisible: true,
        pnpVisible: true,
        ppVisible: true,
        rrVisible: true,
    };
    const settingKeys = Object.keys(initialSettings);

    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const settingsDocRef = doc(db, "appConfig", "visibility"); // Reference to your settings document

    // Fetch settings on mount
    const fetchSettings = useCallback(async () => {
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const docSnap = await getDoc(settingsDocRef);
            if (docSnap.exists()) {
                // Merge fetched data with initial settings to ensure all keys exist
                setSettings({ ...initialSettings, ...docSnap.data() });
            } else {
                // Document doesn't exist, use initial settings
                console.log("Visibility config not found, using defaults.");
                setSettings(initialSettings);
                // Optional: Save the default settings if they don't exist
                // await setDoc(settingsDocRef, initialSettings);
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
            setError("Failed to load settings.");
            setSettings(initialSettings); // Fallback to defaults on error
        } finally {
            setLoading(false);
        }
    }, [settingsDocRef]); // Include dependency

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Handle checkbox changes
    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: checked
        }));
    };

    // Save settings to Firestore
    const handleSaveChanges = async () => {
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await setDoc(settingsDocRef, settings, { merge: true }); // Use merge: true to avoid overwriting unrelated fields if any
            setMessage("Settings saved successfully!");
        } catch (err) {
            console.error("Error saving settings:", err);
            setError("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading settings...</div>;

    return (
        <div className="admin-page">
            <h2>Application Settings</h2>
            <h3>Algorithm Visibility in Navbar</h3>

            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}

            <div className="settings-form">
                {settingKeys.map(key => (
                    <div key={key} className="setting-item">
                        <label>
                            <input
                                type="checkbox"
                                name={key}
                                checked={settings[key]}
                                onChange={handleCheckboxChange}
                                disabled={saving}
                            />
                            {/* Make label more readable */}
                            Show {key.replace('Visible', '').toUpperCase()}
                        </label>
                    </div>
                ))}
            </div>

            <button onClick={handleSaveChanges} disabled={saving || loading} className="save-button">
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
};

export default AdminSettings;