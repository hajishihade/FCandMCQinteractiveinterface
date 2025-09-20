import React from 'react';

const TableSessionSummary = React.memo(({
  sessionResults,
  summaryStats,
  onNavigateToSeries,
  onNavigateToDashboard
}) => {
  if (!sessionResults || !summaryStats) return null;

  const {
    totalTables,
    totalCells,
    totalCorrectCells,
    overallAccuracy,
    averageTimePerTable,
    perfectTables,
    strongPerformance,
    needsImprovement
  } = summaryStats;

  return (
    <div className="study-container">
      <div className="summary-header">
        <div className="summary-title">session complete!</div>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">score</span>
            <span className="stat-value">
              {summaryStats.totalCorrectCells}/{summaryStats.totalCells}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">accuracy</span>
            <span className="stat-value">{summaryStats.overallAccuracy}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">tables</span>
            <span className="stat-value">{summaryStats.totalTables}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">avg/table</span>
            <span className="stat-value">{Math.round(summaryStats.averageTimePerTable)}s</span>
          </div>
        </div>
      </div>

      <div className="results-list">
        {sessionResults.map((result, index) => (
          <div key={index} className="result-item">
            <div className="result-header">
              <span className="card-number">
                Table {index + 1}
              </span>
              <span className={`result-badge ${result.accuracy >= 80 ? 'right' : 'wrong'}`}>
                {result.accuracy}%
              </span>
            </div>
            <div className="result-details">
              <div className="result-content">
                <div className="table-name">{result.tableName}</div>
                <div className="performance-stats">
                  <span>{result.correctPlacements}/{result.totalCells} cells correct</span>
                  <span>{result.timeSpent}s</span>
                  <span>Confidence: {result.confidenceWhileSolving}</span>
                  <span>Difficulty: {result.difficulty}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {(strongPerformance.length > 0 || needsImprovement.length > 0) && (
        <div className="insights-section">
          {strongPerformance.length > 0 && (
            <div className="insights-group">
              <h4>💪 Strong Performance</h4>
              {strongPerformance.map((item, index) => (
                <div key={index} className="insight-item good">
                  {item}
                </div>
              ))}
            </div>
          )}

          {needsImprovement.length > 0 && (
            <div className="insights-group">
              <h4>📚 Areas for Improvement</h4>
              {needsImprovement.map((item, index) => (
                <div key={index} className="insight-item needs-work">
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="navigation-footer">
        <button
          onClick={onNavigateToSeries}
          className="home-btn"
        >
          ← Back to Series
        </button>
        <button
          onClick={onNavigateToDashboard}
          className="home-btn"
        >
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
});

TableSessionSummary.displayName = 'TableSessionSummary';

export default TableSessionSummary;