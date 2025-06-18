import React from 'react';
import { useTranslation } from 'react-i18next';

const Table = ({
  processes,
  handleInputChange,
  showPriority,
  showQuantum,
  showArrivalTime = true,
  idPrefix = "P",
  nameColumnHeader = "Name"
}) => {
  const { t } = useTranslation();
  if (!Array.isArray(processes)) {
    console.error("Processes must be an array");
    console.log(processes);
    return null;
  }
  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          {showArrivalTime && <th>{t('table.headerArrivalTime')}</th>}
          <th>{t('table.headerRunningTime')}</th>
          {showPriority && <th>{t('table.headerPriority')}</th>}
        </tr>
      </thead>
      <tbody>
        {processes.map((process, index) => (
          <tr key={index}>
            <td>{idPrefix}{process.id}</td>
            {showArrivalTime && (
              <td>
                <input
                  type="number"
                  min="1"
                  value={process.arrivalTime}
                  onChange={(e) =>
                    handleInputChange &&
                    handleInputChange(index, "arrivalTime", Number(e.target.value))
                  }
                  className="input-table"
                  readOnly={!handleInputChange || process.readOnlyArrivalTime}
                />
              </td>
            )}
            <td>
              <input
                type="number"
                min="1"
                value={process.runningTime}
                onChange={(e) =>
                  handleInputChange &&
                  handleInputChange(index, "runningTime", Number(e.target.value))
                }
                className="input-table"
                readOnly={!handleInputChange}
              />
            </td>
            {showPriority && (
              <td>
                <input
                  type="number"
                  min="0"
                  value={process.priority}
                  onChange={(e) =>
                    handleInputChange &&
                    handleInputChange(index, "priority", Number(e.target.value))
                  }
                  className="input-table"
                  readOnly={!handleInputChange}
                />
              </td>
            )}

          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;