import { useState, useCallback } from 'react';
import { seriesAPI, flashcardAPI } from '../services/api';
import { getCachedData, setCachedData, CACHE_KEYS } from '../utils/cache';

export const useSeriesData = () => {
  // Initialize with cached data if available
  const [series, setSeries] = useState(() => getCachedData(CACHE_KEYS.FLASHCARD_SERIES) || []);
  const [allFlashcards, setAllFlashcards] = useState(() => getCachedData(CACHE_KEYS.FLASHCARD_LIST) || []);
  const [filterOptions, setFilterOptions] = useState(() =>
    getCachedData(CACHE_KEYS.FLASHCARD_FILTER_OPTIONS) || {
      subjects: [],
      chapters: [],
      sections: []
    }
  );

  // Start loading only if we don't have cached data
  const [loading, setLoading] = useState(() => {
    const hasCached = getCachedData(CACHE_KEYS.FLASHCARD_SERIES) &&
                      getCachedData(CACHE_KEYS.FLASHCARD_LIST);
    return !hasCached;
  });
  const [error, setError] = useState('');

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedSeries = getCachedData(CACHE_KEYS.FLASHCARD_SERIES);
        const cachedFlashcards = getCachedData(CACHE_KEYS.FLASHCARD_LIST);
        const cachedFilters = getCachedData(CACHE_KEYS.FLASHCARD_FILTER_OPTIONS);

        if (cachedSeries && cachedFlashcards) {
          setSeries(cachedSeries);
          setAllFlashcards(cachedFlashcards);
          if (cachedFilters) setFilterOptions(cachedFilters);
          setLoading(false);
          console.log('[Series Data] Using cached data');
          return;
        }
      }

      console.log('[Series Data] Fetching fresh data...');
      setLoading(true);
      setError('');

      // Fetch both series and flashcards for client-side filtering
      const [seriesResponse, flashcardsResponse] = await Promise.all([
        seriesAPI.getAll({ limit: 100 }),
        flashcardAPI.getAll({ limit: 100 })
      ]);

      // Process and cache series
      if (seriesResponse?.data?.data && Array.isArray(seriesResponse.data.data)) {
        setSeries(seriesResponse.data.data);
        setCachedData(CACHE_KEYS.FLASHCARD_SERIES, seriesResponse.data.data);
        console.log('[Series Data] Cached series:', seriesResponse.data.data.length);
      } else {
        console.error('Invalid series API response format:', seriesResponse);
        setSeries([]);
      }

      // Process and cache flashcards
      if (flashcardsResponse?.data?.data && Array.isArray(flashcardsResponse.data.data)) {
        const flashcards = flashcardsResponse.data.data;
        setAllFlashcards(flashcards);
        setCachedData(CACHE_KEYS.FLASHCARD_LIST, flashcards);
        console.log('[Series Data] Cached flashcards:', flashcards.length);

        // Extract filter options from flashcards
        const subjects = [...new Set(flashcards.map(fc => fc.subject).filter(Boolean))].sort();
        const chapters = [...new Set(flashcards.map(fc => fc.chapter).filter(Boolean))].sort();
        const sections = [...new Set(flashcards.map(fc => fc.section).filter(Boolean))].sort();

        const options = { subjects, chapters, sections };
        setFilterOptions(options);
        setCachedData(CACHE_KEYS.FLASHCARD_FILTER_OPTIONS, options);
        console.log('[Series Data] Cached filter options');
      }

    } catch (error) {
      console.error('Failed to fetch series data:', error);
      setError('Failed to load series data');
      setSeries([]);
      setAllFlashcards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    series,
    allFlashcards,
    filterOptions,
    loading,
    error,
    fetchData,
    clearCache: () => {
      sessionStorage.removeItem(CACHE_KEYS.FLASHCARD_SERIES);
      sessionStorage.removeItem(CACHE_KEYS.FLASHCARD_FILTER_OPTIONS);
      sessionStorage.removeItem(CACHE_KEYS.FLASHCARD_LIST);
    }
  };
};