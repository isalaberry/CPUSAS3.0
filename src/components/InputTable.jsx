import React, { Component } from "react";
import Cookies from 'js-cookie';
import { GridProcess } from './GridProcess';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Table from './Table';
import { auth } from '../config/firebase';

class InputTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalProcess: 0,
      processes: [],
      tempProcesses: [],
      history: [[]],
      time: 0,
      showGanttChart: false,
      user: null,
    };
    this.addProcess = this.addProcess.bind(this);
    this.deleteProcess = this.deleteProcess.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.saveHistoryToCookies = this.saveHistoryToCookies.bind(this);
    this.prepareAndShowGanttChart = this.prepareAndShowGanttChart.bind(this);
    this.generateRandomData = this.generateRandomData.bind(this);
    this.saveDataToFirestore = this.saveDataToFirestore.bind(this);
  }

  async saveDataToFirestore(processesToSave) {
    if (this.state.user) {
      try {
        await addDoc(collection(db, 'tables'), {
          processes: processesToSave,
          timestamp: new Date(),
          userId: this.state.user.uid,
          algorithm: this.props.algorithm
        });
        console.log('Table data successfully saved to Firestore.');
      } catch (error) {
        console.error('Error adding table to Firestore:', error);
      }
    } else {
      console.log('User not logged in. Skipping Firestore save.');
    }
  }

  componentDidMount() {
    const savedHistory = Cookies.get('history');
    let initialProcesses = [];
    if (savedHistory) {
        try {
            const history = JSON.parse(savedHistory);
            if (Array.isArray(history) && history.length > 0 && Array.isArray(history[0])) {
                initialProcesses = history[0];
                this.setState({
                  history,
                  processes: initialProcesses,
                  tempProcesses: initialProcesses,
                  totalProcess: initialProcesses.length,
                });
            } else {
                 this.setState({ history: [[]] });
            }
        } catch(e) {
             console.error("Error parsing history cookie:", e);
             Cookies.remove('history');
             this.setState({ history: [[]] });
        }
    }

    this.authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        this.setState({ user });
      } else {
        this.setState({ user: null });
      }
    });
  }

  componentWillUnmount() {
      if (this.authUnsubscribe) {
          this.authUnsubscribe();
      }
  }

  saveHistoryToCookies(history) {
    const limitedHistory = history.slice(0, 10);
    Cookies.set('history', JSON.stringify(limitedHistory), { expires: 7 });
  }

  addProcess() {
    this.setState((prevState) => {
      const nextId = prevState.tempProcesses.length > 0
                     ? Math.max(...prevState.tempProcesses.map(p => p.id)) + 1
                     : 1;
      const newProcess = {
        id: nextId,
        arrivalTime: 0,
        runningTime: 1,
        priority: 0,
        quantum: 1,
      };
      const updatedProcesses = [...prevState.tempProcesses, newProcess];
      return {
        totalProcess: updatedProcesses.length,
        tempProcesses: updatedProcesses,
      };
    });
  }

  deleteProcess() {
    this.setState((prevState) => {
      if (prevState.tempProcesses.length === 0) return {};

      const processes = prevState.tempProcesses.slice(0, -1);
      return {
        totalProcess: processes.length,
        tempProcesses: processes,
      };
    });
  }

  handleInputChange(index, field, value) {
    const numericValue = value === '' ? '' : Number(value);

    if (numericValue < 0) {
      alert(`${field} cannot be negative`);
      return;
    }

    this.setState((prevState) => {
      const tempProcesses = [...prevState.tempProcesses];
      tempProcesses[index] = { ...tempProcesses[index], [field]: numericValue };
      return { tempProcesses };
    });
  }

  prepareAndShowGanttChart() {
    const tempProcesses = [...this.state.tempProcesses];

    let isValid = true;
    let commonQuantum = null;

    for (let i = 0; i < tempProcesses.length; i++) {
        const process = tempProcesses[i];
        const arrivalTime = Number(process.arrivalTime);
        const runningTime = Number(process.runningTime);
        const priority = Number(process.priority);
        const quantum = Number(process.quantum);

        if (isNaN(arrivalTime) || arrivalTime < 0) {
             alert(`Process ${process.id}: Arrival Time must be a non-negative number.`);
             isValid = false; break;
        }
        if (isNaN(runningTime) || runningTime <= 0) {
            alert(`Process ${process.id}: Running Time must be a positive number.`);
            isValid = false; break;
        }
        if (this.props.algorithm === 'PP' || this.props.algorithm === 'PNP') {
            if (isNaN(priority) || priority < 0) {
                 alert(`Process ${process.id}: Priority must be a non-negative number.`);
                 isValid = false; break;
            }
        }
        if (this.props.algorithm === 'RR') {
            if (isNaN(quantum) || quantum <= 0) {
                 alert(`Process ${process.id}: Quantum must be a positive number.`);
                 isValid = false; break;
            }
            if (commonQuantum === null) {
                commonQuantum = quantum;
            } else if (commonQuantum !== quantum) {
                alert("All Quantum values must be the same for the Round Robin algorithm.");
                isValid = false; break;
            }
        }

        tempProcesses[i] = { ...process, arrivalTime, runningTime, priority, quantum };
    }

    if (!isValid) {
        this.setState({ showGanttChart: false });
        return;
    }

    //this.saveDataToFirestore(tempProcesses);

    const updatedHistory = [tempProcesses, ...this.state.history.slice(1)];
    this.saveHistoryToCookies(updatedHistory);

    this.setState({
        processes: tempProcesses,
        history: updatedHistory,
        showGanttChart: true,
    });
  }

  generateRandomData() {
    this.setState((prevState) => {
      const numProcesses = prevState.tempProcesses.length || Math.floor(Math.random() * 5) + 3;
      const tempProcesses = [];
      const commonQuantum = this.props.algorithm === 'RR' ? Math.floor(Math.random() * 5) + 1 : null;

      for (let i = 0; i < numProcesses; i++) {
          const id = (prevState.tempProcesses[i]?.id) || i + 1;
          tempProcesses.push({
               id: id,
               arrivalTime: Math.floor(Math.random() * 10),
               runningTime: Math.floor(Math.random() * 10) + 1,
               priority: Math.floor(Math.random() * 10),
               quantum: commonQuantum !== null ? commonQuantum : Math.floor(Math.random() * 5) + 1
           });
      }

      return {
          tempProcesses,
          totalProcess: tempProcesses.length
       };
    });
  }

  render() {
    const { tempProcesses, showGanttChart, processes } = this.state;
    const { algorithm } = this.props;
    const showPriority = algorithm === 'PP' || algorithm === 'PNP';
    const showQuantum = algorithm === 'RR';

    return (
      <div className="screen">
        <div className="container mx-auto p-4">
            <Table
                processes={tempProcesses}
                handleInputChange={this.handleInputChange}
                showPriority={showPriority}
                showQuantum={showQuantum}
            />
        </div>

        <div className="button-container my-4 flex justify-center gap-4">
            <button className="button bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" onClick={this.addProcess}>
                Add Process
            </button>
            <button className="button bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" onClick={this.deleteProcess} disabled={tempProcesses.length === 0}>
                Delete Last
            </button>
            <button className="button bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded" onClick={this.generateRandomData}>
                Random Data
            </button>
            <button className="button bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50" onClick={this.prepareAndShowGanttChart} disabled={tempProcesses.length === 0}>
                Generate Gantt Chart
            </button>
        </div>

        {showGanttChart ? (
            <div className='bg-white p-4 shadow-lg rounded'>
                <GridProcess
                    tableInfos={processes}
                    algorithm={algorithm}
                    saveDataToFirestore={this.saveDataToFirestore}
                />
            </div>
        ) : (
            <div className="flex justify-center items-center bg-blue-100 p-10 rounded-lg shadow">
                <img src="/assets/cpusas3.jpg" alt="Insert data and generate Gantt chart" className="max-w-md rounded shadow" />
            </div>
        )}
      </div>
    );
  }
}

export default InputTable;