import React, { useState } from 'react';

const TableDropZone = React.memo(({
  row,
  column,
  currentCell,
  onDrop,
  onRemove,
  isDropTarget,
  showResult,
  isCorrect,
  style
}) => {
  const [isHovering, setIsHovering] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsHovering(false);

    try {
      const cellData = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (onDrop) {
        onDrop(row, column, cellData);
      }
    } catch (error) {
      console.error('Error parsing dropped cell data:', error);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsHovering(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Only set hovering to false if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsHovering(false);
    }
  };

  const handleCellClick = () => {
    if (currentCell && onRemove && !showResult) {
      onRemove(row, column);
    }
  };

  const isEmpty = !currentCell || !currentCell.text;
  const displayText = currentCell?.text || '';

  return (
    <div
      className={`
        table-drop-zone
        ${isHovering && isDropTarget ? 'drag-hover' : ''}
        ${isEmpty ? 'empty' : 'filled'}
        ${showResult ? 'show-result' : ''}
        ${showResult && isCorrect ? 'correct' : ''}
        ${showResult && !isCorrect ? 'incorrect' : ''}
      `.trim()}
      style={style}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onClick={handleCellClick}
      title={
        isEmpty
          ? 'Drop a cell here'
          : showResult
          ? `${isCorrect ? 'Correct' : 'Incorrect'}: ${displayText}`
          : `Click to remove: ${displayText}`
      }
    >
      <div className="drop-zone-content">
        {isEmpty ? (
          <div className="placeholder">
            {isHovering && isDropTarget ? '↓ Drop here' : '???'}
          </div>
        ) : (
          <div className="cell-content">
            {displayText === '' ? (
              <div className="empty-indicator">EMPTY</div>
            ) : (
              <div className="text-content">{displayText}</div>
            )}
          </div>
        )}
      </div>

      {showResult && (
        <div className="result-indicator">
          {isCorrect ? '✓' : '✗'}
        </div>
      )}
    </div>
  );
});

TableDropZone.displayName = 'TableDropZone';

export default TableDropZone;