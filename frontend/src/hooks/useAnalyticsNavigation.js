import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export const useAnalyticsNavigation = () => {
  const navigate = useNavigate();

  // Handle session resume navigation (from ActiveSessionsWidget)
  const handleSessionResume = useCallback((session) => {
    if (session.type === 'Flashcard') {
      navigate('/new-study', {
        state: {
          seriesId: session.seriesId,
          sessionId: session.sessionId,
          mode: 'continue'
        }
      });
    } else {
      navigate('/new-mcq-study', {
        state: {
          seriesId: session.seriesId,
          sessionId: session.sessionId,
          mode: 'continue'
        }
      });
    }
  }, [navigate]);

  // Handle start studying navigation (from StudyAccessFooter)
  const handleStartStudying = useCallback(() => {
    navigate('/browse-series');
  }, [navigate]);

  return {
    handleSessionResume,
    handleStartStudying
  };
};