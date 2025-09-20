import React from 'react';
import TableSolutionGuide from './TableSolutionGuide';

const TableResultsDisplay = React.memo(({
  tableStructure,
  results,
  correctAnswers,
  wrongPlacements,
  originalTable // Add this to show solution
}) => {
  if (!results) return null;

  const { correctPlacements, totalCells, accuracy } = results;

  return (
    <div className="table-results-display">
      <div className="results-header">
        <h3>Results</h3>
        <div className="score-summary">
          <span className="score">
            {correctPlacements}/{totalCells} correct
          </span>
          <span className="accuracy">
            ({accuracy}%)
          </span>
        </div>
      </div>

      <div className="results-content">
        {wrongPlacements.length > 0 && (
          <div className="wrong-placements">
            <h4>Incorrect Placements:</h4>
            <div className="wrong-list">
              {wrongPlacements.map((placement, index) => (
                <div key={index} className="wrong-item">
                  <div className="placement-info">
                    <span className="placed-text">
                      "{placement.cellText}"
                    </span>
                    <span className="placement-location">
                      placed at row {placement.placedAtRow + 1}, column {placement.placedAtColumn + 1}
                    </span>
                  </div>
                  <div className="correction-info">
                    <span className="should-be">Should be:</span>
                    <span className="correct-text">
                      "{placement.correctCellText}"
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {correctPlacements === totalCells && (
          <div className="perfect-score">
            <div className="celebration">🎉</div>
            <div className="perfect-message">
              Perfect! All cells placed correctly!
            </div>
          </div>
        )}

        {/* Show solution guide for low scores */}
        {accuracy < 50 && originalTable && (
          <div className="solution-section">
            <h4>📚 Study the Correct Solution:</h4>
            <TableSolutionGuide tableData={originalTable} show={true} />
          </div>
        )}
      </div>

      <div className="results-stats">
        <div className="stat-item">
          <span className="stat-label">Accuracy:</span>
          <span className={`stat-value ${accuracy >= 80 ? 'good' : accuracy >= 60 ? 'okay' : 'needs-work'}`}>
            {accuracy}%
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Correct:</span>
          <span className="stat-value">{correctPlacements}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total:</span>
          <span className="stat-value">{totalCells}</span>
        </div>
      </div>
    </div>
  );
});

TableResultsDisplay.displayName = 'TableResultsDisplay';

export default TableResultsDisplay;