import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// MCQ Custom Hooks
import { useMCQData } from '../hooks/useMCQData';
import { useMCQFiltering } from '../hooks/useMCQFiltering';
import { useMCQSessionActions } from '../hooks/useMCQSessionActions';

// MCQ Components
import { MCQSeriesList } from '../components/mcq';

// Shared Components (reuse from flashcard system)
import { NavigationHeader, FilterSection } from '../components/series';

// Modals (MCQ-specific)
import MCQSessionRecipeModal from '../components/MCQSessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';

// Styles (reuse existing)
import './BrowseSeries.css';

const BrowseMCQSeries = () => {
  const navigate = useNavigate();

  // Data fetching hook (MCQ-specific)
  const {
    series,
    allMCQs,
    filterOptions,
    loading,
    error,
    fetchData
  } = useMCQData();

  // Filtering hook (MCQ-specific)
  const {
    filters,
    dropdownOpen,
    processedSeries,
    handleFilterToggle,
    toggleDropdown,
    getDropdownText,
    clearFilters
  } = useMCQFiltering(series, allMCQs);

  // Session actions hook (MCQ-specific)
  const {
    modalState,
    handleSessionClick,
    handleNewSession,
    handleEditSession,
    handleCreateCustomSession,
    closeModal
  } = useMCQSessionActions(fetchData);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Navigation handlers (MCQ-specific)
  const handleNavigateDashboard = () => navigate('/');
  const handleToggleMode = () => navigate('/browse-series');
  const handleCreateClick = () => navigate('/create-mcq-series');

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
          <h2>Error Loading MCQ Series</h2>
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
          currentMode="mcq"
          onNavigateDashboard={handleNavigateDashboard}
          onToggleMode={handleToggleMode}
          onCreateClick={handleCreateClick}
        />

        <div className="empty-container">
          <h2>No MCQ Series Yet</h2>
          <p>Create your first MCQ series to start studying</p>
          <button onClick={handleCreateClick} className="primary-btn">
            Create MCQ Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">
      <NavigationHeader
        currentMode="mcq"
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

      <MCQSeriesList
        series={processedSeries}
        onSessionClick={handleSessionClick}
        onNewSession={handleNewSession}
        onEditSession={handleEditSession}
      />

      {/* Modals - MCQ-specific */}
      {modalState.type === 'recipe' && (
        <MCQSessionRecipeModal
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
          isFlashcard={false}
        />
      )}
    </div>
  );
};

export default BrowseMCQSeries;