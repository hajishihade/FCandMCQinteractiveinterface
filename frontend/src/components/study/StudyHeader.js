import React from 'react';

const StudyHeader = React.memo(({
  elapsedTime,
  currentIndex,
  totalItems,
  sessionId
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="study-header">
      <div className="timer-section">
        <div className="timer">{formatTime(elapsedTime)}</div>
      </div>
      <div className="progress-section">
        <div className="progress-numbers">
          {currentIndex + 1} / {totalItems}
        </div>
      </div>
    </div>
  );
});

export default StudyHeader;