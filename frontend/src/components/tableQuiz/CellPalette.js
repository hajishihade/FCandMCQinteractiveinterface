import React from 'react';
import DraggableContentCell from './DraggableContentCell';

const CellPalette = React.memo(({
  availableCells,
  onDragStart,
  onDragEnd,
  cellsPlaced,
  totalCells
}) => {
  const remainingCells = availableCells.length;
  const progressPercentage = totalCells > 0 ? ((totalCells - remainingCells) / totalCells) * 100 : 0;

  return (
    <div className="cell-palette">
      <div className="palette-header">
        <h3>Available Cells</h3>
        <div className="progress-container">
          <div className="progress-text">
            {totalCells - remainingCells}/{totalCells} placed
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="cells-container">
        {availableCells.length === 0 ? (
          <div className="no-cells-message">
            All cells have been placed!
          </div>
        ) : (
          availableCells.map((cell, index) => (
            <DraggableContentCell
              key={`${cell.row}-${cell.column}-${index}-${cell.text}`}
              cell={cell}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isInPalette={true}
            />
          ))
        )}
      </div>
    </div>
  );
});

CellPalette.displayName = 'CellPalette';

export default CellPalette;