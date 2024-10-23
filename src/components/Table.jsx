import React, { Component } from "react";
import { GridProcess } from './GridProcess';
import './../App.css';


const Table = ({ processes, handleInputChange }) => {
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
        {processes.map((process, index) => (
          <tr key={process.id}>
            <td>P{process.id}</td>
            <td>
              <input
                type="number"
                value={process.arrivalTime}
                onChange={(e) => handleInputChange(index, "arrivalTime", Number(e.target.value))}
                className="input-table"
              />
            </td>
            <td>
              <input
                type="number"
                value={process.runningTime}
                onChange={(e) => handleInputChange(index, "runningTime", Number(e.target.value))}
                className="input-table"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};


class InputTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalProcess: 0,
      processes: [],
      isIoEnabled: false,
      timeQuantum: 2,
    };
    this.addProcess = this.addProcess.bind(this);
    this.deleteProcess = this.deleteProcess.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  addProcess() {
    this.setState((prevState) => {
      const totalProcess = prevState.totalProcess + 1;
      const newProcess = {
        id: totalProcess,
        arrivalTime: 0, // Inicializa como 0, pode ser modificado posteriormente
        runningTime: 0, // Inicializa como 0, pode ser modificado posteriormente
      };
      return {
        totalProcess,
        processes: [...prevState.processes, newProcess],
      };
    });
  }

  deleteProcess() {
    this.setState((prevState) => {
      const processes = prevState.processes.slice(0, -1);
      return {
        totalProcess: processes.length,
        processes,
      };
    });
  }

  handleInputChange(index, field, value) {
    this.setState((prevState) => {
      const processes = [...prevState.processes];
      processes[index] = { ...processes[index], [field]: value };
      return { processes };
    });
  }

  render() {
    const { processes } = this.state;

    return (
      <div style={styles.screen}>
        <div style={styles.container}>
          <Table processes={processes} handleInputChange={this.handleInputChange} />
        </div>

        <div style={{ paddingBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <button style={styles.button} onClick={this.addProcess}>
            Add Process
          </button>
          <button style={styles.button} onClick={this.deleteProcess}>
            Delete Process
          </button>
        </div>

        <div className='bg-white h-screen'>
          <GridProcess tableInfos={processes} />
        </div>
      </div>
    );
  }
}


const styles = {
  screen: {
    display: 'flex',
    flexDirection: 'column',
    padding: '20px',
  },
  switchContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  switchText: {
    marginRight: '10px',
  },
  quantumContainer: {
    display: 'flex',
    alignItems: 'center',
    marginVertical: '10px',
  },
  quantumText: {
    marginRight: '10px',
  },
  quantumInput: {
    border: '1px solid #ccc',
    padding: '5px',
    width: '60px',
    textAlign: 'center',
  },
  container: {
    padding: '20px',
  },
  inputRow: {
    display: 'flex',
    marginTop: '10px',
  },
  button: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cellInput: {
    border: '1px solid #ccc',
    padding: '5px',
    marginRight: '10px',
    textAlign: 'center',
  },
};

export default InputTable;
