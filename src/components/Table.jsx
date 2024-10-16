import React from 'react';

const Table = ({ processes }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Arrival Time</th>
          <th>Running Time</th>
        </tr>
      </thead>
      <tbody>
        {processes.map((process) => (
          <tr key={process.id}>
            <td>P{process.id}</td>
            <td>{process.arrivalTime}</td>
            <td>{process.runningTime}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
