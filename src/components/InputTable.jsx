import React, { Component } from "react";
import Cookies from 'js-cookie';
import { GridProcess } from './GridProcess';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Table from './Table';

class InputTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalProcess: 0,
      processes: [],
      tempProcesses: [],
      history: [[]],
      isIoEnabled: false,
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
        quantum: 0,
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

  async generateGanttChart() {
    const tempProcesses = [...this.state.tempProcesses];

    // Check if any runningTime is zero
    for (let process of tempProcesses) {
      if (process.runningTime <= 0) {
        alert("Running Time must be greater than zero for all processes");
        this.setState({ showGanttChart: false });
        return;
      }
    }

    // Check if total runningTime exceeds 10
    const totalRunningTime = tempProcesses.reduce((sum, process) => sum + process.runningTime, 0);
    if (totalRunningTime > 10) {
      alert("Total Running Time cannot exceed 10");
      this.setState({ showGanttChart: false });
      return;
    }

    // Check if all quantums are the same
    const firstQuantum = tempProcesses[0].quantum;
    const allQuantumsSame = tempProcesses.every(process => process.quantum === firstQuantum);
    if (!allQuantumsSame) {
      alert("Quantum must be the same for all processes");
      this.setState({ showGanttChart: false });
      return;
    }

    const updatedHistory = [tempProcesses, ...this.state.history.slice(1)];
    this.saveHistoryToCookies(updatedHistory);

    // Adicionar a tabela ao Firestore
    try {
      await addDoc(collection(db, 'tables'), {
        processes: tempProcesses,
        timestamp: new Date(),
      });
      console.log('Table added to Firestore');
    } catch (error) {
      console.error('Error adding table to Firestore:', error);
    }

    this.setState({
      processes: tempProcesses,
      history: updatedHistory,
      showGanttChart: true,
    });
  }

  render() {
    const { tempProcesses, showGanttChart, timeQuantum } = this.state;
    const { algorithm } = this.props;
    const showPriority = algorithm === 'PP' || algorithm === 'PNP';
    const showQuantum = algorithm === 'RR';

    return (
      <div className="screen">
        <div className="container">
          <Table processes={tempProcesses} handleInputChange={this.handleInputChange} showPriority={showPriority} showQuantum={showQuantum} />
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