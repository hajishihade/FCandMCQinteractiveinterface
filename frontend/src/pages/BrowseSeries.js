import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom Hooks
import { useSeriesData, useClientFiltering, useSessionActions } from '../hooks';

// Components
import { NavigationHeader, FilterSection, SeriesList } from '../components/series';

// Modals (enhanced)
import SessionRecipeModal from '../components/SessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';

// Styles (reuse existing)
import './BrowseSeries.css';

const NewBrowseSeries = () => {
  const navigate = useNavigate();

  // Data fetching hook
  const {
    series,
    allFlashcards,
    filterOptions,
    loading,
    error,
    fetchData
  } = useSeriesData();

  // Filtering hook
  const {
    filters,
    dropdownOpen,
    filteredSeries,
    processedSeries,
    handleFilterToggle,
    toggleDropdown,
    getDropdownText,
    clearFilters
  } = useClientFiltering(series, allFlashcards);

  // Session actions hook
  const {
    modalState,
    handleSessionClick,
    handleNewSession,
    handleEditSession,
    handleCreateCustomSession,
    closeModal
  } = useSessionActions(fetchData);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation handlers (Enhanced for three-way toggle)
  const handleNavigateDashboard = () => navigate('/');
  const handleToggleMode = (mode) => {
    if (mode === 'mcq') navigate('/browse-mcq-series');
    if (mode === 'tables') navigate('/browse-table-series');
    // Stay on flashcards if mode === 'flashcards'
  };
  const handleCreateClick = () => navigate('/create-series');

  // NEVER block the entire page - show UI immediately

  return (
    <div className="browse-container">
      <NavigationHeader
        currentMode="flashcards"
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

      {/* Show content immediately */}
      {error ? (
        <div className="error-container">
          <h2>Error Loading Series</h2>
          <p>{error}</p>
          <button onClick={() => fetchData(true)} className="retry-btn">
            Retry
          </button>
        </div>
      ) : !loading && series.length === 0 ? (
        <div className="empty-container">
          <h2>No Series Yet</h2>
          <p>Create your first flashcard series to start studying</p>
          <button onClick={handleCreateClick} className="primary-btn">
            Create Flashcard Series
          </button>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {loading && !series.length ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              Loading flashcard series...
            </div>
          ) : (
            <SeriesList
              series={processedSeries}
              onSessionClick={handleSessionClick}
              onNewSession={handleNewSession}
              onEditSession={handleEditSession}
            />
          )}
        </div>
      )}

      {/* Modals - Reuse existing components */}
      {modalState.type === 'recipe' && (
        <SessionRecipeModal
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
          isFlashcard={true}
        />
      )}
    </div>
  );
};

export default NewBrowseSeries;