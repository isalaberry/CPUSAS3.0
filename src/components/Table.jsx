import React, { Component } from "react";
import { GridProcess } from './GridProcess';
import './../App.css';


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


class InputTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalProcess: 0,
      processes: [],
      isIoEnabled: false,
      timeQuantum: 2, // Time Quantum
    };
    this.addProcess = this.addProcess.bind(this);
    this.deleteProcess = this.deleteProcess.bind(this);
    this.toggleButton = this.toggleButton.bind(this);
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

  toggleButton() {
    this.setState((prevState) => ({
      isIoEnabled: !prevState.isIoEnabled,
    }));
  }

  handleInputChange(index, field, value) {
    this.setState((prevState) => {
      const processes = [...prevState.processes];
      processes[index] = { ...processes[index], [field]: value };
      return { processes };
    });
  }

  timeQuantamTextInput() {
    return (
      <div style={styles.quantumContainer}>
        <span style={styles.quantumText}>Time Quantum:</span>
        <input
          type="number"
          value={this.state.timeQuantum}
          onChange={(e) => this.setState({ timeQuantum: Number(e.target.value) })}
          style={styles.quantumInput}
        />
      </div>
    );
  }

  render() {
    const { processes, timeQuantum } = this.state;

    return (
      <div style={styles.screen}>
        <div style={styles.switchContainer}>
          <span style={styles.switchText}>I/O Burst: </span>
          <input
            type="checkbox"
            onChange={this.toggleButton}
            checked={this.state.isIoEnabled}
          />
        </div>
        <div style={styles.container}>
          <Table processes={processes} />
          {processes.map((process, index) => (
            <div key={process.id} style={styles.inputRow}>
              <input
                type="number"
                placeholder="Arrival Time"
                value={process.arrivalTime}
                onChange={(e) => this.handleInputChange(index, "arrivalTime", Number(e.target.value))}
                style={styles.cellInput}
              />
              <input
                type="number"
                placeholder="Running Time"
                value={process.runningTime}
                onChange={(e) => this.handleInputChange(index, "runningTime", Number(e.target.value))}
                style={styles.cellInput}
              />
            </div>
          ))}
        </div>
        <button style={styles.button} onClick={this.addProcess}>
          Add Process
        </button>
        <button style={styles.button} onClick={this.deleteProcess}>
          Delete Process
        </button>
        {this.timeQuantamTextInput()}

        {/* Adicionando a div no final */}
        <div className='bg-white h-screen pt-5'>
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
