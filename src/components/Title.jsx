import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';

export function Title() {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  const handleClick = () => {
    if (!user) {
      navigate('/');
    }
    if(user) {
      navigate('/user-data-page');
    }
  };

  return (
    <div className="title-container" onClick={handleClick}>
      <h1 className="title">
        CPU SCHEDULING ALGORITHMS SIMULATOR
      </h1>
    </div>
  );
}

export default Title;