import React from 'react';
import TableDropZone from './TableDropZone';

const TableQuizDisplay = React.memo(({
  tableStructure,
  onCellDrop,
  onCellRemove,
  draggedCell,
  showResults,
  results
}) => {
  const rows = tableStructure.length;
  const columns = tableStructure[0]?.length || 0;

  return (
    <div className="table-quiz-display">
      <div
        className="table-grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 1fr)`
        }}
      >
        {tableStructure.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const key = `${rowIndex}-${colIndex}`;

            // Render header cells as fixed elements
            if (cell?.isHeader) {
              return (
                <div
                  key={key}
                  className="table-cell header-cell"
                  style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }}
                >
                  {cell.text}
                </div>
              );
            }

            // Render content cells as drop zones
            return (
              <TableDropZone
                key={key}
                row={rowIndex}
                column={colIndex}
                currentCell={cell}
                onDrop={onCellDrop}
                onRemove={onCellRemove}
                isDropTarget={draggedCell !== null}
                showResult={showResults}
                isCorrect={results?.correctGrid?.[rowIndex]?.[colIndex]}
                style={{ gridRow: rowIndex + 1, gridColumn: colIndex + 1 }}
              />
            );
          })
        )}
      </div>
    </div>
  );
});

TableQuizDisplay.displayName = 'TableQuizDisplay';

export default TableQuizDisplay;