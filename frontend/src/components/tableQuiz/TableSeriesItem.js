import React from 'react';
import TableSessionCard from './TableSessionCard';

const TableSeriesItem = React.memo(({
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

      <div className="series-container">
        {/* Title section - completely separate and centered */}
        <div className="series-title-section">
          <h2 className="series-title-centered">
            {title} <span className="series-progress">({completedCount}/{sessions.length})</span>
          </h2>
        </div>

        {/* Boxes section - separate container starting from left edge */}
        <div className="series-boxes-section">
          <div className="sessions-row-left">
            {sessions.map((session) => (
              <TableSessionCard
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
      </div>
    </React.Fragment>
  );
});

export default TableSeriesItem;