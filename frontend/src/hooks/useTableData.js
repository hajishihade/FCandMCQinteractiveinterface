import { useState, useCallback } from 'react';
// Using real API for database integration
import { tableSeriesAPI, tableQuizAPI } from '../services/tableQuizApi';

export const useTableData = () => {
  const [series, setSeries] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    chapters: [],
    sections: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch both table series and table quizzes for client-side filtering
      const [seriesResponse, tablesResponse] = await Promise.all([
        tableSeriesAPI.getAll({ limit: 100 }),
        tableQuizAPI.getAll({ limit: 100 })
      ]);

      // Validate table series response (following MCQ format)
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
      } else {
        console.error('Invalid table series API response format:', seriesResponse);
        setSeries([]);
      }

      // Validate table quizzes response and extract filter options
      console.log('Table Quiz Response structure:', tablesResponse);
      if (tablesResponse?.data && Array.isArray(tablesResponse.data)) {
        console.log('Table quizzes count:', tablesResponse.data.length);
        setAllTables(tablesResponse.data);

        // Extract unique filter options
        const subjects = [...new Set(tablesResponse.data.map(table => table.subject).filter(Boolean))];
        const chapters = [...new Set(tablesResponse.data.map(table => table.chapter).filter(Boolean))];
        const sections = [...new Set(tablesResponse.data.map(table => table.section).filter(Boolean))];

        setFilterOptions({
          subjects: subjects.sort(),
          chapters: chapters.sort(),
          sections: sections.sort()
        });

        console.log('Filter options:', {
          subjects: subjects.length,
          chapters: chapters.length,
          sections: sections.length
        });
      }

    } catch (error) {
      console.error('Failed to fetch table data:', error);
      setError('Failed to load table series data');
      setSeries([]);
      setAllTables([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    series,
    allTables,
    filterOptions,
    loading,
    error,
    fetchData
  };
};