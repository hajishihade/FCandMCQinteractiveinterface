import React, { useCallback } from 'react';

const NavigationHeader = React.memo(({
  currentMode = 'flashcards', // 'flashcards' | 'mcq'
  onNavigateDashboard,
  onToggleMode,
  onCreateClick
}) => {
  // No-op function to avoid creating new functions on each render (same as original)
  const noOp = useCallback(() => {}, []);
  return (
    <div className="navigation-section">
      <button
        className="home-btn"
        onClick={onNavigateDashboard}
      >
        ← Dashboard
      </button>

      <div className="mode-toggle">
        <button
          className={`toggle-btn ${currentMode === 'flashcards' ? 'active' : ''}`}
          onClick={currentMode === 'flashcards' ? noOp : onToggleMode}
        >
          Flashcards
        </button>
        <button
          className={`toggle-btn ${currentMode === 'mcq' ? 'active' : ''}`}
          onClick={currentMode === 'mcq' ? noOp : onToggleMode}
        >
          MCQ
        </button>
      </div>

      <button onClick={onCreateClick} className="create-btn">
        + Create
      </button>
    </div>
  );
});

export default NavigationHeader;