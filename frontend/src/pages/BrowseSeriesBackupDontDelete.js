import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Custom Hooks
import { useSeriesData, useClientFiltering, useSessionActions } from '../hooks';

// Components
import { NavigationHeader, FilterSection, SeriesList } from '../components/series';

// Modals (reuse existing)
import SessionRecipeModal from '../components/SessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';

// Styles (reuse existing)
import './BrowseSeries.css';

const BrowseSeries = () => {
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

  // Navigation handlers
  const handleNavigateDashboard = () => navigate('/');
  const handleToggleMode = () => navigate('/browse-mcq-series');
  const handleCreateClick = () => navigate('/create-series');

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
          <h2>Error Loading Series</h2>
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
          currentMode="flashcards"
          onNavigateDashboard={handleNavigateDashboard}
          onToggleMode={handleToggleMode}
          onCreateClick={handleCreateClick}
        />

        <div className="empty-container">
          <h2>No Series Yet</h2>
          <p>Create your first flashcard series to start studying</p>
          <button onClick={handleCreateClick} className="primary-btn">
            Create Flashcard Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <NavigationHeader
        currentMode="flashcards"
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

      <SeriesList
        series={processedSeries}
        onSessionClick={handleSessionClick}
        onNewSession={handleNewSession}
        onEditSession={handleEditSession}
      />

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

export default BrowseSeries;