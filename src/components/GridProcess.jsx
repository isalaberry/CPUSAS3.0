import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from './UserContext';
import html2canvas from 'html2canvas';

export const GridProcess = ({ tableInfos: initialTableInfos, interruptionsData: initialInterruptionsData, algorithm, saveDataToFirestore }) => {
    const processGridRef = useRef(null);
    const { user, userProfile } = useContext(UserContext);

    const [tableInfos, setTableInfos] = useState([]);
    const [interruptions, setInterruptions] = useState([]);

    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
    const [averageWaitingTime, setAverageWaitingTime] = useState(0);
    const [averageTurnaroundTime, setAverageTurnaroundTime] = useState(0);

    const [darkBlueSquares, setDarkBlueSquares] = useState([]);
    const [simulationLastEndTime, setSimulationLastEndTime] = useState(0);

    const [recIsRecording, setRecIsRecording] = useState(false);
    const recMediaRecorderRef = useRef(null);
    const recOffScreenCanvasRef = useRef(null);
    const recChunksRef = useRef([]);
    const recIsRecordingStateRef = useRef(recIsRecording);

    const maxProcessId = initialTableInfos && initialTableInfos.length > 0 ? Math.max(0, ...initialTableInfos.map(p => p.id)) : 0;

    const handleNextColumn = () => setCurrentColumn((prev) => Math.min(prev + 1, simulationLastEndTime + 1));
    const handlePreviousColumn = () => setCurrentColumn((prev) => Math.max(prev - 1, 1));
    const handleFirstColumn = () => setCurrentColumn(1);
    const handleLastColumn = () => setCurrentColumn(simulationLastEndTime + 1);

    const processRowIds = (initialTableInfos || []).map(p => p.id);
    const interruptRowIds = (initialInterruptionsData || []).map(i => maxProcessId + i.id);
    const allRowIds = [...processRowIds, ...interruptRowIds].filter(id => typeof id === 'number');
    const totalRowsForGrid = allRowIds.length > 0 ? Math.max(1, ...allRowIds) : 1;


    useEffect(() => {
        recIsRecordingStateRef.current = recIsRecording;
    }, [recIsRecording]);

    useEffect(() => {
        setTableInfos(initialTableInfos ? JSON.parse(JSON.stringify(initialTableInfos)) : []);
        setInterruptions(initialInterruptionsData ? JSON.parse(JSON.stringify(initialInterruptionsData)) : []);
        setCurrentColumn(1);
        setDarkBlueSquares([]);
        setSimulationLastEndTime(0);
        setDescriptions({});
        setAverageWaitingTime(0);
        setAverageTurnaroundTime(0);
    }, [initialTableInfos, initialInterruptionsData, algorithm]);

    useEffect(() => {
        if ((!tableInfos || tableInfos.length === 0) && (!interruptions || interruptions.length === 0)) {
            setDarkBlueSquares([]);
            setSimulationLastEndTime(0);
            return;
        }

        let calculatedBlocks = [];
        let currentSimTime = 0;
        
        let processesForSim = tableInfos.map(p => ({
            ...JSON.parse(JSON.stringify(p)),
            remainingTime: p.runningTime,
            finishedAt: -1,
            startedAt: -1,
            timeInReadyQueueSince: p.arrivalTime,
            type: 'process',
            displayId: `P${p.id}`
        }));
        let completedProcessesCount = 0;

        let interruptionsForSim = interruptions.map(i => ({
            ...JSON.parse(JSON.stringify(i)),
            processed: false,
            type: 'interrupt',
            displayId: `I${i.id}`
        }));

        let readyQueue = [];
        const maxProcessIdInSim = tableInfos.length > 0 ? Math.max(0, ...tableInfos.map(p => p.id)) : 0;

        while (completedProcessesCount < processesForSim.length || interruptionsForSim.some(i => !i.processed)) {
            let eventOccurred = false;

            interruptionsForSim.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
            for (let interrupt of interruptionsForSim) {
                if (!interrupt.processed && interrupt.arrivalTime <= currentSimTime) {
                    const execStartTimeInterrupt = Math.max(currentSimTime, interrupt.arrivalTime);
                    currentSimTime = execStartTimeInterrupt;

                    const interruptSpan = interrupt.runningTime;
                    calculatedBlocks.push({
                        id: `interrupt-block-${interrupt.id}-${currentSimTime}`,
                        colStart: currentSimTime + 1,
                        colSpan: interruptSpan,
                        rowStart: maxProcessIdInSim + interrupt.id,
                        type: 'interrupt',
                        displayId: interrupt.displayId,
                        color: 'rgba(146, 107, 252, 0.7)'
                    });
                    currentSimTime += interruptSpan;
                    interrupt.processed = true;
                    eventOccurred = true;
                }
            }
            if (eventOccurred) continue;

            processesForSim.forEach(p => {
                if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id)) {
                    p.enteredReadyQueueAtTick = currentSimTime;
                    p.timeInReadyQueueSince = currentSimTime;
                    readyQueue.push(p);
                }
            });

            if (readyQueue.length === 0) {
                let nextProcessArrivalTimes = processesForSim
                    .filter(p => p.remainingTime > 0 && p.finishedAt === -1 && p.arrivalTime > currentSimTime)
                    .map(p => p.arrivalTime);
                let nextInterruptArrivalTimes = interruptionsForSim
                    .filter(i => !i.processed && i.arrivalTime > currentSimTime)
                    .map(i => i.arrivalTime);
                
                const allNextEventTimes = [...nextProcessArrivalTimes, ...nextInterruptArrivalTimes].filter(t => t !== undefined && t !== null);

                if (allNextEventTimes.length === 0) {
                     if (completedProcessesCount < processesForSim.length || interruptionsForSim.some(i => !i.processed)) {
                        // Potential issue if stuck
                     }
                    break;
                }
                currentSimTime = Math.min(...allNextEventTimes);
                eventOccurred = true;
                if (eventOccurred) continue;
            }
            
            if (eventOccurred) continue;

            let nextProcessToRun;
            if (algorithm === 'FIFO') {
                readyQueue.sort((a, b) => a.timeInReadyQueueSince - b.timeInReadyQueueSince || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'SJF') {
                readyQueue.sort((a, b) => a.runningTime - b.runningTime || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PNP') {
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PP') {
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue[0];
            } else if (algorithm === 'RR') {
                readyQueue.sort((a,b) => a.timeInReadyQueueSince - b.timeInReadyQueueSince || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else {
                break; 
            }

            if (!nextProcessToRun) {
                 if (interruptionsForSim.some(i => !i.processed && i.arrivalTime <= currentSimTime)) {
                    continue;
                }
                currentSimTime++;
                continue;
            }

            const execStartTimeForProcess = Math.max(currentSimTime, nextProcessToRun.arrivalTime);
            if (currentSimTime < execStartTimeForProcess) {
                currentSimTime = execStartTimeForProcess;
                continue;
            }
            
            if (nextProcessToRun.startedAt === -1) {
                nextProcessToRun.startedAt = currentSimTime;
            }
            
            let baseExecSpan;
            if (algorithm === 'PP') {
                baseExecSpan = 1;
            } else if (algorithm === 'RR') {
                baseExecSpan = Math.min(nextProcessToRun.remainingTime, nextProcessToRun.quantum);
            } else {
                baseExecSpan = nextProcessToRun.remainingTime;
            }
            if (baseExecSpan <= 0 && nextProcessToRun.runningTime > 0) baseExecSpan = 1;
            if (nextProcessToRun.runningTime === 0) baseExecSpan = 0;

            let timeOfNextPendingInterrupt = Infinity;
            interruptionsForSim.forEach(i => {
                if (!i.processed && i.arrivalTime > currentSimTime) {
                    timeOfNextPendingInterrupt = Math.min(timeOfNextPendingInterrupt, i.arrivalTime);
                }
            });

            let actualExecSpan = baseExecSpan;
            if (timeOfNextPendingInterrupt !== Infinity) {
                const maxSpanBeforeInterrupt = timeOfNextPendingInterrupt - currentSimTime;
                if (maxSpanBeforeInterrupt < actualExecSpan) {
                    actualExecSpan = maxSpanBeforeInterrupt;
                }
            }
            
            if (actualExecSpan <= 0 && nextProcessToRun.remainingTime > 0) {
                actualExecSpan = 0;
            }

            if (actualExecSpan > 0) {
                calculatedBlocks.push({
                    id: `block-${nextProcessToRun.id}-${currentSimTime}`,
                    colStart: currentSimTime + 1,
                    colSpan: actualExecSpan,
                    rowStart: nextProcessToRun.id,
                    type: 'process',
                    displayId: nextProcessToRun.displayId,
                    color: 'rgba(0, 0, 255, 0.7)'
                });
                nextProcessToRun.remainingTime -= actualExecSpan;
                eventOccurred = true;
            }
            
            const prevSimTime = currentSimTime;
            currentSimTime += actualExecSpan;

            if (nextProcessToRun.remainingTime <= 0) {
                nextProcessToRun.finishedAt = currentSimTime;
                completedProcessesCount++;
                if (algorithm === 'PP' && readyQueue.includes(nextProcessToRun)) {
                     readyQueue = readyQueue.filter(p => p.id !== nextProcessToRun.id);
                }
            } else {
                if (algorithm === 'RR') {
                    nextProcessToRun.timeInReadyQueueSince = currentSimTime;
                    readyQueue.push(nextProcessToRun);
                }
            }

            if (!eventOccurred && prevSimTime === currentSimTime) {
                if (completedProcessesCount === processesForSim.length && interruptionsForSim.every(i => i.processed)) {
                    break;
                }
                if (readyQueue.length === 0 && interruptionsForSim.every(i => i.processed || i.arrivalTime > currentSimTime)) {
                    break;
                }
            }
        }

        setDarkBlueSquares(calculatedBlocks);
        setSimulationLastEndTime(currentSimTime);

    }, [tableInfos, interruptions, algorithm]);


    useEffect(() => {
        const newDescriptions = {};
        const allItemsToDescribe = [
            ...(initialTableInfos || []).map(p => ({ ...p, itemType: 'process', displayPrefix: 'P' })),
            ...(initialInterruptionsData || []).map(i => ({ ...i, itemType: 'interrupt', displayPrefix: 'I' }))
        ];

        if (allItemsToDescribe.length === 0) {
            setDescriptions({}); return;
        }

        const effectiveCurrentTick = currentColumn > 0 ? currentColumn - 1 : 0;

        allItemsToDescribe.forEach(item => {
            let status = "Não iniciado";
            let color = "grey";
            
            const segmentsForItem = darkBlueSquares.filter(sq => {
                if (item.itemType === 'process' && sq.type === 'process' && sq.rowStart === item.id) return true;
                if (item.itemType === 'interrupt' && sq.type === 'interrupt' && sq.rowStart === (maxProcessId + item.id)) return true;
                return false;
            });

            if (effectiveCurrentTick < item.arrivalTime) {
                status = `${item.displayPrefix}${item.id} aguarda chegada (em ${item.arrivalTime})`;
            } else {
                let isExecutingNow = false;
                let hasFinished = false;
                let latestSegmentEndForItem = item.arrivalTime;

                for (const segment of segmentsForItem) {
                    const segmentStartTick = segment.colStart - 1;
                    const segmentEndTick = segment.colStart - 1 + segment.colSpan;
                    if (effectiveCurrentTick >= segmentStartTick && effectiveCurrentTick < segmentEndTick) {
                        isExecutingNow = true; break;
                    }
                    latestSegmentEndForItem = Math.max(latestSegmentEndForItem, segmentEndTick);
                }
                if (segmentsForItem.length > 0 && effectiveCurrentTick >= latestSegmentEndForItem) {
                    hasFinished = true;
                }

                if (isExecutingNow) {
                    status = `${item.displayPrefix}${item.id} está a executar`;
                    color = item.itemType === 'interrupt' ? 'red' : 'blue';
                } else if (hasFinished) {
                    status = `${item.displayPrefix}${item.id} terminou`;
                    color = "darkgray";
                } else if (item.itemType === 'process' && effectiveCurrentTick >= item.arrivalTime) {
                    status = `${item.displayPrefix}${item.id} está em espera`; color = "orange";
                } else if (item.itemType === 'interrupt' && effectiveCurrentTick >= item.arrivalTime && segmentsForItem.length === 0 && item.runningTime > 0) {
                    status = `${item.displayPrefix}${item.id} pendente`; color = "purple";
                } else if (item.itemType === 'interrupt' && item.runningTime === 0 && effectiveCurrentTick >= item.arrivalTime) {
                    status = `${item.displayPrefix}${item.id} terminou (sem execução)`; color = "darkgray";
                }
            }
            newDescriptions[`${item.itemType}-${item.id}`] = <span style={{ color }}>{status}</span>;
        });
        setDescriptions(newDescriptions);
    }, [currentColumn, darkBlueSquares, initialTableInfos, initialInterruptionsData, simulationLastEndTime, maxProcessId, algorithm]);

    useEffect(() => {
        if (!initialTableInfos || initialTableInfos.length === 0 ) {
            setAverageWaitingTime(0); setAverageTurnaroundTime(0); return;
        }
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
        let processesCountedForMetrics = 0;

        initialTableInfos.forEach(processInfo => {
            const arrival = processInfo.arrivalTime;
            const burst = processInfo.runningTime;
            let completion = arrival;
            const segments = darkBlueSquares.filter(s => s.type ==='process' && s.rowStart === processInfo.id);

            if (burst === 0) {
                completion = arrival;
            } else if (segments.length > 0) {
                const lastSegment = segments.sort((a, b) => (a.colStart + a.colSpan) - (b.colStart + b.colSpan)).pop();
                completion = (lastSegment.colStart -1) + lastSegment.colSpan;
            } else {
                return; 
            }
            
            const turnaround = completion - arrival;
            const waiting = turnaround - burst;
            totalTurnaroundTime += Math.max(0, turnaround);
            totalWaitingTime += Math.max(0, waiting);
            processesCountedForMetrics++;
        });
        setAverageTurnaroundTime(processesCountedForMetrics > 0 ? (totalTurnaroundTime / processesCountedForMetrics) : 0);
        setAverageWaitingTime(processesCountedForMetrics > 0 ? (totalWaitingTime / processesCountedForMetrics) : 0);
    }, [darkBlueSquares, initialTableInfos]); 

    const handleAutoIncrementOriginal = () => {
        if (recIsRecording) return;
        if (simulationLastEndTime === 0 && ((initialTableInfos && initialTableInfos.length > 0) || (initialInterruptionsData && initialInterruptionsData.length > 0))) {
            alert("Aguarde o cálculo da simulação."); return;
        }
        const intervalId = setInterval(() => {
            setCurrentColumn((prevColumn) => {
                if (prevColumn >= simulationLastEndTime + 1) {
                    clearInterval(intervalId); return prevColumn;
                }
                return prevColumn + 1;
            });
        }, 1000);
    };

    const handleSaveTable = () => {
        if (user && userProfile?.status === 'approved' && saveDataToFirestore && typeof saveDataToFirestore === 'function') {
            saveDataToFirestore(initialTableInfos, initialInterruptionsData);
            alert('Cenário guardado com sucesso!');
        } else {
            alert('Erro: Não foi possível guardar o cenário. Verifique se está logado e aprovado.');
        }
    };
    
     const recHandleStart = async () => {
        if (!processGridRef.current || !recOffScreenCanvasRef.current || ((!initialTableInfos || initialTableInfos.length === 0) && (!initialInterruptionsData || initialInterruptionsData.length === 0))) {
            alert("Dados da simulação não disponíveis ou sem processos/interrupções para gravar.");
            return;
        }
        if (simulationLastEndTime <= 0 && ((initialTableInfos && initialTableInfos.length > 0) || (initialInterruptionsData && initialInterruptionsData.length > 0))) {
            alert("Tempo final da simulação inválido. Verifique os dados ou aguarde o cálculo.");
            return;
        }

        alert("A gravação vai começar. A simulação será reiniciada e avançará automaticamente.\n\nPor favor, NÃO MUDE DE ABA OU JANELA durante a gravação.");
        
        setRecIsRecording(true);
        recChunksRef.current = [];
        setCurrentColumn(1);

        await new Promise(resolve => setTimeout(resolve, 150)); 

        const gridElement = processGridRef.current;
        const targetCanvas = recOffScreenCanvasRef.current;
        
        if (!gridElement || !targetCanvas) {
            alert("Erro interno: Elemento do grid ou canvas de gravação não encontrado.");
            setRecIsRecording(false);
            return;
        }

        try {
            targetCanvas.width = gridElement.scrollWidth;
            targetCanvas.height = gridElement.scrollHeight;
            if (targetCanvas.width === 0 || targetCanvas.height === 0) {
                alert("Erro: Dimensões do conteúdo a ser gravado são zero.");
                setRecIsRecording(false);
                return;
            }
        } catch (error) {
            alert("Erro ao configurar as dimensões do canvas de gravação.");
            setRecIsRecording(false);
            return;
        }
        
        const offCtx = targetCanvas.getContext('2d', { willReadFrequently: true }); 
        if (!offCtx) {
            alert("Erro interno: Não foi possível preparar o canvas para gravação.");
            setRecIsRecording(false);
            return;
        }

        const recStream = targetCanvas.captureStream(25);
        
        if (!recStream || recStream.getVideoTracks().length === 0) {
            alert("Erro interno: Não foi possível iniciar a captura de vídeo do canvas.");
            setRecIsRecording(false);
            return;
        }

        let chosenMimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
            chosenMimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
                chosenMimeType = 'video/webm';
                if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
                    alert("Seu navegador não suporta os formatos de vídeo WebM necessários para gravação.");
                    setRecIsRecording(false);
                    return;
                }
            }
        }

        try {
            recMediaRecorderRef.current = new MediaRecorder(recStream, { mimeType: chosenMimeType });
        } catch (e) {
            alert(`Erro ao iniciar o gravador de vídeo: ${e.message}.`);
            setRecIsRecording(false);
            return;
        }

        recMediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recChunksRef.current.push(event.data);
            }
        };
        recMediaRecorderRef.current.onstop = () => {
            if (recChunksRef.current.length === 0) {
                alert("Nenhum dado de vídeo foi gravado.");
                setRecIsRecording(false); 
                return;
            }
            const recVideoBlob = new Blob(recChunksRef.current, { type: recMediaRecorderRef.current.mimeType });
            const recVideoUrl = URL.createObjectURL(recVideoBlob);
            const recDownloadLink = document.createElement('a');
            recDownloadLink.href = recVideoUrl;
            recDownloadLink.download = `simulacao_${algorithm}_${new Date().toISOString().slice(0,10)}.webm`;
            document.body.appendChild(recDownloadLink);
            recDownloadLink.click();
            document.body.removeChild(recDownloadLink);
            URL.revokeObjectURL(recVideoUrl);
            setRecIsRecording(false);
            setCurrentColumn(1);
            alert("Gravação concluída e download iniciado!");
        };
        recMediaRecorderRef.current.onerror = (event) => {
            alert(`Erro durante a gravação: ${event.error.name} - ${event.error.message}`);
            recHandleStop();
        };
        
        recMediaRecorderRef.current.start(1000); 
        recTriggerNextFrame(1);
    };

    const recTriggerNextFrame = async (tickToSet) => {
        if (!recIsRecordingStateRef.current || tickToSet > simulationLastEndTime + 1) {
            if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
                recMediaRecorderRef.current.stop();
            }
            return;
        }
        setCurrentColumn(tickToSet); 

        await new Promise(resolve => requestAnimationFrame(() => {
            requestAnimationFrame(resolve); 
        }));   

        if (recIsRecordingStateRef.current &&
            processGridRef.current &&
            recOffScreenCanvasRef.current &&
            recMediaRecorderRef.current?.state === "recording") {
            
            const gridEl = processGridRef.current;
            const offCanvas = recOffScreenCanvasRef.current;
            const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

            if (!offCtx) {
                recHandleStop();
                return;
            }
            try {
                if (offCanvas.width !== gridEl.scrollWidth || offCanvas.height !== gridEl.scrollHeight) {
                     offCanvas.width = gridEl.scrollWidth;
                     offCanvas.height = gridEl.scrollHeight;
                }

                const h2cCanvas = await html2canvas(gridEl, {
                    useCORS: true,
                    logging: false,
                    width: gridEl.scrollWidth,
                    height: gridEl.scrollHeight,
                    backgroundColor: null,
                });

                offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height);
                offCtx.drawImage(h2cCanvas, 0, 0);

                if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
                    recMediaRecorderRef.current.requestData();
                }
            } catch (error) {
                recHandleStop(); 
                return;
            }
        }

        if (recIsRecordingStateRef.current) {
            await new Promise(resolve => setTimeout(resolve, 1000)); 
            recTriggerNextFrame(tickToSet + 1);
        }
    };

    const recHandleStop = () => {
        if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
            recMediaRecorderRef.current.stop(); 
        } else {
            setRecIsRecording(false);
        }
    };

    return (
        <div className='grid-container'>
            <canvas 
                ref={recOffScreenCanvasRef} 
                style={{ width: '400px', height: '150px', position: 'fixed', top: '10px', right: '10px', zIndex: 9999, display: recIsRecording ? 'block' : 'none' }}
            />
            <div className='process-grid' style={{ position: 'relative' }} ref={processGridRef}>
                <div className="time-bar" style={{
                    position: 'absolute', width: '10px', height: '100%',
                    backgroundColor: 'yellow', zIndex: 4, top: 0, bottom: 0,
                    gridColumnStart: currentColumn, gridColumnEnd: currentColumn + 1,
                }}></div>
                {darkBlueSquares.map((segment) => (
                    <div
                        key={segment.id}
                        className={segment.type === 'interrupt' ? 'interrupt-segment' : 'process-segment'} 
                        style={{
                            gridColumnStart: segment.colStart,
                            gridColumnEnd: `span ${segment.colSpan}`,
                            gridRowStart: segment.rowStart,
                            position: 'relative',
                            backgroundColor: segment.color, 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            fontSize: '0.8em',
                        }}
                    >
                        <div style={{ zIndex: 2 }}>{segment.displayId}</div>
                    </div>
                ))}
                {(initialTableInfos || []).map((process) => (
                     <div
                         key={`arrival-P${process.id}`} className='arrival-indicator'
                         style={{
                             gridColumnStart: process.arrivalTime + 1, gridColumnEnd: process.arrivalTime + 2,
                             position: 'relative', top: 0, left: 0, backgroundColor: '#cadeed', 
                             width: '10px', height: '100%', gridRowStart: process.id, zIndex: 1,
                             writingMode: 'vertical-rl', fontSize: '0.7em', textAlign: 'center',
                         }}
                     >
                         
                     </div>
                ))}
                {(initialInterruptionsData || []).map((interrupt) => (
                     <div
                         key={`arrival-I${interrupt.id}`} className='arrival-indicator'
                         style={{
                             gridColumnStart: interrupt.arrivalTime + 1, gridColumnEnd: interrupt.arrivalTime + 2,
                             position: 'relative', top: 0, left: 0, backgroundColor: '#cadeed', 
                             width: '10px', height: '100%', gridRowStart: maxProcessId + interrupt.id, zIndex: 1,
                             writingMode: 'vertical-rl', fontSize: '0.7em', textAlign: 'center',
                         }}
                     >
                        
                     </div>
                ))}
                <div className="labels" style={{ gridRowStart: totalRowsForGrid + 1 }}> 
                    {[...Array(Math.max(0, simulationLastEndTime + 1))].map((_, i) => ( 
                        <div key={`label-${i}`} className="label" style={{gridColumnStart: i + 1, gridColumnEnd: i + 2}}>
                            {i.toString().padStart(2, '0')}
                        </div>
                    ))}
                </div>
            </div>
            <div className='description-table'>
                <table style={{ width: '100%' }}>
                    <thead>
                        <tr><th className='description-table-title'>Description (Tick: {currentColumn > 0 ? currentColumn -1 : 0})</th></tr>
                    </thead>
                    <tbody>
                        {(initialTableInfos || []).map((process) => (
                            <tr key={`desc-process-${process.id}`}>
                                <td style={{ padding: '8px', textAlign:'center' }}>{descriptions[`process-${process.id}`] || `P${process.id} aguarda`}</td>
                            </tr>
                        ))}
                        {(initialInterruptionsData || []).map((interrupt) => (
                            <tr key={`desc-interrupt-${interrupt.id}`}>
                                <td style={{ padding: '8px', textAlign:'center' }}>{descriptions[`interrupt-${interrupt.id}`] || `I${interrupt.id} aguarda`}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="button-time-container">
                <button onClick={handleFirstColumn} className="button" disabled={recIsRecording}>{'<<'}</button>
                <button onClick={handlePreviousColumn} className="button" disabled={recIsRecording}>{'<'}</button>
                <button onClick={handleNextColumn} className="button" disabled={recIsRecording}>{'>'}</button>
                <button onClick={handleLastColumn} className="button" disabled={recIsRecording}>{'>>'}</button>
                <button onClick={handleAutoIncrementOriginal} className="button" style={{ minWidth: '20%' }} disabled={recIsRecording}>{'Auto >'}</button>
            
                {user && userProfile?.status === 'approved' && saveDataToFirestore && (
                    <button onClick={handleSaveTable} className="button" style={{ minWidth: '30%' }} disabled={recIsRecording}>
                        Guardar Cenário
                    </button>
                )}
                {recIsRecording ? (
                    <button onClick={recHandleStop} className="button" >Parar Gravação</button>
                ) : (
                    <button onClick={recHandleStart} className="button" >Gravar Simulação</button>
                )}
            </div>
            <div className="ttwt-container">
                <div>Average Waiting Time: {averageWaitingTime.toFixed(2)}</div>
                <div>Turnaround Time: {averageTurnaroundTime.toFixed(2)}</div>
            </div>
        </div>
    );
};