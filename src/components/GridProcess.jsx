import React, { useState, useEffect, useRef, useContext } from 'react';
import { UserContext } from './UserContext';
import html2canvas from 'html2canvas';

export const GridProcess = ({ tableInfos: initialTableInfos, algorithm, saveDataToFirestore }) => {
    const processGridRef = useRef(null);
    const { user, userProfile } = useContext(UserContext);

    // Estado para a cópia local dos dados de entrada
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

    //mantem o estado de recIsRecording atualizado para uso em recTriggerNextFrame
    useEffect(() => {
        recIsRecordingStateRef.current = recIsRecording;
    }, [recIsRecording]);

    //reseta os estados quando a tabela inicial muda ou o algoritmo é alterado
    useEffect(() => {
        setTableInfos(initialTableInfos ? JSON.parse(JSON.stringify(initialTableInfos)) : []);
        setCurrentColumn(1);
        setDarkBlueSquares([]);
        setSimulationLastEndTime(0);
        setDescriptions({});
        setAverageWaitingTime(0);
        setAverageTurnaroundTime(0);
    }, [initialTableInfos, algorithm]);


    // useEffect para calcular a simulação
    /*
    Verifica se há processos definidos:
        Se não houver, limpa os resultados (darkBlueSquares e simulationLastEndTime) e sai.

    Prepara os dados:
        Cria uma cópia dos processos e inicializa propriedades auxiliares para a simulação (tempo restante, início, término, etc).

    Simula o escalonamento:
        Usa um laço while para simular o avanço do tempo.
        Em cada ciclo, adiciona processos que chegaram à fila de prontos.
        Se não há processos prontos, avança o tempo para a próxima chegada.
        Seleciona o próximo processo a ser executado conforme o algoritmo (FIFO, SJF, PNP, PP, RR).
        Calcula quanto tempo o processo vai executar (considerando preempção, quantum, etc).
        Atualiza os blocos de execução (calculatedBlocks) e o tempo atual.
        Marca processos como finalizados quando terminam.

    Atualiza o estado visual:
        Ao final, define os blocos calculados (setDarkBlueSquares) e o tempo final da simulação (setSimulationLastEndTime).
     */
    useEffect(() => {
        //se nao houver processos definidos, limpa o darkBlueSquares e simulationLastEndTime
        if (!tableInfos || tableInfos.length === 0) {
            console.log(`GRIDPROCESS_SIM_LOGIC: Iniciando cálculo para algoritmo: ${algorithm}`); // LOG ADICIONAL
            setDarkBlueSquares([]);
            setSimulationLastEndTime(0);
            return;
        }

        //guarda os resultados da simulação
        let calculatedBlocks = [];
        let calculatedEndTime = 0;
        let currentSimTime = 0;
        let completedProcessesCount = 0;

        //cria uma copia profunda das tablesinfos e pra cada processo inicializa props
        let processesForSim = JSON.parse(JSON.stringify(tableInfos));
        processesForSim.forEach(p => {
            p.remainingTime = p.runningTime;
            p.finishedAt = -1; //marcador de processo terminado (-1 nao terminou)
            p.startedAt = -1; // marca quando o processo começou a ser executado (-1 nao começou)
            p.timeInReadyQueueSince = p.arrivalTime; // Para FIFO em RR e desempate
        });

        let readyQueue = [];

        // Loop principal da simulação
        // Continua enquanto houver processos não concluídos ou processos na fila de prontos
        // Cada iteração do while representa uma decisão de escalonamento ou um avanço no tempo. - SDD
        while (completedProcessesCount < processesForSim.length) {
            
            // Adicionar processos que chegaram na readyQueue
            processesForSim.forEach(p => {
                if (p.arrivalTime <= currentSimTime && p.remainingTime > 0 && p.finishedAt === -1 && !readyQueue.find(rq => rq.id === p.id)) {
                    p.enteredReadyQueueAtTick = currentSimTime;
                    readyQueue.push(p);
                }
            });

            if (readyQueue.length === 0) {
                // Se não tem processos prontos, avançar o tempo para a próxima chegada
                let nextArrivalTimes = processesForSim
                    .filter(p => p.remainingTime > 0 && p.finishedAt === -1 && p.arrivalTime > currentSimTime)
                    .map(p => p.arrivalTime);

                if (nextArrivalTimes.length === 0) {
                    if (processesForSim.every(p => p.remainingTime === 0 || p.finishedAt !== -1)) break; // Todos terminaram
                    console.log("loop de simulação preso - fila de prontos vazia, sem chegadas futuras, mas processos incompletos.");
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
            } else if (algorithm === 'SJF') {
                readyQueue.sort((a, b) => a.runningTime - b.runningTime || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PNP') {
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue.shift();
            } else if (algorithm === 'PP') {
                readyQueue.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime || a.id - b.id);
                nextProcessToRun = readyQueue[0]; // Pega, mas não remove para PP (será removido se terminar ou outro o preemptir)
            } else if (algorithm === 'RR') {
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

            if (execSpan > 0) {// Se o processo vai executar, adiciona ao calculatedBlocks
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
    /*
    Atualiza o status textual e a cor de cada processo (ex: "aguarda", "executando", "terminou") conforme o 
    tempo (currentColumn) avança na simulação.
    Usa os blocos de execução (darkBlueSquares) para saber se o processo está executando, esperando ou já terminou.
    O resultado é exibido na tabela de descrições da interface.
    */
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

    // useEffect o cálculo de Average Waiting Time e Turnaround Time
    /*
    Calcula o tempo médio de espera e o tempo médio de turnaround dos processos, usando os blocos de execução (darkBlueSquares).
    Atualiza esses valores sempre que a simulação muda.
    */
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

    // --- Gravação ------------------------------------------------------------------------------------------------


    // Função recHandleStart:
    /*
    */
     const recHandleStart = async () => {
        if (!processGridRef.current || !recOffScreenCanvasRef.current || tableInfos.length === 0) {
            alert("Dados da simulação não disponíveis ou sem processos para gravar.");
            return;
        }
        // Garante que a simulação foi calculada e tem um tempo final válido.
        if (simulationLastEndTime <= 0 && tableInfos.length > 0) {
            alert("Tempo final da simulação inválido ou não calculado. Verifique os dados de entrada ou aguarde o cálculo da simulação antes de gravar.");
            return;
        }

        alert("A gravação vai começar. A simulação será reiniciada e avançará automaticamente.\n\nPor favor, NÃO MUDE DE ABA OU JANELA durante a gravação.\nSe o conteúdo for maior que a tela, pode ser necessário rolar manualmente para capturar toda a área desejada.\n\nObrigada!");
        
        setRecIsRecording(true);
        recChunksRef.current = [];
        // recCurrentCapturingTickRef.current = 1; // Esta ref parece não ser utilizada atualmente. Considere remover se não tiver um propósito futuro.
        setCurrentColumn(1); // Reinicia a visualização para o início da simulação

        // Delay para permitir que o React processe a atualização de setCurrentColumn(1) e o DOM seja atualizado.
        await new Promise(resolve => setTimeout(resolve, 150)); 

        const gridElement = processGridRef.current;
        const targetCanvas = recOffScreenCanvasRef.current;
        targetCanvas.width = gridElement.scrollWidth;
        targetCanvas.height = gridElement.scrollHeight;

        if (!gridElement || !targetCanvas) {
            alert("Erro interno: Elemento do grid ou canvas de gravação não encontrado. Não é possível gravar.");
            setRecIsRecording(false);
            return;
        }

        // Configurar dimensões do canvas de gravação
        try {
            targetCanvas.width = gridElement.scrollWidth;
            targetCanvas.height = gridElement.scrollHeight;
            // Verifica se as dimensões são válidas
            if (targetCanvas.width === 0 || targetCanvas.height === 0) {
                alert("Erro: As dimensões do conteúdo a ser gravado são zero. Verifique o layout ou os dados da simulação.");
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
            alert("Erro interno: Não foi possível preparar o canvas para gravação (falha ao obter contexto 2D).");
            setRecIsRecording(false);
            return;
        }
        console.log(`REC_DEBUG: Canvas off-screen configurado: ${targetCanvas.width}x${targetCanvas.height}`);

        const recStream = targetCanvas.captureStream(25); // FPS para o stream
        
        if (!recStream || recStream.getVideoTracks().length === 0) {
            console.error("REC_DEBUG: No video tracks found in captureStream ou o stream é null!");
            alert("Erro interno: Não foi possível iniciar a captura de vídeo do canvas (nenhuma faixa de vídeo encontrada).");
            setRecIsRecording(false);
            return;
        }

        const track = recStream.getVideoTracks()[0];
        console.log(`REC_DEBUG: Video track state: ${track.readyState}, muted: ${track.muted}`);
        track.onended = () => console.log("REC_DEBUG: Video track ended!");
        track.onmute = () => console.log("REC_DEBUG: Video track muted!");
        track.onunmute = () => console.log("REC_DEBUG: Video track unmuted!");

        let chosenMimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
            console.warn(`REC_DEBUG: mimeType '${chosenMimeType}' não suportado. Tentando 'video/webm;codecs=vp8'.`);
            chosenMimeType = 'video/webm;codecs=vp8';
            if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
                console.warn(`REC_DEBUG: mimeType '${chosenMimeType}' não suportado. Tentando 'video/webm'.`);
                chosenMimeType = 'video/webm';
                if (!MediaRecorder.isTypeSupported(chosenMimeType)) {
                    console.error("REC_DEBUG: Nenhum mimeType suportado encontrado (vp9, vp8, genérico webm).");
                    alert("Seu navegador não suporta os formatos de vídeo WebM necessários para gravação. Tente um navegador diferente ou atualize o seu.");
                    setRecIsRecording(false);
                    return;
                }
            }
        }

        try {
            recMediaRecorderRef.current = new MediaRecorder(recStream, { mimeType: chosenMimeType });
            console.log("REC_DEBUG: MediaRecorder instanciado com mimeType:", recMediaRecorderRef.current.mimeType);
        } catch (e) {
            console.error("REC_DEBUG: Erro ao instanciar MediaRecorder:", e);
            alert(`Erro ao iniciar o gravador de vídeo: ${e.message}. Verifique as permissões do navegador ou tente um navegador diferente.`);
            setRecIsRecording(false);
            return;
        }

        recMediaRecorderRef.current.ondataavailable = (event) => {
            // ... (seu código existente para ondataavailable)
            console.log("REC_DEBUG: ondataavailable chamado depois da criacao de MediaRecorder.");
            console.log(`REC_DEBUG: ondataavailable - Tamanho do chunk: ${event.data.size}`);
            if (event.data.size > 0) {
                recChunksRef.current.push(event.data);
                console.log(`REC_DEBUG: Chunk adicionado. Total de chunks: ${recChunksRef.current.length}`);
            } else {
                console.warn("REC_DEBUG: Chunk de dados vazio recebido.");
            }
        };
        recMediaRecorderRef.current.onstop = () => {
            // ... (seu código existente para onstop)
            console.log("REC_DEBUG: onstop chamado. Total de chunks:", recChunksRef.current.length);
            if (recChunksRef.current.length === 0) {
                alert("Nenhum dado de vídeo foi gravado. Verifique a consola para mais detalhes. A gravação pode ter sido interrompida ou o conteúdo não mudou.");
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
            console.log("REC_DEBUG: Download do vídeo iniciado.");
        };
        recMediaRecorderRef.current.onerror = (event) => {
            // ... (seu código existente para onerror)
            console.error("REC_DEBUG: Erro no MediaRecorder:", event.error);
            alert(`Erro durante a gravação: ${event.error.name} - ${event.error.message}`);
            recHandleStop(); // Chama recHandleStop para limpeza e resetar o estado
        };
        
        recMediaRecorderRef.current.start(1000); 
        console.log("REC_DEBUG: Gravação iniciada (MediaRecorder.start() chamado). simulationLastEndTime:", simulationLastEndTime);
        recTriggerNextFrame(1); // Inicia o loop de captura de frames
    };

    // Função recTriggerNextFrame:
    /*
    Recebe o tick (tempo) que deve ser exibido na simulação (tickToSet).
    Verifica se a gravação ainda está ativa (recIsRecordingStateRef.current) e se ainda não passou do tempo final da simulação (tickToSet > simulationLastEndTime + 1).
    Se a gravação acabou ou chegou ao fim da simulação, para o MediaRecorder (se ainda estiver gravando) e encerra a função.
    Atualiza o tick atual:
        Salva o tick atual em recCurrentCapturingTickRef.current.
        Atualiza o estado currentColumn para mostrar esse tick na interface.
        Chama a si mesma para o próximo tick usando requestAnimationFrame, criando assim um loop automático que avança a simulação e captura os frames até o final.
    */
    const recTriggerNextFrame = async (tickToSet) => {
    if (!recIsRecordingStateRef.current || tickToSet > simulationLastEndTime + 1) {

        if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
            console.log("REC_DEBUG: Parando MediaRecorder a partir do recTriggerNextFrame (fim da simulação ou gravação parada).");
            recMediaRecorderRef.current.stop();
        }
        return;
    }

   
    // 1. ATUALIZE O ESTADO QUE CAUSA MUDANÇAS VISUAIS NO SEU GRID
    setCurrentColumn(tickToSet); 
    console.log(`REC_DEBUG_SIM: Tick ${tickToSet} - setCurrentColumn chamado.`);

    // 2. ESPERE O NAVEGADOR PROCESSAR A ATUALIZAÇÃO DO REACT E PINTAR O DOM
    await new Promise(resolve => requestAnimationFrame(() => {
        requestAnimationFrame(resolve); 
    }));   

    // 3. (OPCIONAL) PEQUENO DELAY ADICIONAL SE requestAnimationFrame NÃO FOR SUFICIENTE
    // await new Promise(resolve => setTimeout(resolve, 30)); // Ex: 30ms. Teste sem primeiro.

    // Log para verificar o estado do DOM ANTES de html2canvas
    if (processGridRef.current && recIsRecordingStateRef.current) {
        // ... (existing DOM log)
        const timeBarEl = processGridRef.current.querySelector('.time-bar');
        if (timeBarEl) {
            const computedStyle = window.getComputedStyle(timeBarEl);
            console.log(`REC_HTML2CANVAS_PREP: Tick ${tickToSet}, TimeBar Computed gridColumnStart: ${computedStyle.gridColumnStart}`);
        } else {
            console.warn(`REC_HTML2CANVAS_PREP: Tick ${tickToSet}, TimeBar element not found!`);
        }
    }


// 4. CAPTURE COM HTML2CANVAS (MODIFIED APPROACH)
    if (recIsRecordingStateRef.current &&
        processGridRef.current && // Make sure gridEl exists
        recOffScreenCanvasRef.current &&
        recMediaRecorderRef.current?.state === "recording") {
        
        const gridEl = processGridRef.current;
        const offCanvas = recOffScreenCanvasRef.current; // This is the canvas being streamed
        const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

        if (!offCtx) {
            console.error("REC_DEBUG_DRAW: Não foi possível obter contexto 2D do offCanvas no Tick:", tickToSet);
            recHandleStop();
            return;
        }
        try {
            // Ensure offCanvas (the one being streamed) has the correct dimensions
            // These should be set in recHandleStart and ideally not change,
            // but good to be aware of if gridEl could resize.
            if (offCanvas.width !== gridEl.scrollWidth || offCanvas.height !== gridEl.scrollHeight) {
                 console.warn(`REC_DEBUG: Dimensões do offCanvas (${offCanvas.width}x${offCanvas.height}) não correspondem ao gridElement (${gridEl.scrollWidth}x${gridEl.scrollHeight}) no tick ${tickToSet}. Reajustando.`);
                 offCanvas.width = gridEl.scrollWidth;
                 offCanvas.height = gridEl.scrollHeight;
            }


            // Let html2canvas render to its own, new canvas
            const h2cCanvas = await html2canvas(gridEl, {
                useCORS: true,
                logging: true, // Keep logging for html2canvas for now
                width: gridEl.scrollWidth, // Explicitly set width/height for html2canvas
                height: gridEl.scrollHeight,
                backgroundColor: null,
                
            });
            console.log(`REC_DEBUG_DRAW: Tick ${tickToSet} - html2canvas renderizou para canvas INTERNO.`);

            // Now, draw the result from html2canvas (h2cCanvas) onto your offScreenCanvas (offCanvas)
            offCtx.clearRect(0, 0, offCanvas.width, offCanvas.height); // Clear the streamed canvas
            offCtx.drawImage(h2cCanvas, 0, 0); // Draw the captured image onto the streamed canvas
            console.log(`REC_DEBUG_DRAW: Tick ${tickToSet} - Imagem do html2canvas copiada para offCanvas.`);


            // Mantenha o requestData()
            if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
                console.log(`REC_DEBUG: Tick ${tickToSet} (html2canvas - copiado) - Chamando requestData()`);
                recMediaRecorderRef.current.requestData();
            }

        } catch (error) {
            console.error(`REC_DEBUG_DRAW: Erro ao capturar com html2canvas (abordagem de cópia) para o tick ${tickToSet}:`, error);
            recHandleStop(); 
            return;
        }
    }

    // 5. CONTINUE O LOOP DE GRAVAÇÃO
    if (recIsRecordingStateRef.current) {
        await new Promise(resolve => setTimeout(resolve, 1000)); 
        recTriggerNextFrame(tickToSet + 1);
    }
};



    // Função recHandleStop:
    /*
    Cancela o próximo frame da animação, se estiver agendado, usando cancelAnimationFrame e limpa o id salvo.
    Para o MediaRecorder (que grava o vídeo) se ele ainda estiver gravando.
    Se o MediaRecorder já não está gravando, apenas define o estado de gravação (recIsRecording) como falso.
    */
const recHandleStop = () => {
    console.log("REC_DEBUG: recHandleStop chamado.");
    // recAnimationFrameIdRef.current is not used by the recTriggerNextFrame loop,
    // as it uses setTimeout. This block can likely be removed or adapted if
    // requestAnimationFrame is used elsewhere for recording control.
    if (recAnimationFrameIdRef.current) {
        cancelAnimationFrame(recAnimationFrameIdRef.current);
        recAnimationFrameIdRef.current = null;
        console.log("REC_DEBUG: requestAnimationFrame cancelado (se aplicável).");
    }
    if (recMediaRecorderRef.current && recMediaRecorderRef.current.state === "recording") {
        console.log("REC_DEBUG: Parando MediaRecorder a partir do recHandleStop.");
        recMediaRecorderRef.current.stop(); // This will trigger 'onstop'
    } else {
        // If already stopped or never started, ensure UI state is correct
        setRecIsRecording(false);
        console.log("REC_DEBUG: MediaRecorder não estava a gravar ou já parado. Definindo recIsRecording para false.");
    }
};
    // --- Fim da Gravação --------------------------------------------------------------------------------------------

    return (
        <div className='grid-container'>
        {/* <canvas ref={recOffScreenCanvasRef} style={{ display: 'none' }}></canvas> */}
        <canvas 
            ref={recOffScreenCanvasRef} 
            style={{ width: '400px', height: '150px', position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}
        ></canvas>
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
