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

const SessionStatsModal = ({ isOpen, onClose, sessionData, seriesTitle, isFlashcard = true }) => {
  // Data fetching hook - gets actual content for cards/questions
  const {
    itemsWithContent,
    loading,
    error
  } = useSessionStatsData(sessionData, isFlashcard);

  // Analytics processing hook - comprehensive stats calculation
  const analytics = useSessionAnalytics(sessionData, itemsWithContent, isFlashcard);


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
            isFlashcard={isFlashcard}
          />

          {/* Individual Items Section */}
          <SessionItemsList
            items={itemsWithContent}
            isFlashcard={isFlashcard}
            loading={loading}
          />

          {/* Performance Breakdown */}
          <SessionStatsBreakdown
            analytics={analytics}
            isFlashcard={isFlashcard}
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