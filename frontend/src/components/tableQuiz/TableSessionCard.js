import React from 'react';

const TableSessionCard = React.memo(({
  session,
  seriesId,
  seriesData,
  onClick,
  onEdit
}) => {
  // Calculate comprehensive session stats (Table adaptation)
  const tables = session.tables || [];
  const completedTables = tables.filter(table => table.interaction).length;
  const totalCells = tables.reduce((sum, table) => sum + (table.interaction?.results.totalCells || 0), 0);
  const correctCells = tables.reduce((sum, table) => sum + (table.interaction?.results.correctPlacements || 0), 0);
  const accuracy = totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 0;

  const totalTime = tables.reduce((sum, table) => sum + (table.interaction?.timeSpent || 0), 0);
  const avgTime = completedTables > 0 ? Math.round(totalTime / completedTables) : 0;

  const sessionDate = session.completedAt || session.startedAt;
  const dateStr = sessionDate ? new Date(sessionDate).toLocaleDateString() : '';

  const handleClick = () => {
    onClick(seriesId, session.sessionId, session.status, session, seriesData);
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent session click
    onEdit(seriesId, session, seriesData, e);
  };

  return (
    <button
      className={`session-btn ${session.status}`}
      onClick={handleClick}
      title={
        session.status === 'completed'
          ? 'Click to view stats'
          : session.status === 'active'
          ? 'Click to continue'
          : ''
      }
    >
      <div className="session-number">#{session.sessionId}</div>

      {session.status === 'completed' && (
        <div className="session-stats">
          <span>{accuracy}% accuracy</span>
          <span>{completedTables}/{tables.length} tables</span>
          <span>{avgTime}s avg time</span>
          <span>{dateStr}</span>
        </div>
      )}

      {session.status === 'active' && (
        <>
          <div className="session-stats">
            <span>In Progress</span>
            <span>{completedTables}/{tables.length} done</span>
            {completedTables > 0 && <span>{accuracy}% so far</span>}
            {avgTime > 0 && <span>{avgTime}s avg</span>}
          </div>
          <div
            className="edit-session-btn"
            onClick={handleEdit}
            title="Edit session - Add/Remove tables"
          >
            ⚙
          </div>
        </>
      )}
    </button>
  );
});

export default TableSessionCard;