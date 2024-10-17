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
            <div className="flex flex-col gap-4 justify-end">
              <p className="titletwo">Enter or generate process info:</p>

              <div className="input-group">
                <label htmlFor="arrivalTime" className="labelTable">Arrival Time:</label>
                <input
                  id="arrivalTime"
                  type="number"
                  placeholder="Enter Arrival Time"
                  className="input"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="runningTime" className="labelTable">Running Time:</label>
                <input
                  id="runningTime"
                  type="number"
                  placeholder="Enter Running Time"
                  className="input"
                  value={runningTime}
                  onChange={(e) => setRunningTime(e.target.value)}
                  required
                />
              </div>

              <div className='text-right'>
                <button
                  type="submit"
                  className="button"
                >
                  Insert Process
                </button>
              </div>
            </div>
          </div>

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
