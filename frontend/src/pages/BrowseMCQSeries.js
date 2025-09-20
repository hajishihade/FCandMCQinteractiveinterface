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

// Modals (enhanced)
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

  // Navigation handlers (Enhanced for three-way toggle)
  const handleNavigateDashboard = () => navigate('/');
  const handleToggleMode = (mode) => {
    if (mode === 'flashcards') navigate('/browse-series');
    if (mode === 'tables') navigate('/browse-table-series');
    // Stay on MCQ if mode === 'mcq'
  };
  const handleCreateClick = () => navigate('/create-mcq-series');

  // NEVER block the entire page for loading - show the UI immediately

  return (
    <div className="browse-container">
      <NavigationHeader
        currentMode="mcq"
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

      {/* Show content immediately, with loading state inline */}
      {error ? (
        <div className="error-container">
          <h2>Error Loading MCQ Series</h2>
          <p>{error}</p>
          <button onClick={() => fetchData(true)} className="retry-btn">
            Retry
          </button>
        </div>
      ) : !loading && series.length === 0 ? (
        <div className="empty-container">
          <h2>No MCQ Series Yet</h2>
          <p>Create your first MCQ series to start studying</p>
          <button onClick={handleCreateClick} className="primary-btn">
            Create MCQ Series
          </button>
        </div>
      ) : (
        <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
          {loading && !series.length ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
              Loading MCQ series...
            </div>
          ) : (
            <MCQSeriesList
              series={processedSeries}
              onSessionClick={handleSessionClick}
              onNewSession={handleNewSession}
              onEditSession={handleEditSession}
            />
          )}
        </div>
      )}

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