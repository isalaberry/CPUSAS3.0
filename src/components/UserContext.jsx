import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [account, setAccount] = useState(null);
    const [tables, setTables] = useState(null);

    return (
        <UserContext.Provider value={{ user, setUser, account, setAccount, tables, setTables }}>
            {children}
        </UserContext.Provider>
    );
};


