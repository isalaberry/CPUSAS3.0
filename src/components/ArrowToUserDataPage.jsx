import React from 'react';
import { Link } from 'react-router-dom';

const ArrowToUserDataPage = () => {
    return (
        <Link to="/user-data-page" style={{ textDecoration: 'none' }}>
            <div style={{ marginLeft: '60px', marginTop:'40px' }}>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ marginRight: '8px' }}
                >
                    <path
                        d="M12 20L13.41 18.59L7.83 13H20V11H7.83L13.41 5.41L12 4L4 12L12 20Z"
                        fill="currentColor"
                    />
                </svg>
                
            </div>
        </Link>
    );
};

export default ArrowToUserDataPage;