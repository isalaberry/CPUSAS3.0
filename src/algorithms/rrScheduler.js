export function runRrSimulation(initialProcesses, initialInterruptions, maxProcessId, quantum) {
    let calculatedBlocks = [];
    let currentSimTime = 0;

    let processesForSim = initialProcesses.map(p => ({
        ...p,
        remainingTime: p.runningTime,
        finishedAt: -1,
        waitingTime: 0,
        turnaroundTime: 0,
        type: 'process',
        displayId: `P${p.id}`,
        lastExecutionTime: -1
    }));

    let interruptionsForSim = initialInterruptions.map(i => ({
        ...i,
        processed: false,
        type: 'interrupt',
        displayId: `I${i.id}`
    }));

    let readyQueue = []; // FIFO
    const totalProcessesToTrack = processesForSim.length;
    let completedTrackedProcesses = 0;
    let currentExecutingProcess = null;

    while (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed) || readyQueue.length > 0) {
        let activityInCycle = false;

        // interrupcoes handler
        interruptionsForSim.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
        for (let interrupt of interruptionsForSim) {
            if (!interrupt.processed && interrupt.arrivalTime <= currentSimTime) {
                currentSimTime = Math.max(currentSimTime, interrupt.arrivalTime);
                if (interrupt.runningTime > 0) {
                    calculatedBlocks.push({
                        id: `interrupt-block-${interrupt.id}-${currentSimTime}`,
                        colStart: currentSimTime + 1,
                        colSpan: interrupt.runningTime,
                        rowStart: maxProcessId + interrupt.id,
                        type: 'interrupt',
                        displayId: interrupt.displayId,
                        color: 'rgba(146, 107, 252, 0.7)'
                    });
                }
                currentSimTime += interrupt.runningTime;
                interrupt.processed = true;
                activityInCycle = true;
                break;
            }
        }
        if (activityInCycle) continue;


        let initialNewArrivals = [];
        processesForSim.forEach(p => {
            if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id) && !initialNewArrivals.find(na => na.id === p.id) ) {
                initialNewArrivals.push(p);
            }
        });
        initialNewArrivals.sort((a,b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
        initialNewArrivals.forEach(p => {
            if (!readyQueue.find(rq => rq.id === p.id)) readyQueue.push(p);
        });



        // RR
        if (readyQueue.length > 0) {
            const currentProcess = readyQueue.shift();
            const timeProcessStartedThisSlice = currentSimTime;

            currentSimTime = Math.max(currentSimTime, currentProcess.arrivalTime);
            
            let execSpan = Math.min(currentProcess.quantum, currentProcess.remainingTime);

            let nextInterruptTime = Infinity;
            for (const interrupt of interruptionsForSim) {
                if (!interrupt.processed && interrupt.arrivalTime > currentSimTime && interrupt.arrivalTime < (currentSimTime + execSpan)) {
                    nextInterruptTime = Math.min(nextInterruptTime, interrupt.arrivalTime);
                }
            }
            if (nextInterruptTime !== Infinity) {
                execSpan = nextInterruptTime - currentSimTime;
            }
            execSpan = Math.max(0, execSpan);

            if (execSpan > 0) {
                calculatedBlocks.push({
                    id: `block-${currentProcess.id}-${currentSimTime}`,
                    colStart: currentSimTime + 1,
                    colSpan: execSpan,
                    rowStart: currentProcess.id,
                    type: 'process',
                    displayId: currentProcess.displayId,
                    color: 'rgba(68, 92, 243, 0.9)'
                });
            }
            
            currentProcess.remainingTime -= execSpan;
            currentSimTime += execSpan;
            activityInCycle = true;

let newArrivalsDuringQuantum = [];
            processesForSim.forEach(p => {
                if (p.id !== currentProcess.id &&
                    p.arrivalTime <= currentSimTime &&
                    p.arrivalTime > timeProcessStartedThisSlice &&
                    p.remainingTime > 0 && p.finishedAt === -1 &&
                    !readyQueue.find(rq => rq.id === p.id) &&
                    !newArrivalsDuringQuantum.find(na => na.id === p.id)
                ) {
                    newArrivalsDuringQuantum.push(p);
                }
            });

            // ordenar os recém-chegados (durante o quantum atual) por tempo de chegada para adicioná-los na ordem correta
            newArrivalsDuringQuantum.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);

            // Adicionar os recém-chegados à readyQueue (ao final)
            newArrivalsDuringQuantum.forEach(p => {
                 if (!readyQueue.find(rq => rq.id === p.id)) readyQueue.push(p);
            });

            if (currentProcess.remainingTime > 0) {
                if (!readyQueue.find(rq => rq.id === currentProcess.id)) { 
                    readyQueue.push(currentProcess);
                }
            } else { // Processo terminou
                currentProcess.finishedAt = currentSimTime;
                const processInList = processesForSim.find(p => p.id === currentProcess.id);
                if (processInList && !processInList.metricsUpdated) {
                    processInList.finishedAt = currentProcess.finishedAt;
                    processInList.turnaroundTime = processInList.finishedAt - processInList.arrivalTime;
                    processInList.waitingTime = Math.max(0, processInList.turnaroundTime - processInList.runningTime);
                    completedTrackedProcesses++;
                    processInList.metricsUpdated = true;
                }
            }
        } else { // readyQueue está vazia
            if (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed)) {
                let nextEventTime = Infinity;
                processesForSim.forEach(p => {
                    if (p.finishedAt === -1 && p.arrivalTime > currentSimTime) {
                        nextEventTime = Math.min(nextEventTime, p.arrivalTime);
                    }
                });
                interruptionsForSim.forEach(i => {
                    if (!i.processed && i.arrivalTime > currentSimTime) {
                        nextEventTime = Math.min(nextEventTime, i.arrivalTime);
                    }
                });

                if (nextEventTime !== Infinity && nextEventTime > currentSimTime) {
                    currentSimTime = nextEventTime;
                    activityInCycle = true;
                } else if (nextEventTime === Infinity && (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed))) {
                    if (!activityInCycle) break;
                }
            }
        }
               if (!activityInCycle && readyQueue.length === 0 && !(completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed))) {
            break;
        }
    }
    processesForSim.forEach(p => delete p.metricsUpdated);
    return { calculatedBlocks, simulationLastEndTime: currentSimTime, processedItems: processesForSim };
}
