import React from 'react';
import { useTranslation } from 'react-i18next';
import './../App.css';


const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

return (
    <div className="language-switcher">
        <button 
            onClick={() => changeLanguage('pt')} 
            className={i18n.language === 'pt' ? 'active' : ''}
            aria-label="Mudar para Português"
        >
            <img 
                src="/assets/flags/ptbr.png" 
                alt="PT Flag"
                style={{ maxWidth: '40px', maxHeight: '20px' }}
            />    
        </button>
        <button 
            onClick={() => changeLanguage('en')} 
            className={i18n.language === 'en' ? 'active' : ''}
            aria-label="Switch to English"
        >
            <img 
                src="/assets/flags/eng.jpg" 
                alt="EN Flag" 
                style={{ maxWidth: '40px', maxHeight: '20px' }}
            />   
        </button>
    </div>
);
};

export default LanguageSwitcher;