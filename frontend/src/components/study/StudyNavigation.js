import React from 'react';

const StudyNavigation = React.memo(({
  onNavigateToSeries,
  onNavigateToDashboard,
  studyType = 'flashcard'
}) => {
  const seriesPath = studyType === 'flashcard' ? '/browse-series' : '/browse-mcq-series';
  const seriesLabel = studyType === 'flashcard' ? '← Series' : '← MCQ Series';

  // Safe guard - prevent crashes if handlers are missing
  const handleNavigateToSeries = () => {
    if (typeof onNavigateToSeries === 'function') {
      onNavigateToSeries();
    } else {
      console.warn('StudyNavigation: onNavigateToSeries handler missing');
      // Fallback navigation
      window.location.href = seriesPath;
    }
  };

  const handleNavigateToDashboard = () => {
    if (typeof onNavigateToDashboard === 'function') {
      onNavigateToDashboard();
    } else {
      console.warn('StudyNavigation: onNavigateToDashboard handler missing');
      // Fallback navigation
      window.location.href = '/';
    }
  };

  return (
    <div className="session-info">
      <div className="navigation-buttons">
        <button onClick={handleNavigateToSeries} className="series-btn">
          {seriesLabel}
        </button>
        <button onClick={handleNavigateToDashboard} className="dashboard-btn">
          🏠 Dashboard
        </button>
      </div>
    </div>
  );
});

export default StudyNavigation;