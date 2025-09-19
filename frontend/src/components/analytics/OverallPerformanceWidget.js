import React from 'react';

const OverallPerformanceWidget = React.memo(({
  analytics
}) => {
  return (
    <div className="widget performance-widget">
      <div className="widget-header">
        <h3>Overall Performance</h3>
      </div>
      <div className="widget-content">
        <div className="overview-stats">
          <div className="stat-item">
            <div className="stat-value">{analytics.overallAccuracy}%</div>
            <div className="stat-label">Accuracy</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{analytics.studyTime}</div>
            <div className="stat-label">Study Time</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{analytics.totalSessions}</div>
            <div className="stat-label">Sessions</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{analytics.totalCards}</div>
            <div className="stat-label">Cards</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default OverallPerformanceWidget;