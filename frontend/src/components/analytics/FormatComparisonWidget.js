import React from 'react';

const FormatComparisonWidget = React.memo(({
  formatStats
}) => {
  return (
    <div className="widget format-widget">
      <div className="widget-header">
        <h3>Flashcards vs MCQ Performance</h3>
      </div>
      <div className="widget-content">
        <div className="format-comparison">
          <div className="format-card">
            <div className="format-name">Flashcards</div>
            <div className="format-stats">
              <div className="format-accuracy">{formatStats.flashcards.accuracy}%</div>
            </div>
          </div>
          <div className="vs-divider">vs</div>
          <div className="format-card">
            <div className="format-name">MCQ</div>
            <div className="format-stats">
              <div className="format-accuracy">{formatStats.mcq.accuracy}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FormatComparisonWidget;