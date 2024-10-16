import './App.css';
import NavBar from './components/NavBar';
import { Title } from './components/Title';
import { Route, Routes} from "react-router-dom";
import { Fifo, Sjf, Pnp, Pp, Rr } from "./components";



export function App() {
  return (<div>
        <div>
        <Title/>
        </div>


        <div className='bg-blue-200 p-8'>
          <NavBar/>
            <Routes>
              <Route path="/fifo" element={<Fifo />} />
              <Route path="/sjf" element={<Sjf />} />
              <Route path="/pnp" element={<Pnp />} />
              <Route path="/pp" element={<Pp />} />
              <Route path="/rr" element={<Rr />} />
            </Routes>

        </div>


    
</div>);}

