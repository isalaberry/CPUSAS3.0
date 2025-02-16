import React, { useState, useEffect, useRef } from 'react';

export const GridProcess = ({ tableInfos, algorithm }) => {
    const processGridRef = useRef(null);

    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
    //-------------------FIX: Average Waiting Time and Average Turnaround Time-------------------
    //dê um id e um estado para cada um dos darkbluesquares. o forEach do darkblueSquares deve percorrer todo o array de darkbluequares a cada iteracao e assignar estados para cada darkbluesquare
    const [averageWaitingTime, setAverageWaitingTime] = useState(0);
    const [averageTurnaroundTime, setAverageTurnaroundTime] = useState(0);
    const [darkBlueSquares, setDarkBlueSquares] = useState([]);     

    const handleNextColumn = () => {
        setCurrentColumn((prevColumn) => Math.min(prevColumn + 1, 11));
    };

    const handlePreviousColumn = () => {
        setCurrentColumn((prevColumn) => Math.max(prevColumn - 1, 1));
    };

    const handleFirstColumn = () => {
        setCurrentColumn(1);
    };
    
    const handleLastColumn = () => {
        setCurrentColumn(11);
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
            if (algorithm === 'FIFO' || algorithm === 'PP'|| algorithm === 'RR') {
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

useEffect(() => {
    const newDescriptions = {};

    darkBlueSquares.forEach(({ id, colStart, colSpan, rowStart }) => {
        let processDescriptionId = parseInt(rowStart, 10);
        console.log(colStart+colSpan);

        const allSquaresInRow = darkBlueSquares.filter(square => square.rowStart === rowStart);
        const isEnded = allSquaresInRow.every(square => currentColumn > square.colStart + square.colSpan-1);
        const isEntered = allSquaresInRow.some(square => currentColumn === square.colStart);
        const isExited = allSquaresInRow.some(square => currentColumn === square.colStart + square.colSpan);
        const isExecuting = allSquaresInRow.some(square => currentColumn > square.colStart && currentColumn < square.colStart + square.colSpan);
        const isWaiting = allSquaresInRow.some(square => currentColumn < square.colStart);

        if (isEntered) { 
            newDescriptions[processDescriptionId] = `P${processDescriptionId} entered`;
        }

        else if (isExited) {
            newDescriptions[processDescriptionId] = `P${processDescriptionId} exited`;
        }

        else if (isExecuting) { 
            newDescriptions[processDescriptionId] = `P${processDescriptionId} is executing`;
        }  

        else if (isWaiting) {
            newDescriptions[processDescriptionId] = `P${processDescriptionId} is waiting`; 
        }

        else if (isEnded) {
            newDescriptions[processDescriptionId] = `P${processDescriptionId} ended`;
        }
        
        else {
            newDescriptions[processDescriptionId] = `Error`;
        }
    });

    setDescriptions(newDescriptions);
    //console.log('Descriptions:', newDescriptions);
    //setAverageWaitingTime(totalWaitingTime / sortedProcesses.length);
    //setAverageTurnaroundTime(totalTurnaroundTime / sortedProcesses.length);
}, [currentColumn, tableInfos, algorithm, darkBlueSquares]);

useEffect(() => {
    if (processGridRef.current) {
        const squares = processGridRef.current.querySelectorAll('.process');
        const darkBlueSquares = [];
        squares.forEach((square) => {
            const backgroundColor = window.getComputedStyle(square).backgroundColor;
            if (backgroundColor === 'rgb(25, 69, 105)') { 

                const colStart = parseInt(square.style.gridColumnStart, 10);
                const colSpan = parseInt(square.style.gridColumnEnd.split('span ')[1], 10); 
                const rowStart = square.style.gridRowStart;
                darkBlueSquares.push({id:colStart, colStart, colSpan, rowStart });
            }
        });
       
        //console.log('Identified darkBlueSquares:', darkBlueSquares);
        setDarkBlueSquares(darkBlueSquares);
    }
}, [currentColumn, tableInfos, algorithm]);
//-----------------------------------

    const sortedProcesses = sortProcesses(tableInfos);
    let lastEndTime = 0;
    //let stack = [];
    let queue = [];

    const printQueueElementPP = (processData) => {//PP
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

                        // se o proximo processo cortar o atual e tiver menos prioridade (+)
                        if (nextArrival && nextArrival < arrivalTime + runningTime && priority > nextPriority) {
                            colSpan = nextArrival - arrivalTime;
                            remainingTime -= colSpan;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            queue.push({ idQueue: process.id, arrivalTime, remainingTime, priority });
                            lastEndTime = colStart + colSpan;
                            processId = process.id;
                        }
                        // se o proximo processo nao cortar o atual
                        else {
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            colSpan = runningTime;
                            lastEndTime = colStart + colSpan;
                            processId = process.id;

                            // verificar se o proximo tem prioridade maior que o da stack - se tiver, executar o da stack em seguida
                            if (queue.length > 0&&(index === sortedProcesses.length - 1 || nextPriority > queue[0].priority) ) { //queue undefined?
                                do {
                                    const processData = queue.shift();
                                    queueElement = printQueueElementPP(processData);
                                } while (index === sortedProcesses.length - 1 && queue.length > 0);
                            }
                        }

                    } else if (algorithm === 'RR') {
                        let remainingTime = runningTime;
                        let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity;

                        // se for o ultimo processo e tiver coisa na queue
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
                        }
                        // se um processo esta finalizando e o remaining time for menor que o quantum
                        else if (remainingTime < quantum) {
                            colSpan = remainingTime;
                            remainingTime = 0;

                            processId = process.id;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            lastEndTime = colStart + colSpan;

                            // se o processo finalizar antes do proximo processo chegar - executa a stack
                            if (lastEndTime < nextArrival && queue.length > 0) {
                                const processData = queue.shift();
                                if (processData) {
                                    queueElement = printQueueElementRR(processData);
                                }
                            }
                        }
                        // se o running time for maior ou igual que o quantum e nao for o ultimo processo
                        else {
                            colSpan = quantum;
                            remainingTime -= quantum;

                            processId = process.id;
                            colStart = Math.max(lastEndTime, arrivalTime + 1);
                            lastEndTime = colStart + colSpan;

                            if(remainingTime>0){
                                queue.push({ idQueue: process.id, arrivalTime, remainingTime, quantum: process.quantum });
                            }

                                // se fim do processo atual for menor que o arrival time do proximo processo
                            if (lastEndTime < nextArrival && queue.length > 0) {
                                const processData = queue.shift();
                                if (processData) {
                                    queueElement = printQueueElementRR(processData);
                                }
                            }
                        }

                    } else { // outros algoritmos
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

            </div>

            <div className='description-table'>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>Description</th>
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

            <div className="labels">
                {[...Array(11)].map((_, i) => (
                    <div key={i} className="label">{i}</div>
                ))}
            </div>

            <div className="button-time-container">
                <button onClick={handleFirstColumn} className="button">{'<<'}</button>
                <button onClick={handlePreviousColumn} className="button">{'<'}</button>
                <button onClick={handleNextColumn} className="button">{'>'}</button>
                <button onClick={handleLastColumn} className="button">{'>>'}</button>
            </div>

            <div className="ttwt-container">
                <div>
                    Average Waiting Time: {0}
                </div>
                <div>
                    Turnaround Time: {0}
                </div>
            </div>
        </div>
    );
};