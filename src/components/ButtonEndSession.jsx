import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt } from 'react-icons/fa';

const ButtonEndSession = ({ onClick }) => {
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
                position: 'fixed',
                top: '10px',
                right: '10px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <span style={{ marginRight: '8px', color: '#646de8', fontSize: '16px' }}>Log out</span>
            <FaSignOutAlt size={24} color="#646de8" />
        </button>
    );
};

export default ButtonEndSession;