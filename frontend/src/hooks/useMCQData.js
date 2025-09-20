/**
 * useMCQData Hook
 *
 * Central data management hook for MCQ features.
 * Handles fetching, caching, and state management for MCQ series,
 * questions, and filter options.
 *
 * Features:
 * - Intelligent caching with sessionStorage
 * - Lazy initialization from cache
 * - Parallel API calls for performance
 * - Graceful error handling
 * - Force refresh capability
 *
 * Performance optimizations:
 * - Initializes from cache to avoid loading state
 * - Batches API calls with Promise.all
 * - Caches data for 5 minutes
 * - Returns cached data instantly on repeat renders
 */

import { useState, useCallback, useEffect } from 'react';
import { mcqSeriesAPI, mcqAPI } from '../services/mcqApi';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';

/**
 * Hook for managing MCQ data with intelligent caching
 *
 * @returns {Object} MCQ data and operations
 * @returns {Array} series - List of MCQ series
 * @returns {Array} allMCQs - All MCQ questions
 * @returns {Object} filterOptions - Available filter options
 * @returns {boolean} loading - Loading state
 * @returns {string} error - Error message if any
 * @returns {Function} fetchData - Function to refresh data
 * @returns {Function} clearCache - Function to clear MCQ cache
 *
 * @example
 * const { series, loading, fetchData } = useMCQData();
 *
 * useEffect(() => {
 *   if (!series.length) fetchData();
 * }, []);
 */
export const useMCQData = () => {
  /**
   * Initialize state with cached data if available
   * Using lazy initialization to avoid unnecessary re-renders
   */
  const [series, setSeries] = useState(() => getCachedData(CACHE_KEYS.MCQ_SERIES) || []);
  const [allMCQs, setAllMCQs] = useState(() => getCachedData(CACHE_KEYS.MCQ_LIST) || []);
  const [filterOptions, setFilterOptions] = useState(() =>
    getCachedData(CACHE_KEYS.MCQ_FILTER_OPTIONS) || {
      subjects: [],
      chapters: [],
      sections: []
    }
  );

  /**
   * Loading state - starts false if we have cached data
   * This prevents loading spinners on cached page visits
   */
  const [loading, setLoading] = useState(() => {
    const hasCached = getCachedData(CACHE_KEYS.MCQ_SERIES) &&
                      getCachedData(CACHE_KEYS.MCQ_FILTER_OPTIONS);
    return !hasCached;
  });
  const [error, setError] = useState('');

  /**
   * Fetch MCQ data from API or cache
   * @param {boolean} forceRefresh - Skip cache and fetch fresh data
   */
  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Try cache first for instant loading
      if (!forceRefresh) {
        const cachedSeries = getCachedData(CACHE_KEYS.MCQ_SERIES);
        const cachedFilters = getCachedData(CACHE_KEYS.MCQ_FILTER_OPTIONS);
        const cachedMCQs = getCachedData(CACHE_KEYS.MCQ_LIST);

        if (cachedSeries && cachedFilters && cachedMCQs) {
          setSeries(cachedSeries);
          setFilterOptions(cachedFilters);
          setAllMCQs(cachedMCQs);
          setLoading(false);
          console.log('[MCQ Data] Using cached data');
          return;
        }
      }

      console.log('[MCQ Data] Fetching fresh data...');
      setLoading(true);
      setError('');

      // Fetch data with individual error handling
      const promises = [
        mcqSeriesAPI.getAll({ limit: 100 }).catch(err => {
          console.error('Series fetch failed:', err);
          return { data: [] };
        }),
        mcqAPI.getAll({ limit: 100 }).catch(err => {
          console.error('MCQs fetch failed:', err);
          return { data: { data: [] } };
        }),
        mcqAPI.getFilterOptions().catch(err => {
          console.error('Filter options fetch failed:', err);
          return { data: { data: {} } };
        })
      ];

      const [seriesResponse, mcqsResponse, filterResponse] = await Promise.all(promises);

      // Process and cache series
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
        setCachedData(CACHE_KEYS.MCQ_SERIES, seriesResponse.data);
        console.log('[MCQ Data] Cached series:', seriesResponse.data.length);
      } else {
        console.error('Invalid MCQ series API response format:', seriesResponse);
        setSeries([]);
      }

      // Process and cache MCQs
      if (mcqsResponse?.data?.data && Array.isArray(mcqsResponse.data.data)) {
        setAllMCQs(mcqsResponse.data.data);
        setCachedData(CACHE_KEYS.MCQ_LIST, mcqsResponse.data.data);
        console.log('[MCQ Data] Cached MCQs:', mcqsResponse.data.data.length);
      }

      // Process and cache filter options
      const filterData = filterResponse?.data?.data || filterResponse?.data || {};

      if (filterData.subjects || filterData.chapters || filterData.sections) {
        const options = {
          subjects: filterData.subjects || [],
          chapters: filterData.chapters || [],
          sections: filterData.sections || []
        };
        setFilterOptions(options);
        setCachedData(CACHE_KEYS.MCQ_FILTER_OPTIONS, options);
        console.log('[MCQ Data] Cached filter options');
      } else {
        console.error('No filter data found in response:', filterResponse);
      }

    } catch (error) {
      console.error('Failed to fetch MCQ data:', error);
      setError('Failed to load MCQ series data');
      setSeries([]);
      setAllMCQs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    series,
    allMCQs,
    filterOptions,
    loading,
    error,
    fetchData,
    clearCache: () => {
      sessionStorage.removeItem(CACHE_KEYS.MCQ_SERIES);
      sessionStorage.removeItem(CACHE_KEYS.MCQ_FILTER_OPTIONS);
      sessionStorage.removeItem(CACHE_KEYS.MCQ_LIST);
    }
  };
};