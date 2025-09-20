import React from 'react';

const SubjectAnalyticsWidget = React.memo(({
  subjectStats
}) => {
  return (
    <div className="widget subject-analytics-widget">
      <div className="widget-header">
        <h3>Subject Performance</h3>
      </div>
      <div className="widget-content">
        {subjectStats.map((subject, index) => (
          <div key={index} className="subject-item">
            <div className="subject-info">
              <span className="subject-name">{subject.name}</span>
              <span className="subject-cards">{subject.totalCards} cards</span>
            </div>
            <div className="subject-accuracy">
              <span className="accuracy-value">{subject.accuracy}%</span>
              <div
                className="accuracy-bar"
                style={{
                  width: `${subject.accuracy}%`,
                  backgroundColor: subject.accuracy >= 70 ? '#4caf50' : subject.accuracy >= 50 ? '#ff9800' : '#f44336'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SubjectAnalyticsWidget;