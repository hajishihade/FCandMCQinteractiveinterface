import React, { useState, useEffect, useCallback } from 'react';
import './SessionRecipeModal.css';

const SessionRecipeModal = ({ isOpen, onClose, onCreateSession, seriesData }) => {
  const [filters, setFilters] = useState({
    result: [],
    difficulty: [],
    confidenceWhileSolving: [],
    timeSpent: 'any'
  });

  const [selectedCards, setSelectedCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);

  const getMatchingCards = useCallback(() => {
    if (!seriesData?.sessions) return [];

    const allCards = [];
    seriesData.sessions.forEach(session => {
      if (session.cards && session.cards.length > 0) {
        session.cards.forEach(card => {
          // Only include cards that have interactions (not null)
          if (card.interaction && card.interaction.result) {
            allCards.push({
              cardId: card.cardId,
              result: card.interaction.result,
              difficulty: card.interaction.difficulty,
              confidenceWhileSolving: card.interaction.confidenceWhileSolving,
              timeSpent: card.interaction.timeSpent,
              sessionId: session.sessionId
            });
          }
        });
      }
    });

    const latestCardStates = {};
    allCards.forEach(card => {
      const cardId = card.cardId;
      if (!latestCardStates[cardId] || card.sessionId > latestCardStates[cardId].sessionId) {
        latestCardStates[cardId] = card;
      }
    });

    const uniqueLatestCards = Object.values(latestCardStates);

    return uniqueLatestCards.filter(card => {
      if (filters.result.length > 0 && !filters.result.includes(card.result)) return false;
      if (filters.difficulty.length > 0 && !filters.difficulty.includes(card.difficulty)) return false;
      if (filters.confidenceWhileSolving.length > 0 && !filters.confidenceWhileSolving.includes(card.confidenceWhileSolving)) return false;
      if (filters.timeSpent !== 'any') {
        if (filters.timeSpent === 'fast' && card.timeSpent >= 30) return false;
        if (filters.timeSpent === 'medium' && (card.timeSpent < 30 || card.timeSpent >= 90)) return false;
        if (filters.timeSpent === 'slow' && card.timeSpent < 90) return false;
      }
      return true;
    });
  }, [filters, seriesData]);

  useEffect(() => {
    if (seriesData && isOpen) {
      const matchingCards = getMatchingCards();
      setFilteredCards(matchingCards);
    }
  }, [filters, seriesData, isOpen, getMatchingCards]);

  // Separate useEffect for edit mode initialization
  useEffect(() => {
    if (seriesData && isOpen) {
      if (seriesData.editingSessionId && seriesData.existingCards) {
        setSelectedCards([...seriesData.existingCards]);
      } else {
        // Clear selection for new sessions
        setSelectedCards([]);
      }
    }
  }, [seriesData, isOpen]);

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

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev =>
      prev.includes(cardId) ? prev.filter(id => id !== cardId) : [...prev, cardId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedCards(filteredCards.map(card => card.cardId));
  };

  const deselectAll = () => {
    setSelectedCards([]);
  };

  const isCardSelected = (cardId) => selectedCards.includes(cardId);

  const isFilterSelected = (category, value) => filters[category].includes(value);

  const handleCreateSession = () => {
    if (selectedCards.length === 0) {
      alert('Please select at least one card to create a session.');
      return;
    }

    if (seriesData?.editingSessionId) {
      // Edit mode - pass the sessionId to update
      onCreateSession(selectedCards, seriesData.editingSessionId);
    } else {
      // Create mode - create new session
      onCreateSession(selectedCards);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{seriesData?.editingSessionId ? `Edit Session ${seriesData.editingSessionId}` : 'Create Custom Session'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="filters-panel">
            <p className="modal-description">Select characteristics of cards you want to study:</p>

            <div className="filter-group">
              <h3>Result:</h3>
              <div className="filter-buttons">
                {['Right', 'Wrong'].map(value => (
                  <button
                    key={value}
                    className={`filter-btn ${isFilterSelected('result', value) ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('result', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Difficulty:</h3>
              <div className="filter-buttons">
                {['Easy', 'Medium', 'Hard'].map(value => (
                  <button
                    key={value}
                    className={`filter-btn ${isFilterSelected('difficulty', value) ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('difficulty', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Confidence While Solving:</h3>
              <div className="filter-buttons">
                {['High', 'Low'].map(value => (
                  <button
                    key={value}
                    className={`filter-btn ${isFilterSelected('confidenceWhileSolving', value) ? 'selected' : ''}`}
                    onClick={() => handleFilterChange('confidenceWhileSolving', value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h3>Time Spent:</h3>
              <div className="filter-buttons">
                {[
                  { value: 'any', label: 'Any Time' },
                  { value: 'fast', label: 'Fast (<30s)' },
                  { value: 'medium', label: 'Medium (30-90s)' },
                  { value: 'slow', label: 'Slow (>90s)' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`filter-btn ${filters.timeSpent === option.value ? 'selected' : ''}`}
                    onClick={() => handleTimeFilterChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="preview-section">
              <div className="preview-count">{filteredCards.length} cards match your filters</div>
              <div className="selection-count">{selectedCards.length} cards selected for session</div>
            </div>
          </div>

          <div className="preview-panel">
            <div className="preview-header">
              <h3 className="preview-title">Select Cards for Session:</h3>
              <div className="selection-controls">
                <button className="selection-btn" onClick={selectAllFiltered} disabled={filteredCards.length === 0}>
                  Select All Filtered
                </button>
                <button className="selection-btn" onClick={deselectAll} disabled={selectedCards.length === 0}>
                  Deselect All
                </button>
              </div>
            </div>
            <div className="card-preview-list">
              {filteredCards.map(card => (
                <div
                  key={card.cardId}
                  className={`preview-card ${isCardSelected(card.cardId) ? 'selected' : ''}`}
                  onClick={() => toggleCardSelection(card.cardId)}
                >
                  <div className="preview-card-header">
                    <div className="card-id-section">
                      <input
                        type="checkbox"
                        checked={isCardSelected(card.cardId)}
                        onChange={() => toggleCardSelection(card.cardId)}
                        className="card-checkbox"
                      />
                      <span className="preview-card-id">ID: {card.cardId}</span>
                    </div>
                    <div className="preview-card-badges">
                      <span className={`badge result-${card.result.toLowerCase()}`}>{card.result}</span>
                      <span className={`badge difficulty-${card.difficulty.toLowerCase()}`}>{card.difficulty}</span>
                      <span className={`badge confidence-${card.confidenceWhileSolving.toLowerCase()}`}>{card.confidenceWhileSolving}</span>
                      <span className="badge time">{card.timeSpent}s</span>
                    </div>
                  </div>
                  <div className="preview-card-content">
                    <div className="card-text">Card {card.cardId}</div>
                    <div className="session-info">Latest state from Session {card.sessionId}</div>
                  </div>
                </div>
              ))}

              {filteredCards.length === 0 && (
                <div className="no-matches">No cards match your current filters. Try adjusting your criteria above.</div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            {seriesData?.editingSessionId && (
              <button
                className="delete-btn"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete Session ${seriesData.editingSessionId}? This action cannot be undone.`)) {
                    onCreateSession([], seriesData.editingSessionId, 'delete');
                    onClose();
                  }
                }}
              >
                Delete Session
              </button>
            )}
          </div>
          <div className="footer-right">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            <button className="create-btn" onClick={handleCreateSession} disabled={selectedCards.length === 0}>
              {seriesData?.editingSessionId ? `Update Session (${selectedCards.length} cards)` : `Create Session (${selectedCards.length} cards)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRecipeModal;