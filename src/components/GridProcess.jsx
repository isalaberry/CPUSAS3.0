import React, { useState, useEffect } from 'react';

export const GridProcess = ({ tableInfos, algorithm }) => {

    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
    const [averageWaitingTime, setAverageWaitingTime] = useState(0);
    const [averageTurnaroundTime, setAverageTurnaroundTime] = useState(0);



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
    //
        while (tableInfos.length > 0) {
            let availableProcesses = tableInfos.filter(process => process.arrivalTime <= currentTime);
    
            if (availableProcesses.length === 0) {
                currentTime = Math.min(...tableInfos.map(process => process.arrivalTime));
                availableProcesses = tableInfos.filter(process => process.arrivalTime <= currentTime);
            }
    //
            let nextProcess;
            if (algorithm === 'FIFO') {
                nextProcess = availableProcesses.sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
            } else if (algorithm === 'SJF') {
                nextProcess = availableProcesses.sort((a, b) => a.runningTime - b.runningTime)[0];
            } else if (algorithm === 'PP' || algorithm === 'PNP') {
                nextProcess = availableProcesses.sort((a, b) => a.priority - b.priority)[0];
            }
    
            sorted.push(nextProcess);
            currentTime += nextProcess.runningTime;
            tableInfos = tableInfos.filter(process => process.id !== nextProcess.id);
        }
    
        return sorted;
    };

    useEffect(() => {
        const sortedProcesses = sortProcesses(tableInfos);
        let lastEndTime = 0;
        const newDescriptions = {};
        let totalWaitingTime = 0;
        let totalTurnaroundTime = 0;


        sortedProcesses.forEach((process) => {
            const { arrivalTime, runningTime } = process;
            const colStart = Math.max(lastEndTime, arrivalTime + 1); 
            const colSpan = runningTime; 
            lastEndTime = colStart + colSpan;

            const waitingTime = colStart - arrivalTime;
            totalWaitingTime += waitingTime;

            const turnaroundTime = (lastEndTime-1) - arrivalTime;
            totalTurnaroundTime += turnaroundTime;

            if(currentColumn === colStart + colSpan){
                newDescriptions[process.id] = `P${process.id} exited`;
            }
           
            else if(currentColumn === colStart && currentColumn === arrivalTime + 1){
                newDescriptions[process.id] = `P${process.id} arrived and entered`;
            }
            else if(currentColumn === arrivalTime + 1){
                newDescriptions[process.id] = `P${process.id} arrived`;
            }
            else if(currentColumn === colStart){
                newDescriptions[process.id] = `P${process.id} entered`;
            }
            else if(currentColumn === colStart + colSpan){
                newDescriptions[process.id] = `P${process.id} exited`;
            }
            else if(currentColumn < arrivalTime + 1){
                newDescriptions[process.id] = `P${process.id} didn't arrive yet`;
            }
            else if(currentColumn > colStart && currentColumn < colStart + colSpan){
                newDescriptions[process.id] = `P${process.id} is executing`;
            }  
            else if(currentColumn<colStart){
                newDescriptions[process.id] = `P${process.id} is waiting`;
            }
            else if(currentColumn>colStart+colSpan){
                newDescriptions[process.id] = `P${process.id} ended`;
            }
            else{
                newDescriptions[process.id] = `Error`;
            }

        });

        setDescriptions(newDescriptions);
        setAverageWaitingTime(totalWaitingTime / sortedProcesses.length);
        setAverageTurnaroundTime(totalTurnaroundTime / sortedProcesses.length);
    }, [currentColumn, tableInfos, algorithm]);

    const sortedProcesses = sortProcesses(tableInfos);
    let lastEndTime = 0;

    return (
        <div className='grid-container'>
            <div className='process-grid' style={{ position: 'relative' }}>

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

                    if (algorithm === 'PP') {  //lembrando que sortedProcesses ja esta sorteado em orddem de prioridade
                        let remainingTime = runningTime; 

                        let nextArrival = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].arrivalTime : Infinity; //pega o arrival do proximo processo
                        let nextPriority = index < sortedProcesses.length - 1 ? sortedProcesses[index + 1].priority : Infinity; //pega a prioridade do proximo processo
                        let stack = []; //declara a stack
                        
                        //
                        
                            //tem coisas na stack? SIM: um item da stack tem prioridade menor que o atual? SIM: executa o item da stack NÃO: executa o atual
                            //tem coisas na stack? NAO: executa o atual
                            if (nextArrival && nextArrival < arrivalTime + runningTime && priority > nextPriority) { //se o proximo processo cortar o atual
                                colSpan = nextArrival - arrivalTime;
                                remainingTime -= colSpan;
                                colStart = Math.max(lastEndTime, arrivalTime + 1);
                                console.log("algum processo cortou");
                                stack.push({ arrivalTime: nextArrival, remainingTime, priority: nextPriority });
                                lastEndTime = colStart + colSpan; 

                            } else {  //se o proximo processo nao cortar o atual
                                console.log("processo nao cortou", remainingTime);
                                colStart = Math.max(lastEndTime, arrivalTime + 1);
                                colSpan = runningTime;
                                lastEndTime = colStart + colSpan;
                            }

                        

                    } else { //outros algoritmos
                        colStart = Math.max(lastEndTime, arrivalTime + 1);
                        colSpan = runningTime;
                        lastEndTime = colStart + colSpan; 

                    }

                    
                    const processStyle = {
                        gridColumnStart: colStart,
                        gridColumnEnd: `span ${colSpan}`,
                        position: 'relative',
                        gridRowStart: process.id,
                    };
                    
                    return (
                        <div key={process.id} className='process' style={processStyle}>
                            <div style={{ zIndex: 2 }}>
                                {`P${process.id}`}
                            </div>
                        </div>
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
                    Average Waiting Time: {averageWaitingTime}
                </div>
                <div>
                    Turnaround Time: {averageTurnaroundTime}

                </div>
            </div>
        </div>
    );
};
