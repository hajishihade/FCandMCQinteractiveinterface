import { useMemo } from 'react';

export const useSessionAnalytics = (sessionData, itemsWithContent, isFlashcard) => {
  const analytics = useMemo(() => {
    if (!sessionData || !itemsWithContent.length) {
      return {
        overviewStats: {
          totalItems: 0,
          correctItems: 0,
          accuracy: 0,
          totalTime: 0,
          averageTime: 0
        },
        performanceBreakdown: {
          correct: 0,
          incorrect: 0,
          easyCount: 0,
          mediumCount: 0,
          hardCount: 0,
          highConfidenceCount: 0,
          lowConfidenceCount: 0
        },
        timeAnalysis: {
          fastestItem: null,
          slowestItem: null,
          timeDistribution: []
        },
        subjectBreakdown: {}
      };
    }

    const totalItems = itemsWithContent.length;

    // Calculate correct items (fixed logic)
    const correctItems = itemsWithContent.filter(item => {
      if (isFlashcard) {
        return item.interaction?.result === 'Right';
      } else {
        return item.interaction?.isCorrect === true;
      }
    }).length;

    const incorrectItems = totalItems - correctItems;

    // Calculate time stats
    const totalTime = itemsWithContent.reduce((sum, item) => sum + (item.interaction?.timeSpent || 0), 0);
    const averageTime = totalItems > 0 ? (totalTime / totalItems) : 0;

    // Difficulty distribution (fixed field name)
    const easyCount = itemsWithContent.filter(item => item.interaction?.difficulty === 'Easy').length;
    const mediumCount = itemsWithContent.filter(item => item.interaction?.difficulty === 'Medium').length;
    const hardCount = itemsWithContent.filter(item => item.interaction?.difficulty === 'Hard').length;

    // Confidence distribution (FIXED BUG)
    const highConfidenceCount = itemsWithContent.filter(item =>
      item.interaction?.confidenceWhileSolving === 'High'  // ✅ CORRECT FIELD NAME
    ).length;
    const lowConfidenceCount = itemsWithContent.filter(item =>
      item.interaction?.confidenceWhileSolving === 'Low'   // ✅ CORRECT FIELD NAME
    ).length;

    // Find fastest and slowest items
    const sortedByTime = [...itemsWithContent]
      .filter(item => item.interaction?.timeSpent)
      .sort((a, b) => a.interaction.timeSpent - b.interaction.timeSpent);

    const fastestItem = sortedByTime[0] || null;
    const slowestItem = sortedByTime[sortedByTime.length - 1] || null;

    // Subject breakdown
    const subjectBreakdown = {};
    itemsWithContent.forEach(item => {
      const subject = item.content?.subject || 'Unknown Subject';
      if (!subjectBreakdown[subject]) {
        subjectBreakdown[subject] = { total: 0, correct: 0, totalTime: 0 };
      }
      subjectBreakdown[subject].total++;
      subjectBreakdown[subject].totalTime += item.interaction?.timeSpent || 0;

      if (isFlashcard) {
        if (item.interaction?.result === 'Right') {
          subjectBreakdown[subject].correct++;
        }
      } else {
        if (item.interaction?.isCorrect === true) {
          subjectBreakdown[subject].correct++;
        }
      }
    });

    // Calculate subject accuracies
    Object.keys(subjectBreakdown).forEach(subject => {
      const data = subjectBreakdown[subject];
      data.accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
      data.averageTime = data.total > 0 ? Math.round(data.totalTime / data.total) : 0;
    });

    console.log('=== SESSION ANALYTICS DEBUG ===');
    console.log('Total items:', totalItems);
    console.log('Correct items:', correctItems);
    console.log('Incorrect items:', incorrectItems);
    console.log('Confidence counts:', { highConfidenceCount, lowConfidenceCount });
    console.log('Subject breakdown:', subjectBreakdown);

    return {
      // Flatten structure for easier access
      totalItems,
      correctItems,
      incorrectItems,
      accuracy: totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0,
      totalTime,
      averageTime: Math.round(averageTime),
      easyCount,
      mediumCount,
      hardCount,
      highConfidenceCount,
      lowConfidenceCount,
      timeAnalysis: {
        fastestItem,
        slowestItem,
        timeDistribution: sortedByTime
      },
      subjectBreakdown
    };
  }, [sessionData, itemsWithContent, isFlashcard]);

  return analytics;
};