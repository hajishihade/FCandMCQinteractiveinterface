import React from 'react';

const ConfidenceSelector = React.memo(({
  confidence = '',
  onConfidenceChange,
  disabled = false
}) => {
  // Safe guard - prevent crashes if handler is missing
  const handleConfidenceChange = (value) => {
    if (typeof onConfidenceChange === 'function') {
      onConfidenceChange(value);
    } else {
      console.warn('ConfidenceSelector: onConfidenceChange handler missing');
    }
  };

  return (
    <div className="control-row">
      <span className="control-label">confidence</span>
      <div className="minimal-buttons">
        <button
          className={`minimal-btn ${confidence === 'High' ? 'selected' : ''}`}
          onClick={() => handleConfidenceChange('High')}
          disabled={disabled}
          title="High Confidence"
        >
          ↑
        </button>
        <button
          className={`minimal-btn ${confidence === 'Low' ? 'selected' : ''}`}
          onClick={() => handleConfidenceChange('Low')}
          disabled={disabled}
          title="Low Confidence"
        >
          ↓
        </button>
      </div>
    </div>
  );
});

export default ConfidenceSelector;