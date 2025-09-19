import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { seriesAPI, sessionAPI, flashcardAPI } from '../services/api';
import SessionRecipeModal from '../components/SessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';
import './BrowseSeries.css';

// Constants
const SERIES_FETCH_LIMIT = 50;

const BrowseSeries = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    sections: []
  });
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    chapters: [],
    sections: []
  });
  const [dropdownOpen, setDropdownOpen] = useState({
    subjects: false,
    chapters: false,
    sections: false
  });
  const [modalState, setModalState] = useState({
    type: null, // 'recipe' | 'stats' | null
    isOpen: false,
    selectedSeries: null,
    selectedSession: null
  });

  const fetchSeries = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch both series and flashcards for client-side filtering
      const [seriesResponse, flashcardsResponse] = await Promise.all([
        seriesAPI.getAll({ limit: 100 }),
        flashcardAPI.getAll({ limit: 100 })
      ]);

      // Validate series response
      if (seriesResponse?.data?.data && Array.isArray(seriesResponse.data.data)) {
        setSeries(seriesResponse.data.data);
      } else {
        console.error('Invalid series API response format:', seriesResponse);
        setSeries([]);
      }

      // Validate flashcards response and extract filter options
      if (flashcardsResponse?.data?.data && Array.isArray(flashcardsResponse.data.data)) {
        setAllFlashcards(flashcardsResponse.data.data);

        // Extract unique filter options
        const subjects = [...new Set(flashcardsResponse.data.data.map(card => card.subject).filter(Boolean))];
        const chapters = [...new Set(flashcardsResponse.data.data.map(card => card.chapter).filter(Boolean))];
        const sections = [...new Set(flashcardsResponse.data.data.map(card => card.section).filter(Boolean))];

        setFilterOptions({
          subjects: subjects.sort(),
          chapters: chapters.sort(),
          sections: sections.sort()
        });
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setSeries([]);
      setAllFlashcards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSessionClick = useCallback((seriesId, sessionId, sessionStatus, session, seriesItem) => {
    if (sessionStatus === 'active') {
      navigate('/study', {
        state: { seriesId, sessionId, mode: 'continue' }
      });
    } else if (sessionStatus === 'completed') {
      setModalState({
        type: 'stats',
        isOpen: true,
        selectedSeries: seriesItem,
        selectedSession: session
      });
    }
  }, [navigate]);

  const handleNewSession = useCallback((seriesId, seriesData) => {
    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: seriesData,
      selectedSession: null
    });
  }, []);

  const handleEditSession = useCallback((seriesId, session, seriesData, e) => {
    e.stopPropagation(); // Prevent session click
    const sessionCards = session.cards?.map(card => card.cardId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingCards: sessionCards
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (cardIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        // Delete session
        await sessionAPI.delete(modalState.selectedSeries._id, sessionId);
        fetchSeries();
      } else if (sessionId) {
        // Update existing session - delete and recreate
        await sessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (cardIds.length > 0) {
          const response = await sessionAPI.start(modalState.selectedSeries._id, cardIds, sessionId);

          navigate('/study', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.data.sessionId,
              selectedCards: cardIds
            }
          });
        } else {
          fetchSeries(); // Just refresh if no cards selected
        }
      } else {
        // Create new session
        const response = await sessionAPI.start(modalState.selectedSeries._id, cardIds);

        navigate('/study', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.data.sessionId,
            selectedCards: cardIds
          }
        });
      }
    } catch (error) {
      alert('Failed to update session. Please try again.');
    }
    closeModal();
  }, [modalState.selectedSeries, navigate, fetchSeries]);

  const closeModal = useCallback(() => {
    setModalState({ type: null, isOpen: false, selectedSeries: null, selectedSession: null });
  }, []);


  // No-op function to avoid creating new functions on each render
  const noOp = useCallback(() => {}, []);

  // Client-side filtering logic
  const filteredSeries = useMemo(() => {
    if (!series.length || !allFlashcards.length) return series;

    // If no filters applied, return all series
    if (filters.subjects.length === 0 && filters.chapters.length === 0 && filters.sections.length === 0) {
      return series;
    }

    // Create flashcard lookup map
    const flashcardLookup = {};
    allFlashcards.forEach(card => {
      flashcardLookup[card.cardId] = card;
    });

    return series.filter(seriesItem => {
      // Extract all cardIds from all sessions in this series
      const allCardIds = [];
      seriesItem.sessions?.forEach(session => {
        session.cards?.forEach(card => {
          if (typeof card.cardId === 'number') {
            allCardIds.push(card.cardId);
          }
        });
      });

      if (allCardIds.length === 0) return false;

      // Get unique cardIds and their flashcard data
      const uniqueCardIds = [...new Set(allCardIds)];
      const seriesFlashcards = uniqueCardIds
        .map(cardId => flashcardLookup[cardId])
        .filter(Boolean);

      if (seriesFlashcards.length === 0) return false;

      // Check if series matches filter criteria
      let matchesFilter = true;

      // Subject filter - series must contain flashcards with ANY of the selected subjects
      if (filters.subjects.length > 0) {
        matchesFilter = matchesFilter && seriesFlashcards.some(card =>
          filters.subjects.includes(card.subject)
        );
      }

      // Chapter filter - series must contain flashcards with ANY of the selected chapters
      if (filters.chapters.length > 0) {
        matchesFilter = matchesFilter && seriesFlashcards.some(card =>
          filters.chapters.includes(card.chapter)
        );
      }

      // Section filter - series must contain flashcards with ANY of the selected sections
      if (filters.sections.length > 0) {
        matchesFilter = matchesFilter && seriesFlashcards.some(card =>
          filters.sections.includes(card.section)
        );
      }

      return matchesFilter;
    });
  }, [series, allFlashcards, filters]);

  // Helper function for multi-select
  const handleFilterToggle = (filterType, value) => {
    setFilters(prev => {
      const currentValues = prev[filterType];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return { ...prev, [filterType]: newValues };
    });
  };

  // Dropdown toggle helper
  const toggleDropdown = (filterType) => {
    setDropdownOpen(prev => ({
      subjects: filterType === 'subjects' ? !prev.subjects : false,
      chapters: filterType === 'chapters' ? !prev.chapters : false,
      sections: filterType === 'sections' ? !prev.sections : false
    }));
  };

  // Get display text for dropdown button
  const getDropdownText = (filterType) => {
    const selected = filters[filterType];
    const filterName = filterType.charAt(0).toUpperCase() + filterType.slice(1, -1); // "subjects" -> "Subject"

    if (selected.length === 0) return `All ${filterName}s`;
    if (selected.length === 1) return selected[0];
    return `${selected.length} ${filterName}s Selected`;
  };

  // Pre-process expensive calculations once instead of in render loop
  const processedSeries = useMemo(() =>
    filteredSeries.map(seriesItem => ({
      ...seriesItem,
      completedCount: seriesItem.sessions.filter(s => s.status === 'completed').length,
      activeSession: seriesItem.sessions.find(s => s.status === 'active')
    })), [filteredSeries]
  );

  if (loading) {
    return (
      <div className="browse-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="browse-container">
  
        <div className="mode-toggle">
          <button
            className="toggle-btn active"
            onClick={noOp}
          >
            Flashcards
          </button>
          <button
            className="toggle-btn"
            onClick={() => navigate('/browse-mcq-series')}
          >
            MCQ
          </button>
        </div>

        <div className="empty-container">
          <h2>No Series Yet</h2>
          <p>Create your first flashcard series to start studying</p>
          <button onClick={() => navigate('/create-series')} className="primary-btn">
            Create Flashcard Series
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="browse-container">

      <div className="navigation-section">
        <button
          className="home-btn"
          onClick={() => navigate('/')}
        >
          ← Dashboard
        </button>

        <div className="mode-toggle">
          <button
            className="toggle-btn active"
            onClick={() => {}}
          >
            Flashcards
          </button>
          <button
            className="toggle-btn"
            onClick={() => navigate('/browse-mcq-series')}
          >
            MCQ
          </button>
        </div>

        <button onClick={() => navigate('/create-series')} className="create-btn">
          + Create
        </button>
      </div>

      <div className="filters-section">
        <div className="filters-row">

          {/* Subjects Dropdown */}
          <div className="filter-dropdown">
            <button
              className="dropdown-button"
              onClick={() => toggleDropdown('subjects')}
            >
              {getDropdownText('subjects')} ▼
            </button>
            {dropdownOpen.subjects && (
              <div className="dropdown-content">
                {filterOptions.subjects.map(subject => (
                  <label key={subject} className="dropdown-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.subjects.includes(subject)}
                      onChange={() => handleFilterToggle('subjects', subject)}
                    />
                    <span className="checkbox-label">{subject}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Chapters Dropdown */}
          <div className="filter-dropdown">
            <button
              className="dropdown-button"
              onClick={() => toggleDropdown('chapters')}
            >
              {getDropdownText('chapters')} ▼
            </button>
            {dropdownOpen.chapters && (
              <div className="dropdown-content">
                {filterOptions.chapters.map(chapter => (
                  <label key={chapter} className="dropdown-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.chapters.includes(chapter)}
                      onChange={() => handleFilterToggle('chapters', chapter)}
                    />
                    <span className="checkbox-label">{chapter}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sections Dropdown */}
          <div className="filter-dropdown">
            <button
              className="dropdown-button"
              onClick={() => toggleDropdown('sections')}
            >
              {getDropdownText('sections')} ▼
            </button>
            {dropdownOpen.sections && (
              <div className="dropdown-content">
                {filterOptions.sections.map(section => (
                  <label key={section} className="dropdown-checkbox">
                    <input
                      type="checkbox"
                      checked={filters.sections.includes(section)}
                      onChange={() => handleFilterToggle('sections', section)}
                    />
                    <span className="checkbox-label">{section}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setFilters({ subjects: [], chapters: [], sections: [] })}
            className="clear-filters-btn"
          >
            Clear All
          </button>

          <div className="filter-summary">
            Showing {processedSeries.length} of {series.length} series
          </div>

        </div>
      </div>


      {processedSeries.length > 0 && <div className="series-divider"></div>}

      <div className="series-list">
        {processedSeries.map((seriesItem, index) => {
          const { sessions, _id: seriesId, title, status, completedCount, activeSession } = seriesItem;

          return (
            <React.Fragment key={seriesId}>
              {index > 0 && <div className="series-divider"></div>}

              <div className="series-item">
                <div className="series-header">
                  <h2 className="series-title">{title}</h2>
                  <div className="series-progress">({completedCount}/{sessions.length})</div>
                </div>

                <div className="sessions-row">
                  {sessions.map((session) => {
                    // Calculate comprehensive session stats
                    const cards = session.cards || [];
                    const completedCards = cards.filter(card => card.interaction).length;
                    const correctCards = cards.filter(card => card.interaction?.result === 'Right').length;
                    const accuracy = completedCards > 0 ? Math.round((correctCards / completedCards) * 100) : 0;

                    const totalTime = cards.reduce((sum, card) => sum + (card.interaction?.timeSpent || 0), 0);
                    const avgTime = completedCards > 0 ? Math.round(totalTime / completedCards) : 0;


                    const sessionDate = session.completedAt || session.startedAt;
                    const dateStr = sessionDate ? new Date(sessionDate).toLocaleDateString() : '';

                    return (
                      <button
                        key={session.sessionId}
                        className={`session-btn ${session.status}`}
                        onClick={() => handleSessionClick(seriesId, session.sessionId, session.status, session, seriesItem)}
                        title={session.status === 'completed' ? 'Click to view stats' : session.status === 'active' ? 'Click to continue' : ''}
                      >
                        <div className="session-number">#{session.sessionId}</div>

                        {session.status === 'completed' && (
                          <div className="session-stats">
                            <span>{accuracy}% accuracy</span>
                            <span>{completedCards}/{cards.length} cards</span>
                            <span>{avgTime}s avg time</span>
                            <span>{dateStr}</span>
                          </div>
                        )}

                        {session.status === 'active' && (
                          <>
                            <div className="session-stats">
                              <span>In Progress</span>
                              <span>{completedCards}/{cards.length} done</span>
                              {completedCards > 0 && <span>{accuracy}% so far</span>}
                              {avgTime > 0 && <span>{avgTime}s avg</span>}
                            </div>
                            <button
                              className="edit-session-btn"
                              onClick={(e) => handleEditSession(seriesId, session, seriesItem, e)}
                              title="Edit session - Add/Remove cards"
                            >
                              ⚙
                            </button>
                          </>
                        )}
                      </button>
                    );
                  })}

                  {status === 'active' && !activeSession && (
                    <button
                      className="session-btn new"
                      onClick={() => handleNewSession(seriesId, seriesItem)}
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

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