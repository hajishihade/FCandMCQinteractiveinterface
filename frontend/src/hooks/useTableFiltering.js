import { useState, useMemo } from 'react';

export const useTableFiltering = (series, allTables) => {
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

  // Client-side filtering logic (following MCQ pattern)
  const filteredSeries = useMemo(() => {
    if (!series.length || !allTables.length) return series;

    // If no filters applied, return all series
    if (filters.subjects.length === 0 && filters.chapters.length === 0 && filters.sections.length === 0) {
      return series;
    }

    // Create table lookup map (tableId instead of questionId)
    const tableLookup = {};
    allTables.forEach(table => {
      tableLookup[table.tableId] = table;
    });

    return series.filter(seriesItem => {
      // Extract all tableIds from all sessions in this series
      const allTableIds = [];
      seriesItem.sessions?.forEach(session => {
        session.tables?.forEach(table => {
          if (typeof table.tableId === 'number') {
            allTableIds.push(table.tableId);
          }
        });
      });

      if (allTableIds.length === 0) return false;

      // Get unique tableIds and their table data
      const uniqueTableIds = [...new Set(allTableIds)];
      const seriesTables = uniqueTableIds
        .map(tableId => tableLookup[tableId])
        .filter(Boolean);

      if (seriesTables.length === 0) return false;

      // Check if series matches filter criteria
      let matchesFilter = true;

      // Subject filter - series must contain tables with ANY of the selected subjects
      if (filters.subjects.length > 0) {
        matchesFilter = matchesFilter && seriesTables.some(table =>
          filters.subjects.includes(table.subject)
        );
      }

      // Chapter filter - series must contain tables with ANY of the selected chapters
      if (filters.chapters.length > 0) {
        matchesFilter = matchesFilter && seriesTables.some(table =>
          filters.chapters.includes(table.chapter)
        );
      }

      // Section filter - series must contain tables with ANY of the selected sections
      if (filters.sections.length > 0) {
        matchesFilter = matchesFilter && seriesTables.some(table =>
          filters.sections.includes(table.section)
        );
      }

      return matchesFilter;
    });
  }, [series, allTables, filters]);

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

  // Pre-process series data for performance (same as MCQ)
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
    processedSeries,
    handleFilterToggle,
    toggleDropdown,
    getDropdownText,
    clearFilters
  };
};