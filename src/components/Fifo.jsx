import React, { useState } from 'react';
import Table from './Table';
import { GridProccess } from './GridProccess';
import './../App.css'; // Importando o CSS

export const Fifo = () => {
  const [arrivalTime, setArrivalTime] = useState('');
  const [runningTime, setRunningTime] = useState('');
  const [processes, setProcesses] = useState([]);

  const handleInsertProcess = (e) => {
    e.preventDefault();

    if (processes.length >= 10) {
      alert('You cannot add more than 10 processes.');
      return;
    }

    if (parseInt(runningTime) > 10) {
      alert('Running time cannot be greater than 10.');
      return;
    }

    if (parseInt(runningTime) < 1) {
      alert('Running time cannot be less than 1.');
      return;
    }

    if (parseInt(arrivalTime) < 0) {
      alert('Arrival time cannot be less than 0.');
      return;
    }

    const newProcess = {
      id: processes.length + 1,
      arrivalTime,
      runningTime,
    };

    setProcesses([...processes, newProcess]);
    setArrivalTime('');
    setRunningTime('');
  };

  return (
    <div>
      <form onSubmit={handleInsertProcess}>
        <div className="container">

          <div className="card">
            <Table processes={processes} />
          </div>
          
        </div>
      </form>

      <div className='bg-white h-screen pt-5'>
        <GridProccess tableInfos={processes} />
      </div>
    </div>
  );
};
