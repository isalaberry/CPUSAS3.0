import React, { useState } from 'react';
import InputTable from './InputTable';
import { GridProcess } from './GridProcess';
import './../App.css'; // Importando o CSS

export const Fifo = () => {

  return (
    <div className="container">
      <div className="card">
        <InputTable />
      </div>
    </div>
  );
};
