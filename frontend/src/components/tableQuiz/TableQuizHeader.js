import React from 'react';

const TableQuizHeader = React.memo(({
  elapsedTime,
  tableName,
  tableIndex,
  totalTables,
  cellsPlaced,
  totalContentCells
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = totalContentCells > 0
    ? (cellsPlaced / totalContentCells) * 100
    : 0;

  return (
    <div className="table-quiz-header">
      <div className="header-left">
        <div className="timer">
          <span className="timer-icon">⏱</span>
          <span className="timer-text">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="header-center">
        <div className="table-info">
          <h2 className="table-name">{tableName}</h2>
          <div className="table-progress">
            Table {tableIndex + 1} of {totalTables}
          </div>
        </div>
      </div>

      <div className="header-right">
        <div className="placement-progress">
          <div className="progress-text">
            {cellsPlaced}/{totalContentCells} placed
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="progress-percentage">
              {Math.round(progressPercentage)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

TableQuizHeader.displayName = 'TableQuizHeader';

export default TableQuizHeader;