import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { tableQuizAPI, tableSeriesAPI, tableSessionAPI } from '../services/tableQuizApi';
import './CreateSeries.css';

const CreateTableSeries = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [allFilterOptions, setAllFilterOptions] = useState({
    subjects: [],
    chapters: [],
    sections: [],
    tags: [],
    sources: []
  });
  const [selectedTables, setSelectedTables] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [initialLoading, setInitialLoading] = useState(true); // Only for first load
  const [filterLoading, setFilterLoading] = useState(false); // For filter changes
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalTables, setTotalTables] = useState(0);
  const [tablesPerPage] = useState(50);
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    sections: [],
    tags: [],
    sources: []
  });

  useEffect(() => {
    fetchFilterOptions();
    fetchTables(true); // Initial load
  }, []);

  useEffect(() => {
    fetchTables(false); // Filter/pagination change
  }, [currentPage, filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await tableQuizAPI.getFilterOptions();
      console.log('Table filter options response:', response);

      // Check both response.data.data and response.data structures
      const filterData = response?.data?.data || response?.data || {};

      setAllFilterOptions({
        subjects: filterData.subjects || [],
        chapters: filterData.chapters || [],
        sections: filterData.sections || [],
        tags: filterData.tags || [],
        sources: filterData.sources || []
      });

      console.log('Set table filter options:', {
        subjects: filterData.subjects?.length || 0,
        chapters: filterData.chapters?.length || 0,
        sections: filterData.sections?.length || 0
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchTables = async (isInitialLoad = false) => {
    try {
      // Use different loading states for initial load vs filter changes
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setFilterLoading(true);
      }

      const skip = (currentPage - 1) * tablesPerPage;
      const response = await tableQuizAPI.getAll({
        limit: tablesPerPage,
        skip,
        subject: filters.subjects.map(s => s.value).join(','),
        chapter: filters.chapters.map(c => c.value).join(','),
        section: filters.sections.map(s => s.value).join(',')
      });

      if (response?.data) {
        setTables(response.data);
      }
      if (response?.pagination) {
        setTotalTables(response.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching table quizzes:', error);
      setError('Failed to load table quizzes');
    } finally {
      setInitialLoading(false);
      setFilterLoading(false);
    }
  };

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  // Get unique values for each filter level - now from ALL database options
  const getAvailableSubjects = () => {
    return allFilterOptions.subjects.map(subject => ({ value: subject, label: subject }));
  };

  const getAvailableChapters = () => {
    // Show all chapters from database
    return allFilterOptions.chapters.map(chapter => ({ value: chapter, label: chapter }));
  };

  const getAvailableSections = () => {
    // Show all sections from database
    return allFilterOptions.sections.map(section => ({ value: section, label: section }));
  };

  const getAvailableTags = () => {
    return allFilterOptions.tags.map(tag => ({ value: tag, label: tag }));
  };

  const getAvailableSources = () => {
    return allFilterOptions.sources.map(source => ({ value: source, label: source }));
  };

  // Filter tables based on all criteria
  const filteredTables = tables.filter(table => {
    // Search filter
    if (searchTerm && !table.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Subject filter (multi-select)
    if (filters.subjects.length > 0 && !filters.subjects.some(subject => subject.value === table.subject)) {
      return false;
    }

    // Chapter filter (multi-select)
    if (filters.chapters.length > 0 && !filters.chapters.some(chapter => chapter.value === table.chapter)) {
      return false;
    }

    // Section filter (multi-select)
    if (filters.sections.length > 0 && !filters.sections.some(section => section.value === table.section)) {
      return false;
    }

    // Tags filter (multi-select)
    if (filters.tags.length > 0) {
      const tableTags = table.tags || [];
      const hasMatchingTag = filters.tags.some(tag => tableTags.includes(tag.value));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Sources filter (multi-select)
    if (filters.sources.length > 0 && !filters.sources.some(source => source.value === table.source)) {
      return false;
    }

    return true;
  });

  // Pagination for display (fetch all, show 100)
  const totalPages = Math.ceil(filteredTables.length / tablesPerPage);
  const startIndex = (currentPage - 1) * tablesPerPage;
  const endIndex = startIndex + tablesPerPage;
  const paginatedTables = filteredTables.slice(startIndex, endIndex);

  const handleSelectAll = () => {
    if (selectedTables.length === filteredTables.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(filteredTables.map(table => table.tableId));
    }
  };

  // Reset to page 1 when filters change
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // Custom styles for Select components (EXACT SAME AS MCQ)
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
      fontWeight: '500'
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.8)',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.3)',
        color: 'white'
      }
    }),
    placeholder: (provided) => ({
      ...provided,
      color: 'rgba(255,255,255,0.6)'
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

  const handleCreateSeries = async () => {
    const trimmedTitle = seriesTitle.trim();

    if (!trimmedTitle) {
      setError('Please enter a series title');
      return;
    }

    if (selectedTables.length === 0) {
      setError('Please select at least one table quiz');
      return;
    }

    try {
      setCreating(true);
      setError('');

      // Create the series
      const seriesResponse = await tableSeriesAPI.create(trimmedTitle);
      const seriesId = seriesResponse.data.seriesId;

      // Start a session with selected tables
      const sessionResponse = await tableSessionAPI.start(seriesId, selectedTables);
      const sessionId = sessionResponse.data.sessionId;

      // Navigate to the new session
      navigate('/table-quiz-session', {
        state: {
          seriesId,
          sessionId,
          selectedTables
        }
      });

    } catch (error) {
      console.error('Error creating table series:', error);
      setError(`Failed to create series: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreating(false);
    }
  };

  // NEVER show full page loading - always show the UI

  return (
    <div className="create-series-container">
      <div className="create-series-header">
        <button
          onClick={() => navigate('/browse-table-series')}
          className="back-btn"
        >
          ←
        </button>
      </div>

      <div className="series-creation-line">
        <input
          type="text"
          className="series-title-line"
          placeholder="Enter the name of the Table Quiz series you want to create here and choose the table quizzes"
          value={seriesTitle}
          onChange={(e) => setSeriesTitle(e.target.value)}
          maxLength={100}
        />
        <button
          onClick={handleCreateSeries}
          disabled={selectedTables.length === 0 || !seriesTitle.trim() || creating}
          className="start-btn-minimal"
        >
          {creating ? 'Creating...' : `Start (${selectedTables.length})`}
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
              chapters: [],
              sections: []
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
              sections: []
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
          />
        </div>
      </div>

      <div className="filter-summary">
        <span className="filter-count">
          {filterLoading ? (
            <span style={{ opacity: 0.6 }}>Loading...</span>
          ) : (
            `${filteredTables.length} Table Quizzes found`
          )}
        </span>
        <input
          type="text"
          className="search-line-small"
          placeholder="search table quizzes..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          disabled={filterLoading}
        />
        <button
          className="select-all-btn"
          onClick={handleSelectAll}
          disabled={filterLoading}
        >
          {selectedTables.length === filteredTables.length && filteredTables.length > 0
            ? 'Deselect All'
            : 'Select All'
          }
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="flashcards-grid" style={{ opacity: filterLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
        {filteredTables.length === 0 ? (
          <div className="no-flashcards-message">
            {filterLoading ? 'Loading Table Quizzes...' : 'No Table Quizzes match your filters'}
          </div>
        ) : (
          paginatedTables.map((table) => (
            <div
              key={table.tableId}
              className={`flashcard-item ${selectedTables.includes(table.tableId) ? 'selected' : ''}`}
              onClick={() => toggleTableSelection(table.tableId)}
            >
              <div className="card-header">
                <input
                  type="checkbox"
                  checked={selectedTables.includes(table.tableId)}
                  onChange={() => toggleTableSelection(table.tableId)}
                  className="card-checkbox"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="card-content">
                <h3 className="card-front">
                  {table.name.length > 60
                    ? table.name.substring(0, 60) + '...'
                    : table.name
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
            Page {currentPage} of {totalPages} ({filteredTables.length} total tables)
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

export default CreateTableSeries;