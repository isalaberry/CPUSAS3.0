import React from 'react';
import { FaUser } from 'react-icons/fa';
import './../App.css'; 
import { Link } from 'react-router-dom';

const UserButton = () => {

    return (
        <Link to="/user-data-page" className="user-button">
            <FaUser size={24} />
        </Link>
    );
};

export default UserButton;