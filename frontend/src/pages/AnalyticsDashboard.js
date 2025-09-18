import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { seriesAPI } from '../services/api';
import { mcqSeriesAPI } from '../services/mcqApi';
import { analyticsCalculator } from '../utils/analyticsCalculator';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Real data state
  const [flashcardSeries, setFlashcardSeries] = useState([]);
  const [mcqSeries, setMcqSeries] = useState([]);
  const [calculatedAnalytics, setCalculatedAnalytics] = useState(null);


  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch both flashcard and MCQ series data
      const [flashcardResponse, mcqResponse] = await Promise.all([
        seriesAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: [] } })),
        mcqSeriesAPI.getAll({ limit: 100 }).catch(() => ({ data: [] }))
      ]);

      // Validate and extract data safely
      const flashcardData = Array.isArray(flashcardResponse?.data?.data)
        ? flashcardResponse.data.data
        : [];

      const mcqData = Array.isArray(mcqResponse?.data)
        ? mcqResponse.data
        : [];

      // Process data using analytics calculator
      const processedFlashcards = analyticsCalculator.processFlashcardSeries(flashcardData);
      const processedMCQs = analyticsCalculator.processMCQSeries(mcqData);

      // Calculate overall analytics
      const overallStats = analyticsCalculator.calculateOverallAnalytics(processedFlashcards, processedMCQs);
      const weeklyProgress = analyticsCalculator.calculateWeeklyProgress(overallStats.allInteractions);
      const topSeries = analyticsCalculator.findTopSeries(processedFlashcards, processedMCQs);
      const weakAreas = analyticsCalculator.findWeakAreas(processedFlashcards, processedMCQs);
      const studyHabits = analyticsCalculator.calculateStudyHabits(processedFlashcards, processedMCQs);
      const formatStats = analyticsCalculator.calculateFormatComparison(processedFlashcards, processedMCQs);

      // Store processed data
      setFlashcardSeries(processedFlashcards);
      setMcqSeries(processedMCQs);
      setCalculatedAnalytics({
        ...overallStats,
        weeklyAccuracy: weeklyProgress,
        topSeries,
        weakAreas,
        studyHabits,
        formatStats
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

  // Use calculated data or fallback to defaults
  const analytics = calculatedAnalytics || {
    totalSeries: 0,
    totalSessions: 0,
    totalCards: 0,
    overallAccuracy: 0,
    studyTime: "0h 0m",
    improvement: "0%",
    weeklyAccuracy: [0, 0, 0, 0, 0],
    topSeries: [{ name: "No data yet", accuracy: 0, sessions: 0 }],
    weakAreas: [{ name: "No data yet", accuracy: 0, cardsToReview: 0 }],
    studyHabits: { streak: 0, averageSessionLength: "0 minutes", preferredTime: "Unknown", consistency: 0 },
    formatStats: { flashcards: { accuracy: 0, efficiency: "0 cards/min" }, mcq: { accuracy: 0, efficiency: "0 questions/min" } }
  };

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
            <span className="trend-indicator">{analytics.improvement}</span>
          </div>
          <div className="widget-content">
            <div className="overview-stats">
              <div className="stat-item">
                <div className="stat-value">{analytics.overallAccuracy}%</div>
                <div className="stat-label">Accuracy</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{analytics.studyTime}</div>
                <div className="stat-label">Study Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{analytics.totalSessions}</div>
                <div className="stat-label">Sessions</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{analytics.totalCards}</div>
                <div className="stat-label">Cards</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Chart */}
        <div className="widget progress-widget">
          <div className="widget-header">
            <h3>Weekly Progress</h3>
          </div>
          <div className="widget-content">
            <div className="chart-container">
              {analytics.weeklyAccuracy.map((accuracy, index) => (
                <div key={index} className="chart-bar">
                  <div
                    className="bar"
                    style={{ height: `${accuracy}%` }}
                    title={`Week ${index + 1}: ${accuracy}%`}
                  ></div>
                  <div className="bar-label">W{index + 1}</div>
                  <div className="bar-value">{accuracy}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Performing Series */}
        <div className="widget top-series-widget">
          <div className="widget-header">
            <h3>Top Performing Series</h3>
          </div>
          <div className="widget-content">
            {analytics.topSeries.map((series, index) => (
              <div key={index} className="series-item">
                <div className="series-info">
                  <span className="series-name">{series.name}</span>
                  <span className="series-sessions">{series.sessions} sessions</span>
                </div>
                <div className="series-accuracy">{series.accuracy}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* Areas Needing Attention */}
        <div className="widget weak-areas-widget">
          <div className="widget-header">
            <h3>Areas Needing Attention</h3>
          </div>
          <div className="widget-content">
            {analytics.weakAreas.map((area, index) => (
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

        {/* Study Habits */}
        <div className="widget habits-widget">
          <div className="widget-header">
            <h3>Study Habits</h3>
          </div>
          <div className="widget-content">
            <div className="habits-grid">
              <div className="habit-item">
                <div className="habit-icon">🔥</div>
                <div className="habit-info">
                  <div className="habit-value">{analytics.studyHabits.streak} days</div>
                  <div className="habit-label">Study Streak</div>
                </div>
              </div>
              <div className="habit-item">
                <div className="habit-icon">⏱️</div>
                <div className="habit-info">
                  <div className="habit-value">{analytics.studyHabits.averageSessionLength}</div>
                  <div className="habit-label">Avg Session</div>
                </div>
              </div>
              <div className="habit-item">
                <div className="habit-icon">📊</div>
                <div className="habit-info">
                  <div className="habit-value">{analytics.studyHabits.consistency}%</div>
                  <div className="habit-label">Consistency</div>
                </div>
              </div>
              <div className="habit-item">
                <div className="habit-icon">🌙</div>
                <div className="habit-info">
                  <div className="habit-value">{analytics.studyHabits.preferredTime}</div>
                  <div className="habit-label">Best Time</div>
                </div>
              </div>
            </div>
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
                  <div className="format-accuracy">{analytics.formatStats.flashcards.accuracy}%</div>
                  <div className="format-efficiency">{analytics.formatStats.flashcards.efficiency}</div>
                </div>
              </div>
              <div className="vs-divider">vs</div>
              <div className="format-card">
                <div className="format-name">MCQ</div>
                <div className="format-stats">
                  <div className="format-accuracy">{analytics.formatStats.mcq.accuracy}%</div>
                  <div className="format-efficiency">{analytics.formatStats.mcq.efficiency}</div>
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
            📚 Study Flashcards
          </button>
          <button
            onClick={() => navigate('/browse-mcq-series')}
            className="study-btn secondary"
          >
            🧠 Study MCQ
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;