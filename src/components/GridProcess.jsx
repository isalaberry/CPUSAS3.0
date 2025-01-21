 
import React, { useState, useEffect } from 'react';

import { useRef } from 'react';

export const GridProcess = ({ tableInfos, algorithm }) => {
    const processGridRef = useRef(null);

    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
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
            if (algorithm === 'FIFO' || algorithm === 'PP') {
                nextProcess = availableProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            } else if (algorithm === 'SJF') {
                nextProcess = availableProcesses.sort((a, b) => a.runningTime - b.runningTime)[0];
            } else if (algorithm === 'PNP') {
                nextProcess = availableProcesses.sort((a, b) => a.priority - b.priority)[0];
            }
    
            sorted.push(nextProcess);
            currentTime += nextProcess.runningTime;
            tableInfos = tableInfos.filter(process => process.id !== nextProcess.id);
        }
    
        return sorted;
    };
//-------------FIX: DESCRIPTION TABLE----------------

useEffect(() => {
    const newDescriptions = {};

    darkBlueSquares.forEach(({ colStart, colSpan, rowStart }) => {
        let processDescriptionId = parseInt(rowStart, 10);

        if(currentColumn === colStart + colSpan){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} exited`;
        }
        else if(currentColumn === colStart){
            newDescriptions[processDescriptionId] = `P${processDescriptionId} entered`;
            //console.log('entrou?', colStart===currentColumn);//true - NAO TA INDO TRUE ? problema na stack
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

// nova funcao
useEffect(() => {
    if (processGridRef.current) {
        const squares = processGridRef.current.querySelectorAll('.process');
        const darkBlueSquares = [];
        squares.forEach((square) => {
            const backgroundColor = window.getComputedStyle(square).backgroundColor;
            if (backgroundColor === 'rgb(25, 69, 105)') { // Verifica se a cor é azul escuro
                //console.log(square);

                const colStart = parseInt(square.style.gridColumnStart, 10);
                const colSpan = parseInt(square.style.gridColumnEnd.split('span ')[1], 10); // Pega o span diretamente
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

    const printStackElement = (processData) => {
        let colStart = Math.max(lastEndTime, processData.arrivalTime + 1);
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
                    let processId; //declara o id do processo

                    let stackElement = null; // Variável para armazenar o elemento da stack

                    if (algorithm === 'PP') {  //lembrando que sortedProcesses ja esta sorteado em orddem de prioridade
                        let remainingTime = runningTime; 

                        let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity; //pega o arrival do proximo processo
                        let nextPriority = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].priority : Infinity; //pega a prioridade do proximo processo
                        let nextId = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].id : null; //pega o id do proximo processo
                        
                        //-------------------PP-------------------

                       

                            //se o proximo processo cortar o atual -> o final do tempo de execucao nao é necessariamente arrivalTime + runningTime!!!
                            if (nextArrival && nextArrival < arrivalTime + runningTime && priority > nextPriority) {
                                //console.log('proximo processo corta o atual');
                                colSpan = nextArrival - arrivalTime; //nextArrival-1 - arrivalTime
                                remainingTime -= colSpan;
                                colStart = Math.max(lastEndTime, arrivalTime + 1);
                                stack.push({ idStack: process.id, arrivalTime, remainingTime, priority });
                                console.log(stack);//certo
                                lastEndTime = colStart + colSpan; 
                                processId=process.id;
                                //logica para salvar tempo de inicio e final do processo
                                //setProcessEntered [process.id] (chegada,saida); - salva o tempo de chegada e saida do processo
                            } 

                            //se o proximo processo nao cortar o atual
                            else {  
                                colStart = Math.max(lastEndTime, arrivalTime + 1);
                                colSpan = runningTime;
                                lastEndTime = colStart + colSpan;
                                processId = process.id;
                                //logica para salvar tempo de inicio e final do processo


                                            //  1 problema: se o ultimo tiver maior prioridade, a stack nunca é printada
                                            //  2 problema: tem que executar os outros processos da stack
                                if (stack.length > 0 && stack[0].priority < priority || index === sortedProcesses.length - 1) { //  bom!!
                                    //  if is the last process, execute all the stack!!!!!!!!!! IDEA!!!!
                                    do{
                                        const processData = stack.pop(); //     
                                        console.log('stack.pop', processData);
                                        stackElement = printStackElement(processData);
                                    }while(index === sortedProcesses.length - 1&&stack.length>0);
                                }
                            }

                             

                        //-------------------PP-------------------

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
                            {stackElement} {/* Renderiza o elemento da stack, se houver */}
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