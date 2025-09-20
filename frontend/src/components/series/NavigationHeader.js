/**
 * Navigation Header Component
 *
 * Reusable header component for navigation between study modes.
 * Includes intelligent prefetching on hover for instant navigation.
 *
 * Features:
 * - Three-way toggle (Flashcards, MCQ, Tables)
 * - Dashboard navigation button
 * - Create new series button
 * - Prefetching on hover for instant page loads
 * - Backward compatibility for legacy implementations
 *
 * Performance optimizations:
 * - React.memo for preventing unnecessary re-renders
 * - useCallback to memoize functions
 * - Prefetch data on hover before navigation
 */

import React, { useCallback } from 'react';
import { prefetchRoute } from '../../utils/prefetch';

/**
 * Navigation Header
 *
 * @param {Object} props
 * @param {string} props.currentMode - Active mode ('flashcards' | 'mcq' | 'tables')
 * @param {Function} props.onNavigateDashboard - Handler for dashboard navigation
 * @param {Function} props.onToggleMode - Handler for mode switching
 * @param {Function} props.onCreateClick - Handler for create button
 * @param {Array} props.supportedModes - Available modes to display
 * @returns {JSX.Element} Memoized navigation header
 */
const NavigationHeader = React.memo(({
  currentMode = 'flashcards',
  onNavigateDashboard,
  onToggleMode,
  onCreateClick,
  supportedModes = ['flashcards', 'mcq'] // Backward compatibility
}) => {
  // Stable no-op function for disabled buttons
  const noOp = useCallback(() => {}, []);

  // Configuration for mode display and routing
  const modeDisplayNames = {
    flashcards: 'Flashcards',
    mcq: 'MCQ',
    tables: 'Tables'
  };

  const modeRoutes = {
    flashcards: '/browse-series',
    mcq: '/browse-mcq-series',
    tables: '/browse-table-series'
  };

  /**
   * Handle mode toggle with backward compatibility
   * Supports both legacy (no params) and new (mode param) signatures
   */
  const handleModeToggle = useCallback((mode) => {
    if (currentMode === mode) return noOp;

    if (typeof onToggleMode === 'function') {
      try {
        onToggleMode(mode); // New signature
      } catch (error) {
        onToggleMode(); // Legacy signature fallback
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
            onMouseEnter={() => {
              // Prefetch data when hovering over mode button
              if (currentMode !== mode) {
                prefetchRoute(modeRoutes[mode]);
              }
            }}
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