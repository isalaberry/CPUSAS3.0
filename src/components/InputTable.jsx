import React, { Component } from "react";
import './../App.css';
import Cookies from 'js-cookie';
import { GridProcess } from './GridProcess';

const Table = ({ processes, handleInputChange, showPriority }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Arrival Time</th>
          <th>Running Time</th>
          {showPriority && <th>Priority</th>}
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
            {showPriority && (
              <td>
                <input
                  type="number"
                  value={process.priority}
                  onChange={(e) => handleInputChange(index, "priority", Number(e.target.value))}
                  className="input-table"
                />
              </td>
            )}
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
      tempProcesses: [],
      history: [[]],
      isIoEnabled: false,
      timeQuantum: 2,
      time: 0,
      showGanttChart: false,
    };
    this.addProcess = this.addProcess.bind(this);
    this.deleteProcess = this.deleteProcess.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.saveHistoryToCookies = this.saveHistoryToCookies.bind(this);
    this.generateGanttChart = this.generateGanttChart.bind(this);
  }

  componentDidMount() {
    const savedHistory = Cookies.get('history');
    if (savedHistory) {
      const history = JSON.parse(savedHistory);
      this.setState({ 
        history,
        processes: history[0] || [],
        tempProcesses: history[0] || [],
      });
    }
  }

  saveHistoryToCookies(history) {
    Cookies.set('history', JSON.stringify(history), { expires: 7 });
  }

  addProcess() {
    this.setState((prevState) => {
      const totalProcess = prevState.totalProcess + 1;
      const newProcess = {
        id: prevState.totalProcess + 1,
        arrivalTime: 0,
        runningTime: 0,
        priority: 0,
      };
      const updatedProcesses = [...prevState.tempProcesses, newProcess];
      return {
        totalProcess,
        tempProcesses: updatedProcesses,
      };
    });
  }

  deleteProcess() {
    this.setState((prevState) => {
      const processes = prevState.tempProcesses.slice(0, -1);
      return {
        totalProcess: processes.length,
        tempProcesses: processes,
      };
    });
  }

  handleInputChange(index, field, value) {
    if (value < 0) {
      alert(`${field} cannot be negative`);
      return;
    }

    this.setState((prevState) => {
      const tempProcesses = [...prevState.tempProcesses];
      tempProcesses[index] = { ...tempProcesses[index], [field]: value };
      return { tempProcesses };
    });
  }

  generateGanttChart() {
    this.setState((prevState) => {
      const tempProcesses = [...prevState.tempProcesses];

      // Check if any runningTime is zero
      for (let process of tempProcesses) {
        if (process.runningTime <= 0) {
          alert("Running Time must be greater than zero for all processes");
          return { showGanttChart: false };
        }
      }

      // Check if total runningTime exceeds 10
      const totalRunningTime = tempProcesses.reduce((sum, process) => sum + process.runningTime, 0);
      if (totalRunningTime > 10) {
        alert("Total Running Time cannot exceed 10");
        return { showGanttChart: false };
      }

      const updatedHistory = [tempProcesses, ...prevState.history.slice(1)];
      this.saveHistoryToCookies(updatedHistory);
      return {
        processes: tempProcesses,
        history: updatedHistory,
        showGanttChart: true,
      };
    });
  }

  render() {
    const { tempProcesses, showGanttChart } = this.state;
    const { algorithm } = this.props;
    const showPriority = algorithm === 'PP' || algorithm === 'PNP';

    return (
      <div className="screen">
        <div className="container">
          <Table processes={tempProcesses} handleInputChange={this.handleInputChange} showPriority={showPriority} />
        </div>

        <div className="button-container">
          <button className="button" onClick={this.addProcess}>
            Add Process
          </button>
          <button className="button" onClick={this.deleteProcess}>
            Delete Process
          </button>
          <button className="button" onClick={this.generateGanttChart}>
            Generate Gantt Chart
          </button>
        </div>

        {showGanttChart && (
          <div className='bg-white h-screen'>
            <GridProcess tableInfos={this.state.processes} algorithm={algorithm}/> 
          </div>
        )}
      </div>
    );
  }
}

export default InputTable;