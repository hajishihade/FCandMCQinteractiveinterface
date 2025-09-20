/**
 * Analytics Dashboard Page
 *
 * Main entry point for the study platform. Displays comprehensive
 * analytics about user's study performance across all formats
 * (Flashcards, MCQs, and Table Quizzes).
 *
 * Features:
 * - Real-time performance metrics from MongoDB
 * - Subject-wise analytics breakdown
 * - Active session management
 * - Weak areas identification
 * - Format comparison charts
 * - Quick navigation to study modes
 *
 * Component Architecture:
 * - Uses 7 specialized widget components
 * - 3 custom hooks for data management
 * - Memoized calculations for performance
 *
 * Performance optimizations:
 * - Lazy loading of analytics data
 * - Memoized calculations in hooks
 * - Component-level code splitting
 */

import React, { useEffect } from 'react';

// Analytics Custom Hooks
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useAnalyticsCalculations } from '../hooks/useAnalyticsCalculations';
import { useAnalyticsNavigation } from '../hooks/useAnalyticsNavigation';

// Analytics Components - Each widget is a specialized component
import {
  AnalyticsHeader,
  OverallPerformanceWidget,
  SubjectAnalyticsWidget,
  ActiveSessionsWidget,
  WeakAreasWidget,
  FormatComparisonWidget,
  StudyAccessFooter
} from '../components/analytics';

// Styles
import './AnalyticsDashboard.css';

/**
 * Analytics Dashboard Component
 *
 * Provides comprehensive study analytics with real-time data
 * from MongoDB. Serves as the main hub for the application.
 *
 * @returns {JSX.Element} Rendered analytics dashboard
 */
const AnalyticsDashboard = () => {
  // Fetch raw analytics data from API
  const {
    rawData,
    loading,
    error,
    fetchAnalyticsData
  } = useAnalyticsData();

  // Process raw data into analytics metrics (memoized for performance)
  const {
    analytics
  } = useAnalyticsCalculations(rawData);

  // Handle navigation to study sessions
  const {
    handleSessionResume,
    handleStartStudying
  } = useAnalyticsNavigation();

  // Fetch analytics data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  // Loading state
  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner">Loading analytics...</div>
      </div>
    );
  }

  // Error state
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
      <AnalyticsHeader />

      <div className="analytics-content">
        <OverallPerformanceWidget analytics={analytics} />

        <SubjectAnalyticsWidget subjectStats={analytics.subjectStats} />

        <ActiveSessionsWidget
          activeSessions={analytics.activeSessions}
          onSessionResume={handleSessionResume}
        />

        <WeakAreasWidget weakAreas={analytics.weakAreas} />

        <FormatComparisonWidget formatStats={analytics.formatStats} />
      </div>

      <StudyAccessFooter onStartStudying={handleStartStudying} />
    </div>
  );
};

export default AnalyticsDashboard;