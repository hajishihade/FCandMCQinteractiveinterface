import { useState, useCallback } from 'react';
import { mcqSeriesAPI, mcqAPI } from '../services/mcqApi';

export const useMCQData = () => {
  const [series, setSeries] = useState([]);
  const [allMCQs, setAllMCQs] = useState([]);
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

      // Fetch both MCQ series and MCQs for client-side filtering
      const [seriesResponse, mcqsResponse] = await Promise.all([
        mcqSeriesAPI.getAll({ limit: 100 }),
        mcqAPI.getAll({ limit: 2000 }) // Increased to fetch all 1077+ questions
      ]);

      // Validate MCQ series response (Note: different response format)
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
      } else {
        console.error('Invalid MCQ series API response format:', seriesResponse);
        setSeries([]);
      }

      // Validate MCQs response and extract filter options
      console.log('MCQ Response structure:', mcqsResponse);
      if (mcqsResponse?.data?.data && Array.isArray(mcqsResponse.data.data)) {
        console.log('MCQs count:', mcqsResponse.data.data.length);
        setAllMCQs(mcqsResponse.data.data);

        // Extract unique filter options
        const subjects = [...new Set(mcqsResponse.data.data.map(mcq => mcq.subject).filter(Boolean))];
        const chapters = [...new Set(mcqsResponse.data.data.map(mcq => mcq.chapter).filter(Boolean))];
        const sections = [...new Set(mcqsResponse.data.data.map(mcq => mcq.section).filter(Boolean))];

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
    fetchData
  };
};