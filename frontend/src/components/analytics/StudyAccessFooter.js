import React from 'react';

const StudyAccessFooter = React.memo(({
  onStartStudying
}) => {
  return (
    <div className="analytics-footer">
      <div className="study-access">
        <button
          onClick={onStartStudying}
          className="study-btn primary"
        >
          📚 Start Studying
        </button>
      </div>
    </div>
  );
});

export default StudyAccessFooter;