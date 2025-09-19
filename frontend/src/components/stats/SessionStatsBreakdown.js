import React from 'react';

const SessionStatsBreakdown = React.memo(({
  analytics,
  isFlashcard
}) => {
  console.log('=== BREAKDOWN WIDGET DEBUG ===');
  console.log('Analytics for breakdown:', analytics);

  // Access analytics properties directly (flattened structure)
  const performanceBreakdown = {
    correct: analytics.correctItems || 0,
    incorrect: analytics.incorrectItems || 0,
    easyCount: analytics.easyCount || 0,
    mediumCount: analytics.mediumCount || 0,
    hardCount: analytics.hardCount || 0,
    highConfidenceCount: analytics.highConfidenceCount || 0,
    lowConfidenceCount: analytics.lowConfidenceCount || 0
  };

  const timeAnalysis = analytics.timeAnalysis || {};
  const subjectBreakdown = analytics.subjectBreakdown || {};

  return (
    <>
      {/* Results Breakdown */}
      <div className="breakdown-section">
        <h3>Results Breakdown</h3>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <div className="breakdown-bar">
              <div
                className="breakdown-fill success"
                style={{
                  width: `${performanceBreakdown.correct > 0 ?
                    (performanceBreakdown.correct / (performanceBreakdown.correct + performanceBreakdown.incorrect) * 100) : 0}%`
                }}
              />
            </div>
            <div className="breakdown-label">
              <span>{isFlashcard ? 'Right' : 'Correct'}</span>
              <span>{performanceBreakdown.correct}</span>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-bar">
              <div
                className="breakdown-fill danger"
                style={{
                  width: `${performanceBreakdown.incorrect > 0 ?
                    (performanceBreakdown.incorrect / (performanceBreakdown.correct + performanceBreakdown.incorrect) * 100) : 0}%`
                }}
              />
            </div>
            <div className="breakdown-label">
              <span>{isFlashcard ? 'Wrong' : 'Incorrect'}</span>
              <span>{performanceBreakdown.incorrect}</span>
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
            <span className="dist-value">{performanceBreakdown.easyCount}</span>
          </div>
          <div className="distribution-item">
            <span className="dist-label medium">Medium</span>
            <span className="dist-value">{performanceBreakdown.mediumCount}</span>
          </div>
          <div className="distribution-item">
            <span className="dist-label hard">Hard</span>
            <span className="dist-value">{performanceBreakdown.hardCount}</span>
          </div>
        </div>
      </div>

      {/* Confidence Distribution */}
      <div className="breakdown-section">
        <h3>Confidence Distribution</h3>
        <div className="distribution-grid">
          <div className="distribution-item">
            <span className="dist-label high">High</span>
            <span className="dist-value">{performanceBreakdown.highConfidenceCount}</span>
          </div>
          <div className="distribution-item">
            <span className="dist-label low">Low</span>
            <span className="dist-value">{performanceBreakdown.lowConfidenceCount}</span>
          </div>
        </div>
      </div>

      {/* Time Analysis */}
      {timeAnalysis.fastestItem && timeAnalysis.slowestItem && (
        <div className="breakdown-section">
          <h3>Time Analysis</h3>
          <div className="time-analysis">
            <div className="time-stat">
              <span className="time-label">Fastest Response:</span>
              <span className="time-value">{timeAnalysis.fastestItem.interaction.timeSpent}s</span>
            </div>
            <div className="time-stat">
              <span className="time-label">Slowest Response:</span>
              <span className="time-value">{timeAnalysis.slowestItem.interaction.timeSpent}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Subject Performance */}
      {Object.keys(subjectBreakdown).length > 0 && (
        <div className="breakdown-section">
          <h3>Subject Performance</h3>
          <div className="subject-performance">
            {Object.entries(subjectBreakdown).map(([subject, stats]) => (
              <div key={subject} className="subject-stat">
                <div className="subject-info">
                  <span className="subject-name">{subject}</span>
                  <span className="subject-details">{stats.total} items, {stats.averageTime}s avg</span>
                </div>
                <div className="subject-accuracy">
                  <span className="accuracy-value">{stats.accuracy}%</span>
                  <div
                    className="accuracy-bar"
                    style={{
                      width: `${stats.accuracy}%`,
                      backgroundColor: stats.accuracy >= 70 ? '#4caf50' : stats.accuracy >= 50 ? '#ff9800' : '#f44336'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
});

export default SessionStatsBreakdown;