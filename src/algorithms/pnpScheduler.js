export function runPnpSimulation(initialProcesses, initialInterruptions, maxProcessId) {
    let calculatedBlocks = [];
    let currentSimTime = 0;

    let processesForSim = initialProcesses.map(p => ({
        ...p,
        remainingTime: p.runningTime,
        finishedAt: -1,
        waitingTime: 0,
        turnaroundTime: 0,
        type: 'process',
        displayId: `P${p.id}`
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

    while (completedTrackedProcesses < totalProcessesToTrack || interruptionsForSim.some(i => !i.processed)) {
        let activityInCycle = false;

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

        // PNP
        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
            const currentProcess = readyQueue.shift();

            currentSimTime = Math.max(currentSimTime, currentProcess.arrivalTime);
            
            let execSpan = currentProcess.remainingTime;

            // Check for upcoming interruptions that might preempt this process
            let nextInterruptTime = Infinity;
            for (const interrupt of interruptionsForSim) {
                if (!interrupt.processed && interrupt.arrivalTime > currentSimTime && interrupt.arrivalTime < (currentSimTime + execSpan)) {
                    nextInterruptTime = Math.min(nextInterruptTime, interrupt.arrivalTime);
                }
            }

            if (nextInterruptTime !== Infinity) {
                execSpan = nextInterruptTime - currentSimTime;
            }

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

            if (currentProcess.remainingTime <= 0) {
                currentProcess.finishedAt = currentSimTime;
                currentProcess.turnaroundTime = currentProcess.finishedAt - currentProcess.arrivalTime;
                currentProcess.waitingTime = Math.max(0, currentProcess.turnaroundTime - currentProcess.runningTime);
                if (!processesForSim.find(proc => proc.id === currentProcess.id && proc.metricsUpdated)) {
                    completedTrackedProcesses++;
                    currentProcess.metricsUpdated = true;
                }
            } else {
                if (!readyQueue.find(p => p.id === currentProcess.id)) {
                    readyQueue.push(currentProcess);
                }
            }
            activityInCycle = true;
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