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

      // Fetch series, MCQs for display, AND all filter options separately
      const [seriesResponse, mcqsResponse, filterResponse] = await Promise.all([
        mcqSeriesAPI.getAll({ limit: 100 }),
        mcqAPI.getAll({ limit: 100 }), // Limited for display
        mcqAPI.getFilterOptions() // Get ALL filter options from entire database
      ]);

      // Validate MCQ series response (Note: different response format)
      if (seriesResponse?.data && Array.isArray(seriesResponse.data)) {
        setSeries(seriesResponse.data);
      } else {
        console.error('Invalid MCQ series API response format:', seriesResponse);
        setSeries([]);
      }

      // Validate MCQs response
      console.log('MCQ Response structure:', mcqsResponse);
      if (mcqsResponse?.data?.data && Array.isArray(mcqsResponse.data.data)) {
        console.log('MCQs count:', mcqsResponse.data.data.length);
        setAllMCQs(mcqsResponse.data.data);
      }

      // Use filter options from dedicated endpoint (includes ALL database values)
      console.log('Filter response in hook:', filterResponse);

      // Handle both response structures
      const filterData = filterResponse?.data?.data || filterResponse?.data || {};

      if (filterData.subjects || filterData.chapters || filterData.sections) {
        setFilterOptions({
          subjects: filterData.subjects || [],
          chapters: filterData.chapters || [],
          sections: filterData.sections || []
        });

        console.log('Filter options from database:', {
          subjects: filterData.subjects?.length || 0,
          chapters: filterData.chapters?.length || 0,
          sections: filterData.sections?.length || 0
        });
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
    fetchData
  };
};