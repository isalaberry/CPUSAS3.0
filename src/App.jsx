import NavBar from './components/NavBar';
import { Title } from './components/Title';
import UserButton from './components/UserButton';
import { Outlet } from 'react-router-dom'
import LanguageSwitcher from './components/LanguageSwitcher';
import './App.css';

export function App() {
  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>


        <div style={{ display: 'flex',  alignItems: 'center', marginLeft: '20px', marginRight: '80px' }}>

          <div className="flex-1">
            <Title />
          </div>

          <div style={{ marginLeft: '20px' }}>
            <UserButton />
          
          </div>

        </div>

        <div className='bg-blue-200 p-8' style={{ width: '100%' }}>
          <NavBar />
          <Outlet /> 
        </div>
      </div>
      <div style={{ top: '10px', position: 'fixed', right: '20px', zIndex: 1000 }}>
          <LanguageSwitcher />
      </div>



    </div>
  );
}

