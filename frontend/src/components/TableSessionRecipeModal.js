import React, { useState, useCallback, useEffect } from 'react';
import { tableQuizAPI } from '../services/tableQuizApi';
import './MCQSessionRecipeModal.css';

const TableSessionRecipeModal = ({ isOpen, onClose, onCreateSession, seriesData }) => {
  const [filters, setFilters] = useState({
    subjects: [],
    accuracy: [], // 'high', 'medium', 'low'
    difficulty: [],
    confidence: [],
    timeSpent: 'any'
  });

  const [selectedTables, setSelectedTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [availableTables, setAvailableTables] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTables();
      initializeExistingSelection();
    }
  }, [isOpen, seriesData]);

  const fetchAvailableTables = async () => {
    try {
      setLoading(true);
      const response = await tableQuizAPI.getAll({ limit: 100 });
      setAvailableTables(response.data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      setAvailableTables([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeExistingSelection = () => {
    if (seriesData?.existingTables) {
      setSelectedTables(seriesData.existingTables);
    } else {
      setSelectedTables([]);
    }
  };

  const getMatchingTables = useCallback(() => {
    if (!seriesData?.sessions || availableTables.length === 0) return availableTables;

    // For simplicity, return all available tables for now
    // In production, this would filter based on previous session performance
    let tables = [...availableTables];

    // Apply subject filter
    if (filters.subjects.length > 0) {
      tables = tables.filter(table => filters.subjects.includes(table.subject));
    }

    return tables;
  }, [availableTables, filters, seriesData]);

  useEffect(() => {
    setFilteredTables(getMatchingTables());
  }, [getMatchingTables]);

  const handleSubjectFilterChange = (subject) => {
    setFilters(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleAccuracyFilterChange = (accuracy) => {
    setFilters(prev => ({
      ...prev,
      accuracy: prev.accuracy.includes(accuracy)
        ? prev.accuracy.filter(a => a !== accuracy)
        : [...prev.accuracy, accuracy]
    }));
  };

  const handleDifficultyFilterChange = (difficulty) => {
    setFilters(prev => ({
      ...prev,
      difficulty: prev.difficulty.includes(difficulty)
        ? prev.difficulty.filter(d => d !== difficulty)
        : [...prev.difficulty, difficulty]
    }));
  };

  const handleConfidenceFilterChange = (confidence) => {
    setFilters(prev => ({
      ...prev,
      confidence: prev.confidence.includes(confidence)
        ? prev.confidence.filter(c => c !== confidence)
        : [...prev.confidence, confidence]
    }));
  };

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev =>
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const selectAllFiltered = () => {
    setSelectedTables(filteredTables.map(t => t.tableId));
  };

  const clearAllSelected = () => {
    setSelectedTables([]);
  };

  const handleCreateSession = () => {
    setIsCreating(true);

    if (seriesData?.editingSessionId) {
      onCreateSession(selectedTables, seriesData.editingSessionId);
    } else {
      onCreateSession(selectedTables);
    }
  };

  const getUniqueSubjects = () => {
    return [...new Set(availableTables.map(table => table.subject).filter(Boolean))];
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{seriesData?.editingSessionId ? `Edit Table Session ${seriesData.editingSessionId}` : 'Create Custom Table Quiz Session'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="filters-panel">
            <div className="modal-description">
              Select filters to find table quizzes based on your preferences.
            </div>

            {/* Subject Filter */}
            <div className="filter-group">
              <h3>Subject</h3>
              <div className="filter-buttons">
                {getUniqueSubjects().map(subject => (
                  <button
                    key={subject}
                    className={`filter-btn ${filters.subjects.includes(subject) ? 'selected' : ''}`}
                    onClick={() => handleSubjectFilterChange(subject)}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Accuracy Filter */}
            <div className="filter-group">
              <h3>Target Practice</h3>
              <div className="filter-buttons">
                {['high', 'medium', 'low'].map(accuracy => (
                  <button
                    key={accuracy}
                    className={`filter-btn ${filters.accuracy.includes(accuracy) ? 'selected' : ''}`}
                    onClick={() => handleAccuracyFilterChange(accuracy)}
                  >
                    {accuracy === 'high' ? 'High Accuracy (>80%)' :
                     accuracy === 'medium' ? 'Medium Accuracy (50-80%)' : 'Low Accuracy (<50%)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="filter-group">
              <h3>Difficulty</h3>
              <div className="filter-buttons">
                {['Easy', 'Medium', 'Hard'].map(difficulty => (
                  <button
                    key={difficulty}
                    className={`filter-btn ${filters.difficulty.includes(difficulty) ? 'selected' : ''}`}
                    onClick={() => handleDifficultyFilterChange(difficulty)}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>

            {/* Confidence Filter */}
            <div className="filter-group">
              <h3>Confidence</h3>
              <div className="filter-buttons">
                {['High', 'Low'].map(confidence => (
                  <button
                    key={confidence}
                    className={`filter-btn ${filters.confidence.includes(confidence) ? 'selected' : ''}`}
                    onClick={() => handleConfidenceFilterChange(confidence)}
                  >
                    {confidence}
                  </button>
                ))}
              </div>
            </div>

            <div className="preview-section">
              <div className="preview-count">
                {filteredTables.length} matching table quiz{filteredTables.length !== 1 ? 'es' : ''}
              </div>
              <div className="selection-count">
                {selectedTables.length} selected
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <div className="preview-header">
              <h3 className="preview-title">Available Table Quizzes</h3>
              <div className="selection-controls">
                <button
                  onClick={selectAllFiltered}
                  className="selection-btn"
                  disabled={filteredTables.length === 0}
                >
                  Select All
                </button>
                <button
                  onClick={clearAllSelected}
                  className="selection-btn"
                  disabled={selectedTables.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="card-preview-list">
              {loading ? (
                <div className="loading-message">Loading table quizzes...</div>
              ) : filteredTables.length === 0 ? (
                <div className="no-tables-message">No table quizzes match your filters</div>
              ) : (
                filteredTables.map((table) => (
                  <div
                    key={table.tableId}
                    className={`card-preview-item ${selectedTables.includes(table.tableId) ? 'selected' : ''}`}
                    onClick={() => toggleTableSelection(table.tableId)}
                  >
                    <div className="card-preview-content">
                      <div className="card-preview-header">
                        <span className="card-number">#{table.tableId}</span>
                        <span className="card-subject">{table.subject}</span>
                      </div>
                      <div className="card-preview-title">
                        {table.name}
                      </div>
                      <div className="card-preview-details">
                        <span>{table.rows}×{table.columns} grid</span>
                        {table.chapter && <span>{table.chapter}</span>}
                        {table.section && <span>{table.section}</span>}
                      </div>
                    </div>
                    <div className="card-selection-indicator">
                      {selectedTables.includes(table.tableId) && '✓'}
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
              {selectedTables.length} table quiz{selectedTables.length !== 1 ? 'es' : ''} selected
            </div>
          </div>
          <div className="footer-right">
            {seriesData?.editingSessionId && (
              <button
                className="delete-btn"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete Table Session ${seriesData.editingSessionId}? This action cannot be undone.`)) {
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
              disabled={selectedTables.length === 0 || isCreating}
            >
              {isCreating
                ? (seriesData?.editingSessionId ? 'Updating...' : 'Creating...')
                : (seriesData?.editingSessionId ? `Update Session (${selectedTables.length} tables)` : `Create Session (${selectedTables.length} tables)`)
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableSessionRecipeModal;