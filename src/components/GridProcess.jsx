export const GridProcess = ({ tableInfos }) => {
    console.log({ tableInfos });

    // Função para ordenar processos de acordo com o algoritmo
    const sortProcesses = (tableInfos) => {
        console.log("Before sorting:", tableInfos.map(p => p.arrivalTime));
        const sorted = [...tableInfos].sort((a, b) => a.arrivalTime - b.arrivalTime);
        console.log("After sorting:", sorted.map(p => p.arrivalTime));

        
        return sorted;
    };

    const sortedProcesses = sortProcesses(tableInfos);
  //  console.log( sortedProcesses );
    let lastEndTime = 0;

    return (
        <div className='grid-container'>
            <div className='process-grid'>
                {sortedProcesses.map((process, index) => {
                    const { arrivalTime, runningTime } = process;

                    const colStart = Math.max(lastEndTime, arrivalTime+1); 
                    const colSpan = runningTime; 
                    lastEndTime = colStart + colSpan; //javascript executa tudo ao mesmo tempo
                    console.log({colStart});

                    const processStyle = {
                        gridColumnStart: colStart,
                        gridColumnEnd: `span ${colSpan}`,
                        position: 'relative',
                        gridRowStart: process.id,
                    };

                    const arrivalStyle = {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: 'yellow',
                        width: '10px',
                        height: '100%',
                        zIndex: 1,
                    };

                    return (
                        <div key={process.id} className='process' style={processStyle}>
                            <div className='arrival-indicator' style={arrivalStyle}></div>
                            <div style={{ zIndex: 2 }}>
                                {`P${process.id}`} {/* Correção para IDs */}
                            </div>
                        </div>
                    );
                })}

                <div className="labels">
                    {[...Array(11)].map((_, i) => (
                        <div key={i} className="label">{i}</div>
                    ))}
                </div>
            </div>

            <div className='description-table'>
                <table className="w-full">
                    <thead>
                        <tr>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableInfos.map((process) => (
                            <tr key={process.id}>
                                <td className='p-4'>description {process.id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
