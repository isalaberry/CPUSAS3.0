import React from 'react';

/*
*   Esse componente recebe de parametro tableInfos e ordea os processos da tableInfos em um array de 10 posicoes,
*   ordenando os processos por arrivalTime (algoritmo first come first served). Cada posicao do vetor corresponde
*   a um ciclo da cpu, e cada processo ocupa o mesmo numero de espaços do vetor que o seu próprio runningTime. 
*   Cada espaço do vetor deve guardar todas as informações do porcesso. Esse componente deve devolver esse array 
*   ordenado de processos.
*/


const FCFS = ({ tableInfos }) => {
    // Ordena os processos por arrivalTime
    const sortedProcesses = [...tableInfos].sort((a, b) => a.arrivalTime - b.arrivalTime);

    // Cria um array de 10 posições para representar os ciclos da CPU
    const cpuCycles = new Array(10).fill(null);

    let currentIndex = 0;

    // Preenche o array com os processos ordenados
    sortedProcesses.forEach(process => {
        for (let i = 0; i < process.runningTime; i++) {
            if (currentIndex < 10) {
                cpuCycles[currentIndex] = process;
                currentIndex++;
            }
        }
    });

    return cpuCycles;
};

export default FCFS;