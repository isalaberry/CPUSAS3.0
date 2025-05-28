import React from 'react';

const Table = ({ processes, handleInputChange, showPriority, showQuantum, idPrefix = "P", nameColumnHeader = "Name"}) => {
  if (!Array.isArray(processes)) {
    console.error("Processes must be an array");
    console.log(processes);
    return null;
  }
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
            <td>{idPrefix}{process.id}</td>
            <td>
              <input
                type="number"
                min="0"
                value={process.arrivalTime}
                onChange={(e) => handleInputChange && handleInputChange(index, "arrivalTime", Number(e.target.value))}
                className="input-table"
                readOnly={!handleInputChange}
              />
            </td>
            <td>
              <input
                type="number"
                min={nameColumnHeader === "ID" ? "1" : "1"}
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
                  min="0"
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
                  min="1"
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