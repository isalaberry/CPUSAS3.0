import NavBar from './components/NavBar';
import { Title } from './components/Title';
import UserButton from './components/User';
import { Route, Routes} from "react-router-dom";
import { Fifo, Sjf, Pnp, Pp, Rr } from "./components";


export function App() {
  return (
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
        <Routes>
          <Route path="/" element={<Fifo />} />
          <Route path="/fifo" element={<Fifo />} />
          <Route path="/sjf" element={<Sjf />} />
          <Route path="/pnp" element={<Pnp />} />
          <Route path="/pp" element={<Pp />} />
          <Route path="/rr" element={<Rr />} />
        </Routes>
      </div>
    </div>
  );
}

