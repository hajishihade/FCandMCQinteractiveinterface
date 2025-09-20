import { useState, useCallback } from 'react';
// Using real API for database integration
import { tableSeriesAPI, tableQuizAPI } from '../services/tableQuizApi';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';

export const useTableData = () => {
  // Initialize with cached data if available
  const [series, setSeries] = useState(() => getCachedData(CACHE_KEYS.TABLE_SERIES) || []);
  const [allTables, setAllTables] = useState(() => getCachedData(CACHE_KEYS.TABLE_LIST) || []);
  const [filterOptions, setFilterOptions] = useState(() =>
    getCachedData(CACHE_KEYS.TABLE_FILTER_OPTIONS) || {
      subjects: [],
      chapters: [],
      sections: []
    }
  );

  // Start loading only if we don't have cached data
  const [loading, setLoading] = useState(() => {
    const hasCached = getCachedData(CACHE_KEYS.TABLE_SERIES) &&
                      getCachedData(CACHE_KEYS.TABLE_LIST);
    return !hasCached;
  });
  const [error, setError] = useState('');

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedSeries = getCachedData(CACHE_KEYS.TABLE_SERIES);
        const cachedTables = getCachedData(CACHE_KEYS.TABLE_LIST);
        const cachedFilters = getCachedData(CACHE_KEYS.TABLE_FILTER_OPTIONS);

        if (cachedSeries && cachedTables) {
          setSeries(cachedSeries);
          setAllTables(cachedTables);
          if (cachedFilters) setFilterOptions(cachedFilters);
          setLoading(false);
          console.log('[Table Data] Using cached data');
          return;
        }
      }

      console.log('[Table Data] Fetching fresh data...');
      setLoading(true);
      setError('');

      // Fetch both table series and table quizzes for client-side filtering
      const [seriesResponse, tablesResponse] = await Promise.all([
        tableSeriesAPI.getAll({ limit: 100 }),
        tableQuizAPI.getAll({ limit: 100 })
      ]);

      // Process and cache series
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
        setCachedData(CACHE_KEYS.TABLE_SERIES, seriesResponse.data);
        console.log('[Table Data] Cached series:', seriesResponse.data.length);
      } else {
        console.error('Invalid table series API response format:', seriesResponse);
        setSeries([]);
      }

      // Process and cache table quizzes
      console.log('Table Quiz Response structure:', tablesResponse);
      if (tablesResponse?.data && Array.isArray(tablesResponse.data)) {
        const tables = tablesResponse.data;
        console.log('Table quizzes count:', tables.length);
        setAllTables(tables);
        setCachedData(CACHE_KEYS.TABLE_LIST, tables);

        // Extract unique filter options
        const subjects = [...new Set(tables.map(table => table.subject).filter(Boolean))];
        const chapters = [...new Set(tables.map(table => table.chapter).filter(Boolean))];
        const sections = [...new Set(tables.map(table => table.section).filter(Boolean))];

        const options = {
          subjects: subjects.sort(),
          chapters: chapters.sort(),
          sections: sections.sort()
        };

        setFilterOptions(options);
        setCachedData(CACHE_KEYS.TABLE_FILTER_OPTIONS, options);
        console.log('[Table Data] Cached filter options');

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
    fetchData,
    clearCache: () => {
      sessionStorage.removeItem(CACHE_KEYS.TABLE_SERIES);
      sessionStorage.removeItem(CACHE_KEYS.TABLE_FILTER_OPTIONS);
      sessionStorage.removeItem(CACHE_KEYS.TABLE_LIST);
    }
  };
};