import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { mcqAPI, mcqSeriesAPI, mcqSessionAPI } from '../services/mcqApi';
import './CreateSeries.css';

const CreateMCQSeries = () => {
  const navigate = useNavigate();
  const [mcqs, setMcqs] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    sections: [],
    tags: [],
    sources: []
  });

  useEffect(() => {
    fetchMCQs();
  }, []);

  const fetchMCQs = async () => {
    try {
      setLoading(true);
      const response = await mcqAPI.getAll({ limit: 100 });
      setMcqs(response.data);
    } catch (error) {
      console.error('Error fetching MCQs:', error);
      setError('Failed to load MCQs');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Get unique values for each filter level
  const getAvailableSubjects = () => {
    const subjects = [...new Set(mcqs.map(mcq => mcq.subject).filter(Boolean))];
    return subjects.map(subject => ({ value: subject, label: subject }));
  };

  const getAvailableChapters = () => {
    let relevantMcqs = mcqs;

    // Filter by selected subjects if any
    if (filters.subjects.length > 0) {
      relevantMcqs = relevantMcqs.filter(mcq =>
        filters.subjects.some(subject => subject.value === mcq.subject)
      );
    }

    const chapters = [...new Set(relevantMcqs.map(mcq => mcq.chapter).filter(Boolean))];
    return chapters.map(chapter => ({ value: chapter, label: chapter }));
  };

  const getAvailableSections = () => {
    let relevantMcqs = mcqs;

    // Filter by selected subjects if any
    if (filters.subjects.length > 0) {
      relevantMcqs = relevantMcqs.filter(mcq =>
        filters.subjects.some(subject => subject.value === mcq.subject)
      );
    }

    // Filter by selected chapters if any
    if (filters.chapters.length > 0) {
      relevantMcqs = relevantMcqs.filter(mcq =>
        filters.chapters.some(chapter => chapter.value === mcq.chapter)
      );
    }

    const sections = [...new Set(relevantMcqs.map(mcq => mcq.section).filter(Boolean))];
    return sections.map(section => ({ value: section, label: section }));
  };

  const getAvailableTags = () => {
    // Tags are independent - show all available tags from all MCQs
    const tags = [...new Set(mcqs.flatMap(mcq => mcq.tags || []).filter(Boolean))];
    return tags.map(tag => ({ value: tag, label: tag }));
  };

  const getAvailableSources = () => {
    // Sources are independent - show all available sources from all MCQs
    const sources = [...new Set(mcqs.map(mcq => mcq.source).filter(Boolean))];
    return sources.map(source => ({ value: source, label: source }));
  };

  // Filter MCQs based on all criteria
  const filteredMCQs = mcqs.filter(mcq => {
    // Search filter
    if (searchTerm && !mcq.question.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Subject filter (multi-select)
    if (filters.subjects.length > 0 && !filters.subjects.some(subject => subject.value === mcq.subject)) {
      return false;
    }

    // Chapter filter (multi-select)
    if (filters.chapters.length > 0 && !filters.chapters.some(chapter => chapter.value === mcq.chapter)) {
      return false;
    }

    // Section filter (multi-select)
    if (filters.sections.length > 0 && !filters.sections.some(section => section.value === mcq.section)) {
      return false;
    }

    // Tags filter (multi-select)
    if (filters.tags.length > 0) {
      const mcqTags = mcq.tags || [];
      const hasMatchingTag = filters.tags.some(tag => mcqTags.includes(tag.value));
      if (!hasMatchingTag) {
        return false;
      }
    }

    // Source filter (multi-select)
    if (filters.sources.length > 0 && !filters.sources.some(source => source.value === mcq.source)) {
      return false;
    }

    return true;
  });

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredMCQs.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredMCQs.map(mcq => mcq.questionId));
    }
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

  if (loading) {
    return (
      <div className="create-series-loading">
        <div className="loading-spinner">Loading MCQs...</div>
      </div>
    );
  }

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
          {filteredMCQs.length} MCQs found
        </span>
        <input
          type="text"
          className="search-line-small"
          placeholder="search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="select-all-btn"
          onClick={handleSelectAll}
        >
          {selectedQuestions.length === filteredMCQs.length && filteredMCQs.length > 0
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="flashcards-grid">
        {filteredMCQs.length === 0 ? (
          <div className="no-flashcards-message">
            No MCQs match your filters
          </div>
        ) : (
          filteredMCQs.map((mcq) => (
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
    </div>
  );
};

export default CreateMCQSeries;