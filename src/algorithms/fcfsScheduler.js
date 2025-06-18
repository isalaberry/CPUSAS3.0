
export function runFcfsSimulation(initialProcesses, initialInterruptions, maxProcessId) {
    let calculatedBlocks = [];
    let currentSimTime = 0;

    let processesForSim = initialProcesses.map(p => ({
        ...p,
        originalId: p.id,
        remainingTime: p.runningTime,
        finishedAt: -1,
        type: 'process',
        displayId: `P${p.id}`
    }));

    let interruptionsForSim = initialInterruptions.map(i => ({
        ...i,
        originalId: i.id,
        processed: false,
        type: 'interrupt',
        displayId: `I${i.id}`
    }));

    let readyQueue = [];
    let completedProcessesCount = 0;
    const totalProcessesToComplete = processesForSim.length;

    while (completedProcessesCount < totalProcessesToComplete || interruptionsForSim.some(i => !i.processed)) {
        let interruptHandledThisCycle = false;
        interruptionsForSim.sort((a, b) => a.arrivalTime - b.arrivalTime);
        for (let interrupt of interruptionsForSim) {
            if (!interrupt.processed && interrupt.arrivalTime <= currentSimTime) {
                const execStartTimeInterrupt = Math.max(currentSimTime, interrupt.arrivalTime);
                currentSimTime = execStartTimeInterrupt;

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
                interruptHandledThisCycle = true;
                break;
            }
        }

        if (interruptHandledThisCycle) {
            continue;
        }

        processesForSim.forEach(p => {
            if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id)) {
                readyQueue.push(p);
            }
        });

        if (readyQueue.length === 0) {
            if (completedProcessesCount >= totalProcessesToComplete && interruptionsForSim.every(i => i.processed)) {
                break;
            }
            let nextEventTimes = [];
            processesForSim.forEach(p => {
                if (p.finishedAt === -1 && p.arrivalTime > currentSimTime) nextEventTimes.push(p.arrivalTime);
            });
            interruptionsForSim.forEach(i => {
                if (!i.processed && i.arrivalTime > currentSimTime) nextEventTimes.push(i.arrivalTime);
            });

            if (nextEventTimes.length === 0) {
                break;
            }
            currentSimTime = Math.min(...nextEventTimes);
            continue;
        }

        // FCFS: ordena por arrivalTime, e por id para desempate
        readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
        const currentProcess = readyQueue.shift();

        let execSpan = currentProcess.remainingTime;

        // verifica interrupcoes
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
            completedProcessesCount++;
            const processInList = processesForSim.find(p => p.id === currentProcess.id);
            if (processInList) {
                processInList.finishedAt = currentProcess.finishedAt;
                processInList.waitingTime = processInList.finishedAt - processInList.arrivalTime - processInList.runningTime;
                processInList.turnaroundTime = processInList.finishedAt - processInList.arrivalTime;
            }
        } 
    }
    return {
        calculatedBlocks,
        simulationLastEndTime: currentSimTime,
        processedItems: processesForSim,
    };
}