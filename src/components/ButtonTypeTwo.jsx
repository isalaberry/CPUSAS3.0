import React from 'react';
import { useNavigate } from 'react-router-dom';

const ButtonTypeTwo = ({ onClick, children }) => {
    const navigate = useNavigate();

    const handleClick = async () => {
        if (onClick) {
            await onClick();
        }
        navigate('/user-data-page');
    };

    return (
        <button
            onClick={handleClick}
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
    );
};

export default ButtonTypeTwo;