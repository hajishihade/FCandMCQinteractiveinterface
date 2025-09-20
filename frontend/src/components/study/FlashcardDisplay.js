import React from 'react';

const FlashcardDisplay = React.memo(({
  card,
  showingFront,
  isTransitioning
}) => {
  // Safe guard - defensive programming
  if (!card) {
    return (
      <div className="card-section">
        <div className="loading-card">Loading card...</div>
      </div>
    );
  }

  return (
    <div className="card-section">
      <div className="card-meta">
        ID: {card?.cardId || 'Unknown'} • {card?.subject || 'Unknown Subject'}
      </div>

      <div className={`floating-content ${isTransitioning ? 'card-transition-out' : 'card-transition-in'}`}>
        <div className="question-text">
          {card?.frontText || 'Question not available'}
        </div>

        {!showingFront && (
          <div className="answer-section">
            <div className="divider-line"></div>
            <div className="answer-text">
              {card?.backText || 'Answer not available'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default FlashcardDisplay;