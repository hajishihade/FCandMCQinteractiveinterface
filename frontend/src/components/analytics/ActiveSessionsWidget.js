import React from 'react';

const ActiveSessionsWidget = React.memo(({
  activeSessions,
  onSessionResume
}) => {
  return (
    <div className="widget active-sessions-widget">
      <div className="widget-header">
        <h3>Active Sessions</h3>
      </div>
      <div className="widget-content">
        {activeSessions.length > 0 ? (
          <div className="sessions-table">
            <div className="table-header">
              <span>Type</span>
              <span>Series</span>
              <span>Progress</span>
              <span>Started</span>
            </div>
            {activeSessions.map((session, index) => (
              <div
                key={index}
                className="table-row clickable-row"
                onClick={() => onSessionResume(session)}
              >
                <span className={`session-type ${session.type.toLowerCase()}`}>
                  {session.type}
                </span>
                <span className="session-series">{session.seriesTitle}</span>
                <span className="session-progress">
                  {session.completedCards}/{session.totalCards}
                </span>
                <span className="session-date">
                  {new Date(session.startedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-sessions">No active sessions</div>
        )}
      </div>
    </div>
  );
});

export default ActiveSessionsWidget;