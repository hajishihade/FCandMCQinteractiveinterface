import { useState, useMemo } from 'react';

export const useClientFiltering = (series, allFlashcards) => {
  const [filters, setFilters] = useState({
    subjects: [],
    chapters: [],
    sections: []
  });

  const [dropdownOpen, setDropdownOpen] = useState({
    subjects: false,
    chapters: false,
    sections: false
  });

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

  // Clear all filters
  const clearFilters = () => {
    setFilters({ subjects: [], chapters: [], sections: [] });
  };

  // Pre-process series data for performance (same as original)
  const processedSeries = useMemo(() =>
    filteredSeries.map(seriesItem => ({
      ...seriesItem,
      completedCount: seriesItem.sessions.filter(s => s.status === 'completed').length,
      activeSession: seriesItem.sessions.find(s => s.status === 'active')
    })), [filteredSeries]
  );

  return {
    filters,
    dropdownOpen,
    filteredSeries,
    processedSeries, // Add this crucial optimization
    handleFilterToggle,
    toggleDropdown,
    getDropdownText,
    clearFilters
  };
};