import React from 'react';
import './SessionStatsModal.css';

const SessionStatsModal = ({ isOpen, onClose, sessionData, seriesTitle, isFlashcard = true }) => {
  if (!isOpen || !sessionData) return null;

  // Calculate stats for flashcards
  const calculateFlashcardStats = () => {
    const cards = sessionData.cards || [];
    const totalCards = cards.length;

    const rightCount = cards.filter(card =>
      card.interaction?.result === 'Right'
    ).length;

    const wrongCount = cards.filter(card =>
      card.interaction?.result === 'Wrong'
    ).length;

    const easyCount = cards.filter(card =>
      card.interaction?.difficulty === 'Easy'
    ).length;

    const mediumCount = cards.filter(card =>
      card.interaction?.difficulty === 'Medium'
    ).length;

    const hardCount = cards.filter(card =>
      card.interaction?.difficulty === 'Hard'
    ).length;

    const highConfidenceCount = cards.filter(card =>
      card.interaction?.confidence === 'High'
    ).length;

    const lowConfidenceCount = cards.filter(card =>
      card.interaction?.confidence === 'Low'
    ).length;

    const totalTime = cards.reduce((sum, card) =>
      sum + (card.interaction?.timeSpent || 0), 0
    );

    const avgTime = totalCards > 0 ? (totalTime / totalCards).toFixed(1) : 0;

    return {
      totalCards,
      rightCount,
      wrongCount,
      easyCount,
      mediumCount,
      hardCount,
      highConfidenceCount,
      lowConfidenceCount,
      totalTime,
      avgTime,
      accuracy: totalCards > 0 ? ((rightCount / totalCards) * 100).toFixed(1) : 0
    };
  };

  // Calculate stats for MCQs
  const calculateMCQStats = () => {
    const questions = sessionData.questions || [];
    const totalQuestions = questions.length;

    const correctCount = questions.filter(q =>
      q.interaction?.isCorrect === true
    ).length;

    const incorrectCount = questions.filter(q =>
      q.interaction?.isCorrect === false
    ).length;

    const easyCount = questions.filter(q =>
      q.interaction?.difficulty === 'Easy'
    ).length;

    const mediumCount = questions.filter(q =>
      q.interaction?.difficulty === 'Medium'
    ).length;

    const hardCount = questions.filter(q =>
      q.interaction?.difficulty === 'Hard'
    ).length;

    const highConfidenceCount = questions.filter(q =>
      q.interaction?.confidenceWhileSolving === 'High'
    ).length;

    const lowConfidenceCount = questions.filter(q =>
      q.interaction?.confidenceWhileSolving === 'Low'
    ).length;

    const totalTime = questions.reduce((sum, q) =>
      sum + (q.interaction?.timeSpent || 0), 0
    );

    const avgTime = totalQuestions > 0 ? (totalTime / totalQuestions).toFixed(1) : 0;

    return {
      totalQuestions,
      correctCount,
      incorrectCount,
      easyCount,
      mediumCount,
      hardCount,
      highConfidenceCount,
      lowConfidenceCount,
      totalTime,
      avgTime,
      accuracy: totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : 0
    };
  };

  const stats = isFlashcard ? calculateFlashcardStats() : calculateMCQStats();
  const itemLabel = isFlashcard ? 'card' : 'question';
  const itemLabelPlural = isFlashcard ? 'cards' : 'questions';

  const formatTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return '#28a745';
      case 'active': return '#007bff';
      default: return '#6c757d';
    }
  };

  const getProgressPercentage = () => {
    if (sessionData.status === 'completed') return 100;
    const total = isFlashcard ? stats.totalCards : stats.totalQuestions;
    const completed = isFlashcard ?
      (stats.rightCount + stats.wrongCount) :
      (stats.correctCount + stats.incorrectCount);
    return total > 0 ? ((completed / total) * 100).toFixed(0) : 0;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stats-modal-content" onClick={e => e.stopPropagation()}>
        <div className="stats-modal-header">
          <div>
            <h2>Session #{sessionData.sessionId} Statistics</h2>
            <p className="series-subtitle">{seriesTitle}</p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="stats-modal-body">
          {/* Status Banner */}
          <div className="status-banner" style={{ backgroundColor: getStatusColor(sessionData.status) }}>
            <span className="status-label">{sessionData.status?.toUpperCase()}</span>
            <span className="progress-label">{getProgressPercentage()}% Complete</span>
          </div>

          {/* Main Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card primary">
              <div className="stat-value">
                {isFlashcard ? stats.totalCards : stats.totalQuestions}
              </div>
              <div className="stat-label">Total {itemLabelPlural}</div>
            </div>

            <div className="stat-card success">
              <div className="stat-value">{stats.accuracy}%</div>
              <div className="stat-label">Accuracy</div>
            </div>

            <div className="stat-card info">
              <div className="stat-value">{formatTime(Math.round(stats.totalTime))}</div>
              <div className="stat-label">Total Time</div>
            </div>

            <div className="stat-card warning">
              <div className="stat-value">{stats.avgTime}s</div>
              <div className="stat-label">Avg Time per {itemLabel}</div>
            </div>
          </div>

          {/* Results Breakdown */}
          <div className="breakdown-section">
            <h3>Results Breakdown</h3>
            <div className="breakdown-grid">
              <div className="breakdown-item">
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill success"
                    style={{ width: `${isFlashcard ?
                      (stats.rightCount / stats.totalCards * 100) :
                      (stats.correctCount / stats.totalQuestions * 100)}%` }}
                  />
                </div>
                <div className="breakdown-label">
                  <span>{isFlashcard ? 'Right' : 'Correct'}</span>
                  <span>{isFlashcard ? stats.rightCount : stats.correctCount}</span>
                </div>
              </div>

              <div className="breakdown-item">
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill danger"
                    style={{ width: `${isFlashcard ?
                      (stats.wrongCount / stats.totalCards * 100) :
                      (stats.incorrectCount / stats.totalQuestions * 100)}%` }}
                  />
                </div>
                <div className="breakdown-label">
                  <span>{isFlashcard ? 'Wrong' : 'Incorrect'}</span>
                  <span>{isFlashcard ? stats.wrongCount : stats.incorrectCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="breakdown-section">
            <h3>Difficulty Distribution</h3>
            <div className="distribution-grid">
              <div className="distribution-item">
                <span className="dist-label easy">Easy</span>
                <span className="dist-value">{stats.easyCount}</span>
              </div>
              <div className="distribution-item">
                <span className="dist-label medium">Medium</span>
                <span className="dist-value">{stats.mediumCount}</span>
              </div>
              <div className="distribution-item">
                <span className="dist-label hard">Hard</span>
                <span className="dist-value">{stats.hardCount}</span>
              </div>
            </div>
          </div>

          {/* Confidence Distribution */}
          <div className="breakdown-section">
            <h3>Confidence Distribution</h3>
            <div className="distribution-grid">
              <div className="distribution-item">
                <span className="dist-label high">High</span>
                <span className="dist-value">{stats.highConfidenceCount}</span>
              </div>
              <div className="distribution-item">
                <span className="dist-label low">Low</span>
                <span className="dist-value">{stats.lowConfidenceCount}</span>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="session-details">
            <div className="detail-item">
              <span className="detail-label">Started:</span>
              <span className="detail-value">
                {sessionData.startedAt ? new Date(sessionData.startedAt).toLocaleString() : 'Not started'}
              </span>
            </div>
            {sessionData.completedAt && (
              <div className="detail-item">
                <span className="detail-label">Completed:</span>
                <span className="detail-value">
                  {new Date(sessionData.completedAt).toLocaleString()}
                </span>
              </div>
            )}
            {sessionData.generatedFrom && (
              <div className="detail-item">
                <span className="detail-label">Generated from:</span>
                <span className="detail-value">Session #{sessionData.generatedFrom}</span>
              </div>
            )}
          </div>
        </div>

        <div className="stats-modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsModal;