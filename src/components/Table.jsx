import React, { Component } from "react";
import { GridProcess } from './GridProcess';
import Cookies from 'js-cookie';
import './../App.css';

 // *Renderiza* a tabela de processos
const Table = ({ processes, handleInputChange }) => { //handleInputChange é chamado sempre que um input é alterado
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

// Gerencia a tabela de processos
class InputTable extends Component {
  constructor(props) {// construtor da tabela
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
    this.saveProcessesToCookies = this.saveProcessesToCookies.bind(this);
  }

  componentDidMount() { //carregar dos cookies (js-cookie library)
    const savedProcesses = Cookies.get('processes');
    if (savedProcesses) {
      this.setState({ processes: JSON.parse(savedProcesses) });
    }
  }

  saveProcessesToCookies(processes) { //salvar nos cookies (js-cookie library) por 7 dias
    Cookies.set('processes', JSON.stringify(processes), { expires: 7 }); 
  }

  addProcess() {
    this.setState((prevState) => {
      const totalProcess = prevState.totalProcess + 1;
      const newProcess = {
        id: totalProcess,
        arrivalTime: 0,
        runningTime: 0,
      };
      const updatedProcesses = [...prevState.processes, newProcess];
      this.saveProcessesToCookies(updatedProcesses);
      return {
        totalProcess,
        processes: updatedProcesses,
      };
    });
  }

  deleteProcess() {
    this.setState((prevState) => {
      const processes = prevState.processes.slice(0, -1);
      this.saveProcessesToCookies(processes);
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
      this.saveProcessesToCookies(processes);
      return { processes };
    });
  }

  render() {
    const { processes } = this.state;

    return (
      <div className="screen">
        <div className="container">
          <Table processes={processes} handleInputChange={this.handleInputChange} />
        </div>

        <div className="button-container">
          <button className="button" onClick={this.addProcess}>
            Add Process
          </button>
          <button className="button" onClick={this.deleteProcess}>
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

export default InputTable;