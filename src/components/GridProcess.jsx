import React, { useState, useEffect, useRef } from 'react';

//fix: timebar must end on the maximum time of process+not process
export const GridProcess = ({ tableInfos, algorithm }) => {
    const processGridRef = useRef(null);

    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
    const [averageWaitingTime, setAverageWaitingTime] = useState(0);
    const [averageTurnaroundTime, setAverageTurnaroundTime] = useState(0);
    const [darkBlueSquares, setDarkBlueSquares] = useState([]);     

    const handleNextColumn = () => {
        setCurrentColumn((prevColumn) => Math.min(prevColumn + 1, totalRunningTime+1));
    };

    const handlePreviousColumn = () => {
        setCurrentColumn((prevColumn) => Math.max(prevColumn - 1, 1));
    };

    const handleFirstColumn = () => {
        setCurrentColumn(1);
    };
    
    const handleLastColumn = () => {
        const totalRunningTime = tableInfos.reduce((sum, process) => sum + process.runningTime, 0);
        setCurrentColumn(totalRunningTime+1);
    };
    const handleAutoIncrement = () => {
        const totalRunningTime = tableInfos.reduce((sum, process) => sum + process.runningTime, 0);
        const intervalId = setInterval(() => {
            setCurrentColumn((prevColumn) => {
                if (prevColumn >= totalRunningTime + 1) {
                    clearInterval(intervalId);
                    return prevColumn;
                }
                return prevColumn + 1;
            });
        }, 1000);
    };

    const sortProcesses = (tableInfos) => {
        let sorted = [];
        let currentTime = 0;

        while (tableInfos.length > 0) {
            let availableProcesses = tableInfos.filter(process => process.arrivalTime <= currentTime);

            if (availableProcesses.length === 0) {
                currentTime = Math.min(...tableInfos.map(process => process.arrivalTime));
                availableProcesses = tableInfos.filter(process => process.arrivalTime <= currentTime);
            }

            let nextProcess;
            if (algorithm === 'FIFO' || algorithm === 'PP' || algorithm === 'RR') {
                nextProcess = availableProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            } else if (algorithm === 'SJF') {
                nextProcess = availableProcesses.sort((a, b) => a.runningTime - b.runningTime)[0];
            } else if (algorithm === 'PNP') {
                nextProcess = availableProcesses.sort((a, b) => a.priority - b.priority)[0];
            } else {
                console.log('Error in algorithm atribuition');
            }

            sorted.push(nextProcess);
            currentTime += nextProcess.runningTime;
            tableInfos = tableInfos.filter(process => process.id !== nextProcess.id);
        }

        return sorted;
    };
//DESCRIPTION TABLE --------------------------------------------------------------
    useEffect(() => {
        const newDescriptions = {};

        darkBlueSquares.forEach(({ id, colStart, colSpan, rowStart }) => {
            let processDescriptionId = parseInt(rowStart, 10);

            const allSquaresInRow = darkBlueSquares.filter(square => square.rowStart === rowStart);
            const isEnded = allSquaresInRow.every(square => currentColumn > square.colStart + square.colSpan - 1) || currentColumn === 11;
            const isEntered = allSquaresInRow.some(square => currentColumn === square.colStart);
            const isExited = allSquaresInRow.some(square => currentColumn === square.colStart + square.colSpan);
            const isExecuting = allSquaresInRow.some(square => currentColumn > square.colStart && currentColumn < square.colStart + square.colSpan);
            const isWaiting = allSquaresInRow.some(square => currentColumn < square.colStart);

            if (isEntered) { 
                newDescriptions[processDescriptionId] = (
                    <span style={{ color: 'darkblue' }}>{`P${processDescriptionId} entered`}</span>
                );
            }

            else if (isExited) {
                newDescriptions[processDescriptionId] = (
                    <span style={{ color: 'darkblue' }}>{`P${processDescriptionId} exited`}</span>
                );
            }

            else if (isEnded) {
                newDescriptions[processDescriptionId] = (
                    <span style={{ color: 'darkgray' }}>{`P${processDescriptionId} ended`}</span>
                );
            }

            else if (isExecuting) { 
                newDescriptions[processDescriptionId] = (
                    <span style={{ color: 'blue' }}>{`P${processDescriptionId} is executing`}</span>
                );
            }  

            else if (isWaiting) {
                newDescriptions[processDescriptionId] = (
                    <span style={{ color: 'darkgray' }}>{`P${processDescriptionId} is waiting`}</span>
                );
            }

            else {
                newDescriptions[processDescriptionId] = (
                    <span style={{ color: 'red' }}>{`Error`}</span>
                );
            }
        });

        setDescriptions(newDescriptions);
    }, [currentColumn, tableInfos, algorithm, darkBlueSquares]);
//-----------------------------------------------------------------------------
    useEffect(() => {
        if (processGridRef.current) {
            const squares = processGridRef.current.querySelectorAll('.process');
            const darkBlueSquares = [];
            squares.forEach((square) => {
                const backgroundColor = window.getComputedStyle(square).backgroundColor;
                if (backgroundColor === 'rgb(68, 92, 243)') { 
                    const colStart = parseInt(square.style.gridColumnStart, 10);
                    const colSpan = parseInt(square.style.gridColumnEnd.split('span ')[1], 10); 
                    const rowStart = square.style.gridRowStart;
                    darkBlueSquares.push({ id: colStart, colStart, colSpan, rowStart });
                }
            });

            setDarkBlueSquares(darkBlueSquares);
        }
    }, [ tableInfos, algorithm]);

    // TURNAROUND TIME / WAITING TIME ----------------------------------------
    useEffect(() => {
        let turnaroundTime = 0;
        let waitingTime = 0;
        const numProc = tableInfos.length;

        const executedRows = new Set();

        darkBlueSquares.forEach((process) => {
            if (!executedRows.has(process.rowStart)) {
            const lastProcessInRow = darkBlueSquares.filter(p => p.rowStart === process.rowStart).sort((a, b) => b.colStart - a.colStart)[0];
            let completionTime = lastProcessInRow.colStart-1 + lastProcessInRow.colSpan;
            const procArrivalTime = tableInfos.find(p => p.id === parseInt(process.rowStart, 10)).arrivalTime;
            turnaroundTime += completionTime - procArrivalTime;

            const burstTime = tableInfos.find(p => p.id === parseInt(process.rowStart, 10)).runningTime;
            console.log('burstTime', burstTime);
            waitingTime += (completionTime-procArrivalTime) - burstTime;

            executedRows.add(process.rowStart);

            
            }
        });

        let averageTurnaroundTime =turnaroundTime / numProc
        let averageWaitingTime = waitingTime / numProc
        setAverageTurnaroundTime(averageTurnaroundTime);
        setAverageWaitingTime(averageWaitingTime);
    }, [darkBlueSquares, tableInfos]);
    //--------------------------------------------------------

    const sortedProcesses = sortProcesses(tableInfos);
    let lastEndTime = 0;
    let queue = [];

    const printQueueElementPP = (processData) => {
        let colStart = Math.max(lastEndTime);
        let colSpan = processData.remainingTime;
        lastEndTime = colStart + colSpan;

        return (
            <div className='process' style={{
                gridColumnStart: colStart,
                gridColumnEnd: `span ${colSpan}`,
                position: 'relative',
                gridRowStart: processData.idQueue,
            }}>
                <div style={{ zIndex: 2 }}>
                    {`P${processData.idQueue}`}
                </div>
            </div>
        );
    };

    const printQueueElementRR = (processData) => {
        if (!processData || processData.idQueue === undefined) {
            console.error('Invalid processData:', processData);
            return null;
        }

        let colStart = lastEndTime;
        let colSpan = Math.min(processData.remainingTime, processData.quantum);
        lastEndTime = colStart + colSpan;

        return (
            <div className='process' style={{
                gridColumnStart: colStart,
                gridColumnEnd: `span ${colSpan}`,
                position: 'relative',
                gridRowStart: processData.idQueue,
            }}>
                <div style={{ zIndex: 2 }}>
                    {`P${processData.idQueue}`}
                </div>
            </div>
        );
    };

    // Calcular a soma do runningTime de todos os processos
    const totalRunningTime = tableInfos.reduce((sum, process) => sum + process.runningTime, 0);

    return (
        <div className='grid-container'>
            <div className='process-grid' style={{ position: 'relative' }} ref={processGridRef}>

                <div className="time-bar" style={{
                    position: 'absolute',
                    width: '10px',
                    height: '100%',
                    backgroundColor: 'yellow',
                    zIndex: 4,
                    top: 0,
                    bottom: 0,
                    gridColumnStart: currentColumn,
                    gridColumnEnd: currentColumn + 1,
                }}></div>

                {sortedProcesses.map((process, index) => {
                    const { arrivalTime, runningTime, priority = null, quantum } = process;
                    let colStart, colSpan;
                    let processId;
                    let queueElement = null;

                    if (algorithm === 'PP') {
                        let remainingTime = runningTime;
                        let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity;
                        let nextPriority = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].priority : Infinity;

                        if (nextArrival && nextArrival < arrivalTime + runningTime && priority > nextPriority) {
                            colSpan = nextArrival - arrivalTime;
                            remainingTime -= colSpan;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            queue.push({ idQueue: process.id, arrivalTime, remainingTime, priority });
                            lastEndTime = colStart + colSpan;
                            processId = process.id;
                        } else {
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            colSpan = runningTime;
                            lastEndTime = colStart + colSpan;
                            processId = process.id;

                            if (queue.length > 0 && (index === sortedProcesses.length - 1 || nextPriority > queue[0].priority)) {
                                do {
                                    const processData = queue.shift();
                                    queueElement = printQueueElementPP(processData);
                                } while (index === sortedProcesses.length - 1 && queue.length > 0);
                            }
                        }

                    } else if (algorithm === 'RR') {
                        let remainingTime = runningTime;
                        let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity;

                        if (index === sortedProcesses.length - 1 && queue.length > 0) {
                            colSpan = Math.min(quantum, remainingTime);
                            remainingTime -= colSpan;

                            processId = process.id;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            lastEndTime = colStart + colSpan;

                            if (remainingTime > 0) {
                                queue.push({ idQueue: process.id, arrivalTime, remainingTime, quantum });
                            }

                            queueElement = queue.map(processData => printQueueElementRR(processData));
                        } else if (remainingTime < quantum) {
                            colSpan = remainingTime;
                            remainingTime = 0;

                            processId = process.id;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            lastEndTime = colStart + colSpan;

                            if (lastEndTime < nextArrival && queue.length > 0) {
                                const processData = queue.shift();
                                if (processData) {
                                    queueElement = printQueueElementRR(processData);
                                }
                            }
                        } else {
                            colSpan = quantum;
                            remainingTime -= quantum;

                            processId = process.id;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            lastEndTime = colStart + colSpan;

                            if (remainingTime > 0) {
                                queue.push({ idQueue: process.id, arrivalTime, remainingTime, quantum: process.quantum });
                            }

                            if (lastEndTime < nextArrival && queue.length > 0) {
                                const processData = queue.shift();
                                if (processData) {
                                    queueElement = printQueueElementRR(processData);
                                }
                            }
                        }

                    } else {
                        colStart = Math.max(lastEndTime, arrivalTime + 1);
                        colSpan = runningTime;
                        lastEndTime = colStart + colSpan;
                        processId = process.id;
                    }

                    const processStyle = {
                        gridColumnStart: colStart,
                        gridColumnEnd: `span ${colSpan}`,
                        position: 'relative',
                        gridRowStart: processId,
                    };

                    return (
                        <React.Fragment key={`${colStart - 1}-${process.id}`}>
                            {queueElement}
                            <div className='process' style={processStyle}>
                                <div style={{ zIndex: 2 }}>
                                    {`P${processId}`}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}

                {sortedProcesses.map((process) => {
                    const { arrivalTime } = process;

                    const arrivalStyle = {
                        gridColumnStart: arrivalTime + 1,
                        gridColumnEnd: arrivalTime + 2,
                        position: 'relative',
                        top: 0,
                        left: 0,
                        backgroundColor: '#CADEED',
                        width: '10px',
                        height: '100%',
                        gridRowStart: process.id,
                        zIndex: 1,
                    };

                    return (
                        <div key={`arrival-${process.id}`} className='arrival-indicator' style={arrivalStyle}></div>
                    );
                })}

                <div className="labels" style={{ gridRowStart: sortedProcesses.length + 1 }}>
                    {[...Array(totalRunningTime + 1)].map((_, i) => (
                        <div key={i} className="label">{i.toString().padStart(2, '0')}</div>
                    ))}
                </div>

            </div>

            <div className='description-table'>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th className='description-table-title'>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableInfos.map((process) => (
                            <tr key={process.id}>
                                <td style={{ padding: '16px' }}>{descriptions[process.id]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="button-time-container">
                <button onClick={handleFirstColumn} className="button">{'<<'}</button>
                <button onClick={handlePreviousColumn} className="button">{'<'}</button>
                <button onClick={handleNextColumn} className="button">{'>'}</button>
                <button onClick={handleLastColumn} className="button">{'>>'}</button>
                <button onClick={handleAutoIncrement} className="button">{'auto  >'}</button>

            </div>

            <div className="ttwt-container">
                <div>
                    Average Waiting Time: {averageWaitingTime.toFixed(2)}
                </div>
                <div>
                    Turnaround Time: {averageTurnaroundTime.toFixed(2)}
                </div>
            </div>
        </div>
    );
};