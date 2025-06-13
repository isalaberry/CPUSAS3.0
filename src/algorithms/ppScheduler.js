export function runPpSimulation(initialProcesses, initialInterruptions, maxProcessId) {
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

    let readyQueue = [];
    const totalProcessesToTrack = processesForSim.length;
    let completedTrackedProcesses = 0;
    let currentExecutingProcess = null;

    while (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed)) {
        let activityInCycle = false;

        if (currentExecutingProcess && currentExecutingProcess.remainingTime > 0) {
            if (!readyQueue.find(p => p.id === currentExecutingProcess.id)) {
                readyQueue.push(currentExecutingProcess);
            }
        }
        currentExecutingProcess = null;

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

        processesForSim.forEach(p => {
            if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id)) {
                readyQueue.push(p);
            }
            if (p.arrivalTime <= currentSimTime && p.runningTime === 0 && p.finishedAt === -1) {
                p.finishedAt = Math.max(currentSimTime, p.arrivalTime);
                p.waitingTime = Math.max(0, p.finishedAt - p.arrivalTime);
                p.turnaroundTime = p.waitingTime + p.runningTime;
                if (!processesForSim.find(proc => proc.id === p.id && proc.metricsUpdated)) {
                    completedTrackedProcesses++;
                    p.metricsUpdated = true;
                }
                activityInCycle = true;
            }
        });
        
        // PP
        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
            currentExecutingProcess = readyQueue.shift();

            currentSimTime = Math.max(currentSimTime, currentExecutingProcess.arrivalTime);
            
            let execSpan = 1;

            let nextInterruptTime = Infinity;
            interruptionsForSim.forEach(i => {
                if (!i.processed && i.arrivalTime > currentSimTime && i.arrivalTime < currentSimTime + execSpan) {
                    nextInterruptTime = Math.min(nextInterruptTime, i.arrivalTime);
                }
            });

            let nextHigherPrioProcessArrivalTime = Infinity;
            processesForSim.forEach(p => {
                if (p.id !== currentExecutingProcess.id && p.finishedAt === -1 && p.arrivalTime > currentSimTime && p.arrivalTime < currentSimTime + execSpan && p.priority < currentExecutingProcess.priority) {
                    nextHigherPrioProcessArrivalTime = Math.min(nextHigherPrioProcessArrivalTime, p.arrivalTime);
                }
            });

            const actualRunTime = Math.min(execSpan, nextInterruptTime - currentSimTime, nextHigherPrioProcessArrivalTime - currentSimTime, currentExecutingProcess.remainingTime);
            const runThisTick = Math.max(0, actualRunTime > 0 ? Math.min(1, actualRunTime) : 0);

           if (runThisTick > 0) {
                const lastBlock = calculatedBlocks.length > 0 ? calculatedBlocks[calculatedBlocks.length - 1] : null;
                if (lastBlock &&
                    lastBlock.type === 'process' &&
                    lastBlock.rowStart === currentExecutingProcess.id &&
                    (lastBlock.colStart + lastBlock.colSpan -1) === currentSimTime
                   ) {
                    lastBlock.colSpan += runThisTick;
                } else {
                    calculatedBlocks.push({
                        id: `block-${currentExecutingProcess.id}-${currentSimTime}`,
                        colStart: currentSimTime + 1,
                        colSpan: runThisTick,
                        rowStart: currentExecutingProcess.id,
                        type: 'process',
                        displayId: currentExecutingProcess.displayId,
                        color: 'rgba(68, 92, 243, 0.9)'
                    });
                }
                currentExecutingProcess.remainingTime -= runThisTick;
                currentSimTime += runThisTick;
                currentExecutingProcess.lastExecutionTime = currentSimTime;
                activityInCycle = true;
            }


            if (currentExecutingProcess.remainingTime <= 0 && currentExecutingProcess.finishedAt === -1) {
                currentExecutingProcess.finishedAt = currentSimTime;
                currentExecutingProcess.turnaroundTime = currentExecutingProcess.finishedAt - currentExecutingProcess.arrivalTime;
                currentExecutingProcess.waitingTime = Math.max(0, currentExecutingProcess.turnaroundTime - currentExecutingProcess.runningTime);
                 if (!processesForSim.find(proc => proc.id === currentExecutingProcess.id && proc.metricsUpdated)) {
                    completedTrackedProcesses++;
                    currentExecutingProcess.metricsUpdated = true;
                }
                currentExecutingProcess = null;
            }
        } else {
            if (completedTrackedProcesses >= totalProcessesToTrack && interruptionsForSim.every(i => i.processed)) {
                break;
            }
            if (!activityInCycle) {
                let nextEventTimes = [];
                processesForSim.forEach(p => {
                    if (p.finishedAt === -1 && p.arrivalTime > currentSimTime) nextEventTimes.push(p.arrivalTime);
                });
                interruptionsForSim.forEach(i => {
                    if (!i.processed && i.arrivalTime > currentSimTime) nextEventTimes.push(i.arrivalTime);
                });
                 if (nextEventTimes.length === 0) {
                     if (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed)) {
                         let forceBreak = true;
                         processesForSim.forEach(p => { if(p.finishedAt === -1 && p.arrivalTime <= currentSimTime) forceBreak = false;});
                         interruptionsForSim.forEach(i => { if(!i.processed && i.arrivalTime <= currentSimTime) forceBreak = false;});
                         if(forceBreak) break;
                    } else break;
                } else {
                    currentSimTime = Math.min(...nextEventTimes);
                }
            }
        }
    }
    processesForSim.forEach(p => delete p.metricsUpdated);
    return { calculatedBlocks, simulationLastEndTime: currentSimTime, processedItems: processesForSim };
}