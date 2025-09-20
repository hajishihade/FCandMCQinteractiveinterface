import React from 'react';

const DifficultySelector = React.memo(({
  difficulty = '',
  onDifficultyChange,
  disabled = false
}) => {
  // Safe guard - prevent crashes if handler is missing
  const handleDifficultyChange = (value) => {
    if (typeof onDifficultyChange === 'function') {
      onDifficultyChange(value);
    } else {
      console.warn('DifficultySelector: onDifficultyChange handler missing');
    }
  };

  return (
    <div className="control-row">
      <span className="control-label">difficulty</span>
      <div className="minimal-buttons">
        <button
          className={`minimal-btn ${difficulty === 'Easy' ? 'selected' : ''}`}
          onClick={() => handleDifficultyChange('Easy')}
          disabled={disabled}
          title="Easy"
        >
          −
        </button>
        <button
          className={`minimal-btn ${difficulty === 'Medium' ? 'selected' : ''}`}
          onClick={() => handleDifficultyChange('Medium')}
          disabled={disabled}
          title="Medium"
        >
          =
        </button>
        <button
          className={`minimal-btn ${difficulty === 'Hard' ? 'selected' : ''}`}
          onClick={() => handleDifficultyChange('Hard')}
          disabled={disabled}
          title="Hard"
        >
          ≡
        </button>
      </div>
    </div>
  );
});

export default DifficultySelector;