import React from 'react';

const SessionSummary = React.memo(({
  sessionResults,
  summaryStats,
  studyType,
  onNavigateToSeries,
  onNavigateToDashboard
}) => {
  const itemLabel = studyType === 'flashcard' ? 'card' : 'question';

  return (
    <div className="study-container">
      <div className="summary-header">
        <div className="summary-title">session complete!</div>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">score</span>
            <span className="stat-value">
              {summaryStats.correctCount}/{summaryStats.totalCards || summaryStats.totalQuestions}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">success</span>
            <span className="stat-value">{summaryStats.successRate}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">time</span>
            <span className="stat-value">{summaryStats.totalTime}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">avg/{itemLabel}</span>
            <span className="stat-value">{summaryStats.avgTime}s</span>
          </div>
        </div>
      </div>

      <div className="results-list">
        {sessionResults.map((result) => (
          <div key={result.cardId || result.questionId} className="result-item">
            <div className="result-header">
              <span className="card-number">
                #{result.cardId || result.questionId}
              </span>
              <span className={`result-badge ${
                studyType === 'flashcard'
                  ? result.result?.toLowerCase()
                  : (result.isCorrect ? 'right' : 'wrong')
              }`}>
                {studyType === 'flashcard'
                  ? (result.result === 'Right' ? '✓' : '✗')
                  : (result.isCorrect ? '✓' : '✗')
                }
              </span>
            </div>

            <div className="result-content">
              {studyType === 'flashcard' ? (
                <>
                  <div className="result-question">{result.frontText}</div>
                  <div className="result-answer">{result.backText}</div>
                </>
              ) : (
                <>
                  <div className="result-question">{result.question}</div>
                  <div className="result-mcq-info">
                    <div>Your Answer: {result.selectedAnswer}</div>
                    {!result.isCorrect && (
                      <div>Correct Answer: {result.correctAnswer}</div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="result-meta">
              <div className="meta-item">
                {result.confidenceWhileSolving === 'High' ? '↑' : '↓'}
              </div>
              <div className="meta-item">
                {result.difficulty === 'Easy' ? '−' : result.difficulty === 'Medium' ? '=' : '≡'}
              </div>
              <div className="meta-item">
                {studyType === 'flashcard'
                  ? (result.result === 'Right' ? '✓' : '✗')
                  : (result.isCorrect ? '✓' : '✗')
                }
              </div>
              <div className="meta-item">
                {result.timeSpent}s
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="summary-footer">
        <button onClick={onNavigateToSeries} className="series-btn">
          ← {studyType === 'flashcard' ? 'Series' : 'MCQ Series'}
        </button>
        <button onClick={onNavigateToDashboard} className="dashboard-btn">
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
});

export default SessionSummary;