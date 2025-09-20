import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Using real API for database integration
import { tableQuizAPI, tableSeriesAPI, tableSessionAPI } from '../services/tableQuizApi';

// Table Quiz Components
import {
  TableQuizDisplay,
  CellPalette,
  TableQuizControls,
  TableQuizHeader,
  TableResultsDisplay,
  TableSessionSummary
} from '../components/tableQuiz';

// Shared Components
import { StudyNavigation } from '../components/study';

// Table Quiz Hooks
import { useTableDragDrop } from '../hooks/useTableDragDrop';
import { useTableValidation } from '../hooks/useTableValidation';

import './TableQuizSession.css';
import './StudySession.css'; // For .study-container gradient background

const TableQuizSession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Session state pattern (following MCQ exactly)
  const [seriesId, setSeriesId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [tables, setTables] = useState([]);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

  // Table-specific state (replacing MCQ answer state)
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [confidence, setConfidence] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Table quiz hooks
  const { validateTablePlacement, calculateSessionStats } = useTableValidation();
  const currentTable = tables[currentTableIndex];
  const {
    dragState,
    tableState,
    initializeTable,
    handleDragStart,
    handleDragEnd,
    handleCellDrop,
    handleCellRemove,
    isTableComplete,
    getTotalContentCells
  } = useTableDragDrop(currentTable);

  // Initialization logic (following MCQ pattern exactly)
  useEffect(() => {
    const sessionInfo = location.state;

    if (!sessionInfo || !sessionInfo.seriesId) {
      navigate('/browse-table-series');
      return;
    }

    if (sessionInfo.mode === 'continue') {
      continueExistingSession(sessionInfo);
    } else {
      initializeSession(sessionInfo);
    }
  }, [location.state, navigate]);

  const continueExistingSession = async (sessionInfo) => {
    try {
      setLoading(true);

      const seriesResponse = await tableSeriesAPI.getById(sessionInfo.seriesId);
      const seriesData = seriesResponse.data.data || seriesResponse.data;

      if (!seriesData || !seriesData.sessions) {
        throw new Error('Table Series data not found or invalid format');
      }

      const session = seriesData.sessions.find(s => s.sessionId === sessionInfo.sessionId);

      if (!session) {
        throw new Error('Table Session not found in series');
      }

      const selectedTables = session.tables && session.tables.length > 0
        ? session.tables.map(t => t.tableId)
        : [1, 2, 3];

      const response = await tableQuizAPI.getByIds(selectedTables);
      const tableQuizzes = response.data;

      setSeriesId(sessionInfo.seriesId);
      setSessionId(sessionInfo.sessionId);
      setTables(tableQuizzes);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error continuing session:', error);
      setError(`Failed to continue table session: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async (seriesInfo) => {
    try {
      setLoading(true);

      const response = await tableQuizAPI.getByIds(seriesInfo.selectedTables);
      const tableQuizzes = response.data;

      setSeriesId(seriesInfo.seriesId);
      setSessionId(seriesInfo.sessionId);
      setTables(tableQuizzes);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error initializing session:', error);
      setError(`Failed to start table session: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize table when current table changes
  useEffect(() => {
    if (currentTable) {
      initializeTable(currentTable);
    }
  }, [currentTable, initializeTable]);

  // Selection handlers (following MCQ pattern)
  const handleConfidenceSelect = useCallback((level) => {
    setConfidence(level);
  }, []);

  const handleDifficultySelect = useCallback((level) => {
    setDifficulty(level);
  }, []);

  // Table submission handler (replacing MCQ answer selection)
  const handleTableSubmit = useCallback(() => {
    if (!currentTable || !isTableComplete()) return;

    const validationResults = validateTablePlacement(tableState.currentGrid, currentTable);
    setResults(validationResults);
    setSubmitted(true);
  }, [currentTable, tableState.currentGrid, validateTablePlacement, isTableComplete]);

  // Next table handler (following MCQ next question pattern)
  const handleNextTable = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    const currentResult = {
      tableId: currentTable.tableId,
      tableName: currentTable.name,
      userGrid: tableState.currentGrid,
      results,
      subject: currentTable.subject,
      difficulty,
      confidenceWhileSolving: confidence,
      timeSpent
    };

    try {
      // FIXED: Convert userGrid from cell objects to string array for database
      const userGridAsStrings = tableState.currentGrid.map(row =>
        row.map(cell => cell ? (cell.text || '') : '')
      );

      const interactionData = {
        tableId: currentTable.tableId,
        userGrid: userGridAsStrings, // Send strings instead of objects
        results,
        difficulty,
        confidenceWhileSolving: confidence,
        timeSpent
      };

      console.log('Recording interaction:', { seriesId, sessionId, interactionData });

      await tableSessionAPI.recordInteraction(seriesId, sessionId, interactionData);

      setSessionResults(prev => [...prev, currentResult]);

      if (currentTableIndex + 1 < tables.length) {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentTableIndex(prev => prev + 1);
          resetTableState();
          setIsTransitioning(false);
        }, 500);
      } else {
        finishSessionWithSummary();
      }

    } catch (error) {
      console.error('Error recording interaction:', error);
      setError('Failed to record your table placement');
    }
  };

  // Timer effect (following MCQ pattern exactly)
  useEffect(() => {
    if (startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime]);

  // Reset state for next table (following MCQ pattern)
  const resetTableState = () => {
    setSubmitted(false);
    setResults(null);
    setConfidence('');
    setDifficulty('');
    setStartTime(Date.now());
    setElapsedTime(0);
  };

  const finishSessionWithSummary = async () => {
    try {
      await tableSessionAPI.complete(seriesId, sessionId);
      setSessionComplete(true);
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Session finished but there was an error saving.');
    }
  };

  // Utility functions (following MCQ pattern)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation handlers (following MCQ pattern)
  const handleNavigateToSeries = useCallback(() => navigate('/browse-table-series'), [navigate]);
  const handleNavigateToDashboard = useCallback(() => navigate('/'), [navigate]);

  // Loading state (following MCQ pattern)
  if (loading) {
    return (
      <div className="mcq-loading">
        <div className="loading-text">Starting your table quiz session...</div>
      </div>
    );
  }

  // Error state (following MCQ pattern)
  if (error) {
    return (
      <div className="mcq-error">
        <div className="error-text">{error}</div>
        <StudyNavigation
          onNavigateToSeries={handleNavigateToSeries}
          onNavigateToDashboard={handleNavigateToDashboard}
          studyType="table"
        />
      </div>
    );
  }

  // Empty state (following MCQ pattern)
  if (!tables || tables.length === 0) {
    return (
      <div className="mcq-empty">
        <div className="empty-text">No table quizzes to study</div>
        <StudyNavigation
          onNavigateToSeries={handleNavigateToSeries}
          onNavigateToDashboard={handleNavigateToDashboard}
          studyType="table"
        />
      </div>
    );
  }

  // Session complete state (following MCQ pattern)
  if (sessionComplete) {
    const summaryStats = calculateSessionStats(sessionResults);

    return (
      <TableSessionSummary
        sessionResults={sessionResults}
        summaryStats={summaryStats}
        onNavigateToSeries={handleNavigateToSeries}
        onNavigateToDashboard={handleNavigateToDashboard}
      />
    );
  }

  const canSubmit = isTableComplete() && !submitted;
  const canProceed = submitted && confidence && difficulty;

  // Main table quiz interface (following MCQ structure)
  return (
    <div className="mcq-container">
      {/* Table Quiz Header */}
      <TableQuizHeader
        elapsedTime={elapsedTime}
        tableName={currentTable?.name || ''}
        tableIndex={currentTableIndex}
        totalTables={tables.length}
        cellsPlaced={tableState.cellsPlaced}
        totalContentCells={getTotalContentCells()}
      />

      {/* Main Table Interface */}
      <div className="table-quiz-main">
        <div className="table-quiz-content">
          <div className="table-area">
            <TableQuizDisplay
              tableStructure={tableState.currentGrid}
              onCellDrop={handleCellDrop}
              onCellRemove={handleCellRemove}
              draggedCell={dragState.draggedCell}
              showResults={submitted}
              results={results}
            />
          </div>

          <div className="palette-area">
            <CellPalette
              availableCells={tableState.availableCells}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              cellsPlaced={tableState.cellsPlaced}
              totalCells={getTotalContentCells()}
            />
          </div>
        </div>

        {/* Results Display (when submitted) */}
        {submitted && results && (
          <TableResultsDisplay
            tableStructure={tableState.currentGrid}
            results={results}
            correctAnswers={currentTable.cells}
            wrongPlacements={results.wrongPlacements}
            originalTable={currentTable}
          />
        )}
      </div>

      {/* Table Quiz Controls */}
      <TableQuizControls
        onSubmit={handleTableSubmit}
        submitted={submitted}
        confidence={confidence}
        difficulty={difficulty}
        onConfidenceChange={handleConfidenceSelect}
        onDifficultyChange={handleDifficultySelect}
        onNext={handleNextTable}
        canSubmit={canSubmit}
        canProceed={canProceed}
      />

      {/* Navigation (following MCQ pattern) */}
      <StudyNavigation
        onNavigateToSeries={handleNavigateToSeries}
        onNavigateToDashboard={handleNavigateToDashboard}
        studyType="table"
      />
    </div>
  );
};

export default TableQuizSession;