import React from 'react';

const Table = ({ processes, handleInputChange, showPriority, showQuantum }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Arrival Time</th>
          <th>Running Time</th>
          {showPriority && <th>Priority</th>}
          {showQuantum && <th>Quantum</th>}
        </tr>
      </thead>
      <tbody>
        {processes.map((process, index) => (
          <tr key={index}>
            <td>P{process.id}</td>
            <td>
              <input
                type="number"
                value={process.arrivalTime}
                onChange={(e) => handleInputChange && handleInputChange(index, "arrivalTime", Number(e.target.value))}
                className="input-table"
                readOnly={!handleInputChange}
              />
            </td>
            <td>
              <input
                type="number"
                value={process.runningTime}
                onChange={(e) => handleInputChange && handleInputChange(index, "runningTime", Number(e.target.value))}
                className="input-table"
                readOnly={!handleInputChange}
              />
            </td>
            {showPriority && (
              <td>
                <input
                  type="number"
                  value={process.priority}
                  onChange={(e) => handleInputChange && handleInputChange(index, "priority", Number(e.target.value))}
                  className="input-table"
                  readOnly={!handleInputChange}
                />
              </td>
            )}
            {showQuantum && (
              <td>
                <input
                  type="number"
                  value={process.quantum}
                  onChange={(e) => handleInputChange && handleInputChange(index, "quantum", Number(e.target.value))}
                  className="input-table"
                  readOnly={!handleInputChange}
                />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;