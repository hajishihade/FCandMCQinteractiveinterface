import React from 'react';

const WeakAreasWidget = React.memo(({
  weakAreas
}) => {
  return (
    <div className="widget weak-areas-widget">
      <div className="widget-header">
        <h3>Areas Needing Attention</h3>
      </div>
      <div className="widget-content">
        {weakAreas.map((area, index) => (
          <div key={index} className="weak-area-item">
            <div className="area-info">
              <span className="area-name">{area.name}</span>
              <span className="area-accuracy">{area.accuracy}%</span>
            </div>
            <div className="area-action">
              <span className="review-count">{area.cardsToReview} cards to review</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default WeakAreasWidget;