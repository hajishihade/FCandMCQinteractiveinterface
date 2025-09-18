import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import { flashcardAPI, seriesAPI, sessionAPI } from '../services/api';
import './CreateSeries.css';

const CreateSeries = () => {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [seriesTitle, setSeriesTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    sections: [],
    tags: []
  });

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      setLoading(true);
      const response = await flashcardAPI.getAll({ limit: 100 });
      setFlashcards(response.data.data);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      setError('Failed to load flashcards');
    } finally {
      setLoading(false);
    }
  };

  const toggleCardSelection = (cardId) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  // Get unique values for each filter level
  const getAvailableSubjects = () => {
    const subjects = [...new Set(flashcards.map(card => card.subject))];
    return subjects.map(subject => ({ value: subject, label: subject }));
  };

  const getAvailableChapters = () => {
    let relevantCards = flashcards;

    // Filter by selected subjects if any
    if (filters.subjects.length > 0) {
      relevantCards = relevantCards.filter(card =>
        filters.subjects.some(subject => subject.value === card.subject)
      );
    }

    const chapters = [...new Set(relevantCards.map(card => card.chapter).filter(Boolean))];
    return chapters.map(chapter => ({ value: chapter, label: chapter }));
  };

  const getAvailableSections = () => {
    let relevantCards = flashcards;

    // Filter by selected subjects if any
    if (filters.subjects.length > 0) {
      relevantCards = relevantCards.filter(card =>
        filters.subjects.some(subject => subject.value === card.subject)
      );
    }

    // Filter by selected chapters if any
    if (filters.chapters.length > 0) {
      relevantCards = relevantCards.filter(card =>
        filters.chapters.some(chapter => chapter.value === card.chapter)
      );
    }

    const sections = [...new Set(relevantCards.map(card => card.section).filter(Boolean))];
    return sections.map(section => ({ value: section, label: section }));
  };

  const getAvailableTags = () => {
    // Tags are independent - show all available tags from all flashcards
    const tags = [...new Set(flashcards.flatMap(card => card.tags || []).filter(Boolean))];
    return tags.map(tag => ({ value: tag, label: tag }));
  };

  // Filter flashcards based on all criteria
  const filteredFlashcards = flashcards.filter(card => {
    // Search filter
    if (searchTerm && !card.frontText.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Subject filter (multi-select)
    if (filters.subjects.length > 0 && !filters.subjects.some(subject => subject.value === card.subject)) {
      return false;
    }

    // Chapter filter (multi-select)
    if (filters.chapters.length > 0 && !filters.chapters.some(chapter => chapter.value === card.chapter)) {
      return false;
    }

    // Section filter (multi-select)
    if (filters.sections.length > 0 && !filters.sections.some(section => section.value === card.section)) {
      return false;
    }

    // Tags filter (multi-select)
    if (filters.tags.length > 0) {
      const cardTags = card.tags || [];
      const hasMatchingTag = filters.tags.some(tag => cardTags.includes(tag.value));
      if (!hasMatchingTag) {
        return false;
      }
    }

    return true;
  });

  const handleSelectAll = () => {
    if (selectedCards.length === filteredFlashcards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(filteredFlashcards.map(card => card.cardId));
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

    if (selectedCards.length === 0) {
      setError('Please select at least one flashcard');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Step 1: Create the series
      const seriesResponse = await seriesAPI.create(trimmedTitle);
      const seriesId = seriesResponse.data.data.seriesId;

      // Step 2: Automatically create first session with selected cards
      const sessionResponse = await sessionAPI.start(seriesId, selectedCards);
      const sessionId = sessionResponse.data.data.sessionId;

      // Step 3: Navigate to study the first session
      navigate('/study', {
        state: {
          seriesId,
          sessionId,
          mode: 'continue' // Use continue mode since session is created
        }
      });

    } catch (error) {
      console.error('Error creating series:', error);
      setError(error.response?.data?.message || 'Failed to create series');
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
        <div className="loading-spinner">Loading flashcards...</div>
      </div>
    );
  }

  return (
    <div className="create-series-container">
      <div className="create-series-header">
        <button
          onClick={() => navigate('/browse-series')}
          className="back-btn"
        >
          ←
        </button>
      </div>

      <div className="series-creation-line">
        <input
          type="text"
          className="series-title-line"
          placeholder="Enter the name of the series you want to create here and choose the cards"
          value={seriesTitle}
          onChange={(e) => setSeriesTitle(e.target.value)}
          maxLength={100}
        />
        <button
          onClick={handleCreateSeries}
          disabled={selectedCards.length === 0 || !seriesTitle.trim() || creating}
          className="start-btn-minimal"
        >
          {creating ? 'Creating...' : `Start (${selectedCards.length})`}
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
              // Keep tags - they're independent
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
              // Keep tags - they're independent
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
              // Don't reset tags - they're independent
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
        </div>
      </div>

      <div className="filter-summary">
        <span className="filter-count">
          {filteredFlashcards.length} flashcards found
        </span>
        <input
          type="text"
          className="search-line-small"
          placeholder="search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          className="select-all-btn"
          onClick={handleSelectAll}
        >
          {selectedCards.length === filteredFlashcards.length && filteredFlashcards.length > 0
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
        {filteredFlashcards.length === 0 ? (
          <div className="no-flashcards-message">
            No flashcards match your filters
          </div>
        ) : (
          filteredFlashcards.map((card) => (
          <div
            key={card.cardId}
            className={`flashcard-item ${selectedCards.includes(card.cardId) ? 'selected' : ''}`}
            onClick={() => toggleCardSelection(card.cardId)}
          >
            <div className="card-header">
              <input
                type="checkbox"
                checked={selectedCards.includes(card.cardId)}
                onChange={() => toggleCardSelection(card.cardId)}
                className="card-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="card-content">
              <h3 className="card-front">{card.frontText}</h3>
            </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default CreateSeries;