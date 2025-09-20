import React from 'react';

const MCQDisplay = React.memo(({
  question,
  selectedAnswer,
  onAnswerSelect,
  showingAnswer,
  isTransitioning
}) => {
  // Safe guard - defensive programming
  if (!question) {
    return (
      <div className="question-section">
        <div className="loading-question">Loading question...</div>
      </div>
    );
  }

  const isCorrect = selectedAnswer === question?.correctAnswer;

  return (
    <div className="question-section">
      <div className="question-meta">
        ID: {question?.questionId || 'Unknown'} • {question?.subject || 'Unknown Subject'}
      </div>

      <div className={`floating-content ${isTransitioning ? 'question-transition-out' : 'question-transition-in'}`}>
        <div className="question-text">
          {question?.question || 'Question not available'}
        </div>

        {/* Answer options */}
        <div className="answer-options">
          {question?.options && Object.entries(question.options).map(([key, option]) => (
            <button
              key={key}
              className={`option-btn ${selectedAnswer === key ? 'selected' : ''} ${
                showingAnswer
                  ? (key === question?.correctAnswer ? 'correct' :
                     key === selectedAnswer && key !== question?.correctAnswer ? 'incorrect' : 'disabled')
                  : ''
              }`}
              onClick={() => !showingAnswer && onAnswerSelect(key)}
              disabled={showingAnswer}
            >
              <span className="option-letter">{key}</span>
              <span className="option-text">{option?.text || 'Option not available'}</span>
            </button>
          ))}
        </div>

        {/* Explanation section when showing answer */}
        {showingAnswer && question?.explanation && (
          <div className="explanation-section">
            <div className="explanation-header">
              <h4>Explanation:</h4>
            </div>
            <div className="explanation-content">
              {question.explanation}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default MCQDisplay;