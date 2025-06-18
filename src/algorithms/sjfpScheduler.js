export function runSjfpSimulation(initialProcesses, initialInterruptions, maxProcessId) {
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
        metricsUpdated: false,
        lastExecutionStartTime: -1
    }));

    let interruptionsForSim = initialInterruptions.map(i => ({
        ...i,
        processed: false,
        type: 'interrupt',
        displayId: `I${i.id}`
    }));

    let readyQueue = [];
    const totalProcessesToTrack = processesForSim.length;
    let completedTrackedProcesses = 0;
    let currentExecutingProcess = null;

    while (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed) || readyQueue.length > 0 || currentExecutingProcess) {
        let activityInCycle = false;

        if (currentExecutingProcess) {
            if (currentExecutingProcess.remainingTime > 0) {
                if (!readyQueue.find(p => p.id === currentExecutingProcess.id)) {
                    readyQueue.push(currentExecutingProcess);
                }
            }
            currentExecutingProcess = null;
        }

        // tratamento de interrupções
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

        // fila de prontos
        processesForSim.forEach(p => {
            if (p.arrivalTime <= currentSimTime && p.finishedAt === -1) {
                if (p.runningTime === 0 && !p.metricsUpdated) {
                    p.finishedAt = p.arrivalTime;
                    p.turnaroundTime = 0;
                    p.waitingTime = 0;
                    completedTrackedProcesses++;
                    p.metricsUpdated = true;
                } else if (p.remainingTime > 0 && !readyQueue.find(rq => rq.id === p.id)) {
                    readyQueue.push(p);
                }
            }
        });

        // SRTF -SJFP
        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime || a.arrivalTime - b.arrivalTime || a.id - b.id);
            
            currentExecutingProcess = readyQueue.shift(); // pega o processo com menor tempo restante

            currentSimTime = Math.max(currentSimTime, currentExecutingProcess.arrivalTime);
            
            let execSpan = 1;

            let immediateInterrupt = interruptionsForSim.find(i => !i.processed && i.arrivalTime === currentSimTime);
            if (immediateInterrupt) {
                if (currentExecutingProcess) {
                     if (!readyQueue.find(p => p.id === currentExecutingProcess.id)) {
                        readyQueue.unshift(currentExecutingProcess);
                     }
                     currentExecutingProcess = null;
                }
                activityInCycle = true;
                continue; 
            }

            execSpan = Math.min(execSpan, currentExecutingProcess.remainingTime);
            execSpan = Math.max(0, execSpan);

            if (execSpan > 0) {
                const lastBlock = calculatedBlocks.length > 0 ? calculatedBlocks[calculatedBlocks.length - 1] : null;
                if (lastBlock &&
                    lastBlock.type === 'process' &&
                    lastBlock.rowStart === currentExecutingProcess.id &&
                    (lastBlock.colStart -1 + lastBlock.colSpan) === currentSimTime &&
                    currentExecutingProcess.lastExecutionStartTime === (lastBlock.colStart -1) 
                   ) {
                    lastBlock.colSpan += execSpan;
                } else {
                    calculatedBlocks.push({
                        id: `block-${currentExecutingProcess.id}-${currentSimTime}`,
                        colStart: currentSimTime + 1,
                        colSpan: execSpan,
                        rowStart: currentExecutingProcess.id,
                        type: 'process',
                        displayId: currentExecutingProcess.displayId,
                        color: 'rgba(68, 92, 243, 0.9)'
                    });
                    currentExecutingProcess.lastExecutionStartTime = currentSimTime;
                }

                currentExecutingProcess.remainingTime -= execSpan;
                currentSimTime += execSpan;
                activityInCycle = true;
            }


            if (currentExecutingProcess && currentExecutingProcess.remainingTime <= 0) {
                if (!currentExecutingProcess.metricsUpdated) {
                    currentExecutingProcess.finishedAt = currentSimTime;
                    currentExecutingProcess.turnaroundTime = currentExecutingProcess.finishedAt - currentExecutingProcess.arrivalTime;
                    currentExecutingProcess.waitingTime = Math.max(0, currentExecutingProcess.turnaroundTime - currentExecutingProcess.runningTime);
                    completedTrackedProcesses++;
                    currentExecutingProcess.metricsUpdated = true;
                }
            }

        } else {
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
                    if (!activityInCycle && !(readyQueue.length > 0 || currentExecutingProcess) ) break; 
                }
            }
        }
        
        if (!activityInCycle && !currentExecutingProcess && readyQueue.length === 0 &&
            !(completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed))) {
            break;
        }
    }

    processesForSim.forEach(p => { 
        delete p.metricsUpdated;
        delete p.lastExecutionStartTime;
    });

    return {
        calculatedBlocks,
        simulationLastEndTime: currentSimTime,
        processedItems: processesForSim,
    };
}