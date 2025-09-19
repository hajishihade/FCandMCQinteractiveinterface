import { useMemo } from 'react';
import { analyticsCalculator } from '../utils/analyticsCalculator';

export const useAnalyticsCalculations = (rawData) => {
  const { flashcardData, mcqData, flashcardLookup, mcqLookup } = rawData;

  // Memoized analytics processing for performance
  const processedAnalytics = useMemo(() => {
    // Process data using analytics calculator with both lookups
    const processedFlashcards = analyticsCalculator.processFlashcardSeries(flashcardData, flashcardLookup);
    const processedMCQs = analyticsCalculator.processMCQSeries(mcqData, mcqLookup);

    // Calculate analytics from real data
    const overallStats = analyticsCalculator.calculateOverallAnalytics(processedFlashcards, processedMCQs);
    const activeSessions = analyticsCalculator.findActiveSessions(processedFlashcards, processedMCQs);
    const weakAreas = analyticsCalculator.findWeakAreas(processedFlashcards, processedMCQs);
    const formatStats = analyticsCalculator.calculateFormatComparison(processedFlashcards, processedMCQs);
    const subjectStats = analyticsCalculator.calculateSubjectAnalytics(processedFlashcards, processedMCQs, flashcardLookup, mcqLookup);

    return {
      ...overallStats,
      activeSessions,
      weakAreas,
      formatStats,
      subjectStats
    };
  }, [flashcardData, mcqData, flashcardLookup, mcqLookup]);

  // Fallback analytics when no data available
  const displayAnalytics = processedAnalytics ? processedAnalytics : {
    totalSeries: 0,
    totalSessions: 0,
    totalCards: 0,
    overallAccuracy: 0,
    studyTime: "0h 0m",
    activeSessions: [],
    weakAreas: [{ name: "No data yet", accuracy: 0, cardsToReview: 0 }],
    formatStats: {
      flashcards: { accuracy: 0 },
      mcq: { accuracy: 0 }
    },
    subjectStats: [{ name: "No data yet", accuracy: 0, totalCards: 0, type: 'unknown' }]
  };

  console.log('Processed analytics:', displayAnalytics);

  return {
    analytics: displayAnalytics
  };
};