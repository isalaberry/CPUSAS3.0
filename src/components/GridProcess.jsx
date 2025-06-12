import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from './UserContext';
import html2canvas from 'html2canvas';
import '../App.css';
import { useTranslation } from 'react-i18next';

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

    const { t } = useTranslation();


    useEffect(() => {
        recIsRecordingStateRef.current = recIsRecording;
    }, [recIsRecording]);

    //cria copias profundas dos dados inciais p/ evitar corrupção; inicializa estados => basicamente, reseta o grid
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

    //logica da simulação
    useEffect(() => {
        //clona os dados adicionando propriedades auxiliares para a simulação
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
            timeInReadyQueueSince: p.arrivalTime,
            type: 'process',
            displayId: `P${p.id}`
        }));
        let interruptionsForSim = interruptions.map(i => ({
            ...JSON.parse(JSON.stringify(i)),
            processed: false,
            type: 'interrupt',
            displayId: `I${i.id}`
        }));
        
        let readyQueue = [];
        let completedProcessesCount = 0;

        //interrupções sao executadas antes dos processos
        while (completedProcessesCount < processesForSim.length || interruptionsForSim.some(i => !i.processed)) {
            interruptionsForSim.sort((a, b) => a.arrivalTime - b.arrivalTime);
            let interruptHandledInThisPass = false;
            for (let interrupt of interruptionsForSim) {
                if (!interrupt.processed && interrupt.arrivalTime <= currentSimTime) {
                    const execStartTimeInterrupt = Math.max(currentSimTime, interrupt.arrivalTime);
                    currentSimTime = execStartTimeInterrupt;
                    const interruptSpan = interrupt.runningTime;
                    calculatedBlocks.push({
                        id: `interrupt-block-${interrupt.id}-${currentSimTime}`,
                        colStart: currentSimTime + 1,
                        colSpan: interruptSpan,
                        rowStart: maxProcessId + interrupt.id,
                        type: 'interrupt',
                        displayId: interrupt.displayId,
                        color: 'rgba(146, 107, 252, 0.7)'
                    });
                    currentSimTime += interruptSpan;
                    interrupt.processed = true;
                    interruptHandledInThisPass = true;
                }
            }
            if (interruptHandledInThisPass) continue;

            //adiciona os processos que chegaram na fila de prontos - (se já chegou, ainda não terminou, não tá em duplicata)
            processesForSim.forEach(p => {
                if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id)) {
                    p.timeInReadyQueueSince = currentSimTime;
                    readyQueue.push(p);
                }
            });

            if (readyQueue.length === 0) {
                let nextEventTimes = [
                    ...processesForSim.filter(p => p.finishedAt === -1 && p.arrivalTime > currentSimTime).map(p => p.arrivalTime),
                    ...interruptionsForSim.filter(i => !i.processed && i.arrivalTime > currentSimTime).map(i => i.arrivalTime)
                ];
                //se a ready queue estiver vazia, verifica se tem algum processo ou interrupção que vai chegar no futuro
                if (nextEventTimes.length === 0 && (completedProcessesCount < processesForSim.length || interruptionsForSim.some(i => !i.processed))) {
                     break;
                } else if (nextEventTimes.length === 0) {
                    break;
                }
                //se tiver, pula o tempo até o próximo evento
                currentSimTime = Math.min(...nextEventTimes);
                continue;
            }

            //seleciona o proximo processo a executar dependendo do algoritmo selecionado.
            let nextProcessToRun;
            if (algorithm === 'FIFO') {
                readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'SJF') {
                readyQueue.sort((a, b) => a.runningTime - b.runningTime || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PNP') {
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PP') {
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.length > 0 ? readyQueue[0] : null;
            } else if (algorithm === 'RR') {
                nextProcessToRun = readyQueue.shift();
            } else { break; }

            if (!nextProcessToRun) {continue;}

            //verifica quando o proximo processo pode começar a executar
            const execStartTimeForProcess = Math.max(currentSimTime, nextProcessToRun.arrivalTime); 
            if (currentSimTime < execStartTimeForProcess) {//se o proximo processo nao chegou ainda, coloca o atual na fila novamente se nao for pp
                if (algorithm !== 'PP') {//a lógica de pp é diferente
                    readyQueue.unshift(nextProcessToRun);
                }
                currentSimTime = execStartTimeForProcess;
                continue;
            }

            //calcula o tempo que o proximo processo vai executar
            let baseExecSpan;
            if (algorithm === 'PP') {
                baseExecSpan = 1; 
            } else if (algorithm === 'RR') {
                baseExecSpan = Math.min(nextProcessToRun.remainingTime, nextProcessToRun.quantum);
            } else {
                baseExecSpan = nextProcessToRun.remainingTime;
            }

            //verifica se tem algum evento futuro que pode interromper o processo
            let timeOfNextEvent = Infinity;
            interruptionsForSim.forEach(i => {
                if (!i.processed && i.arrivalTime > currentSimTime) {
                    timeOfNextEvent = Math.min(timeOfNextEvent, i.arrivalTime);
                }
            });
            if (algorithm === 'PP') {
                 processesForSim.forEach(p => {
                    if (p.id !== nextProcessToRun.id && p.finishedAt === -1 && p.arrivalTime > currentSimTime && p.priority < nextProcessToRun.priority) {
                        timeOfNextEvent = Math.min(timeOfNextEvent, p.arrivalTime);
                    }
                });
            }

            //calcula o tempo até o próximo evento
            const maxSpanBeforeEvent = timeOfNextEvent - currentSimTime; 
            const effectiveMaxSpan = maxSpanBeforeEvent > 0 ? maxSpanBeforeEvent : Infinity; 
            const actualExecSpan = Math.min(baseExecSpan, effectiveMaxSpan);

            if (actualExecSpan <= 0 && nextProcessToRun.remainingTime > 0) {
                continue;
            }
            
            if (actualExecSpan > 0) {
                calculatedBlocks.push({
                    id: `block-${nextProcessToRun.id}-${currentSimTime}`,
                    colStart: currentSimTime + 1,
                    colSpan: actualExecSpan,
                    rowStart: nextProcessToRun.id,
                    type: 'process',
                    displayId: nextProcessToRun.displayId,
                    color: 'rgba(68, 92, 243, 0.9)'
                });
            }

            const processJustRan = nextProcessToRun;
            processJustRan.remainingTime -= actualExecSpan;
            const timeSliceEnded = currentSimTime + actualExecSpan;
            currentSimTime = timeSliceEnded;

            //gerencia a ready queue
            let newArrivalsProcessedThisCycle = false;
            processesForSim.forEach(p => {
                if (p.id !== processJustRan.id &&
                    p.arrivalTime <= currentSimTime &&
                    p.remainingTime > 0 && p.finishedAt === -1 &&
                    !readyQueue.find(rq => rq.id === p.id) &&
                    (algorithm === 'PP' ? p.id !== processJustRan.id : true)
                    ) {
                    p.timeInReadyQueueSince = currentSimTime;
                    readyQueue.push(p);
                    newArrivalsProcessedThisCycle = true;
                }
            });

            if (processJustRan.remainingTime <= 0) {
                processJustRan.finishedAt = currentSimTime;
                completedProcessesCount++;
                if (algorithm === 'PP' && readyQueue.length > 0 && readyQueue[0].id === processJustRan.id) {
                    readyQueue.shift();
                }
            } else {
                if (algorithm === 'RR') {
                    processJustRan.timeInReadyQueueSince = currentSimTime;
                    readyQueue.push(processJustRan);
                    if (algorithm === 'RR') console.log(`RR_DEBUG @ t=${currentSimTime}: P${processJustRan.id} voltou para a readyQueue.`);
                } else if (algorithm === 'PP') {
                    processJustRan.timeInReadyQueueSince = currentSimTime;
                }
            }


        }

        setDarkBlueSquares(calculatedBlocks);
        setSimulationLastEndTime(currentSimTime);

    }, [tableInfos, interruptions, algorithm, maxProcessId]);


    // atualiza as descrições
    useEffect(() => {
        const newDescriptions = {};
        const allItemsToDescribe = [
            ...(initialTableInfos || []).map(p => ({ ...p, itemType: 'process', displayPrefix: 'P' })),
            ...(initialInterruptionsData || []).map(i => ({ ...i, itemType: 'interrupt', displayPrefix: 'I' }))
        ];
         if (allItemsToDescribe.length === 0) {setDescriptions({}); return;}

        const effectiveCurrentTick = currentColumn > 0 ? currentColumn - 1 : 0;

        allItemsToDescribe.forEach(item => {
            let status =  t('gridProcess.statusNotStarted');
            let color = "grey";
            
            const segmentsForItem = darkBlueSquares.filter(sq => {
                if (item.itemType === 'process' && sq.type === 'process' && sq.rowStart === item.id) return true;
                if (item.itemType === 'interrupt' && sq.type === 'interrupt' && sq.rowStart === (maxProcessId + item.id)) return true;
                return false;
            });

            if (effectiveCurrentTick < item.arrivalTime) {
                status =  t('gridProcess.statusAwaitingArrival', { prefix: item.displayPrefix, id: item.id, time: item.arrivalTime });
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
                    status = t('gridProcess.statusExecuting', { prefix: item.displayPrefix, id: item.id });
                    color = item.itemType === 'interrupt' ? 'red' : 'blue';
                } else if (hasFinished) {
                    if (item.runningTime === 0 && item.itemType === 'process') {
                        status = t('gridProcess.statusFinishedNoExecution', { prefix: item.displayPrefix, id: item.id });
                    } else if (item.runningTime === 0 && item.itemType === 'interrupt') {
                        status = t('gridProcess.statusFinishedNoExecution', { prefix: item.displayPrefix, id: item.id });
                    }
                    else {
                        status = t('gridProcess.statusFinished', { prefix: item.displayPrefix, id: item.id });
                    }
                    color = "darkgray";
                } else if (item.itemType === 'process' && effectiveCurrentTick >= item.arrivalTime) {
                    status = t('gridProcess.statusWaiting', { prefix: item.displayPrefix, id: item.id }); color = "orange";
                } else if (item.itemType === 'interrupt' && effectiveCurrentTick >= item.arrivalTime && segmentsForItem.length === 0 && item.runningTime > 0) {
                    status = t('gridProcess.statusPending', { prefix: item.displayPrefix, id: item.id }); color = "purple";
                }
            }
            newDescriptions[`${item.itemType}-${item.id}`] = <span style={{ color }}>{status}</span>;
        });
        setDescriptions(newDescriptions);
    }, [currentColumn, darkBlueSquares, initialTableInfos, initialInterruptionsData, simulationLastEndTime, maxProcessId, algorithm]);

    // calcula os tempos médios de espera e turnaround
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
            alert(t('gridProcess.alertWaitForCalculation')); return;
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
            alert(t('gridProcess.alertScenarioSavedSuccess'));
        } else {
            alert(t('gridProcess.alertScenarioSaveError'));
        }
    };
    
    const recHandleStart = async () => {
        if (!processGridRef.current || !recOffScreenCanvasRef.current || ((!initialTableInfos || initialTableInfos.length === 0) && (!initialInterruptionsData || initialInterruptionsData.length === 0))) {
            alert(t('gridProcess.alertNoDataToRecord'));
            return;
        }
        if (simulationLastEndTime <= 0 && ((initialTableInfos && initialTableInfos.length > 0) || (initialInterruptionsData && initialInterruptionsData.length > 0))) {
            alert(t('gridProcess.alertInvalidSimEndTime'));
            return;
        }

        alert(t('gridProcess.alertRecordingStartWarning'));
        
        setRecIsRecording(true);
        recChunksRef.current = [];
        setCurrentColumn(1);

        await new Promise(resolve => setTimeout(resolve, 150)); 

        const gridElement = processGridRef.current;
        const targetCanvas = recOffScreenCanvasRef.current;
        
        if (!gridElement || !targetCanvas) {
            alert(t('gridProcess.alertGridCanvasNotFound'));
            setRecIsRecording(false);
            return;
        }

        try {
            targetCanvas.width = gridElement.scrollWidth;
            targetCanvas.height = gridElement.scrollHeight;
            if (targetCanvas.width === 0 || targetCanvas.height === 0) {
                alert(t('gridProcess.alertZeroRecordDimensions'));
                setRecIsRecording(false);
                return;
            }
        } catch (error) {
            alert(t('gridProcess.alertCanvasSetupError'));
            setRecIsRecording(false);
            return;
        }
        
        const offCtx = targetCanvas.getContext('2d', { willReadFrequently: true }); 
        if (!offCtx) {
            alert(t('gridProcess.alertCanvasContextError'));
            setRecIsRecording(false);
            return;
        }

        const recStream = targetCanvas.captureStream(25);
        
        if (!recStream || recStream.getVideoTracks().length === 0) {
            alert(t('gridProcess.alertVideoCaptureError'));
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
            alert(t('gridProcess.alertMediaRecorderStartError', { message: e.message }));
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
                alert(t('gridProcess.alertNoVideoDataRecorded'));
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
            alert(t('gridProcess.alertRecordingComplete'));
        };
        recMediaRecorderRef.current.onerror = (event) => {
            alert(t('gridProcess.alertRecordingError', { errorName: event.error.name, errorMessage: event.error.message }));
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
                                <td style={{ padding: '8px', textAlign:'center' }}>{descriptions[`process-${process.id}`] || t('gridProcess.statusDefaultAwait', { prefix: 'P', id: process.id })}</td>
                            </tr>
                        ))}
                        {(initialInterruptionsData || []).map((interrupt) => (
                            <tr key={`desc-interrupt-${interrupt.id}`}>
                                <td style={{ padding: '8px', textAlign:'center' }}>{descriptions[`interrupt-${interrupt.id}`] || t('gridProcess.statusDefaultAwait', { prefix: 'I', id: interrupt.id })}</td>
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
                        {t('gridProcess.buttonSaveScenario')}
                    </button>
                )}
                {recIsRecording ? (
                    <button onClick={recHandleStop} className="button" >{t('gridProcess.buttonStopRecording')}</button>
                ) : (
                    <button onClick={recHandleStart} className="button" >{t('gridProcess.buttonStartRecording')}</button>
                )}
            </div>
            <div className="ttwt-container">
                <div>{t('gridProcess.avgWaitingTimeLabel')}{averageWaitingTime.toFixed(2)}</div>
                <div>{t('gridProcess.avgTurnaroundTimeLabel')} {averageTurnaroundTime.toFixed(2)}</div>
            </div>
        </div>
    );
};