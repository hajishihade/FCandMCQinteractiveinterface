import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { seriesAPI, flashcardAPI } from '../services/api';
import { mcqSeriesAPI, mcqAPI } from '../services/mcqApi';
import { analyticsCalculator } from '../utils/analyticsCalculator';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [analytics, setAnalytics] = useState(null);


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

      console.log('LOOKUP DEBUG:');
      console.log('Total flashcards fetched:', allFlashcards.length);
      console.log('Total MCQs fetched:', allMCQs.length);
      console.log('Sample MCQ:', allMCQs[0]);

      // Process data using analytics calculator with both lookups
      const processedFlashcards = analyticsCalculator.processFlashcardSeries(flashcardData, flashcardLookup);
      const processedMCQs = analyticsCalculator.processMCQSeries(mcqData, mcqLookup);

      // Calculate analytics from real data
      const overallStats = analyticsCalculator.calculateOverallAnalytics(processedFlashcards, processedMCQs);
      const activeSessions = analyticsCalculator.findActiveSessions(processedFlashcards, processedMCQs);
      const weakAreas = analyticsCalculator.findWeakAreas(processedFlashcards, processedMCQs);
      const formatStats = analyticsCalculator.calculateFormatComparison(processedFlashcards, processedMCQs);
      const subjectStats = analyticsCalculator.calculateSubjectAnalytics(processedFlashcards, processedMCQs, flashcardLookup, mcqLookup);

      setAnalytics({
        ...overallStats,
        activeSessions,
        weakAreas,
        formatStats,
        subjectStats
      });

    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Debug analytics state
  console.log('Current analytics state:', analytics);

  // Use real analytics data when available
  const displayAnalytics = analytics ? analytics : {
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

  console.log('Display analytics being used:', displayAnalytics);

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-container">
        <div className="error-container">
          <h2>Error Loading Analytics</h2>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h1 className="page-title">Study Analytics</h1>
        <p className="page-subtitle">Your learning insights and performance overview</p>
      </div>

      <div className="analytics-content">
        {/* Overall Performance Widget */}
        <div className="widget performance-widget">
          <div className="widget-header">
            <h3>Overall Performance</h3>
          </div>
          <div className="widget-content">
            <div className="overview-stats">
              <div className="stat-item">
                <div className="stat-value">{displayAnalytics.overallAccuracy}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{displayAnalytics.studyTime}</div>
                <div className="stat-label">Study Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{displayAnalytics.totalSessions}</div>
                <div className="stat-label">Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{displayAnalytics.totalCards}</div>
                <div className="stat-label">Cards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Analytics */}
        <div className="widget subject-analytics-widget">
          <div className="widget-header">
            <h3>Subject Performance</h3>
          </div>
          <div className="widget-content">
            {displayAnalytics.subjectStats.map((subject, index) => (
              <div key={index} className="subject-item">
                <div className="subject-info">
                  <span className="subject-name">{subject.name}</span>
                  <span className="subject-cards">{subject.totalCards} cards</span>
                </div>
                <div className="subject-accuracy">
                  <span className="accuracy-value">{subject.accuracy}%</span>
                  <div
                    className="accuracy-bar"
                    style={{
                      width: `${subject.accuracy}%`,
                      backgroundColor: subject.accuracy >= 70 ? '#4caf50' : subject.accuracy >= 50 ? '#ff9800' : '#f44336'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Sessions Table */}
        <div className="widget active-sessions-widget">
          <div className="widget-header">
            <h3>Active Sessions</h3>
          </div>
          <div className="widget-content">
            {displayAnalytics.activeSessions.length > 0 ? (
              <div className="sessions-table">
                <div className="table-header">
                  <span>Type</span>
                  <span>Series</span>
                  <span>Progress</span>
                  <span>Started</span>
                </div>
                {displayAnalytics.activeSessions.map((session, index) => (
                  <div
                    key={index}
                    className="table-row clickable-row"
                    onClick={() => {
                      if (session.type === 'Flashcard') {
                        navigate('/study', {
                          state: {
                            seriesId: session.seriesId,
                            sessionId: session.sessionId,
                            mode: 'continue'
                          }
                        });
                      } else {
                        navigate('/mcq-study', {
                          state: {
                            seriesId: session.seriesId,
                            sessionId: session.sessionId,
                            mode: 'continue'
                          }
                        });
                      }
                    }}
                  >
                    <span className={`session-type ${session.type.toLowerCase()}`}>
                      {session.type}
                    </span>
                    <span className="session-series">{session.seriesTitle}</span>
                    <span className="session-progress">
                      {session.completedCards}/{session.totalCards}
                    </span>
                    <span className="session-date">
                      {new Date(session.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-sessions">No active sessions</div>
            )}
          </div>
        </div>

        {/* Areas Needing Attention */}
        <div className="widget weak-areas-widget">
          <div className="widget-header">
            <h3>Areas Needing Attention</h3>
          </div>
          <div className="widget-content">
            {displayAnalytics.weakAreas.map((area, index) => (
              <div key={index} className="weak-area-item">
                <div className="area-info">
                  <span className="area-name">{area.name}</span>
                  <span className="area-accuracy">{area.accuracy}%</span>
                </div>
                <div className="area-action">
                  <span className="review-count">{area.cardsToReview} cards to review</span>
                </div>
              </div>
            ))}
          </div>
        </div>


        {/* Format Comparison */}
        <div className="widget format-widget">
          <div className="widget-header">
            <h3>Flashcards vs MCQ Performance</h3>
          </div>
          <div className="widget-content">
            <div className="format-comparison">
              <div className="format-card">
                <div className="format-name">Flashcards</div>
                <div className="format-stats">
                  <div className="format-accuracy">{displayAnalytics.formatStats.flashcards.accuracy}%</div>
                </div>
              </div>
              <div className="vs-divider">vs</div>
              <div className="format-card">
                <div className="format-name">MCQ</div>
                <div className="format-stats">
                  <div className="format-accuracy">{displayAnalytics.formatStats.mcq.accuracy}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Study Access */}
      <div className="analytics-footer">
        <div className="study-access">
          <button
            onClick={() => navigate('/browse-series')}
            className="study-btn primary"
          >
            📚 Start Studying
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;