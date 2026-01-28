import React from 'react';
import './Table.css';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick,
  striped = false,
  hoverable = true,
  bordered = false,
  className = ''
}) => {
  const tableClass = [
    'table',
    striped && 'table-striped',
    hoverable && 'table-hoverable',
    bordered && 'table-bordered',
    className
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className="table-loading">
        <div className="table-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
          <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2"/>
          <line x1="9" y1="21" x2="9" y2="9" strokeWidth="2"/>
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className={tableClass}>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={column.className || ''}
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'table-row-clickable' : ''}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex} className={column.className || ''}>
                  {column.render
                    ? column.render(row[column.field], row, rowIndex)
                    : row[column.field]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;