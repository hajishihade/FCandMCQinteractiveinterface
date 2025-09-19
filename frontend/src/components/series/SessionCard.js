import React from 'react';

const SessionCard = React.memo(({
  session,
  seriesId,
  seriesData,
  onClick,
  onEdit
}) => {
  // Calculate comprehensive session stats
  const cards = session.cards || [];
  const completedCards = cards.filter(card => card.interaction).length;
  const correctCards = cards.filter(card => card.interaction?.result === 'Right').length;
  const accuracy = completedCards > 0 ? Math.round((correctCards / completedCards) * 100) : 0;

  const totalTime = cards.reduce((sum, card) => sum + (card.interaction?.timeSpent || 0), 0);
  const avgTime = completedCards > 0 ? Math.round(totalTime / completedCards) : 0;

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
          <span>{completedCards}/{cards.length} cards</span>
          <span>{avgTime}s avg time</span>
          <span>{dateStr}</span>
        </div>
      )}

      {session.status === 'active' && (
        <>
          <div className="session-stats">
            <span>In Progress</span>
            <span>{completedCards}/{cards.length} done</span>
            {completedCards > 0 && <span>{accuracy}% so far</span>}
            {avgTime > 0 && <span>{avgTime}s avg</span>}
          </div>
          <button
            className="edit-session-btn"
            onClick={handleEdit}
            title="Edit session - Add/Remove cards"
          >
            ⚙
          </button>
        </>
      )}
    </button>
  );
});

export default SessionCard;