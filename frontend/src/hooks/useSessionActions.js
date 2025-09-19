import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionAPI } from '../services/api';

export const useSessionActions = (refetchData) => {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({
    type: null, // 'recipe' | 'stats' | null
    isOpen: false,
    selectedSeries: null,
    selectedSession: null
  });

  const handleSessionClick = useCallback((seriesId, sessionId, sessionStatus, session, seriesItem) => {
    if (sessionStatus === 'active') {
      navigate('/study', {
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
    const sessionCards = session.cards?.map(card => card.cardId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingCards: sessionCards
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (cardIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        // Delete session
        await sessionAPI.delete(modalState.selectedSeries._id, sessionId);
        refetchData();
      } else if (sessionId) {
        // Update existing session - delete and recreate
        await sessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (cardIds.length > 0) {
          const response = await sessionAPI.start(modalState.selectedSeries._id, cardIds, sessionId);

          navigate('/study', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.data.sessionId,
              selectedCards: cardIds
            }
          });
        } else {
          refetchData(); // Just refresh if no cards selected
        }
      } else {
        // Create new session
        const response = await sessionAPI.start(modalState.selectedSeries._id, cardIds);

        navigate('/study', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.data.sessionId,
            selectedCards: cardIds
          }
        });
      }
    } catch (error) {
      alert('Failed to update session. Please try again.');
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