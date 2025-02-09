import React from 'react';
import { Link } from 'react-router-dom';


const ButtonTypeOne = ({ to, children }) => {
    return (
        <Link to={to} style={{ textDecoration: 'none' }}>
            <button
                style={{
                    backgroundColor: '#194569',
                    borderRadius: '20px',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    cursor: 'pointer',
                    margin: '10px',
                    width: '40%',
                    minWidth: '300px',
                }}
            >
                {children}
            </button>
        </Link>
    );
};

export default ButtonTypeOne;