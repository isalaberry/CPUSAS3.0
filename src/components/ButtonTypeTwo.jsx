import React from 'react';
import '../App.css';

const ButtonTypeTwo = ({ onClick, children, type = "button", disabled = false }) => {

    return (
        <button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className="button-type-two"
        >
            {children}
        </button>
    );
};

export default ButtonTypeTwo;