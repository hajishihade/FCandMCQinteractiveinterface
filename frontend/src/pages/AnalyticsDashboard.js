import React, { useEffect } from 'react';

// Analytics Custom Hooks
import { useAnalyticsData } from '../hooks/useAnalyticsData';
import { useAnalyticsCalculations } from '../hooks/useAnalyticsCalculations';
import { useAnalyticsNavigation } from '../hooks/useAnalyticsNavigation';

// Analytics Components
import {
  AnalyticsHeader,
  OverallPerformanceWidget,
  SubjectAnalyticsWidget,
  ActiveSessionsWidget,
  WeakAreasWidget,
  FormatComparisonWidget,
  StudyAccessFooter
} from '../components/analytics';

// Styles (reuse existing)
import './AnalyticsDashboard.css';

const AnalyticsDashboard = () => {
  // Data fetching hook
  const {
    rawData,
    loading,
    error,
    fetchAnalyticsData
  } = useAnalyticsData();

  // Analytics processing hook (memoized)
  const {
    analytics
  } = useAnalyticsCalculations(rawData);

  // Navigation hook
  const {
    handleSessionResume,
    handleStartStudying
  } = useAnalyticsNavigation();

  // Fetch data on mount
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