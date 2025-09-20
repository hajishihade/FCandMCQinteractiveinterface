import React from 'react';

const TableSolutionGuide = React.memo(({ tableData, show = false }) => {
  if (!show || !tableData) return null;

  const { rows, columns, cells } = tableData;

  // Create the correct solution grid
  const solutionGrid = Array(rows).fill(null).map(() => Array(columns).fill(null));

  cells.forEach(cell => {
    solutionGrid[cell.row][cell.column] = cell;
  });

  return (
    <div className="solution-guide">
      <h4>📋 Correct Solution:</h4>
      <div
        className="solution-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px'
        }}
      >
        {solutionGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`solution-cell ${cell?.isHeader ? 'solution-header' : 'solution-content'}`}
              style={{
                background: cell?.isHeader
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                padding: '6px',
                color: 'white',
                textAlign: 'center',
                fontSize: '11px',
                minHeight: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {cell?.text || 'EMPTY'}
            </div>
          ))
        )}
      </div>
      <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', marginTop: '8px' }}>
        💡 Study this layout, then try again!
      </p>
    </div>
  );
});

TableSolutionGuide.displayName = 'TableSolutionGuide';

export default TableSolutionGuide;