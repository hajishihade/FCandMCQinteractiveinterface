// Analytics Calculator - Process real session data safely

export const analyticsCalculator = {
  // Process flashcard series data
  processFlashcardSeries: (series) => {
    if (!Array.isArray(series)) return [];

    return series.map(seriesItem => {
      const sessions = seriesItem.sessions || [];
      const allCards = [];

      // Extract all interactions from all sessions
      sessions.forEach(session => {
        if (session.cards && Array.isArray(session.cards)) {
          session.cards.forEach(card => {
            if (card.interaction) {
              allCards.push({
                cardId: card.cardId,
                result: card.interaction.result,
                difficulty: card.interaction.difficulty,
                confidenceWhileSolving: card.interaction.confidenceWhileSolving,
                timeSpent: card.interaction.timeSpent || 0,
                sessionId: session.sessionId,
                seriesTitle: seriesItem.title,
                completedAt: session.completedAt
              });
            }
          });
        }
      });

      // Calculate series-level stats
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const totalTime = allCards.reduce((sum, card) => sum + card.timeSpent, 0);
      const correctCards = allCards.filter(card => card.result === 'Right').length;
      const accuracy = allCards.length > 0 ? Math.round((correctCards / allCards.length) * 100) : 0;

      return {
        ...seriesItem,
        processedStats: {
          totalInteractions: allCards.length,
          completedSessions,
          totalTimeSpent: totalTime,
          accuracy,
          averageTimePerCard: allCards.length > 0 ? Math.round(totalTime / allCards.length) : 0,
          interactions: allCards
        }
      };
    });
  },

  // Process MCQ series data
  processMCQSeries: (series) => {
    if (!Array.isArray(series)) return [];

    return series.map(seriesItem => {
      const sessions = seriesItem.sessions || [];
      const allQuestions = [];

      // Extract all interactions from all sessions
      sessions.forEach(session => {
        if (session.questions && Array.isArray(session.questions)) {
          session.questions.forEach(question => {
            if (question.interaction) {
              allQuestions.push({
                questionId: question.questionId,
                isCorrect: question.interaction.isCorrect,
                difficulty: question.interaction.difficulty,
                confidenceWhileSolving: question.interaction.confidenceWhileSolving,
                timeSpent: question.interaction.timeSpent || 0,
                sessionId: session.sessionId,
                seriesTitle: seriesItem.title,
                completedAt: session.completedAt
              });
            }
          });
        }
      });

      // Calculate series-level stats
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const totalTime = allQuestions.reduce((sum, q) => sum + q.timeSpent, 0);
      const correctQuestions = allQuestions.filter(q => q.isCorrect).length;
      const accuracy = allQuestions.length > 0 ? Math.round((correctQuestions / allQuestions.length) * 100) : 0;

      return {
        ...seriesItem,
        processedStats: {
          totalInteractions: allQuestions.length,
          completedSessions,
          totalTimeSpent: totalTime,
          accuracy,
          averageTimePerQuestion: allQuestions.length > 0 ? Math.round(totalTime / allQuestions.length) : 0,
          interactions: allQuestions
        }
      };
    });
  },

  // Calculate overall analytics from processed series data
  calculateOverallAnalytics: (flashcardSeries, mcqSeries) => {
    const allFlashcardData = flashcardSeries.flatMap(s => s.processedStats?.interactions || []);
    const allMCQData = mcqSeries.flatMap(s => s.processedStats?.interactions || []);
    const allInteractions = [...allFlashcardData, ...allMCQData];

    if (allInteractions.length === 0) {
      return {
        totalSeries: flashcardSeries.length + mcqSeries.length,
        totalSessions: 0,
        totalCards: 0,
        overallAccuracy: 0,
        studyTime: "0h 0m",
        improvement: "0%"
      };
    }

    // Calculate overall stats
    const totalSessions = flashcardSeries.reduce((sum, s) => sum + (s.processedStats?.completedSessions || 0), 0) +
                         mcqSeries.reduce((sum, s) => sum + (s.processedStats?.completedSessions || 0), 0);

    const totalTime = allInteractions.reduce((sum, item) => sum + item.timeSpent, 0);

    const correctCount = allFlashcardData.filter(card => card.result === 'Right').length +
                        allMCQData.filter(q => q.isCorrect).length;

    const overallAccuracy = Math.round((correctCount / allInteractions.length) * 100);

    return {
      totalSeries: flashcardSeries.length + mcqSeries.length,
      totalSessions,
      totalCards: allInteractions.length,
      overallAccuracy,
      studyTime: this.formatTime(totalTime),
      improvement: this.calculateImprovement(allInteractions),
      allInteractions
    };
  },

  // Calculate weekly progress from interaction data
  calculateWeeklyProgress: (allInteractions) => {
    if (!Array.isArray(allInteractions) || allInteractions.length === 0) {
      return [0, 0, 0, 0, 0]; // 5 weeks of zeros
    }

    // Group interactions by week
    const weeks = {};
    const now = new Date();

    allInteractions.forEach(interaction => {
      if (interaction.completedAt) {
        const date = new Date(interaction.completedAt);
        const weekAgo = Math.floor((now - date) / (7 * 24 * 60 * 60 * 1000));

        if (weekAgo >= 0 && weekAgo < 5) {
          if (!weeks[weekAgo]) {
            weeks[weekAgo] = { total: 0, correct: 0 };
          }
          weeks[weekAgo].total++;

          // Check if correct (handle both flashcard and MCQ format)
          if (interaction.result === 'Right' || interaction.isCorrect === true) {
            weeks[weekAgo].correct++;
          }
        }
      }
    });

    // Calculate accuracy for each week (most recent first)
    const weeklyAccuracy = [];
    for (let i = 4; i >= 0; i--) {
      if (weeks[i] && weeks[i].total > 0) {
        weeklyAccuracy.push(Math.round((weeks[i].correct / weeks[i].total) * 100));
      } else {
        weeklyAccuracy.push(0);
      }
    }

    return weeklyAccuracy;
  },

  // Find top performing series
  findTopSeries: (flashcardSeries, mcqSeries) => {
    const allSeries = [...flashcardSeries, ...mcqSeries]
      .filter(s => s.processedStats && s.processedStats.totalInteractions > 0)
      .map(s => ({
        name: s.title,
        accuracy: s.processedStats.accuracy,
        sessions: s.processedStats.completedSessions
      }))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 3);

    return allSeries.length > 0 ? allSeries : [
      { name: "No data yet", accuracy: 0, sessions: 0 }
    ];
  },

  // Find areas needing attention
  findWeakAreas: (flashcardSeries, mcqSeries) => {
    const allSeries = [...flashcardSeries, ...mcqSeries]
      .filter(s => s.processedStats && s.processedStats.totalInteractions > 0)
      .map(s => ({
        name: s.title,
        accuracy: s.processedStats.accuracy,
        cardsToReview: Math.max(1, Math.floor(s.processedStats.totalInteractions * (100 - s.processedStats.accuracy) / 100))
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    return allSeries.length > 0 ? allSeries : [
      { name: "No data yet", accuracy: 0, cardsToReview: 0 }
    ];
  },

  // Calculate study habits
  calculateStudyHabits: (flashcardSeries, mcqSeries) => {
    const allSessions = [...flashcardSeries, ...mcqSeries]
      .flatMap(s => s.sessions || [])
      .filter(session => session.completedAt);

    if (allSessions.length === 0) {
      return {
        streak: 0,
        averageSessionLength: "0 minutes",
        preferredTime: "Unknown",
        consistency: 0
      };
    }

    // Calculate average session length
    const avgTime = allSessions.reduce((sum, session) => {
      const start = new Date(session.startedAt);
      const end = new Date(session.completedAt);
      return sum + (end - start);
    }, 0) / allSessions.length;

    const avgMinutes = Math.round(avgTime / (1000 * 60));

    // Calculate study streak (simplified)
    const recentSessions = allSessions
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 7);

    return {
      streak: recentSessions.length,
      averageSessionLength: `${avgMinutes} minutes`,
      preferredTime: "Evening", // Could be calculated from timestamps
      consistency: Math.min(100, Math.round((recentSessions.length / 7) * 100))
    };
  },

  // Calculate format comparison
  calculateFormatComparison: (flashcardSeries, mcqSeries) => {
    const flashcardStats = this.calculateFormatStats(flashcardSeries, 'flashcard');
    const mcqStats = this.calculateFormatStats(mcqSeries, 'mcq');

    return {
      flashcards: flashcardStats,
      mcq: mcqStats
    };
  },

  // Helper: Calculate stats for a specific format
  calculateFormatStats: (series, format) => {
    const allInteractions = series.flatMap(s => s.processedStats?.interactions || []);

    if (allInteractions.length === 0) {
      return { accuracy: 0, efficiency: "0 items/min" };
    }

    const correctCount = format === 'flashcard'
      ? allInteractions.filter(item => item.result === 'Right').length
      : allInteractions.filter(item => item.isCorrect).length;

    const accuracy = Math.round((correctCount / allInteractions.length) * 100);

    const totalTime = allInteractions.reduce((sum, item) => sum + item.timeSpent, 0);
    const efficiency = totalTime > 0
      ? (allInteractions.length / (totalTime / 60)).toFixed(1)
      : "0";

    return {
      accuracy,
      efficiency: `${efficiency} ${format === 'flashcard' ? 'cards' : 'questions'}/min`
    };
  },

  // Helper: Format time from seconds to readable string
  formatTime: (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  // Helper: Calculate improvement trend (simplified)
  calculateImprovement: (allInteractions) => {
    if (!Array.isArray(allInteractions) || allInteractions.length < 10) {
      return "0%";
    }

    // Compare recent vs older performance
    const sorted = allInteractions
      .filter(item => item.completedAt)
      .sort((a, b) => new Date(a.completedAt) - new Date(b.completedAt));

    const older = sorted.slice(0, Math.floor(sorted.length / 2));
    const recent = sorted.slice(Math.floor(sorted.length / 2));

    const olderAccuracy = this.calculateAccuracyForGroup(older);
    const recentAccuracy = this.calculateAccuracyForGroup(recent);

    const improvement = recentAccuracy - olderAccuracy;
    return improvement > 0 ? `+${improvement.toFixed(1)}%` : `${improvement.toFixed(1)}%`;
  },

  // Helper: Calculate accuracy for a group of interactions
  calculateAccuracyForGroup: (interactions) => {
    if (interactions.length === 0) return 0;

    const correct = interactions.filter(item =>
      item.result === 'Right' || item.isCorrect === true
    ).length;

    return (correct / interactions.length) * 100;
  }
};