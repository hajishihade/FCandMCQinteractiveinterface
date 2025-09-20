// Prefetch utility to load data before navigation
import { mcqSeriesAPI, mcqAPI } from '../services/mcqApi';
import { tableSeriesAPI, tableQuizAPI } from '../services/tableQuizApi';
import { seriesAPI, flashcardAPI } from '../services/api';
import { getCachedData, setCachedData, CACHE_KEYS } from './cache';

// Track what we're currently prefetching to avoid duplicates
const prefetchingMap = new Map();

export const prefetchMCQData = async () => {
  // If already cached or prefetching, skip
  if (getCachedData(CACHE_KEYS.MCQ_SERIES) || prefetchingMap.has('mcq')) {
    return;
  }

  prefetchingMap.set('mcq', true);
  console.log('[Prefetch] Starting MCQ data prefetch...');

  try {
    const [seriesResponse, mcqsResponse, filterResponse] = await Promise.all([
      mcqSeriesAPI.getAll({ limit: 100 }).catch(() => null),
      mcqAPI.getAll({ limit: 100 }).catch(() => null),
      mcqAPI.getFilterOptions().catch(() => null)
    ]);

    // Cache the responses
    if (seriesResponse?.data) {
      setCachedData(CACHE_KEYS.MCQ_SERIES, seriesResponse.data);
    }
    if (mcqsResponse?.data?.data) {
      setCachedData(CACHE_KEYS.MCQ_LIST, mcqsResponse.data.data);
    }
    if (filterResponse?.data?.data) {
      const filterData = filterResponse.data.data;
      setCachedData(CACHE_KEYS.MCQ_FILTER_OPTIONS, {
        subjects: filterData.subjects || [],
        chapters: filterData.chapters || [],
        sections: filterData.sections || []
      });
    }

    console.log('[Prefetch] MCQ data prefetched successfully');
  } catch (error) {
    console.error('[Prefetch] MCQ prefetch failed:', error);
  } finally {
    prefetchingMap.delete('mcq');
  }
};

export const prefetchTableData = async () => {
  if (getCachedData(CACHE_KEYS.TABLE_SERIES) || prefetchingMap.has('table')) {
    return;
  }

  prefetchingMap.set('table', true);
  console.log('[Prefetch] Starting Table data prefetch...');

  try {
    const [seriesResponse, tablesResponse] = await Promise.all([
      tableSeriesAPI.getAll({ limit: 100 }).catch(() => null),
      tableQuizAPI.getAll({ limit: 100 }).catch(() => null)
    ]);

    if (seriesResponse?.data) {
      setCachedData(CACHE_KEYS.TABLE_SERIES, seriesResponse.data);
    }
    if (tablesResponse?.data) {
      setCachedData(CACHE_KEYS.TABLE_LIST, tablesResponse.data);

      // Extract filter options
      const tables = tablesResponse.data;
      const subjects = [...new Set(tables.map(t => t.subject).filter(Boolean))];
      const chapters = [...new Set(tables.map(t => t.chapter).filter(Boolean))];
      const sections = [...new Set(tables.map(t => t.section).filter(Boolean))];

      setCachedData(CACHE_KEYS.TABLE_FILTER_OPTIONS, {
        subjects: subjects.sort(),
        chapters: chapters.sort(),
        sections: sections.sort()
      });
    }

    console.log('[Prefetch] Table data prefetched successfully');
  } catch (error) {
    console.error('[Prefetch] Table prefetch failed:', error);
  } finally {
    prefetchingMap.delete('table');
  }
};

export const prefetchFlashcardData = async () => {
  if (getCachedData(CACHE_KEYS.FLASHCARD_SERIES) || prefetchingMap.has('flashcard')) {
    return;
  }

  prefetchingMap.set('flashcard', true);
  console.log('[Prefetch] Starting Flashcard data prefetch...');

  try {
    const [seriesResponse, flashcardsResponse] = await Promise.all([
      seriesAPI.getAll({ limit: 100 }).catch(() => null),
      flashcardAPI.getAll({ limit: 100 }).catch(() => null)
    ]);

    if (seriesResponse?.data?.data) {
      setCachedData(CACHE_KEYS.FLASHCARD_SERIES, seriesResponse.data.data);
    }
    if (flashcardsResponse?.data?.data) {
      const flashcards = flashcardsResponse.data.data;
      setCachedData(CACHE_KEYS.FLASHCARD_LIST, flashcards);

      // Extract filter options
      const subjects = [...new Set(flashcards.map(fc => fc.subject).filter(Boolean))];
      const chapters = [...new Set(flashcards.map(fc => fc.chapter).filter(Boolean))];
      const sections = [...new Set(flashcards.map(fc => fc.section).filter(Boolean))];

      setCachedData(CACHE_KEYS.FLASHCARD_FILTER_OPTIONS, {
        subjects: subjects.sort(),
        chapters: chapters.sort(),
        sections: sections.sort()
      });
    }

    console.log('[Prefetch] Flashcard data prefetched successfully');
  } catch (error) {
    console.error('[Prefetch] Flashcard prefetch failed:', error);
  } finally {
    prefetchingMap.delete('flashcard');
  }
};

// Prefetch based on route
export const prefetchRoute = (route) => {
  switch (route) {
    case '/browse-mcq-series':
    case '/create-mcq-series':
      prefetchMCQData();
      break;
    case '/browse-table-series':
    case '/create-table-series':
      prefetchTableData();
      break;
    case '/browse-series':
    case '/create-series':
      prefetchFlashcardData();
      break;
  }
};