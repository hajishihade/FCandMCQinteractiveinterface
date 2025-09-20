// Analytics Calculator - Process real session data safely

export const analyticsCalculator = {
  // Process flashcard series data
  processFlashcardSeries: (series, flashcardLookup = {}) => {
    if (!Array.isArray(series)) return [];

    return series.map(seriesItem => {
      const sessions = seriesItem.sessions || [];
      const allInteractions = [];

      // Extract all interactions from all completed sessions
      sessions.forEach(session => {
        if (session.status === 'completed' && session.cards && Array.isArray(session.cards)) {
          session.cards.forEach(card => {
            if (card.interaction) {
              const flashcardData = flashcardLookup[card.cardId];
              console.log(`Looking up cardId ${card.cardId}:`, flashcardData);
              allInteractions.push({
                cardId: card.cardId,
                result: card.interaction.result,
                difficulty: card.interaction.difficulty,
                confidenceWhileSolving: card.interaction.confidenceWhileSolving,
                timeSpent: card.interaction.timeSpent || 0,
                sessionId: session.sessionId,
                seriesTitle: seriesItem.title,
                subject: flashcardData?.subject || 'Unknown Subject',
                chapter: flashcardData?.chapter || 'Unknown Chapter',
                section: flashcardData?.section || 'Unknown Section',
                completedAt: session.completedAt,
                startedAt: session.startedAt
              });
            }
          });
        }
      });

      // Calculate series-level stats
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const totalTime = allInteractions.reduce((sum, interaction) => sum + interaction.timeSpent, 0);
      const correctInteractions = allInteractions.filter(interaction => interaction.result === 'Right').length;
      const accuracy = allInteractions.length > 0 ? Math.round((correctInteractions / allInteractions.length) * 100) : 0;

      return {
        ...seriesItem,
        processedStats: {
          totalInteractions: allInteractions.length,
          completedSessions,
          totalTimeSpent: totalTime,
          accuracy,
          averageTimePerCard: allInteractions.length > 0 ? Math.round(totalTime / allInteractions.length) : 0,
          interactions: allInteractions
        }
      };
    });
  },

  // Process MCQ series data
  processMCQSeries: (series, mcqLookup = {}) => {
    if (!Array.isArray(series)) return [];

    return series.map(seriesItem => {
      const sessions = seriesItem.sessions || [];
      const allInteractions = [];

      // Extract all interactions from all completed sessions
      sessions.forEach(session => {
        if (session.status === 'completed' && session.questions && Array.isArray(session.questions)) {
          session.questions.forEach(question => {
            if (question.interaction) {
              const mcqData = mcqLookup[question.questionId];
              console.log(`Looking up MCQ questionId ${question.questionId}:`, mcqData);
              allInteractions.push({
                questionId: question.questionId,
                isCorrect: question.interaction.isCorrect,
                selectedAnswer: question.interaction.selectedAnswer,
                difficulty: question.interaction.difficulty,
                confidenceWhileSolving: question.interaction.confidenceWhileSolving,
                timeSpent: question.interaction.timeSpent || 0,
                sessionId: session.sessionId,
                seriesTitle: seriesItem.title,
                subject: mcqData?.subject || 'Unknown Subject',
                chapter: mcqData?.chapter || 'Unknown Chapter',
                section: mcqData?.section || 'Unknown Section',
                completedAt: session.completedAt,
                startedAt: session.startedAt
              });
            }
          });
        }
      });

      // Calculate series-level stats
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      const totalTime = allInteractions.reduce((sum, interaction) => sum + interaction.timeSpent, 0);
      const correctInteractions = allInteractions.filter(interaction => interaction.isCorrect).length;
      const accuracy = allInteractions.length > 0 ? Math.round((correctInteractions / allInteractions.length) * 100) : 0;

      return {
        ...seriesItem,
        processedStats: {
          totalInteractions: allInteractions.length,
          completedSessions,
          totalTimeSpent: totalTime,
          accuracy,
          averageTimePerQuestion: allInteractions.length > 0 ? Math.round(totalTime / allInteractions.length) : 0,
          interactions: allInteractions
        }
      };
    });
  },

  // Calculate overall analytics from processed series data
  calculateOverallAnalytics: (flashcardSeries, mcqSeries) => {

    const allFlashcardData = flashcardSeries.flatMap(s => s.processedStats?.interactions || []);
    const allMCQData = mcqSeries.flatMap(s => s.processedStats?.interactions || []);
    const allInteractions = [...allFlashcardData, ...allMCQData];

    console.log('Total flashcard interactions:', allFlashcardData.length);
    console.log('Total MCQ interactions:', allMCQData.length);
    console.log('All interactions:', allInteractions.length);

    // Calculate total sessions from actual data
    const totalSessions = flashcardSeries.reduce((sum, s) => sum + (s.processedStats?.completedSessions || 0), 0) +
                         mcqSeries.reduce((sum, s) => sum + (s.processedStats?.completedSessions || 0), 0);

    // Calculate total study time from interactions
    const totalTime = allInteractions.reduce((sum, item) => sum + (item.timeSpent || 0), 0);

    // Calculate correct answers
    const correctCount = allFlashcardData.filter(item => item.result === 'Right').length +
                        allMCQData.filter(item => item.isCorrect === true).length;

    // Calculate overall accuracy
    const overallAccuracy = allInteractions.length > 0 ? Math.round((correctCount / allInteractions.length) * 100) : 0;

    console.log('Calculated stats:', {
      totalSeries: flashcardSeries.length + mcqSeries.length,
      totalSessions,
      totalCards: allInteractions.length,
      overallAccuracy,
      totalTime,
      correctCount
    });

    return {
      totalSeries: flashcardSeries.length + mcqSeries.length,
      totalSessions,
      totalCards: allInteractions.length,
      overallAccuracy,
      studyTime: analyticsCalculator.formatTime(totalTime)
    };
  },


  // Find the most recent session for each type (last worked on)
  findActiveSessions: (flashcardSeries, mcqSeries) => {
    const recentSessions = [];

    // Find most recent flashcard session (active or completed)
    let latestFlashcardSession = null;
    flashcardSeries.forEach(series => {
      series.sessions?.forEach(session => {
        const sessionData = {
          type: 'Flashcard',
          seriesTitle: series.title,
          sessionId: session.sessionId,
          startedAt: session.startedAt,
          status: session.status,
          totalCards: session.cards?.length || 0,
          completedCards: session.cards?.filter(c => c.interaction).length || 0,
          seriesId: series._id
        };

        if (!latestFlashcardSession || new Date(session.startedAt) > new Date(latestFlashcardSession.startedAt)) {
          latestFlashcardSession = sessionData;
        }
      });
    });

    // Find most recent MCQ session (active or completed)
    let latestMCQSession = null;
    mcqSeries.forEach(series => {
      series.sessions?.forEach(session => {
        const sessionData = {
          type: 'MCQ',
          seriesTitle: series.title,
          sessionId: session.sessionId,
          startedAt: session.startedAt,
          status: session.status,
          totalCards: session.questions?.length || 0,
          completedCards: session.questions?.filter(q => q.interaction).length || 0,
          seriesId: series._id
        };

        if (!latestMCQSession || new Date(session.startedAt) > new Date(latestMCQSession.startedAt)) {
          latestMCQSession = sessionData;
        }
      });
    });

    // Add the latest sessions (if they exist)
    if (latestFlashcardSession) recentSessions.push(latestFlashcardSession);
    if (latestMCQSession) recentSessions.push(latestMCQSession);

    return recentSessions;
  },

  // Find areas needing attention (lowest performing series)
  findWeakAreas: (flashcardSeries, mcqSeries) => {
    const allSeries = [...flashcardSeries, ...mcqSeries]
      .filter(s => s.processedStats && s.processedStats.totalInteractions > 0)
      .map(s => ({
        name: s.title || 'Unnamed Series',
        accuracy: s.processedStats.accuracy,
        cardsToReview: s.processedStats.totalInteractions - Math.floor(s.processedStats.totalInteractions * s.processedStats.accuracy / 100)
      }))
      .sort((a, b) => a.accuracy - b.accuracy) // Sort by lowest accuracy first
      .slice(0, 4); // Bottom 4 series

    return allSeries.length > 0 ? allSeries : [
      { name: "No data yet", accuracy: 0, cardsToReview: 0 }
    ];
  },


  // Calculate format comparison
  calculateFormatComparison: (flashcardSeries, mcqSeries) => {
    const flashcardStats = analyticsCalculator.calculateFormatStats(flashcardSeries, 'flashcard');
    const mcqStats = analyticsCalculator.calculateFormatStats(mcqSeries, 'mcq');

    return {
      flashcards: flashcardStats,
      mcq: mcqStats
    };
  },

  // Helper: Calculate stats for a specific format
  calculateFormatStats: (series, format) => {
    const allInteractions = series.flatMap(s => s.processedStats?.interactions || []);

    if (allInteractions.length === 0) {
      return { accuracy: 0 };
    }

    const correctCount = format === 'flashcard'
      ? allInteractions.filter(item => item.result === 'Right').length
      : allInteractions.filter(item => item.isCorrect === true).length;

    const accuracy = Math.round((correctCount / allInteractions.length) * 100);

    return { accuracy };
  },

  // Calculate subject-wise performance using real subject data
  calculateSubjectAnalytics: (flashcardSeries, mcqSeries, flashcardLookup = {}, mcqLookup = {}) => {
    const subjectStats = {};

    // Process flashcard data - use real subject from flashcard metadata
    flashcardSeries.forEach(series => {
      if (series.processedStats?.interactions && series.processedStats.interactions.length > 0) {
        series.processedStats.interactions.forEach(interaction => {
          const realSubject = interaction.subject || 'Unknown Subject';
          console.log('Processing flashcard interaction with subject:', realSubject);

          if (!subjectStats[realSubject]) {
            subjectStats[realSubject] = {
              name: realSubject,
              totalCards: 0,
              correctCards: 0,
              accuracy: 0,
              type: 'Flashcard'
            };
          }

          subjectStats[realSubject].totalCards++;
          if (interaction.result === 'Right') {
            subjectStats[realSubject].correctCards++;
          }
        });
      }
    });

    // Process MCQ data - use real subject from MCQ metadata
    mcqSeries.forEach(series => {
      if (series.processedStats?.interactions && series.processedStats.interactions.length > 0) {
        series.processedStats.interactions.forEach(interaction => {
          const realSubject = interaction.subject || 'Unknown Subject';
          console.log('Processing MCQ interaction with subject:', realSubject);

          if (!subjectStats[realSubject]) {
            subjectStats[realSubject] = {
              name: realSubject,
              totalCards: 0,
              correctCards: 0,
              accuracy: 0,
              type: 'MCQ'
            };
          } else {
            // If both flashcard and MCQ exist for same subject, mark as mixed
            subjectStats[realSubject].type = 'Mixed';
          }

          subjectStats[realSubject].totalCards++;
          if (interaction.isCorrect) {
            subjectStats[realSubject].correctCards++;
          }
        });
      }
    });

    // Calculate accuracy for each subject
    Object.values(subjectStats).forEach(subject => {
      if (subject.totalCards > 0) {
        subject.accuracy = Math.round((subject.correctCards / subject.totalCards) * 100);
      }
    });

    console.log('Final subject stats object:', subjectStats);

    // Convert to array and sort by accuracy (descending)
    const sortedSubjects = Object.values(subjectStats)
      .filter(subject => subject.totalCards > 0)
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, 6); // Top 6 subjects

    console.log('Final sorted subjects:', sortedSubjects);

    return sortedSubjects.length > 0 ? sortedSubjects : [
      { name: "No data yet", accuracy: 0, totalCards: 0, type: 'unknown' }
    ];
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

};