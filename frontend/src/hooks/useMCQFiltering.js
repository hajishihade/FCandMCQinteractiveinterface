import { useState, useMemo } from 'react';

export const useMCQFiltering = (series, allMCQs) => {
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

  // Client-side filtering logic (MCQ adaptation)
  const filteredSeries = useMemo(() => {
    if (!series.length || !allMCQs.length) return series;

    // If no filters applied, return all series
    if (filters.subjects.length === 0 && filters.chapters.length === 0 && filters.sections.length === 0) {
      return series;
    }

    // Create MCQ lookup map (questionId instead of cardId)
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