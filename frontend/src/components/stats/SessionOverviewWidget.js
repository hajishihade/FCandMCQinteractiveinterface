import React from 'react';

const SessionOverviewWidget = React.memo(({
  analytics,
  sessionData,
  isFlashcard
}) => {
  console.log('=== OVERVIEW WIDGET DEBUG ===');
  console.log('Analytics received:', analytics);

  // Access analytics properties directly (flattened structure)
  const overviewStats = {
    totalItems: analytics.totalItems || 0,
    accuracy: analytics.accuracy || 0,
    totalTime: analytics.totalTime || 0,
    averageTime: analytics.averageTime || 0
  };

  console.log('Processed overview stats:', overviewStats);
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
    const completed = overviewStats.correctItems + overviewStats.incorrectItems;
    return overviewStats.totalItems > 0 ? Math.round((completed / overviewStats.totalItems) * 100) : 0;
  };

  return (
    <>
      {/* Status Banner */}
      <div className="status-banner" style={{ backgroundColor: getStatusColor(sessionData.status) }}>
        <span className="status-label">{sessionData.status?.toUpperCase()}</span>
        <span className="progress-label">{getProgressPercentage()}% Complete</span>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-value">{overviewStats.totalItems || 0}</div>
          <div className="stat-label">Total {itemLabelPlural}</div>
        </div>

        <div className="stat-card success">
          <div className="stat-value">{overviewStats.accuracy || 0}%</div>
          <div className="stat-label">Accuracy</div>
        </div>

        <div className="stat-card info">
          <div className="stat-value">{formatTime(overviewStats.totalTime || 0)}</div>
          <div className="stat-label">Total Time</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-value">{overviewStats.averageTime || 0}s</div>
          <div className="stat-label">Avg Time per {itemLabel}</div>
        </div>
      </div>
    </>
  );
});

export default SessionOverviewWidget;