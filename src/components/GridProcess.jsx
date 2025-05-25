import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from './UserContext';
import html2canvas from 'html2canvas';

export const GridProcess = ({ tableInfos: initialTableInfos, algorithm, saveDataToFirestore }) => {
    const processGridRef = useRef(null);
    const { user, userProfile } = useContext(UserContext);

    // Estado para a cópia local dos dados de entrada e reset
    const [tableInfos, setTableInfos] = useState([]);

    // Estados para a visualização da simulação
    const [currentColumn, setCurrentColumn] = useState(1);
    const [descriptions, setDescriptions] = useState({});
    const [averageWaitingTime, setAverageWaitingTime] = useState(0);
    const [averageTurnaroundTime, setAverageTurnaroundTime] = useState(0);

    // Estados para os dados calculados da simulação
    const [darkBlueSquares, setDarkBlueSquares] = useState([]);
    const [simulationLastEndTime, setSimulationLastEndTime] = useState(0);

    // Estados e Refs para a funcionalidade de Gravação
    const [recIsRecording, setRecIsRecording] = useState(false);
    const recMediaRecorderRef = useRef(null);
    const recOffScreenCanvasRef = useRef(null);
    const recChunksRef = useRef([]);
    const recAnimationFrameIdRef = useRef(null);
    const recIsRecordingStateRef = useRef(recIsRecording);
    const recCurrentCapturingTickRef = useRef(1);

    useEffect(() => {
        recIsRecordingStateRef.current = recIsRecording;
    }, [recIsRecording]);

    useEffect(() => {
        setTableInfos(initialTableInfos ? JSON.parse(JSON.stringify(initialTableInfos)) : []);
        setCurrentColumn(1);
        setDarkBlueSquares([]);
        setSimulationLastEndTime(0);
        setDescriptions({});
        setAverageWaitingTime(0);
        setAverageTurnaroundTime(0);
    }, [initialTableInfos, algorithm]);


    useEffect(() => {
        if (!tableInfos || tableInfos.length === 0) {
            setDarkBlueSquares([]);
            setSimulationLastEndTime(0);
            return;
        }

        let calculatedBlocks = [];
        let calculatedEndTime = 0;
        let currentSimTime = 0;
        let completedProcessesCount = 0;

        let processesForSim = JSON.parse(JSON.stringify(tableInfos));
        processesForSim.forEach(p => {
            p.remainingTime = p.runningTime;
            p.finishedAt = -1;
            p.startedAt = -1; // Para calcular tempo de espera corretamente
            p.timeInReadyQueueSince = p.arrivalTime; // Para FIFO em RR e desempate
        });

        let readyQueue = [];

        // Loop principal da simulação
        // Continua enquanto houver processos não concluídos ou processos na fila de prontos
        while (completedProcessesCount < processesForSim.length) {
            // Adicionar processos que chegaram à fila de prontos
            processesForSim.forEach(p => {
                if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id)) {
                    p.enteredReadyQueueAtTick = currentSimTime; // Para desempate e lógica RR
                    readyQueue.push(p);
                }
            });

            if (readyQueue.length === 0) {
                // Se não há processos prontos, avançar o tempo para a próxima chegada
                let nextArrivalTimes = processesForSim
                    .filter(p => p.remainingTime > 0 && p.finishedAt === -1 && p.arrivalTime > currentSimTime)
                    .map(p => p.arrivalTime);

                if (nextArrivalTimes.length === 0) {
                    if (processesForSim.every(p => p.remainingTime === 0 || p.finishedAt !== -1)) break; // Todos terminaram
                    console.warn("GRIDPROCESS_DEBUG: Loop de simulação preso. Fila de prontos vazia, sem chegadas futuras, mas processos incompletos.");
                    break; 
                }
                currentSimTime = Math.min(...nextArrivalTimes);
                continue;
            }

            let nextProcessToRun;
            // Selecionar próximo processo baseado no algoritmo
            if (algorithm === 'FIFO') {
                readyQueue.sort((a, b) => a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'SJF') { // Não Preemptivo
                readyQueue.sort((a, b) => a.runningTime - b.runningTime || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PNP') { // Prioridade Não Preemptivo
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PP') { // Prioridade Preemptivo
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue[0]; // Pega, mas não remove para PP (será removido se terminar ou outro o preemptir)
            } else if (algorithm === 'RR') { // Round Robin
                readyQueue.sort((a,b) => a.timeInReadyQueueSince - b.timeInReadyQueueSince || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else {
                break;
            }

            if (!nextProcessToRun) {
                currentSimTime++; // Avança o tempo se nenhum processo foi selecionado (idle tick)
                continue;
            }

            if (nextProcessToRun.startedAt === -1) {
                nextProcessToRun.startedAt = Math.max(currentSimTime, nextProcessToRun.arrivalTime);
            }
            
            const execStartTime = Math.max(currentSimTime, nextProcessToRun.arrivalTime);
            let execSpan;

            if (algorithm === 'PP') {
                execSpan = 0;
                let canRunUntil = execStartTime + nextProcessToRun.remainingTime;
                // Verificar se algum processo na readyQueue (que não seja ele mesmo) ou que chega antes de canRunUntil tem maior prioridade
                for (let t = execStartTime; t < canRunUntil; t++) {
                    execSpan++;
                    const potentialPreempters = processesForSim.filter(p =>
                        p.id !== nextProcessToRun.id &&
                        p.remainingTime > 0 &&
                        p.arrivalTime <= t + 1 && // Chega no próximo tick ou antes
                        p.priority < nextProcessToRun.priority
                    );
                    if (potentialPreempters.length > 0) {
                        break; // Preempção ocorrerá no tick t+1
                    }
                }
            } else if (algorithm === 'RR') {
                execSpan = Math.min(nextProcessToRun.remainingTime, nextProcessToRun.quantum);
            } else { // FIFO, SJF, PNP
                execSpan = nextProcessToRun.remainingTime;
            }
            
            if (execSpan <= 0 && nextProcessToRun.runningTime > 0) execSpan = 1; // Garante progresso mínimo
            if (nextProcessToRun.runningTime === 0) execSpan = 0;

            if (execSpan > 0) {
                calculatedBlocks.push({
                    id: `block-${nextProcessToRun.id}-${execStartTime}`,
                    colStart: execStartTime + 1,
                    colSpan: execSpan,
                    rowStart: nextProcessToRun.id,
                });
            }

            currentSimTime = execStartTime + execSpan;
            nextProcessToRun.remainingTime -= execSpan;
            nextProcessToRun.lastScheduledAt = currentSimTime; // Para RR

            if (nextProcessToRun.remainingTime <= 0) {
                nextProcessToRun.finishedAt = currentSimTime;
                completedProcessesCount++;
                if(algorithm === 'PP') readyQueue = readyQueue.filter(p => p.id !== nextProcessToRun.id); // Remove o terminado da fila
            } else {
                if (algorithm === 'RR') {
                    nextProcessToRun.timeInReadyQueueSince = currentSimTime; // Atualiza para re-enfileirar
                    readyQueue.push(nextProcessToRun); // Volta para o fim da fila de prontos
                } else if (algorithm === 'PP') {
                    // Em PP, se não terminou e não foi preemptido por esta lógica de span,
                    // ele permanece na readyQueue e será reavaliado.
                    // A remoção da readyQueue para PP só acontece se ele for selecionado e terminar o seu 'execSpan' de 1 tick.
                    // Se o execSpan foi menor que o remainingTime (devido a preempção), ele continua na readyQueue.
                    // Se o execSpan foi 1 e ele não terminou, ele continua na readyQueue.
                    // A lógica de remoção da readyQueue para PP é: se ele foi o nextProcessToRun, ele é removido se terminou.
                    // Se não terminou, ele continua lá para ser reordenado.
                    // A linha `nextProcessToRun = readyQueue[0];` não o remove.
                    // Se ele executou (execSpan > 0), mas não terminou, ele continua na readyQueue.
                }
            }
             // Se o algoritmo não é PP e o processo foi retirado com shift, ele já não está na readyQueue.
             // Se é PP e não terminou, ele continua na readyQueue para a próxima iteração.
        }

        calculatedEndTime = currentSimTime;

        console.log("GRIDPROCESS_DEBUG: Simulação Calculada FINAL - Blocks:", JSON.stringify(calculatedBlocks.map(b => ({r:b.rowStart, s:b.colStart, span:b.colSpan}))));
        console.log("GRIDPROCESS_DEBUG: Simulação Calculada FINAL - EndTime:", calculatedEndTime);
        setDarkBlueSquares(calculatedBlocks);
        setSimulationLastEndTime(calculatedEndTime);

    }, [tableInfos, algorithm]);


    // useEffect para descriptions
    useEffect(() => {
        const newDescriptions = {};
        if (!initialTableInfos || initialTableInfos.length === 0) { // Usar initialTableInfos para iterar
            setDescriptions({}); return;
        }
        const currentSimEndTime = simulationLastEndTime;
        const effectiveCurrentColumn = currentColumn > currentSimEndTime + 1 ? currentSimEndTime + 1 : currentColumn;

        initialTableInfos.forEach(process => {
            let status = "Não iniciado";
            let color = "grey";
            const processSegments = darkBlueSquares.filter(sq => sq.rowStart === process.id);
            
            if (effectiveCurrentColumn <= process.arrivalTime) {
                status = `P${process.id} aguarda chegada (${process.arrivalTime})`;
            } else {
                let isExecutingNow = false;
                let hasFinishedAllSegments = true;
                let latestSegmentEndForProcess = process.arrivalTime;

                for (const segment of processSegments) {
                    const segmentStart = segment.colStart; 
                    const segmentEnd = segment.colStart + segment.colSpan; 
                    if (effectiveCurrentColumn >= segmentStart && effectiveCurrentColumn < segmentEnd) {
                        isExecutingNow = true; break; 
                    }
                    if (effectiveCurrentColumn < segmentEnd) hasFinishedAllSegments = false;
                    latestSegmentEndForProcess = Math.max(latestSegmentEndForProcess, segmentEnd -1);
                }
                if (isExecutingNow) {
                    status = `P${process.id} está a executar`; color = "blue";
                } else if (processSegments.length === 0 && process.runningTime > 0 && effectiveCurrentColumn > process.arrivalTime) {
                    status = `P${process.id} está em espera`; color = "orange";
                } else if (hasFinishedAllSegments && effectiveCurrentColumn > latestSegmentEndForProcess && processSegments.length > 0) {
                    status = `P${process.id} terminou`; color = "darkgray";
                } else if (process.runningTime === 0 && effectiveCurrentColumn > process.arrivalTime) {
                    status = `P${process.id} terminou (sem execução)`; color = "darkgray";
                } else if (effectiveCurrentColumn > process.arrivalTime) {
                    status = `P${process.id} está em espera`; color = "orange";
                }
            }
            newDescriptions[process.id] = <span style={{ color }}>{status}</span>;
        });
        setDescriptions(newDescriptions);
    }, [currentColumn, darkBlueSquares, initialTableInfos, simulationLastEndTime, algorithm]);

    // useEffect para métricas
    useEffect(() => {
        if (!initialTableInfos || initialTableInfos.length === 0 ) { // Usar initialTableInfos
            setAverageWaitingTime(0); setAverageTurnaroundTime(0); return;
        }
        let totalTurnaroundTime = 0;
        let totalWaitingTime = 0;
        let processesCountedForMetrics = 0;

        initialTableInfos.forEach(processInfo => {
            const arrival = processInfo.arrivalTime;
            const burst = processInfo.runningTime;
            let completion = arrival;
            const segments = darkBlueSquares.filter(s => s.rowStart === processInfo.id);

            if (burst === 0) {
                completion = arrival;
            } else if (segments.length > 0) {
                const lastSegment = segments.sort((a, b) => (a.colStart + a.colSpan) - (b.colStart + b.colSpan)).pop();
                completion = (lastSegment.colStart -1) + lastSegment.colSpan;
            } else {
                console.warn(`GRIDPROCESS_DEBUG: P${processInfo.id} (burst ${burst}) não tem blocos para métricas.`);
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
    }, [darkBlueSquares, initialTableInfos]); // Usar initialTableInfos


    // Funções de controlo da barra de tempo
    const handleNextColumn = () => setCurrentColumn((prev) => Math.min(prev + 1, simulationLastEndTime + 1));
    const handlePreviousColumn = () => setCurrentColumn((prev) => Math.max(prev - 1, 1));
    const handleFirstColumn = () => setCurrentColumn(1);
    const handleLastColumn = () => setCurrentColumn(simulationLastEndTime + 1);
    const handleAutoIncrementOriginal = () => {
        if (recIsRecording) return;
        if (simulationLastEndTime === 0 && tableInfos.length > 0) {
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

    // Função para guardar tabela
    const handleSaveTable = () => {
        if (user && userProfile?.status === 'approved' && saveDataToFirestore && typeof saveDataToFirestore === 'function') {
            saveDataToFirestore(initialTableInfos); // Guarda os dados originais
            alert('Cenário guardado com sucesso!');
        } else {
            console.error('GRIDPROCESS_DEBUG: Falha ao guardar. User/Profile:', user, userProfile, 'saveDataFunc:', saveDataToFirestore);
            alert('Erro: Não foi possível guardar o cenário. Verifique se está logado e aprovado.');
        }
    };

    // --- Funções de Gravação (rec) ---
    const recHandleStart = async () => {
        console.log("REC_DEBUG: recHandleStart chamado.");
        if (!processGridRef.current || !recOffScreenCanvasRef.current || tableInfos.length === 0) {
            console.log("REC_DEBUG: Condição de início de gravação falhou - refs ou tableInfos ausentes.");
            alert("Dados da simulação não disponíveis ou sem processos para gravar."); return;
        }
        if (simulationLastEndTime <= 0 && tableInfos.length > 0) {
            console.log("REC_DEBUG: simulationLastEndTime inválido:", simulationLastEndTime);
            alert("Tempo final da simulação inválido. Tente novamente."); return;
        }
        alert("A gravação irá começar. A simulação será reiniciada e percorrerá automaticamente.");
        
        setRecIsRecording(true);
        recChunksRef.current = [];
        recCurrentCapturingTickRef.current = 1;
        setCurrentColumn(1); 
        console.log("REC_DEBUG: Estados de gravação inicializados. currentColumn definido para 1.");

        await new Promise(resolve => setTimeout(resolve, 100)); 
        console.log("REC_DEBUG: Delay após setCurrentColumn(1) concluído.");

        const gridElement = processGridRef.current;
        const targetCanvas = recOffScreenCanvasRef.current;
        if (!gridElement || !targetCanvas) {
            console.error("REC_DEBUG: gridElement ou targetCanvas é null após delay!");
            setRecIsRecording(false); return;
        }
        targetCanvas.width = gridElement.scrollWidth;
        targetCanvas.height = gridElement.scrollHeight;
        console.log(`REC_DEBUG: Canvas off-screen configurado: ${targetCanvas.width}x${targetCanvas.height}`);

        const recStream = targetCanvas.captureStream(25);
        console.log("REC_DEBUG: Stream do canvas capturado.");

        try {
            recMediaRecorderRef.current = new MediaRecorder(recStream, { mimeType: 'video/webm;codecs=vp9' });
            console.log("REC_DEBUG: MediaRecorder instanciado.");
        } catch (e) {
            console.error("REC_DEBUG: Erro ao instanciar MediaRecorder:", e);
            alert("Erro ao iniciar o gravador de vídeo. Verifique se o seu navegador suporta video/webm com vp9.");
            setRecIsRecording(false); return;
        }

        recMediaRecorderRef.current.ondataavailable = (event) => {
            console.log(`REC_DEBUG: ondataavailable - Tamanho do chunk: ${event.data.size}`);
            if (event.data.size > 0) {
                recChunksRef.current.push(event.data);
                console.log(`REC_DEBUG: Chunk adicionado. Total de chunks: ${recChunksRef.current.length}`);
            } else {
                console.warn("REC_DEBUG: Chunk de dados vazio recebido.");
            }
        };
        recMediaRecorderRef.current.onstop = () => {
            console.log("REC_DEBUG: onstop chamado. Total de chunks:", recChunksRef.current.length);
            if (recChunksRef.current.length === 0) {
                alert("Nenhum dado de vídeo foi gravado. Verifique a consola para mais detalhes.");
                setRecIsRecording(false); return;
            }
            const recVideoBlob = new Blob(recChunksRef.current, { type: 'video/webm' });
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
            console.log("REC_DEBUG: Download do vídeo iniciado.");
        };
        recMediaRecorderRef.current.onerror = (event) => {
            console.error("REC_DEBUG: Erro no MediaRecorder:", event.error);
            alert(`Erro durante a gravação: ${event.error.name} - ${event.error.message}`);
            recHandleStop();
        };
        recMediaRecorderRef.current.start();
        console.log("REC_DEBUG: Gravação iniciada (MediaRecorder.start() chamado). simulationLastEndTime:", simulationLastEndTime);
        recTriggerNextFrame(1);
    };

    const recTriggerNextFrame = (tickToSet) => {
        console.log(`REC_DEBUG: recTriggerNextFrame chamado para o tick: ${tickToSet}. Está a gravar: ${recIsRecordingStateRef.current}. Limite: ${simulationLastEndTime + 1}`);
        if (!recIsRecordingStateRef.current || tickToSet > simulationLastEndTime + 1) {
            console.log("REC_DEBUG: Condição de paragem do recTriggerNextFrame atingida.");
            if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
                console.log("REC_DEBUG: Parando MediaRecorder a partir do recTriggerNextFrame.");
                recMediaRecorderRef.current.stop();
            }
            return;
        }
        recCurrentCapturingTickRef.current = tickToSet;
        setCurrentColumn(tickToSet); 
        console.log(`REC_DEBUG: currentColumn definido para ${tickToSet} em recTriggerNextFrame.`);
        recAnimationFrameIdRef.current = requestAnimationFrame(() => recTriggerNextFrame(tickToSet + 1));
    };

    useEffect(() => { // useEffect para captura de frame
        const captureFrame = async () => {
            if (!recIsRecordingStateRef.current) return;
            if (currentColumn === recCurrentCapturingTickRef.current &&
                processGridRef.current &&
                recOffScreenCanvasRef.current &&
                recMediaRecorderRef.current?.state === "recording") {
                console.log(`REC_DEBUG: useEffect Captura - Tentando capturar frame para tick ${currentColumn}. Tick esperado: ${recCurrentCapturingTickRef.current}`);
                try {
                    const gridEl = processGridRef.current;
                    const offCanvas = recOffScreenCanvasRef.current;
                    if (offCanvas.width !== gridEl.scrollWidth || offCanvas.height !== gridEl.scrollHeight) {
                        offCanvas.width = gridEl.scrollWidth;
                        offCanvas.height = gridEl.scrollHeight;
                        console.log(`REC_DEBUG: Canvas off-screen redimensionado para ${offCanvas.width}x${offCanvas.height} no useEffect de captura.`);
                    }
                    await html2canvas(gridEl, {
                        canvas: offCanvas, useCORS: true, logging: false, x:0, y:0,
                        width: gridEl.scrollWidth, height: gridEl.scrollHeight,
                    });
                    console.log(`REC_DEBUG: Frame capturado com html2canvas para tick ${currentColumn}`);
                } catch (error) {
                    console.error('REC_DEBUG: Erro no html2canvas dentro do useEffect de captura:', error);
                    recHandleStop();
                }
            }
        };
        const captureTimeoutId = setTimeout(() => { captureFrame(); }, 150);
        return () => clearTimeout(captureTimeoutId);
    }, [currentColumn, recIsRecording]);

    const recHandleStop = () => {
        console.log("REC_DEBUG: recHandleStop chamado.");
        if (recAnimationFrameIdRef.current) {
            cancelAnimationFrame(recAnimationFrameIdRef.current);
            recAnimationFrameIdRef.current = null;
            console.log("REC_DEBUG: requestAnimationFrame cancelado.");
        }
        if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
            console.log("REC_DEBUG: Parando MediaRecorder a partir do recHandleStop.");
            recMediaRecorderRef.current.stop();
        } else {
            setRecIsRecording(false);
            console.log("REC_DEBUG: MediaRecorder não estava a gravar ou já parado. Definindo recIsRecording para false.");
        }
    };
    // --- FIM DAS FUNÇÕES DE GRAVAÇÃO ---

    return (
        <div className='grid-container'>
            <canvas ref={recOffScreenCanvasRef} style={{ display: 'none' }}></canvas>
            <div className='process-grid' style={{ position: 'relative' }} ref={processGridRef}>
                <div className="time-bar" style={{
                    position: 'absolute', width: '10px', height: '100%',
                    backgroundColor: 'yellow', zIndex: 4, top: 0, bottom: 0,
                    gridColumnStart: currentColumn, gridColumnEnd: currentColumn + 1,
                }}></div>
                {darkBlueSquares.map((segment) => (
                    <div
                        key={segment.id}
                        className='process'
                        style={{
                            gridColumnStart: segment.colStart,
                            gridColumnEnd: `span ${segment.colSpan}`,
                            gridRowStart: segment.rowStart,
                            position: 'relative',
                        }}
                    >
                        <div style={{ zIndex: 2 }}>{`P${segment.rowStart}`}</div>
                    </div>
                ))}
                {tableInfos.map((process) => (
                     <div
                         key={`arrival-${process.id}`} className='arrival-indicator'
                         style={{
                             gridColumnStart: process.arrivalTime + 1, gridColumnEnd: process.arrivalTime + 2,
                             position: 'relative', top: 0, left: 0, backgroundColor: '#CADEED',
                             width: '10px', height: '100%', gridRowStart: process.id, zIndex: 1,
                         }}
                     />
                ))}
                <div className="labels" style={{ gridRowStart: tableInfos.length > 0 ? tableInfos.length + 2 : 2}}>
                    {[...Array(Math.max(simulationLastEndTime +1))].map((_, i) => (
                        <div key={`label-${i}`} className="label" style={{gridColumnStart: i + 1, gridColumnEnd: i + 2}}>
                            {i.toString().padStart(2, '0')}
                        </div>
                    ))}
                </div>
            </div>
            <div className='description-table'>
                <table style={{ width: '100%' }}>
                    <thead><tr><th className='description-table-title'>Description (Tick: {currentColumn > 0 ? currentColumn -1 : 0})</th></tr></thead>
                    <tbody>
                        {initialTableInfos.map((process) => (
                            <tr key={`desc-${process.id}`}>
                                <td style={{ padding: '8px', textAlign:'center' }}>{descriptions[process.id] || `P${process.id} aguarda`}</td>
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
