import React from 'react';

const MCQSessionCard = React.memo(({
  session,
  seriesId,
  seriesData,
  onClick,
  onEdit
}) => {
  // Calculate comprehensive session stats (MCQ adaptation)
  const questions = session.questions || [];
  const answeredQuestions = questions.filter(question => question.interaction).length;
  const correctQuestions = questions.filter(question => question.interaction?.isCorrect).length;
  const accuracy = answeredQuestions > 0 ? Math.round((correctQuestions / answeredQuestions) * 100) : 0;

  const totalTime = questions.reduce((sum, question) => sum + (question.interaction?.timeSpent || 0), 0);
  const avgTime = answeredQuestions > 0 ? Math.round(totalTime / answeredQuestions) : 0;

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
          <span>{answeredQuestions}/{questions.length} questions</span>
          <span>{avgTime}s avg time</span>
          <span>{dateStr}</span>
        </div>
      )}

      {session.status === 'active' && (
        <>
          <div className="session-stats">
            <span>In Progress</span>
            <span>{answeredQuestions}/{questions.length} done</span>
            {answeredQuestions > 0 && <span>{accuracy}% so far</span>}
            {avgTime > 0 && <span>{avgTime}s avg</span>}
          </div>
          <button
            className="edit-session-btn"
            onClick={handleEdit}
            title="Edit session - Add/Remove questions"
          >
            ⚙
          </button>
        </>
      )}
    </button>
  );
});

export default MCQSessionCard;