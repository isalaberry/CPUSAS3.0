// src/components/AdminSettings.js
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo just in case
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import '../App.css';

const AdminSettings = () => {
    console.log("AdminSettings: Component rendering or re-rendering.");

    // Define initial settings structure (should be stable)
    const initialSettings = useMemo(() => ({ // Wrap in useMemo for guaranteed stability
        fifo: true,
        sjf: true,
        pnp: true,
        pp: true,
        rr: true,
    }), []); // Empty dependency array - created once

    const settingKeys = useMemo(() => Object.keys(initialSettings), [initialSettings]); // Stable keys

    const [settings, setSettings] = useState(initialSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Stable reference to the Firestore document
    const settingsDocRef = useMemo(() => doc(db, "appConfig", "visibility"), []); // Stable ref

    // Fetch settings function - REMOVED useCallback as it's only called by useEffect now
    const fetchSettings = async () => {
        console.log("AdminSettings: fetchSettings called.");
        // Ensure loading is true if called again manually (though not planned now)
        // setLoading(true); // Not needed for initial load as it starts true
        setError('');
        setMessage('');
        try {
            console.log("AdminSettings: Attempting to get document:", settingsDocRef.path);
            const docSnap = await getDoc(settingsDocRef);
            console.log("AdminSettings: getDoc promise resolved. Exists:", docSnap.exists());

            if (docSnap.exists()) {
                const fetchedData = docSnap.data();
                console.log("AdminSettings: Fetched data:", fetchedData);
                // Merge defaults and fetched data
                const completeSettings = { ...initialSettings };
                settingKeys.forEach(key => {
                    if (fetchedData.hasOwnProperty(key) && typeof fetchedData[key] === 'boolean') {
                        completeSettings[key] = fetchedData[key];
                    }
                });
                console.log("AdminSettings: Setting state with:", completeSettings);
                setSettings(completeSettings);
            } else {
                console.log("AdminSettings: Document does not exist. Using defaults:", initialSettings);
                setSettings(initialSettings);
            }
        } catch (err) {
            console.error("AdminSettings: Error fetching settings:", err);
            setError("Failed to load settings.");
            setSettings(initialSettings);
        } finally {
            console.log("AdminSettings: fetchSettings finally block. Setting loading false.");
            setLoading(false); // Set loading false AFTER fetch attempt
        }
    };

    // useEffect to run fetchSettings ONLY ONCE on component mount
    useEffect(() => {
        console.log("AdminSettings: useEffect mounting, calling fetchSettings.");
        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // <<-- EMPTY DEPENDENCY ARRAY HERE

    // Handle checkbox changes (remains the same)
    const handleCheckboxChange = (event) => {
        const { name, checked } = event.target;
        console.log(`AdminSettings: Checkbox changed - Name: ${name}, Checked: ${checked}`);
        setSettings(prevSettings => ({
            ...prevSettings,
            [name]: checked
        }));
    };

    // Save settings to Firestore (remains the same)
    const handleSaveChanges = async () => {
        console.log("AdminSettings: handleSaveChanges called. Saving data:", settings);
        setSaving(true);
        setError('');
        setMessage('');
        try {
            await setDoc(settingsDocRef, settings);
            console.log("AdminSettings: Save successful.");
            setMessage("Settings saved successfully!");
        } catch (err) {
            console.error("AdminSettings: Error saving settings:", err);
            setError("Failed to save settings.");
        } finally {
            console.log("AdminSettings: handleSaveChanges finally block.");
            setSaving(false);
        }
    };

    console.log("AdminSettings: Rendering component. Loading state:", loading);

    if (loading) {
        return <div>Loading settings...</div>;
    }

    // Render the settings form... (JSX remains the same as previous version)
    return (
        <div className="AdminSettings-page">
            <h2 style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 300, margin: 30 }}>Application Settings</h2>
            <h3 style={{ marginTop: '70px'}}>Algorithm Visibility in Navbar</h3>

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
                            Show {key.toUpperCase()}
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