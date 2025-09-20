import React from 'react';

const TableQuizControls = React.memo(({
  onSubmit,
  submitted,
  confidence,
  difficulty,
  onConfidenceChange,
  onDifficultyChange,
  onNext,
  canSubmit = true,
  canProceed = false
}) => {
  const confidenceOptions = ['', 'High', 'Low'];
  const difficultyOptions = ['', 'Easy', 'Medium', 'Hard'];

  return (
    <div className="table-quiz-controls">
      {!submitted ? (
        <div className="submit-section">
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`submit-btn ${canSubmit ? 'enabled' : 'disabled'}`}
          >
            Submit Table
          </button>
          <div className="submit-hint">
            {canSubmit
              ? 'Click to check your answers'
              : 'Place all cells to submit'
            }
          </div>
        </div>
      ) : (
        <div className="post-submit-section">
          <div className="selectors-row">
            <div className="selector-group">
              <label htmlFor="confidence-select">Confidence:</label>
              <select
                id="confidence-select"
                value={confidence}
                onChange={(e) => onConfidenceChange(e.target.value)}
                className="confidence-selector"
              >
                {confidenceOptions.map(option => (
                  <option key={option} value={option}>
                    {option || 'Select confidence...'}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label htmlFor="difficulty-select">Difficulty:</label>
              <select
                id="difficulty-select"
                value={difficulty}
                onChange={(e) => onDifficultyChange(e.target.value)}
                className="difficulty-selector"
              >
                {difficultyOptions.map(option => (
                  <option key={option} value={option}>
                    {option || 'Select difficulty...'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="next-section">
            <button
              onClick={onNext}
              disabled={!canProceed}
              className={`next-btn ${canProceed ? 'enabled' : 'disabled'}`}
            >
              Next Table →
            </button>
            <div className="next-hint">
              {canProceed
                ? 'Continue to the next table'
                : 'Please select confidence and difficulty'
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TableQuizControls.displayName = 'TableQuizControls';

export default TableQuizControls;