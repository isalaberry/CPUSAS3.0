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
  constructor(props) {
    super(props);
    this.state = {
      totalProcess: 0,
      processes: [],
      history: [], // Histórico de processos - array de t arrays de processes
      isIoEnabled: false,
      timeQuantum: 2,
      time: 0, // Tempo inicial
    };
    this.addProcess = this.addProcess.bind(this);
    this.deleteProcess = this.deleteProcess.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.saveHistoryToCookies = this.saveHistoryToCookies.bind(this);
  }

  componentDidMount() { // carregar dos cookies (js-cookie library)
    const savedHistory = Cookies.get('history');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      console.log('Loaded history from cookies:', history); // Log para verificar o carregamento
      this.setState({ 
        history,
        processes: history[history.length - 1] || [], // Define processes como o último item do history ou um array vazio
      });
    }
  }

  saveHistoryToCookies(history) { // salvar o histórico nos cookies (js-cookie library) por 7 dias
    console.log('Saving history to cookies:', history); // Log para verificar a salvamento
    Cookies.set('history', JSON.stringify(history), { expires: 7 });
  }

  addProcess() {
    this.setState((prevState) => {
      const totalProcess = prevState.totalProcess + 1;
      const newProcess = {
        id: prevState.totalProcess + 1, // Garante que o ID seja único
        arrivalTime: 0,
        runningTime: 0,
      };
      const updatedProcesses = [...prevState.processes, newProcess];
      const updatedHistory = [...prevState.history, updatedProcesses];
      this.saveHistoryToCookies(updatedHistory);
      return {
        totalProcess,
        processes: updatedProcesses,
        history: updatedHistory,
      };
    });
  }

  deleteProcess() {
    this.setState((prevState) => {
      const processes = prevState.processes.slice(0, -1);
      const updatedHistory = [...prevState.history, processes];
      this.saveHistoryToCookies(updatedHistory);
      return {
        totalProcess: processes.length,
        processes,
        history: updatedHistory,
      };
    });
  }

  handleInputChange(index, field, value) {
    this.setState((prevState) => {
      const processes = [...prevState.processes];
      processes[index] = { ...processes[index], [field]: value };
      const updatedHistory = [...prevState.history, processes];
      this.saveHistoryToCookies(updatedHistory);
      return { 
        processes, 
        history: updatedHistory,
      };
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