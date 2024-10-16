import React from 'react';
import { Link } from "react-router-dom";

export function NavBar() {
  const [activeItem, setActiveItem] = React.useState('');

  // Função para definir o item ativo ao clicar
  const handleSetActive = (item) => {
    setActiveItem(item);
  };

  return (
    <nav className="navbar">
      <ul className="nav-list">
        <li className="nav-item">
          <Link 
            to="/fifo" 
            className={`nav-link ${activeItem === 'fifo' ? 'active' : ''}`}
            onClick={() => handleSetActive('fifo')} // Define o item ativo ao clicar
          >
            First-In-First-Out
          </Link>
        </li>
        <li className="nav-item">
          <Link 
            to="/sjf" 
            className={`nav-link ${activeItem === 'sjf' ? 'active' : ''}`}
            onClick={() => handleSetActive('sjf')} // Define o item ativo ao clicar
          >
            Shortest Job First
          </Link>
        </li>
        <li className="nav-item">
          <Link 
            to="/pnp" 
            className={`nav-link ${activeItem === 'pnp' ? 'active' : ''}`}
            onClick={() => handleSetActive('pnp')} // Define o item ativo ao clicar
          >
            Priorities no Preemptive
          </Link>
        </li>
        <li className="nav-item">
          <Link 
            to="/pp" 
            className={`nav-link ${activeItem === 'pp' ? 'active' : ''}`}
            onClick={() => handleSetActive('pp')} // Define o item ativo ao clicar
          >
            Priorities Preemptive
          </Link>
        </li>
        <li className="nav-item">
          <Link 
            to="/rr" 
            className={`nav-link ${activeItem === 'rr' ? 'active' : ''}`}
            onClick={() => handleSetActive('rr')} // Define o item ativo ao clicar
          >
            Round Robin
          </Link>
        </li>
      </ul>
    </nav>
  );
}

export default NavBar;
