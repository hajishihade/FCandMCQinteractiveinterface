/**
 * Create MCQ Series Page
 *
 * Interface for creating new MCQ study series by selecting questions
 * from the database. Supports advanced filtering and bulk selection.
 *
 * Features:
 * - Multi-select dropdown filters
 * - Server-side pagination (50 questions per page)
 * - Search across question content
 * - Bulk selection/deselection
 * - Progressive loading (no full-page blocks)
 * - Separate filter options API for complete database coverage
 *
 * Performance optimizations:
 * - Dual loading states (initial vs filter changes)
 * - Filter options loaded separately from content
 * - No full-page loading screens
 * - Debounced search input
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { mcqAPI, mcqSeriesAPI, mcqSessionAPI } from '../services/mcqApi';
import './CreateSeries.css';

/**
 * Create MCQ Series Component
 *
 * Allows users to create study series by selecting MCQ questions
 * with advanced filtering capabilities.
 *
 * @returns {JSX.Element} MCQ series creation interface
 */
const CreateMCQSeries = () => {
  const navigate = useNavigate();

  // Question data and filter options
  const [mcqs, setMcqs] = useState([]);
  const [allFilterOptions, setAllFilterOptions] = useState({
    subjects: [],
    chapters: [],
    sections: [],
    tags: [],
    sources: []
  });

  // Selection and creation state
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState('');

  // Loading states - separated for better UX
  const [initialLoading, setInitialLoading] = useState(true); // First page load only
  const [filterLoading, setFilterLoading] = useState(false);  // Filter/pagination changes
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionsPerPage] = useState(50);

  // Active filters
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    sections: [],
    tags: [],
    sources: []
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchMCQs(true); // Initial load
  }, []);

  useEffect(() => {
    fetchMCQs(false); // Filter/pagination change
  }, [currentPage, filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await mcqAPI.getFilterOptions();
      console.log('Filter options response:', response);

      // Check both response.data.data and response.data structures
      const filterData = response?.data?.data || response?.data || {};

      setAllFilterOptions({
        subjects: filterData.subjects || [],
        chapters: filterData.chapters || [],
        sections: filterData.sections || [],
        tags: filterData.tags || [],
        sources: filterData.sources || []
      });

      console.log('Set filter options:', {
        subjects: filterData.subjects?.length || 0,
        chapters: filterData.chapters?.length || 0,
        sections: filterData.sections?.length || 0
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchMCQs = async (isInitialLoad = false) => {
    try {
      // Use different loading states for initial load vs filter changes
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setFilterLoading(true);
      }

      const skip = (currentPage - 1) * questionsPerPage;
      const response = await mcqAPI.getAll({
        limit: questionsPerPage,
        skip,
        subject: filters.subjects.map(s => s.value).join(','),
        chapter: filters.chapters.map(c => c.value).join(','),
        section: filters.sections.map(s => s.value).join(',')
      });

      if (response?.data) {
        setMcqs(response.data);
      }
      if (response?.pagination) {
        setTotalQuestions(response.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching MCQs:', error);
      setError('Failed to load MCQs');
    } finally {
      setInitialLoading(false);
      setFilterLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Get unique values for each filter level - now from ALL database options
  const getAvailableSubjects = () => {
    return allFilterOptions.subjects.map(subject => ({ value: subject, label: subject }));
  };

  const getAvailableChapters = () => {
    // For now, show all chapters regardless of subject selection
    // Could implement dependent filtering if needed
    return allFilterOptions.chapters.map(chapter => ({ value: chapter, label: chapter }));
  };

  const getAvailableSections = () => {
    // Show all sections from database
    return allFilterOptions.sections.map(section => ({ value: section, label: section }));
  };

  const getAvailableTags = () => {
    // Show all tags from database
    return allFilterOptions.tags.map(tag => ({ value: tag, label: tag }));
  };

  const getAvailableSources = () => {
    // Show all sources from database
    return allFilterOptions.sources.map(source => ({ value: source, label: source }));
  };

  // Search filter on current page only (for quick local search)
  const filteredMCQs = mcqs.filter(mcq => {
    if (searchTerm && !mcq.question.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Use server pagination
  const totalPages = Math.ceil(totalQuestions / questionsPerPage) || 1;
  const paginatedMCQs = filteredMCQs; // Already paginated from server

  const handleSelectAll = () => {
    // Select/deselect all questions on current page
    const currentPageIds = mcqs.map(mcq => mcq.questionId);
    const allSelected = currentPageIds.every(id => selectedQuestions.includes(id));

    if (allSelected) {
      // Remove current page IDs from selection
      setSelectedQuestions(prev => prev.filter(id => !currentPageIds.includes(id)));
    } else {
      // Add current page IDs to selection
      setSelectedQuestions(prev => [...new Set([...prev, ...currentPageIds])]);
    }
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setCurrentPage(1); // Reset to page 1 when filters change
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreateSeries = async () => {
    const trimmedTitle = seriesTitle.trim();

    // Basic input validation to prevent data corruption
    if (!trimmedTitle) {
      setError('Please enter a series title');
      return;
    }

    if (trimmedTitle.length > 100) {
      setError('Series title must be 100 characters or less');
      return;
    }

    if (selectedQuestions.length === 0) {
      setError('Please select at least one MCQ');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Step 1: Create the MCQ series
      const seriesResponse = await mcqSeriesAPI.create(trimmedTitle);
      const seriesId = seriesResponse.data.seriesId;

      // Step 2: Automatically create first session with selected questions
      const sessionResponse = await mcqSessionAPI.start(seriesId, selectedQuestions);
      const sessionId = sessionResponse.data.sessionId;

      // Step 3: Navigate to study the first session
      navigate('/mcq-study', {
        state: {
          seriesId,
          sessionId,
          selectedQuestions,
          mode: 'new' // Use new mode for fresh session
        }
      });

    } catch (error) {
      console.error('Error creating MCQ series:', error);
      setError(error.response?.data?.message || 'Failed to create MCQ series');
    } finally {
      setCreating(false);
    }
  };

  // Custom styles for react-select to match your theme
  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderColor: state.isFocused ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)',
      borderRadius: '8px',
      minHeight: '40px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'rgba(255,255,255,0.5)'
      }
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#667eea',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.2)'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? 'rgba(255,255,255,0.2)' : 'transparent',
      color: 'white',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.2)'
      }
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: '4px'
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
      fontSize: '0.9rem'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.6)',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.3)',
        color: 'white'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.5)'
    }),
    input: (provided) => ({
      ...provided,
      color: 'white'
    }),
    singleValue: (provided) => ({
      ...provided,
      color: 'white'
    }),
    indicatorSeparator: () => ({
      display: 'none'
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.5)',
      '&:hover': {
        color: 'rgba(255,255,255,0.8)'
      }
    }),
    clearIndicator: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.5)',
      '&:hover': {
        color: 'rgba(255,255,255,0.8)'
      }
    })
  };

  // NEVER show full page loading - always show the UI

  return (
    <div className="create-series-container">
      <div className="create-series-header">
        <button
          onClick={() => navigate('/browse-mcq-series')}
          className="back-btn"
        >
          ←
        </button>
      </div>

      <div className="series-creation-line">
        <input
          type="text"
          className="series-title-line"
          placeholder="Enter the name of the MCQ series you want to create here and choose the questions"
          value={seriesTitle}
          onChange={(e) => setSeriesTitle(e.target.value)}
          maxLength={100}
        />
        <button
          onClick={handleCreateSeries}
          disabled={selectedQuestions.length === 0 || !seriesTitle.trim() || creating}
          className="start-btn-minimal"
        >
          {creating ? 'Creating...' : `Start (${selectedQuestions.length})`}
        </button>
      </div>

      <div className="filters-section">
        <div className="multi-select-filters">
          <Select
            isMulti
            placeholder="Select subjects..."
            options={getAvailableSubjects()}
            value={filters.subjects}
            onChange={(selected) => setFilters(prev => ({
              ...prev,
              subjects: selected || [],
              chapters: [], // Reset dependent filters
              sections: []
              // Keep tags and sources - they're independent
            }))}
            styles={customStyles}
            className="filter-select"
            classNamePrefix="select"
            isClearable
            isSearchable
          />

          <Select
            isMulti
            placeholder="Select chapters..."
            options={getAvailableChapters()}
            value={filters.chapters}
            onChange={(selected) => setFilters(prev => ({
              ...prev,
              chapters: selected || [],
              sections: [] // Reset dependent filter
              // Keep tags and sources - they're independent
            }))}
            styles={customStyles}
            className="filter-select"
            classNamePrefix="select"
            isClearable
            isSearchable
            isDisabled={filters.subjects.length === 0}
          />

          <Select
            isMulti
            placeholder="Select sections..."
            options={getAvailableSections()}
            value={filters.sections}
            onChange={(selected) => setFilters(prev => ({
              ...prev,
              sections: selected || []
              // Don't reset tags or sources - they're independent
            }))}
            styles={customStyles}
            className="filter-select"
            classNamePrefix="select"
            isClearable
            isSearchable
            isDisabled={filters.chapters.length === 0}
          />

          <Select
            isMulti
            placeholder="Select tags..."
            options={getAvailableTags()}
            value={filters.tags}
            onChange={(selected) => setFilters(prev => ({
              ...prev,
              tags: selected || []
            }))}
            styles={customStyles}
            className="filter-select"
            classNamePrefix="select"
            isClearable
            isSearchable
            // Tags are always enabled - independent selection
          />

          <Select
            isMulti
            placeholder="Select sources..."
            options={getAvailableSources()}
            value={filters.sources}
            onChange={(selected) => setFilters(prev => ({
              ...prev,
              sources: selected || []
            }))}
            styles={customStyles}
            className="filter-select"
            classNamePrefix="select"
            isClearable
            isSearchable
            // Sources are always enabled - independent selection
          />
        </div>
      </div>

      <div className="filter-summary">
        <span className="filter-count">
          {filterLoading ? (
            <span style={{ opacity: 0.6 }}>Loading...</span>
          ) : (
            `${totalQuestions} MCQs found`
          )}
        </span>
        <input
          type="text"
          className="search-line-small"
          placeholder="search questions..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={filterLoading}
        />
        <button
          className="select-all-btn"
          onClick={handleSelectAll}
          disabled={filterLoading}
        >
          {selectedQuestions.length === mcqs.length && mcqs.length > 0
            ? 'Deselect Page'
            : 'Select Page'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="flashcards-grid" style={{ opacity: filterLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {filteredMCQs.length === 0 ? (
          <div className="no-flashcards-message">
            {filterLoading ? 'Loading MCQs...' : 'No MCQs match your filters'}
          </div>
        ) : (
          paginatedMCQs.map((mcq) => (
          <div
            key={mcq.questionId}
            className={`flashcard-item ${selectedQuestions.includes(mcq.questionId) ? 'selected' : ''}`}
            onClick={() => toggleQuestionSelection(mcq.questionId)}
          >
            <div className="card-header">
              <input
                type="checkbox"
                checked={selectedQuestions.includes(mcq.questionId)}
                onChange={() => toggleQuestionSelection(mcq.questionId)}
                className="card-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="card-content">
              <h3 className="card-front">
                {mcq.question.length > 60
                  ? mcq.question.substring(0, 60) + '...'
                  : mcq.question
                }
              </h3>
            </div>
          </div>
        ))
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginTop: '20px',
          color: 'white'
        }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
            style={{
              padding: '8px 16px',
              background: currentPage === 1 ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            ← Previous
          </button>

          <span style={{ color: 'rgba(255,255,255,0.8)' }}>
            Page {currentPage} of {totalPages} ({totalQuestions} total questions)
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="pagination-btn"
            style={{
              padding: '8px 16px',
              background: currentPage === totalPages ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              color: 'white',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default CreateMCQSeries;