import React, { Component } from "react";
import Cookies from 'js-cookie';
import { GridProcess } from './GridProcess';
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import Table from './Table';
import { auth } from '../config/firebase';
import './../App.css';
import { withTranslation } from 'react-i18next';

  /* TO DO
  quero que o programa inicialmente ja tenha duas linhas de processos zeradas
  intenacionalizacao
  */


class InputTable extends Component {

  constructor(props) {
    super(props);
    this.state = {
      totalProcess: 0,
      processes: [],
      tempProcesses: [],
      interruptions: [],
      tempInterruptions: [],
      history: [{ processes: [], interruptions: [] }],
      time: 0,
      showGanttChart: false,
      user: null,
    };
    this.addProcess = this.addProcess.bind(this);
    this.deleteProcess = this.deleteProcess.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.addInterruption = this.addInterruption.bind(this);
    this.deleteLastInterruption = this.deleteLastInterruption.bind(this);
    this.handleInterruptionInputChange = this.handleInterruptionInputChange.bind(this);
    this.saveHistoryToCookies = this.saveHistoryToCookies.bind(this);
    this.prepareAndShowGanttChart = this.prepareAndShowGanttChart.bind(this);
    this.generateRandomData = this.generateRandomData.bind(this);
    this.saveDataToFirestore = this.saveDataToFirestore.bind(this);
  }

  async saveDataToFirestore(processesToSave, interruptionsToSave) {
    if (this.state.user) {
      try {
        await addDoc(collection(db, 'tables'), {
          processes: processesToSave,
          interruptions: interruptionsToSave || [],
          timestamp: new Date(),
          userId: this.state.user.uid,
          algorithm: this.props.algorithm
        });
      } catch (error) {
          console.error("Error saving data to Firestore: ", error);
      }
    } 
  }

  componentDidMount() {
    const savedHistory = Cookies.get('history');
    let initialProcesses = [];
    let initialInterruptions = [];
    if (savedHistory) {
        try {
            const parsedHistory = JSON.parse(savedHistory);
            if (Array.isArray(parsedHistory) && parsedHistory.length > 0 && typeof parsedHistory[0] === 'object' && parsedHistory[0] !== null) {
                const latestScenario = parsedHistory[0];
                initialProcesses = latestScenario.processes || [];
                initialInterruptions = latestScenario.interruptions || [];
                this.setState({
                  history: parsedHistory,
                  processes: initialProcesses,
                  tempProcesses: initialProcesses,
                  interruptions: initialInterruptions,
                  tempInterruptions: initialInterruptions,
                  totalProcess: initialProcesses.length,
                });
            } else if (Array.isArray(parsedHistory) && parsedHistory.length > 0 && Array.isArray(parsedHistory[0])) {
                initialProcesses = parsedHistory[0];
                 this.setState({
                  history: parsedHistory.map(p_array => ({ processes: p_array, interruptions: [] })),
                  processes: initialProcesses,
                  tempProcesses: initialProcesses,
                  interruptions: [],
                  tempInterruptions: [],
                  totalProcess: initialProcesses.length,
                });
            } else {
                 this.setState({ history: [{ processes: [], interruptions: [] }] });
            }
        } catch(e) {
             Cookies.remove('history');
             this.setState({ history: [{ processes: [], interruptions: [] }] });
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

  saveHistoryToCookies(historyToSave) {
    const limitedHistory = historyToSave.slice(0, 10);
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
    const { t } = this.props;
    const numericValue = value === '' ? '' : Number(value);

    let translatedField = field;
    if (field === 'arrivalTime') translatedField = t('inputTable.fieldNameArrivalTime');
    else if (field === 'runningTime') translatedField = t('inputTable.fieldNameRunningTime');
    else if (field === 'priority') translatedField = t('inputTable.fieldNamePriority');
    else if (field === 'quantum') translatedField = t('inputTable.fieldNameQuantum');


    if (numericValue < 0 && field !== 'id') {
      alert(t('inputTable.alertFieldNegative', { field: translatedField }));
      return;
    }

    this.setState((prevState) => {
      const tempProcesses = [...prevState.tempProcesses];
      tempProcesses[index] = { ...tempProcesses[index], [field]: numericValue };
      return { tempProcesses };
    });
  }

  
  addInterruption() {
    this.setState((prevState) => {
      const nextId = prevState.tempInterruptions.length > 0
                     ? Math.max(0, ...prevState.tempInterruptions.map(i => i.id)) + 1
                     : 1;
      const newInterruption = {
        id: nextId,
        arrivalTime: 0,
        runningTime: 1,
      };
      const updatedInterruptions = [...prevState.tempInterruptions, newInterruption];
      return {
        tempInterruptions: updatedInterruptions,
      };
    });
  }

  deleteLastInterruption() {
  this.setState((prevState) => {
    if (prevState.tempInterruptions.length === 0) return {};
    const interruptions = prevState.tempInterruptions.slice(0, -1);
    return {
      tempInterruptions: interruptions,
    };
  });
  }

  handleInterruptionInputChange(index, field, value) {
    const { t } = this.props;
    const numericValue = value === '' ? '' : Number(value);

    let translatedField = field;
    if (field === 'arrivalTime') translatedField = t('inputTable.fieldNameArrivalTime');
    else if (field === 'runningTime') translatedField = t('inputTable.fieldNameRunningTime');

    if (numericValue < 0 && field !== 'id') { // Assuming interruptions don't have negative IDs
      alert(t('inputTable.alertFieldNegative', { field: translatedField }));
      return;
    }
    this.setState((prevState) => {
      const tempInterruptions = [...prevState.tempInterruptions];
      tempInterruptions[index] = { ...tempInterruptions[index], [field]: numericValue };
      return { tempInterruptions };
    });
  }

  prepareAndShowGanttChart() {
    const { t } = this.props;
    const tempProcesses = [...this.state.tempProcesses];
    const tempInterruptions = [...this.state.tempInterruptions];

    let isValid = true;
    let commonQuantum = null;

    for (let i = 0; i < tempProcesses.length; i++) {
        const process = tempProcesses[i];
        const arrivalTime = Number(process.arrivalTime);
        const runningTime = Number(process.runningTime);
        const priority = Number(process.priority);
        const quantum = Number(process.quantum);

        if (isNaN(arrivalTime) || arrivalTime < 0) {
             alert(t('inputTable.alertProcessArrivalTimeNegative', { id: process.id }));
             isValid = false; break;
        }
        if (isNaN(runningTime) || runningTime <= 0) {
            alert(t('inputTable.alertProcessRunningTimePositive', { id: process.id }));
            isValid = false; break;
        }
        if (this.props.algorithm === 'PP' || this.props.algorithm === 'PNP') {
            if (isNaN(priority) || priority < 0) {
                 alert(t('inputTable.alertProcessPriorityNegative', { id: process.id }));
                 isValid = false; break;
            }
        }

        if (this.props.algorithm === 'RR') {
            if (isNaN(quantum) || quantum <= 0) {
                 alert(t('inputTable.alertProcessQuantumPositive', { id: process.id }));
                 isValid = false; break;
            }
            if (commonQuantum === null) {
                commonQuantum = quantum;
            } else if (commonQuantum !== quantum) {
                alert(t('inputTable.alertRRQuantumSame'));
                isValid = false; break;
            }
        }

        tempProcesses[i] = { ...process, arrivalTime, runningTime, priority, quantum };
    }

    for (let i = 0; i < tempInterruptions.length; i++) {
        const interruption = tempInterruptions[i];
        const arrivalTime = Number(interruption.arrivalTime);
        const runningTime = Number(interruption.runningTime);

        if (isNaN(arrivalTime) || arrivalTime < 0) {
            alert(`Interruption I${interruption.id}: Arrival Time must be a non-negative number.`);
            isValid = false; break;
        }
        if (isNaN(runningTime) || runningTime <= 0) {
            alert(`Interruption I${interruption.id}: Running Time must be a positive number.`);
            isValid = false; break;
        }
        tempInterruptions[i] = { ...interruption, arrivalTime, runningTime };
    }

    if (!isValid) {
        this.setState({ showGanttChart: false });
        return;
    }

    const currentScenario = { processes: tempProcesses, interruptions: tempInterruptions };
    
    const filteredOldHistory = this.state.history.filter(
        h => h && ((h.processes && h.processes.length > 0) || (h.interruptions && h.interruptions.length > 0))
    );

    const updatedHistory = [currentScenario, ...filteredOldHistory].slice(0, 10);
    this.saveHistoryToCookies(updatedHistory);

    this.setState({
        processes: tempProcesses,
        interruptions: tempInterruptions,
        history: updatedHistory,
        showGanttChart: true,
    });
  }

  generateRandomData() {
    this.setState((prevState) => {
      if (prevState.tempProcesses.length === 0 && prevState.tempInterruptions.length === 0) {return {};}

      const commonQuantum = this.props.algorithm === 'RR' ? Math.floor(Math.random() * 5) + 1 : null;
      const randomizedProcesses = prevState.tempProcesses.map(process => ({
        ...process,
        arrivalTime: Math.floor(Math.random() * 10),
        runningTime: Math.floor(Math.random() * 10) + 1,
        priority: Math.floor(Math.random() * 10),
        quantum: commonQuantum !== null ? commonQuantum : (Math.floor(Math.random() * 5) + 1),
      }));

      const randomizedInterruptions = prevState.tempInterruptions.map(interrupt => ({
        ...interrupt,
        arrivalTime: Math.floor(Math.random() * 15),
        runningTime: Math.floor(Math.random() * 3) + 1,
      }));

      return {
        tempProcesses: randomizedProcesses,
        tempInterruptions: randomizedInterruptions,
      };
    });
  }
  
  handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const fileContent = e.target.result;
        try {
            const { processes: parsedProcesses, interruptions: parsedInterruptions } = this.parseTxtContent(fileContent);
            const processesWithDefaults = parsedProcesses.map((p, index) => ({
                id: p.id || index + 1,
                arrivalTime: parseInt(p.arrivalTime, 10) || 0,
                runningTime: parseInt(p.runningTime, 10) || 1,
                priority: parseInt(p.priority, 10) || 0,
                quantum: parseInt(p.quantum, 10) || 1,
            }));

            const interruptionsWithDefaults = parsedInterruptions.map((i, index) => ({
                id: i.id || index + 1,
                arrivalTime: parseInt(i.arrivalTime, 10) || 0,
                runningTime: parseInt(i.runningTime, 10) || 1,
            }));
        this.setState({
            tempProcesses: processesWithDefaults,
            totalProcess: processesWithDefaults.length,
            tempInterruptions: interruptionsWithDefaults,
            showGanttChart: false,
            processes: [],
            interruptions: [],
        });
            alert('Scenario successfully imported!');
        } catch (error) {
            alert(`Error importing file: ${error.message}`);
        }
    };
    reader.onerror = () => {
        alert('Error reading the file.');
    };
    reader.readAsText(file);
    event.target.value = null;
  }

  parseTxtContent = (txtContent) => {
    const { t } = this.props;
    const lines = txtContent.trim().split('\n');
    const processes = [];
    const interruptions = [];
    let currentSection = null;

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('#') || trimmedLine === '') {
            return;
        }
        if (trimmedLine.toUpperCase() === '[PROCESSES]') {
            currentSection = 'PROCESSES';
            return;
        }
        if (trimmedLine.toUpperCase() === '[INTERRUPTIONS]') {
            currentSection = 'INTERRUPTIONS';
            return;
        }

        if (!currentSection) {
            if (index === 0 && !trimmedLine.startsWith('[')) currentSection = 'PROCESSES';
            else if (!trimmedLine.startsWith('[')) {
                  if (!lines.some(l => l.trim().toUpperCase() === '[PROCESSES]' || l.trim().toUpperCase() === '[INTERRUPTIONS]')) {
                    currentSection = 'PROCESSES';
                  } else {
                    return;
                  }
            } else return;
        }
        
        const parts = trimmedLine.split(',');
        if (currentSection === 'PROCESSES') {
            if (parts.length < 2 || parts.length > 4) {
                throw new Error(t('inputTable.errorParseProcessFormat', { lineNumber: index + 1, lineContent: trimmedLine }));
            }
            processes.push({
                arrivalTime: parts[0]?.trim(),
                runningTime: parts[1]?.trim(),
                priority: parts[2]?.trim() || '0',
                quantum: parts[3]?.trim() || '1',
            });
        } else if (currentSection === 'INTERRUPTIONS') {
            if (parts.length !== 2) {
                throw new Error(t('inputTable.errorParseInterruptionFormat', { lineNumber: index + 1, lineContent: trimmedLine }));
            }
            interruptions.push({
                arrivalTime: parts[0]?.trim(),
                runningTime: parts[1]?.trim(),
            });
        }
    });
    if (!lines.some(l => l.trim().toUpperCase() === '[PROCESSES]' || l.trim().toUpperCase() === '[INTERRUPTIONS]') && processes.length > 0 && interruptions.length === 0) {
        return { processes, interruptions: [] };
    }
    return { processes, interruptions };
  }

  handleExportToTxt = () => {
    //const { t } = this.props;
    const { tempProcesses, tempInterruptions } = this.state;
    if (tempProcesses.length === 0 && tempInterruptions.length === 0) {
        alert("There is no data in the table to export.");
        return;
    }
    
    let fileContent = "";

    if (tempProcesses.length > 0) {
        fileContent += "[PROCESSES]\n";
        fileContent += "#arrivalTime,runningTime,priority,quantum\n";
        fileContent += tempProcesses.map(p =>
            `${p.arrivalTime},${p.runningTime},${p.priority === undefined ? 0 : p.priority},${p.quantum === undefined ? 1 : p.quantum}`
        ).join('\n');
        fileContent += "\n";
    }

    if (tempInterruptions.length > 0) {
        fileContent += "\n[INTERRUPTIONS]\n";
        fileContent += "#arrivalTime,runningTime\n";
        fileContent += tempInterruptions.map(i =>
            `${i.arrivalTime},${i.runningTime}`
        ).join('\n');
    }

    const blob = new Blob([fileContent.trim()], { type: 'text/plain;charset=utf-8' });
    const fileName = `cpusas_scenario_${new Date().toISOString().slice(0,10)}.txt`;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }


  render() {
    const { t } = this.props;
    const { tempProcesses, showGanttChart, processes, tempInterruptions, interruptions } = this.state;
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


            {tempInterruptions.length > 0 && (
                <Table
                    processes={tempInterruptions}
                    handleInputChange={this.handleInterruptionInputChange}
                    showPriority={false}
                    showQuantum={false}
                    idPrefix="I"
                />
            )}
            <div className="button-container my-4 flex justify-start gap-4">
                <button className="button-add-interruption" onClick={this.addInterruption}>
                    {t('inputTable.buttonAddInterruption')}
                </button>
                {tempInterruptions.length > 0 && (
                    <button className="button-add-interruption" onClick={this.deleteLastInterruption}>
                    {t('inputTable.buttonDeleteLastInterruption')}
                    </button>
                )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'right', marginTop: '20px' }}>
                <div>
                <input
                    type="file"
                    id="fileImporter"
                    accept=".txt"
                    onChange={this.handleFileImport}
                    style={{ display: 'none' }}
                />
                <label
                  htmlFor="fileImporter"
                  className="file-importer"
                >
                  Import (.txt)
                </label>
                </div>

                <button
                    onClick={this.handleExportToTxt} 
                    className="file-exporter"
                    
                >
                    Export (.txt)
                </button>  
            </div>
          
        </div>

        <div className="button-container my-4 flex justify-center gap-4">
            <button className="button" onClick={this.addProcess}>
                {t('inputTable.buttonAddProcess')}
            </button>
            <button className="button" onClick={this.deleteProcess} disabled={tempProcesses.length === 0}>
                {t('inputTable.buttonDeleteLastProcess')}
            </button>
            <button className="button" onClick={this.generateRandomData}>
                {t('inputTable.buttonRandomData')}
            </button>
            <button className="button" onClick={this.prepareAndShowGanttChart} disabled={tempProcesses.length === 0}>
                {t('inputTable.buttonGenerateGantt')}
            </button>
        </div>

        {showGanttChart ? (
            <div className='bg-white p-4 shadow-lg rounded'>
                <GridProcess
                    tableInfos={processes}
                    interruptionsData={interruptions}
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

export default withTranslation()(InputTable); // New export