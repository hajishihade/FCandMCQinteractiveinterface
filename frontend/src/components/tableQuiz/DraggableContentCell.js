import React, { useState } from 'react';

const DraggableContentCell = React.memo(({
  cell,
  onDragStart,
  onDragEnd,
  isBeingDragged = false,
  isPlaced = false,
  isInPalette = false
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify(cell));
    e.dataTransfer.effectAllowed = 'move';

    // Create a custom drag image
    const dragImage = e.target.cloneNode(true);
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    e.dataTransfer.setDragImage(dragImage, e.target.offsetWidth / 2, e.target.offsetHeight / 2);

    if (onDragStart) {
      onDragStart(cell);
    }
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    if (onDragEnd) {
      onDragEnd();
    }
  };

  const displayText = cell.text || 'EMPTY';
  const isEmpty = !cell.text || cell.text.trim() === '';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        draggable-cell
        ${isDragging ? 'dragging' : ''}
        ${isBeingDragged ? 'being-dragged' : ''}
        ${isPlaced ? 'placed' : ''}
        ${isInPalette ? 'in-palette' : ''}
        ${isEmpty ? 'empty-cell' : 'content-cell'}
      `.trim()}
      title={`Drag to place: ${displayText}`}
    >
      <div className="cell-content">
        {isEmpty ? (
          <div className="empty-indicator">EMPTY</div>
        ) : (
          <div className="text-content">{displayText}</div>
        )}
      </div>

      {!isInPalette && (
        <div className="drag-handle">
          ⋮⋮
        </div>
      )}
    </div>
  );
});

DraggableContentCell.displayName = 'DraggableContentCell';

export default DraggableContentCell;