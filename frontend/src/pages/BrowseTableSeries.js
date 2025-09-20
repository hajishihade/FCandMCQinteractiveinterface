import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Table Quiz Custom Hooks (using mock API for testing)
import { useTableData } from '../hooks/useTableData';
import { useTableFiltering } from '../hooks/useTableFiltering';
import { useTableSessionActions } from '../hooks/useTableSessionActions';

// Table Quiz Components
import { TableSeriesList } from '../components/tableQuiz';

// Shared Components (reuse from flashcard/MCQ system)
import { NavigationHeader, FilterSection } from '../components/series';

// Modals (enhanced)
import TableSessionRecipeModal from '../components/TableSessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';

// Styles (reuse existing)
import './BrowseSeries.css';

const BrowseTableSeries = () => {
  const navigate = useNavigate();

  // Data fetching hook (Table-specific)
  const {
    series,
    allTables,
    filterOptions,
    loading,
    error,
    fetchData
  } = useTableData();

  // Filtering hook (Table-specific)
  const {
    filters,
    dropdownOpen,
    processedSeries,
    handleFilterToggle,
    toggleDropdown,
    getDropdownText,
    clearFilters
  } = useTableFiltering(series, allTables);

  // Session actions hook (Table-specific)
  const {
    modalState,
    handleSessionClick,
    handleNewSession,
    handleEditSession,
    handleCreateCustomSession,
    closeModal
  } = useTableSessionActions(fetchData);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation handlers (Table-specific)
  const handleNavigateDashboard = () => navigate('/');
  const handleToggleMode = (mode) => {
    if (mode === 'flashcards') navigate('/browse-series');
    if (mode === 'mcq') navigate('/browse-mcq-series');
    // Stay on tables if mode === 'tables'
  };
  const handleCreateClick = () => navigate('/create-table-series');

  // Loading state
  if (loading) {
    return (
      <div className="browse-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="browse-container">
        <div className="error-container">
          <h2>Error Loading Table Series</h2>
          <p>{error}</p>
          <button onClick={fetchData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && series.length === 0) {
    return (
      <div className="browse-container">
        <NavigationHeader
          currentMode="tables"
          supportedModes={['flashcards', 'mcq', 'tables']}
          onNavigateDashboard={handleNavigateDashboard}
          onToggleMode={handleToggleMode}
          onCreateClick={handleCreateClick}
        />

        <div className="empty-container">
          <h2>No Table Quiz Series Yet</h2>
          <p>Create your first table quiz series to start studying</p>
          <button onClick={handleCreateClick} className="primary-btn">
            Create Table Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <NavigationHeader
        currentMode="tables"
        supportedModes={['flashcards', 'mcq', 'tables']}
        onNavigateDashboard={handleNavigateDashboard}
        onToggleMode={handleToggleMode}
        onCreateClick={handleCreateClick}
      />

      <FilterSection
        filters={filters}
        filterOptions={filterOptions}
        dropdownOpen={dropdownOpen}
        onFilterToggle={handleFilterToggle}
        onDropdownToggle={toggleDropdown}
        onClearFilters={clearFilters}
        getDropdownText={getDropdownText}
        seriesCount={processedSeries.length}
        totalSeries={series.length}
      />

      <TableSeriesList
        series={processedSeries}
        onSessionClick={handleSessionClick}
        onNewSession={handleNewSession}
        onEditSession={handleEditSession}
      />

      {/* Modals - Table-specific */}
      {modalState.type === 'recipe' && (
        <TableSessionRecipeModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onCreateSession={handleCreateCustomSession}
          seriesData={modalState.selectedSeries}
        />
      )}

      {modalState.type === 'stats' && (
        <SessionStatsModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          sessionData={modalState.selectedSession}
          seriesTitle={modalState.selectedSeries?.title}
          studyType="table"
        />
      )}
    </div>
  );
};

export default BrowseTableSeries;