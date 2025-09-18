import React, { useState, useEffect, useCallback } from 'react';
import './MCQSessionRecipeModal.css';

const MCQSessionRecipeModal = ({ isOpen, onClose, onCreateSession, seriesData }) => {
  const [filters, setFilters] = useState({
    isCorrect: [], // 'correct' or 'incorrect'
    difficulty: [],
    confidenceWhileSolving: [],
    timeSpent: 'any'
  });

  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const getMatchingQuestions = useCallback(() => {
    if (!seriesData?.sessions) return [];

    const allQuestions = [];
    seriesData.sessions.forEach(session => {
      if (session.questions && session.questions.length > 0) {
        session.questions.forEach(question => {
          // Only include questions that have interactions
          if (question.interaction && question.interaction.selectedAnswer) {
            allQuestions.push({
              questionId: question.questionId,
              isCorrect: question.interaction.isCorrect,
              difficulty: question.interaction.difficulty,
              confidenceWhileSolving: question.interaction.confidenceWhileSolving,
              timeSpent: question.interaction.timeSpent,
              sessionId: session.sessionId
            });
          }
        });
      }
    });

    // Get only the latest state of each question
    const latestQuestionStates = {};
    allQuestions.forEach(question => {
      const questionId = question.questionId;
      if (!latestQuestionStates[questionId] || question.sessionId > latestQuestionStates[questionId].sessionId) {
        latestQuestionStates[questionId] = question;
      }
    });

    const uniqueLatestQuestions = Object.values(latestQuestionStates);

    // Apply filters
    return uniqueLatestQuestions.filter(question => {
      if (filters.isCorrect.length > 0) {
        const correctnessFilter = (filters.isCorrect.includes('correct') && question.isCorrect) ||
                                  (filters.isCorrect.includes('incorrect') && !question.isCorrect);
        if (!correctnessFilter) return false;
      }
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(question.difficulty)) return false;
      if (filters.confidenceWhileSolving.length > 0 && !filters.confidenceWhileSolving.includes(question.confidenceWhileSolving)) return false;
      if (filters.timeSpent !== 'any') {
        if (filters.timeSpent === 'fast' && question.timeSpent >= 30) return false;
        if (filters.timeSpent === 'medium' && (question.timeSpent < 30 || question.timeSpent >= 90)) return false;
        if (filters.timeSpent === 'slow' && question.timeSpent < 90) return false;
      }
      return true;
    });
  }, [filters, seriesData]);

  useEffect(() => {
    if (seriesData && isOpen) {
      const matchingQuestions = getMatchingQuestions();
      setFilteredQuestions(matchingQuestions);

      // Initialize for edit mode
      if (seriesData.editingSessionId && seriesData.existingQuestions) {
        setSelectedQuestions([...seriesData.existingQuestions]);
      } else {
        setSelectedQuestions([]);
      }
    }
  }, [filters, seriesData, isOpen, getMatchingQuestions]);


  const handleCorrectnessFilterChange = (value) => {
    setFilters(prev => ({
      ...prev,
      isCorrect: prev.isCorrect.includes(value)
        ? prev.isCorrect.filter(v => v !== value)
        : [...prev.isCorrect, value]
    }));
  };

  const handleFilterChange = (category, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  const handleTimeFilterChange = (timeFilter) => {
    setFilters(prev => ({ ...prev, timeSpent: timeFilter }));
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedQuestions(filteredQuestions.map(q => q.questionId));
  };

  const clearAllSelected = () => {
    setSelectedQuestions([]);
  };

  const handleCreateSession = () => {
    setIsCreating(true); // Show loading state

    if (seriesData?.editingSessionId) {
      // Edit mode - pass the sessionId to update
      onCreateSession(selectedQuestions, seriesData.editingSessionId);
    } else {
      // Create mode - will auto-navigate to study session
      onCreateSession(selectedQuestions);
    }
    // Don't close modal here - let the parent handle navigation/closing
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{seriesData?.editingSessionId ? `Edit MCQ Session ${seriesData.editingSessionId}` : 'Create Custom MCQ Session'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="filters-panel">
            <div className="modal-description">
              Select filters to find questions based on your previous interactions.
            </div>

            {/* Correctness Filter */}
            <div className="filter-group">
              <h3>Answer Result</h3>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filters.isCorrect.includes('correct') ? 'selected' : ''}`}
                  onClick={() => handleCorrectnessFilterChange('correct')}
                >
                  Correct
                </button>
                <button
                  className={`filter-btn ${filters.isCorrect.includes('incorrect') ? 'selected' : ''}`}
                  onClick={() => handleCorrectnessFilterChange('incorrect')}
                >
                  Incorrect
                </button>
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="filter-group">
              <h3>Difficulty</h3>
              <div className="filter-buttons">
                {['Easy', 'Medium', 'Hard'].map(level => (
                  <button
                    key={level}
                    className={`filter-btn ${filters.difficulty.includes(level) ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('difficulty', level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Filter */}
            <div className="filter-group">
              <h3>Confidence While Solving</h3>
              <div className="filter-buttons">
                {['High', 'Low'].map(level => (
                  <button
                    key={level}
                    className={`filter-btn ${filters.confidenceWhileSolving.includes(level) ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('confidenceWhileSolving', level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Spent Filter */}
            <div className="filter-group">
              <h3>Time Spent</h3>
              <div className="filter-buttons">
                {['any', 'fast', 'medium', 'slow'].map(speed => (
                  <button
                    key={speed}
                    className={`filter-btn ${filters.timeSpent === speed ? 'selected' : ''}`}
                    onClick={() => handleTimeFilterChange(speed)}
                  >
                    {speed === 'any' ? 'Any' :
                     speed === 'fast' ? 'Fast (<30s)' :
                     speed === 'medium' ? 'Medium (30-90s)' : 'Slow (>90s)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="preview-section">
              <div className="preview-count">
                {filteredQuestions.length} matching question{filteredQuestions.length !== 1 ? 's' : ''}
              </div>
              <div className="selection-count">
                {selectedQuestions.length} selected
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <div className="preview-header">
              <h3 className="preview-title">Matching Questions</h3>
              <div className="selection-controls">
                <button
                  onClick={selectAllFiltered}
                  className="selection-btn"
                  disabled={filteredQuestions.length === 0}
                >
                  Select All
                </button>
                <button
                  onClick={clearAllSelected}
                  className="selection-btn"
                  disabled={selectedQuestions.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="card-preview-list">
              {filteredQuestions.length === 0 ? (
                <div className="no-matches">
                  No questions match your filters. Try adjusting your criteria.
                </div>
              ) : (
                filteredQuestions.map(question => (
                  <div
                    key={question.questionId}
                    className={`preview-card ${selectedQuestions.includes(question.questionId) ? 'selected' : ''}`}
                    onClick={() => toggleQuestionSelection(question.questionId)}
                  >
                    <div className="preview-card-header">
                      <div className="card-id-section">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.questionId)}
                          onChange={() => toggleQuestionSelection(question.questionId)}
                          onClick={(e) => e.stopPropagation()}
                          className="card-checkbox"
                        />
                        <span className="preview-card-id">Question #{question.questionId}</span>
                      </div>
                      <div className="preview-card-badges">
                        <span className={`badge ${question.isCorrect ? 'result-right' : 'result-wrong'}`}>
                          {question.isCorrect ? '✓' : '✗'}
                        </span>
                        <span className={`badge difficulty-${question.difficulty.toLowerCase()}`}>
                          {question.difficulty}
                        </span>
                        <span className={`badge confidence-${question.confidenceWhileSolving.toLowerCase()}`}>
                          {question.confidenceWhileSolving}
                        </span>
                        <span className="badge time">
                          {question.timeSpent}s
                        </span>
                      </div>
                    </div>
                    <div className="preview-card-content">
                      <div className="session-info">
                        Last answered in Session #{question.sessionId}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <div className="selection-count">
              {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
            </div>
          </div>
          <div className="footer-right">
            {seriesData?.editingSessionId && (
              <button
                className="delete-btn"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete MCQ Session ${seriesData.editingSessionId}? This action cannot be undone.`)) {
                    onCreateSession([], seriesData.editingSessionId, 'delete');
                  }
                }}
              >
                Delete Session
              </button>
            )}
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              className="create-btn"
              onClick={handleCreateSession}
              disabled={selectedQuestions.length === 0 || isCreating}
            >
              {isCreating
                ? (seriesData?.editingSessionId ? 'Updating...' : 'Creating...')
                : (seriesData?.editingSessionId ? `Update Session (${selectedQuestions.length} questions)` : `Create Session (${selectedQuestions.length} questions)`)
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCQSessionRecipeModal;