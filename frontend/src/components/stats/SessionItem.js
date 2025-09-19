import React from 'react';

const SessionItem = React.memo(({
  item,
  index,
  isFlashcard
}) => {
  const { content, interaction } = item;

  // Determine if answer was correct
  const isCorrect = isFlashcard ?
    interaction?.result === 'Right' :
    interaction?.isCorrect === true;

  // Format timing
  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Get timing classification
  const getTimingClass = (timeSpent) => {
    if (timeSpent <= 5) return 'fast';
    if (timeSpent <= 15) return 'normal';
    return 'slow';
  };

  return (
    <div className={`session-item ${isCorrect ? 'correct' : 'incorrect'}`}>
      <div className="item-header">
        <div className="item-number">#{index}</div>
        <div className="item-result">
          <span className={`result-badge ${isCorrect ? 'success' : 'error'}`}>
            {isCorrect ? '✓ Correct' : '✗ Incorrect'}
          </span>
        </div>
        <div className={`item-time ${getTimingClass(interaction?.timeSpent || 0)}`}>
          {formatTime(interaction?.timeSpent || 0)}
        </div>
      </div>

      <div className="item-content">
        {isFlashcard ? (
          <>
            <div className="question-section">
              <strong>Question:</strong>
              <div className="question-text">{content?.frontText || 'Question not found'}</div>
            </div>
            <div className="answer-section">
              <strong>Answer:</strong>
              <div className="answer-text">{content?.backText || 'Answer not found'}</div>
            </div>
            <div className="user-response">
              <strong>Your Response:</strong> {interaction?.result || 'No response'}
            </div>
          </>
        ) : (
          <>
            <div className="question-section">
              <strong>Question:</strong>
              <div className="question-text">{content?.question || 'Question not found'}</div>
            </div>
            <div className="mcq-options">
              <div className="user-answer">
                <strong>Your Answer:</strong> {interaction?.selectedAnswer}. {content?.options?.[interaction?.selectedAnswer]?.text || 'Option not found'}
                {isCorrect ? ' ✓' : ' ✗'}
              </div>
              {!isCorrect && content?.correctAnswer && (
                <div className="correct-answer">
                  <strong>Correct Answer:</strong> {content.correctAnswer}. {content.options?.[content.correctAnswer]?.text || 'Option not found'}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <div className="item-metadata">
        <div className="metadata-row">
          <span className={`difficulty-badge ${interaction?.difficulty?.toLowerCase() || 'unknown'}`}>
            {interaction?.difficulty || 'Unknown'} Difficulty
          </span>
          <span className={`confidence-badge ${interaction?.confidenceWhileSolving?.toLowerCase() || 'unknown'}`}>
            {interaction?.confidenceWhileSolving || 'Unknown'} Confidence
          </span>
        </div>
        <div className="content-metadata">
          <span className="subject">{content?.subject || 'Unknown Subject'}</span>
          {content?.chapter && (
            <span className="chapter"> | {content.chapter}</span>
          )}
          {content?.section && (
            <span className="section"> | {content.section}</span>
          )}
        </div>
      </div>
    </div>
  );
});

export default SessionItem;