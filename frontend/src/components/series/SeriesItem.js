import React from 'react';
import SessionCard from './SessionCard';

const SeriesItem = React.memo(({
  seriesData,
  onSessionClick,
  onNewSession,
  onEditSession,
  showDivider = false
}) => {
  const { sessions, _id: seriesId, title, status, completedCount, activeSession } = seriesData;

  const handleNewSession = () => {
    onNewSession(seriesId, seriesData);
  };

  return (
    <React.Fragment>
      {showDivider && <div className="series-divider"></div>}

      <div className="series-item">
        <div className="series-header">
          <h2 className="series-title">{title}</h2>
          <div className="series-progress">({completedCount}/{sessions.length})</div>
        </div>

        <div className="sessions-row">
          {sessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              seriesId={seriesId}
              seriesData={seriesData}
              onClick={onSessionClick}
              onEdit={onEditSession}
            />
          ))}

          {status === 'active' && !activeSession && (
            <button
              className="session-btn new"
              onClick={handleNewSession}
            >
              +
            </button>
          )}
        </div>
      </div>
    </React.Fragment>
  );
});

export default SeriesItem;