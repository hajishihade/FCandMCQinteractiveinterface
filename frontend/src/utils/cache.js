// Simple cache utility for storing API responses
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getCachedData = (key) => {
  try {
    const cached = sessionStorage.getItem(key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log(`[Cache] Hit: ${key}`);
        return data;
      } else {
        console.log(`[Cache] Expired: ${key}`);
        sessionStorage.removeItem(key);
      }
    }
    console.log(`[Cache] Miss: ${key}`);
  } catch (error) {
    console.error('[Cache] Read error:', error);
  }
  return null;
};

export const setCachedData = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log(`[Cache] Set: ${key}`);
  } catch (error) {
    console.error('[Cache] Write error:', error);
  }
};

export const clearCache = (prefix = '') => {
  const keys = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (prefix ? key.startsWith(prefix) : true) {
      keys.push(key);
    }
  }
  keys.forEach(key => sessionStorage.removeItem(key));
  console.log(`[Cache] Cleared ${keys.length} items`);
};

export const CACHE_KEYS = {
  MCQ_SERIES: 'mcq_series_cache',
  MCQ_FILTER_OPTIONS: 'mcq_filter_options_cache',
  MCQ_LIST: 'mcq_list_cache',
  TABLE_SERIES: 'table_series_cache',
  TABLE_FILTER_OPTIONS: 'table_filter_options_cache',
  TABLE_LIST: 'table_list_cache',
  FLASHCARD_SERIES: 'flashcard_series_cache',
  FLASHCARD_FILTER_OPTIONS: 'flashcard_filter_options_cache',
  FLASHCARD_LIST: 'flashcard_list_cache'
};