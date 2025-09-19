import { useState, useCallback } from 'react';
import { seriesAPI, flashcardAPI } from '../services/api';

export const useSeriesData = () => {
  const [series, setSeries] = useState([]);
  const [allFlashcards, setAllFlashcards] = useState([]);
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

      // Fetch both series and flashcards for client-side filtering
      const [seriesResponse, flashcardsResponse] = await Promise.all([
        seriesAPI.getAll({ limit: 100 }),
        flashcardAPI.getAll({ limit: 100 })
      ]);

      // Validate series response
      if (seriesResponse?.data?.data && Array.isArray(seriesResponse.data.data)) {
        setSeries(seriesResponse.data.data);
      } else {
        console.error('Invalid series API response format:', seriesResponse);
        setSeries([]);
      }

      // Validate flashcards response and extract filter options
      if (flashcardsResponse?.data?.data && Array.isArray(flashcardsResponse.data.data)) {
        setAllFlashcards(flashcardsResponse.data.data);

        // Extract unique filter options
        const subjects = [...new Set(flashcardsResponse.data.data.map(card => card.subject).filter(Boolean))];
        const chapters = [...new Set(flashcardsResponse.data.data.map(card => card.chapter).filter(Boolean))];
        const sections = [...new Set(flashcardsResponse.data.data.map(card => card.section).filter(Boolean))];

        setFilterOptions({
          subjects: subjects.sort(),
          chapters: chapters.sort(),
          sections: sections.sort()
        });
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
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
    fetchData
  };
};