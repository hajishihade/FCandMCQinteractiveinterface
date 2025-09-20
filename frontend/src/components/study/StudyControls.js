import React from 'react';

const StudyControls = React.memo(({
  studyType,
  showingFront,
  showingAnswer,
  selectedAnswer,
  canSubmit,
  onResult,
  onSubmitMCQ
}) => {
  if (studyType === 'flashcard') {
    // Flashcard controls - Right/Wrong after seeing answer
    if (showingFront) {
      return null; // Controls handled by confidence/difficulty selectors
    }

    return (
      <div className="result-controls">
        <h3>was your answer correct?</h3>
        <div className="result-buttons">
          <button
            className="result-btn wrong-btn"
            onClick={() => onResult('Wrong')}
            title="Wrong"
          >
            ✗
          </button>
          <button
            className="result-btn right-btn"
            onClick={() => onResult('Right')}
            title="Right"
          >
            ✓
          </button>
        </div>
      </div>
    );
  } else {
    // MCQ controls - Show "Next Question" button when showing answer
    if (showingAnswer) {
      return (
        <div className="result-controls">
          <h3>Ready for next question?</h3>
          <div className="result-buttons">
            <button
              className="continue-btn"
              onClick={() => onSubmitMCQ()}
              title="Continue to next question"
            >
              Next Question →
            </button>
          </div>
        </div>
      );
    }

    // No controls when selecting answer
    return null;
  }
});

export default StudyControls;