import React from 'react';
import './../App.css';

export const GridProcess = ({ tableInfos }) => {
    console.log({ tableInfos });

    const sortedProcesses = [...tableInfos].sort((a, b) => a.arrivalTime - b.arrivalTime);
    console.log({ sortedProcesses });
    let lastEndTime = 0;

    return (
        <div className='grid-container'>
            {/* Grid process - cerne do troço */}
            <div className='process-grid'>
                {sortedProcesses.map((process, index) => {
                    const arrivalTime = parseInt(process.arrivalTime, 10);
                    const runningTime = parseInt(process.runningTime, 10);

                    const colStart = Math.max(lastEndTime + 1, arrivalTime + 1); // início da coluna
                    const colSpan = runningTime; // largura da coluna

                    lastEndTime = colStart + colSpan - 1;

                    const processStyle = {
                        gridColumnStart: colStart,
                        gridColumnEnd: `span ${colSpan}`,
                        position: 'relative',
                        gridRowStart: index + 1,
                    };

                    const arrivalStyle = {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: 'yellow',
                        width: '10px',
                        height: '100%',
                        zIndex: 1, // sobrepor o processo
                    };

                    return (
                        <div key={process.id} className='process' style={processStyle}>
                            <div className='arrival-indicator' style={arrivalStyle}></div>
                            <div style={{ zIndex: 2 }}>
                                P{index + 1}
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

            {/* Description table */}
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

export default GridProcess;