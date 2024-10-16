import React from 'react';
import { gsap } from "gsap";

export const GridProccess = ({ tableInfos }) => {
    console.log({ tableInfos });

    return (
        <div className='grid-container'>
            {/* Grid process - cerne do troço */}
            <div className='process-grid'>
                {tableInfos.map((process, index) => {
                    const arrivalTime = parseInt(process.arrivalTime, 10);
                    const runningTime = parseInt(process.runningTime, 10);

                    // Calculando a posição da coluna e a largura
                    const colStart = arrivalTime + 1; // posição inicial
                    const colSpan = runningTime; // largura da coluna

                    const style = {
                        gridColumnStart: colStart,
                        gridColumnEnd: `span ${colSpan}`,
                    };

                    return (
                        <div key={process.id} className='process' style={style}>
                            P{index + 1}
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
