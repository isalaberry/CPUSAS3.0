import React from 'react';
import ButtonTypeOne from './ButtonTypeOne';
import '../App.css';
import {auth} from '../config/firebase';

const NotLoggedPage = () => {
    console.log(auth?.currentUser?.email);
    return (
        <div className='notlp-background'>
                    <h1 className='notlp-title'>You are not logged yet! <br/> Please, login or register:</h1>
            
            <div>
                <ButtonTypeOne to="/login-page">Login</ButtonTypeOne>
            </div>
            <div>
                <ButtonTypeOne to="/register-page">Register</ButtonTypeOne>
            </div>
       
        </div>
    );
};

export default NotLoggedPage;