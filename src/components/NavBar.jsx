import React, { useContext, useState, useEffect } from 'react';
import { Link } from "react-router-dom";
import { UserContext } from './UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // Adjust path

export function NavBar() {
    const { userProfile } = useContext(UserContext);
    const [activeItem, setActiveItem] = React.useState('');
    const [visibility, setVisibility] = useState({ // Default visibility
        fifo: true,
        sjf: true,
        pnp: true,
        pp: true,
        rr: true,
    });

    useEffect(() => {// Inside NavBar.js -> useEffect -> fetchVisibility
        const fetchVisibility = async () => {
            console.log("NavBar: Attempting to fetch visibility config..."); // Log start
            const configDocRef = doc(db, "appConfig", "visibility");
            try {
                const docSnap = await getDoc(configDocRef);
                if (docSnap.exists()) {
                    console.log("NavBar: Visibility document found!"); // Log success
                    const fetchedData = docSnap.data();
                    console.log("NavBar: Fetched visibility data:", fetchedData); // Log the data itself
                    setVisibility(fetchedData);
                } else {
                    // Document non-existent
                    console.log("NavBar: Visibility config document '/appConfig/visibility' not found, using defaults.");
                }
            } catch (error) {
                // Error during fetch
                console.error("NavBar: Error fetching visibility config:", error);
            }
        };
        fetchVisibility();
    }, []); // Fetch once on mount

    const handleSetActive = (item) => {
        setActiveItem(item);
    };

    return (
        <nav className="navbar">
            <ul className="nav-list">
                {visibility.fifo && ( /* Check visibility */
                    <li className="nav-item">
                        <Link to="/fifo" /* ... */>First-In-First-Out</Link>
                    </li>
                )}
                 {visibility.sjf && ( /* Check visibility */
                    <li className="nav-item">
                        <Link to="/sjf" /* ... */>Shortest Job First</Link>
                    </li>
                 )}
                 {visibility.sjf && ( /* Check visibility */
                    <li className="nav-item">
                        <Link to="/pnp" /* ... */>Priorities no preemptive</Link>
                    </li>
                 )}
                 {visibility.sjf && ( /* Check visibility */
                    <li className="nav-item">
                        <Link to="/pp" /* ... */>Priorities Preemptive</Link>
                    </li>
                 )}
                 {visibility.sjf && ( /* Check visibility */
                    <li className="nav-item">
                        <Link to="/rr" /* ... */>Round Robin</Link>
                    </li>
                 )}
                 {/* Repeat for other algorithms (pnp, pp, rr) */}

                 {/* Admin Links */}
                 {userProfile?.role === 'admin' && (
                    <>
                        <li className="nav-item">
                            <Link to="/admin/users" onClick={() => handleSetActive('admin-users')}>Manage Users</Link>
                        </li>
                        <li className="nav-item">
                             <Link to="/admin/settings" onClick={() => handleSetActive('admin-settings')}>Settings</Link>
                        </li>
                    </>
                 )}
            </ul>
        </nav>
    );
}

export default NavBar;