import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mcqSeriesAPI, mcqSessionAPI, mcqAPI } from '../services/mcqApi';
import MCQSessionRecipeModal from '../components/MCQSessionRecipeModal';
import SessionStatsModal from '../components/SessionStatsModal';
import './BrowseMCQSeries.css';

const BrowseMCQSeries = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState([]);
  const [allMCQs, setAllMCQs] = useState([]);
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

      // Fetch both MCQ series and all MCQs for client-side filtering
      const [seriesResponse, mcqsResponse] = await Promise.all([
        mcqSeriesAPI.getAll({ limit: 100 }),
        mcqAPI.getAll({ limit: 100 })
      ]);

      // Validate series response
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
      } else {
        console.error('Invalid MCQ series API response format:', seriesResponse);
        setSeries([]);
      }

      // Validate MCQs response and extract filter options
      if (mcqsResponse?.data?.data && Array.isArray(mcqsResponse.data.data)) {
        setAllMCQs(mcqsResponse.data.data);

        // Extract unique filter options
        const subjects = [...new Set(mcqsResponse.data.data.map(mcq => mcq.subject).filter(Boolean))];
        const chapters = [...new Set(mcqsResponse.data.data.map(mcq => mcq.chapter).filter(Boolean))];
        const sections = [...new Set(mcqsResponse.data.data.map(mcq => mcq.section).filter(Boolean))];

        setFilterOptions({
          subjects: subjects.sort(),
          chapters: chapters.sort(),
          sections: sections.sort()
        });
      }

    } catch (error) {
      console.error('Failed to fetch MCQ data:', error);
      setSeries([]);
      setAllMCQs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [fetchSeries]);

  const handleSessionClick = useCallback((seriesId, sessionId, sessionStatus, session, seriesItem) => {
    if (sessionStatus === 'active') {
      navigate('/mcq-study', {
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
    e.stopPropagation();
    const sessionQuestions = session.questions?.map(q => q.questionId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingQuestions: sessionQuestions
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (questionIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        await mcqSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        fetchSeries();
      } else if (sessionId) {
        await mcqSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (questionIds.length > 0) {
          const response = await mcqSessionAPI.start(modalState.selectedSeries._id, questionIds);
          navigate('/mcq-study', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.sessionId,
              selectedQuestions: questionIds,
              mode: 'new'
            }
          });
        } else {
          fetchSeries();
        }
      } else {
        const response = await mcqSessionAPI.start(modalState.selectedSeries._id, questionIds);
        navigate('/mcq-study', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.sessionId,
            selectedQuestions: questionIds,
            mode: 'new'
          }
        });
      }
    } catch (error) {
      alert('Failed to update MCQ session. Please try again.');
    }
    closeModal();
  }, [modalState.selectedSeries, navigate, fetchSeries]);

  const closeModal = useCallback(() => {
    setModalState({ type: null, isOpen: false, selectedSeries: null, selectedSession: null });
  }, []);

  // Client-side filtering logic for MCQs
  const filteredSeries = useMemo(() => {
    if (!series.length || !allMCQs.length) return series;

    // If no filters applied, return all series
    if (filters.subjects.length === 0 && filters.chapters.length === 0 && filters.sections.length === 0) {
      return series;
    }

    // Create MCQ lookup map
    const mcqLookup = {};
    allMCQs.forEach(mcq => {
      mcqLookup[mcq.questionId] = mcq;
    });

    return series.filter(seriesItem => {
      // Extract all questionIds from all sessions in this series
      const allQuestionIds = [];
      seriesItem.sessions?.forEach(session => {
        session.questions?.forEach(question => {
          if (typeof question.questionId === 'number') {
            allQuestionIds.push(question.questionId);
          }
        });
      });

      if (allQuestionIds.length === 0) return false;

      // Get unique questionIds and their MCQ data
      const uniqueQuestionIds = [...new Set(allQuestionIds)];
      const seriesMCQs = uniqueQuestionIds
        .map(questionId => mcqLookup[questionId])
        .filter(Boolean);

      if (seriesMCQs.length === 0) return false;

      // Check if series matches filter criteria
      let matchesFilter = true;

      // Subject filter - series must contain MCQs with ANY of the selected subjects
      if (filters.subjects.length > 0) {
        matchesFilter = matchesFilter && seriesMCQs.some(mcq =>
          filters.subjects.includes(mcq.subject)
        );
      }

      // Chapter filter - series must contain MCQs with ANY of the selected chapters
      if (filters.chapters.length > 0) {
        matchesFilter = matchesFilter && seriesMCQs.some(mcq =>
          filters.chapters.includes(mcq.chapter)
        );
      }

      // Section filter - series must contain MCQs with ANY of the selected sections
      if (filters.sections.length > 0) {
        matchesFilter = matchesFilter && seriesMCQs.some(mcq =>
          filters.sections.includes(mcq.section)
        );
      }

      return matchesFilter;
    });
  }, [series, allMCQs, filters]);

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

        <div className="navigation-section">
          <button
            className="home-btn"
            onClick={() => navigate('/')}
          >
            ← Dashboard
          </button>

          <div className="mode-toggle">
            <button
              className="toggle-btn"
              onClick={() => navigate('/browse-series')}
            >
              Flashcards
            </button>
            <button
              className="toggle-btn active"
              onClick={() => {}}
            >
              MCQ
            </button>
          </div>
        </div>

        <div className="empty-container">
          <h2>No MCQ Series Yet</h2>
          <p>Create your first MCQ series to start studying</p>
          <button onClick={() => navigate('/create-mcq-series')} className="primary-btn">
            Create MCQ Series
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
            className="toggle-btn"
            onClick={() => navigate('/browse-series')}
          >
            Flashcards
          </button>
          <button
            className="toggle-btn active"
            onClick={() => {}}
          >
            MCQ
          </button>
        </div>

        <button onClick={() => navigate('/create-mcq-series')} className="create-btn">
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
            <React.Fragment key={seriesItem._id}>
              {index > 0 && <div className="series-divider"></div>}

              <div className="series-item">
              <div className="series-header">
                <h2>{seriesItem.title} <span className="series-progress">({completedCount}/{seriesItem.sessions.length})</span></h2>
              </div>

              <div className="sessions-row">
                {seriesItem.sessions.map((session) => {
                  // Calculate MCQ session stats
                  const questions = session.questions || [];
                  const answeredQuestions = questions.filter(q => q.interaction).length;
                  const correctQuestions = questions.filter(q => q.interaction?.isCorrect).length;
                  const accuracy = answeredQuestions > 0 ? Math.round((correctQuestions / answeredQuestions) * 100) : 0;

                  const totalTime = questions.reduce((sum, q) => sum + (q.interaction?.timeSpent || 0), 0);
                  const avgTime = answeredQuestions > 0 ? Math.round(totalTime / answeredQuestions) : 0;

                  const sessionDate = session.completedAt || session.startedAt;
                  const dateStr = sessionDate ? new Date(sessionDate).toLocaleDateString() : '';

                  return (
                    <button
                      key={session.sessionId}
                      className={`session-btn ${session.status}`}
                      onClick={() => handleSessionClick(seriesItem._id, session.sessionId, session.status, session, seriesItem)}
                      title={session.status === 'completed' ? 'Click to view stats' : session.status === 'active' ? 'Click to continue' : ''}
                    >
                      <div className="session-number">#{session.sessionId}</div>

                      {session.status === 'completed' && (
                        <div className="session-stats">
                          <span>{accuracy}% accuracy</span>
                          <span>{answeredQuestions}/{questions.length} questions</span>
                          <span>{avgTime}s avg time</span>
                          <span>{dateStr}</span>
                        </div>
                      )}

                      {session.status === 'active' && (
                        <>
                          <div className="session-stats">
                            <span>In Progress</span>
                            <span>{answeredQuestions}/{questions.length} done</span>
                            {answeredQuestions > 0 && <span>{accuracy}% so far</span>}
                            {avgTime > 0 && <span>{avgTime}s avg</span>}
                          </div>
                          <button
                            className="edit-session-btn"
                            onClick={(e) => handleEditSession(seriesItem._id, session, seriesItem, e)}
                            title="Edit session - Add/Remove questions"
                          >
                            ⚙
                          </button>
                        </>
                      )}
                    </button>
                  );
                })}

                {seriesItem.status === 'active' && !activeSession && (
                  <button
                    className="session-btn new"
                    onClick={() => handleNewSession(seriesItem._id, seriesItem)}
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