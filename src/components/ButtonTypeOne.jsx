import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const ButtonTypeOne = ({ to, children }) => {
    const [isPressed, setIsPressed] = React.useState(false);

    return (
        <Link to={to} className="button-type-one-link">
            <button
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                className={`button-type-one ${isPressed ? 'button-type-one:active' : ''}`}
            >
                {children}
            </button>
        </Link>
    );
};

export default ButtonTypeOne;