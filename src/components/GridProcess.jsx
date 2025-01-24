 
import React, { useState, useEffect } from 'react';

import { useRef } from 'react';

export const GridProcess = ({ tableInfos, algorithm }) => {
    const processGridRef = useRef(null);

    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
    //-------------------FIX: Average Waiting Time and Average Turnaround Time-------------------
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
//-------------FIX: DESCRIPTION TABLE----------------primeiro item nao entra + problems

useEffect(() => {
    const newDescriptions = {};

    darkBlueSquares.forEach(({ colStart, colSpan, rowStart }) => {
        let processDescriptionId = parseInt(rowStart, 10);

        if(currentColumn === colStart + colSpan){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} exited`;
        }
        else if(currentColumn === colStart){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} entered`;
        }
        else if(currentColumn === colStart + colSpan){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} exited`;
        }
        else if(currentColumn > colStart && currentColumn < colStart + colSpan){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} is executing`;
        }  
        else if(currentColumn<colStart){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} is waiting`;
        }
        else if(currentColumn>colStart+colSpan){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} ended`;
        }
        else{
            newDescriptions[processDescriptionId] = `Error`;
        }
    });

    setDescriptions(newDescriptions);
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
                darkBlueSquares.push({ colStart, colSpan, rowStart });
            }
        });
        setDarkBlueSquares(darkBlueSquares);
    }
}, [currentColumn, tableInfos, algorithm]);


//-------------------FIX: DESCRIPTION TABLE-------------------
    const sortedProcesses = sortProcesses(tableInfos);
    let lastEndTime = 0;
    let stack = [];

    const printStackElement = (processData) => {//PP
        let colStart = Math.max(lastEndTime);
        let colSpan = processData.remainingTime;
        lastEndTime = colStart + colSpan;

        return (
            <div className='process' style={{
                gridColumnStart: colStart,
                gridColumnEnd: `span ${colSpan}`,
                position: 'relative',
                gridRowStart: processData.idStack,

            }}>
                <div style={{ zIndex: 2 }}>
                    {`P${processData.idStack}`}
                </div>
            </div>
        );
        
    };

    const printStackElementRR = (processData) => {
        let colStart = Math.max(lastEndTime);
        let colSpan = processData.quantum;
        lastEndTime = colStart + colSpan;

        return (
            <div className='process' style={{
                gridColumnStart: colStart,
                gridColumnEnd: `span ${colSpan}`,
                position: 'relative',
                gridRowStart: processData.idStack,

            }}>
                <div style={{ zIndex: 2 }}>
                    {`P${processData.idStack}`}
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
                    const { arrivalTime, runningTime, priority = null } = process; 
                    let colStart, colSpan; 
                    let processId;
                    let stackElement = null;

                    //-------------------PP-------------------

                    if (algorithm === 'PP') {
                        let remainingTime = runningTime; 

                        let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity;
                        let nextPriority = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].priority : Infinity;
                        
                        

                            //se o proximo processo cortar o atual
                            if (nextArrival && nextArrival < arrivalTime + runningTime && priority > nextPriority) {
                                colSpan = nextArrival - arrivalTime;
                                remainingTime -= colSpan;
                                colStart = Math.max(lastEndTime, arrivalTime + 1);
                                stack.push({ idStack: process.id, arrivalTime, remainingTime, priority });
                                lastEndTime = colStart + colSpan; 
                                processId=process.id;
                            } 

                            //se o proximo processo nao cortar o atual
                            else {  
                                colStart = Math.max(lastEndTime, arrivalTime + 1);
                                colSpan = runningTime;
                                lastEndTime = colStart + colSpan;
                                processId = process.id;

                                //verificar se o proximo tem prioridade maior que o da stack - se tiver, executar o da stack em seguida
                                if((index === sortedProcesses.length - 1||nextPriority>stack[0].priority) && stack.length>0){
                                    do{
                                    const processData = stack.pop();    
                                    stackElement = printStackElement(processData);
                                    }while(index === sortedProcesses.length - 1&&stack.length>0);
                                }

                            }

                    //-------------------PP-------------------
/*
                        colSpan = runningTime; OK
                        lastEndTime = colStart + colSpan;
                        processId = process.id;
                        colStart = Math.max(lastEndTime, arrivalTime + 1);
                        */

                        //- editar InputTable para adicionar quantum OK
                        //- colspan é sempre igual ao quantum, menos quando remainingTime<quantum OK
                        //- se o processo terminar antes do quantum, o colspan é igual ao tempo restante OK
                        //- a cada ciclo remainingtime-quantum OK
                        //- o ciclo para quando remainingtime=0 OK

                        //**next step: implementar a stack para o RR
                        //-verificar se o proximo processo da stack tem arrival time menor - nao precisa eu acho OK

                        //executar a stack no final da lista de processos ou se fim do processo atual for menor que o arrival time do proximo processo
                        //-se o processo da stack ainda nao terminou, ele volta para a stack
                        //

                        /*         
                            do{
                                const processData = stack.pop();    
                                stackElement = printStackElement(processData);
                            }while(index === sortedProcesses.length - 1&&stack.length>0);
                        */



                    //-------------------RR-------------------
                } else if (algorithm === 'RR') { // inicializações padrão
                    let remainingTime = runningTime;
                    let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity;
                
                    // se for o último processo e tiver coisa na stack
                    if (index === sortedProcesses.length - 1 && stack.length > 0) {
                        colSpan = Math.min(process.quantum, remainingTime);
                        remainingTime -= colSpan;
                
                        processId = process.id;
                        colStart = Math.max(lastEndTime, arrivalTime + 1);
                        lastEndTime = colStart + colSpan;
                
                        if (remainingTime > 0) {
                            stack.push({ idStack: process.id, arrivalTime, remainingTime, priority });
                        }
                
                        do {
                            const processData = stack.pop();
                            if (processData) {
                                stackElement = printStackElementRR(processData);
                            }
                        } while (stack.length > 0);
                    }
                
                    // se um processo está finalizando e o remaining time é menor que o quantum
                    else if (remainingTime < process.quantum) {
                        colSpan = remainingTime;
                        remainingTime = 0;
                
                        processId = process.id;
                        colStart = Math.max(lastEndTime, arrivalTime + 1);
                        lastEndTime = colStart + colSpan;
                
                        // se o processo finalizar antes do próximo processo chegar - executa a stack
                        if (lastEndTime < nextArrival && stack.length > 0) {
                            const processData = stack.pop();
                            if (processData) {
                                stackElement = printStackElementRR(processData);
                            }
                        }
                    }
                
                    // se o running time for maior que o quantum e não for o último processo
                    else {
                        colSpan = process.quantum;
                        remainingTime -= process.quantum;
                
                        processId = process.id;
                        colStart = Math.max(lastEndTime, arrivalTime + 1);
                        lastEndTime = colStart + colSpan;
                
                        stack.push({ idStack: process.id, arrivalTime, remainingTime, priority });
                
                        if (lastEndTime < nextArrival && stack.length > 0) {
                            // se fim do processo atual for menor que o arrival time do próximo processo
                            const processData = stack.pop();
                            if (processData) {
                                stackElement = printStackElementRR(processData);
                            }
                        }
                    }//-------------------RR-------------------

                } else { //outros algoritmos
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
                        <React.Fragment key={process.id}>
                            {stackElement}
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