import React from 'react';

// Enhanced Stats Hooks
import { useSessionStatsData } from '../hooks/useSessionStatsData';
import { useSessionAnalytics } from '../hooks/useSessionAnalytics';

// Stats Components
import {
  SessionOverviewWidget,
  SessionItemsList,
  SessionStatsBreakdown
} from './stats';

// Styles (reuse existing + enhanced)
import './SessionStatsModal.css';
import './EnhancedSessionStats.css';

const SessionStatsModal = ({
  isOpen,
  onClose,
  sessionData,
  seriesTitle,
  isFlashcard = true, // Backward compatibility
  studyType = null     // New parameter: 'flashcard' | 'mcq' | 'table'
}) => {
  // Determine study type with backward compatibility
  const actualStudyType = studyType || (isFlashcard ? 'flashcard' : 'mcq');

  // Data fetching hook - gets actual content for cards/questions/tables
  const {
    itemsWithContent,
    loading,
    error
  } = useSessionStatsData(sessionData, actualStudyType);

  // Analytics processing hook - comprehensive stats calculation
  const analytics = useSessionAnalytics(sessionData, itemsWithContent, actualStudyType);


  if (!isOpen || !sessionData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="stats-modal-content enhanced-modal" onClick={e => e.stopPropagation()}>
        <div className="stats-modal-header">
          <div>
            <h2>Session #{sessionData.sessionId} Statistics</h2>
            <p className="series-subtitle">{seriesTitle}</p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="stats-modal-body">
          {error && (
            <div className="error-message">
              <p>Error loading session details: {error}</p>
              <p>Showing basic statistics only.</p>
            </div>
          )}

          {/* Overview Section */}
          <SessionOverviewWidget
            analytics={analytics}
            sessionData={sessionData}
            studyType={actualStudyType}
            isFlashcard={actualStudyType === 'flashcard'} // Backward compatibility
          />

          {/* Individual Items Section - Enhanced for table support */}
          {actualStudyType === 'table' ? (
            <div className="table-session-items">
              <h3>Table Quiz Results</h3>
              {itemsWithContent.map((table, index) => (
                <div key={table.tableId || index} className="table-item">
                  <h4>{table.name}</h4>
                  <div className="table-stats">
                    <span>Accuracy: {table.accuracy || 0}%</span>
                    <span>Cells: {table.correctPlacements || 0}/{table.totalCells || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <SessionItemsList
              items={itemsWithContent}
              isFlashcard={actualStudyType === 'flashcard'}
              loading={loading}
            />
          )}

          {/* Performance Breakdown */}
          <SessionStatsBreakdown
            analytics={analytics}
            studyType={actualStudyType}
            isFlashcard={actualStudyType === 'flashcard'} // Backward compatibility
          />

          {/* Session Details */}
          <div className="session-details">
            <div className="detail-item">
              <span className="detail-label">Started:</span>
              <span className="detail-value">
                {sessionData.startedAt ? new Date(sessionData.startedAt).toLocaleString() : 'Not started'}
              </span>
            </div>
            {sessionData.completedAt && (
              <div className="detail-item">
                <span className="detail-label">Completed:</span>
                <span className="detail-value">
                  {new Date(sessionData.completedAt).toLocaleString()}
                </span>
              </div>
            )}
            {sessionData.generatedFrom && (
              <div className="detail-item">
                <span className="detail-label">Generated from:</span>
                <span className="detail-value">Session #{sessionData.generatedFrom}</span>
              </div>
            )}
          </div>
        </div>

        <div className="stats-modal-footer">
          <button className="close-modal-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsModal;