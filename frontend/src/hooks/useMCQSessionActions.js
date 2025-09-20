import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { mcqSessionAPI } from '../services/mcqApi';

export const useMCQSessionActions = (refetchData) => {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({
    type: null, // 'recipe' | 'stats' | null
    isOpen: false,
    selectedSeries: null,
    selectedSession: null
  });

  const handleSessionClick = useCallback((seriesId, sessionId, sessionStatus, session, seriesItem) => {
    if (sessionStatus === 'active') {
      navigate('/new-mcq-study', {
        state: { seriesId, sessionId, mode: 'continue' }
      });
    } else if (sessionStatus === 'completed') {
      setModalState({
        type: 'stats',
        isOpen: true,
        selectedSeries: seriesItem,
        selectedSession: session
      });
    }
  }, [navigate]);

  const handleNewSession = useCallback((seriesId, seriesData) => {
    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: seriesData,
      selectedSession: null
    });
  }, []);

  const handleEditSession = useCallback((seriesId, session, seriesData, e) => {
    e.stopPropagation(); // Prevent session click
    const sessionQuestions = session.questions?.map(question => question.questionId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingQuestions: sessionQuestions
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (questionIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        // Delete session
        await mcqSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        refetchData();
      } else if (sessionId) {
        // Update existing session - delete and recreate
        await mcqSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (questionIds.length > 0) {
          const response = await mcqSessionAPI.start(modalState.selectedSeries._id, questionIds, sessionId);

          navigate('/new-mcq-study', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.sessionId,
              selectedQuestions: questionIds
            }
          });
        } else {
          refetchData(); // Just refresh if no questions selected
        }
      } else {
        // Create new session
        const response = await mcqSessionAPI.start(modalState.selectedSeries._id, questionIds);

        navigate('/new-mcq-study', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.sessionId,
            selectedQuestions: questionIds
          }
        });
      }
    } catch (error) {
      alert('Failed to update MCQ session. Please try again.');
    }
    closeModal();
  }, [modalState.selectedSeries, navigate, refetchData]);

  const closeModal = useCallback(() => {
    setModalState({ type: null, isOpen: false, selectedSeries: null, selectedSession: null });
  }, []);

  return {
    modalState,
    handleSessionClick,
    handleNewSession,
    handleEditSession,
    handleCreateCustomSession,
    closeModal
  };
};