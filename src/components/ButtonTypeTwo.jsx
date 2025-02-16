import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';

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
            className="button-type-two"
        >
            {children}
        </button>
    );
};

export default ButtonTypeTwo;