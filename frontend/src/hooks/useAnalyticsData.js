import { useState, useCallback } from 'react';
import { seriesAPI, flashcardAPI } from '../services/api';
import { mcqSeriesAPI, mcqAPI } from '../services/mcqApi';

export const useAnalyticsData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rawData, setRawData] = useState({
    flashcardData: [],
    mcqData: [],
    allFlashcards: [],
    allMCQs: []
  });

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all data: series + actual card/question metadata
      const [flashcardResponse, mcqResponse, allFlashcardsResponse, allMCQsResponse] = await Promise.all([
        seriesAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        mcqSeriesAPI.getAll({ limit: 100 }).catch(() => ({ data: [] })),
        flashcardAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        mcqAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } }))
      ]);

      // Validate and extract data safely
      const flashcardData = Array.isArray(flashcardResponse?.data?.data)
        ? flashcardResponse.data.data
        : [];

      const mcqData = Array.isArray(mcqResponse?.data)
        ? mcqResponse.data
        : [];

      const allFlashcards = Array.isArray(allFlashcardsResponse?.data?.data)
        ? allFlashcardsResponse.data.data
        : [];

      const allMCQs = Array.isArray(allMCQsResponse?.data?.data)
        ? allMCQsResponse.data.data
        : [];

      // Create lookup maps by ID
      const flashcardLookup = {};
      allFlashcards.forEach(card => {
        flashcardLookup[card.cardId] = card;
      });

      const mcqLookup = {};
      allMCQs.forEach(mcq => {
        mcqLookup[mcq.questionId] = mcq;
      });


      setRawData({
        flashcardData,
        mcqData,
        allFlashcards,
        allMCQs,
        flashcardLookup,
        mcqLookup
      });

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    rawData,
    loading,
    error,
    fetchAnalyticsData
  };
};