import React, { useCallback } from 'react';

const NavigationHeader = React.memo(({
  currentMode = 'flashcards', // 'flashcards' | 'mcq' | 'tables'
  onNavigateDashboard,
  onToggleMode,
  onCreateClick,
  supportedModes = ['flashcards', 'mcq'] // Default for backward compatibility
}) => {
  // No-op function to avoid creating new functions on each render
  const noOp = useCallback(() => {}, []);

  // Mode display names
  const modeDisplayNames = {
    flashcards: 'Flashcards',
    mcq: 'MCQ',
    tables: 'Tables'
  };

  // Handle mode toggle with backward compatibility
  const handleModeToggle = useCallback((mode) => {
    if (currentMode === mode) return noOp;

    // Support both old and new onToggleMode signatures
    if (typeof onToggleMode === 'function') {
      // Try new signature (mode as parameter) first
      try {
        onToggleMode(mode);
      } catch (error) {
        // Fallback to old signature (no parameters)
        onToggleMode();
      }
    }
  }, [currentMode, onToggleMode, noOp]);

  return (
    <div className="navigation-section">
      <button
        className="home-btn"
        onClick={onNavigateDashboard}
      >
        ← Dashboard
      </button>

      <div className="mode-toggle">
        {supportedModes.map(mode => (
          <button
            key={mode}
            className={`toggle-btn ${currentMode === mode ? 'active' : ''}`}
            onClick={currentMode === mode ? noOp : () => handleModeToggle(mode)}
          >
            {modeDisplayNames[mode]}
          </button>
        ))}
      </div>

      <button onClick={onCreateClick} className="create-btn">
        + Create
      </button>
    </div>
  );
});

export default NavigationHeader;