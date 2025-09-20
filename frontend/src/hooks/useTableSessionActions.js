import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Using real API for database integration
import { tableSessionAPI } from '../services/tableQuizApi';

export const useTableSessionActions = (refetchData) => {
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({
    type: null, // 'recipe' | 'stats' | null
    isOpen: false,
    selectedSeries: null,
    selectedSession: null
  });

  const handleSessionClick = useCallback((seriesId, sessionId, sessionStatus, session, seriesItem) => {
    if (sessionStatus === 'active') {
      navigate('/table-quiz-session', {
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
    const sessionTables = session.tables?.map(table => table.tableId) || [];

    setModalState({
      type: 'recipe',
      isOpen: true,
      selectedSeries: {
        ...seriesData,
        editingSessionId: session.sessionId,
        existingTables: sessionTables
      },
      selectedSession: session
    });
  }, []);

  const handleCreateCustomSession = useCallback(async (tableIds, sessionId = null, action = 'create') => {
    try {
      if (action === 'delete' && sessionId) {
        // Delete session
        await tableSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        refetchData();
      } else if (sessionId) {
        // Update existing session - delete and recreate
        await tableSessionAPI.delete(modalState.selectedSeries._id, sessionId);
        if (tableIds.length > 0) {
          const response = await tableSessionAPI.start(modalState.selectedSeries._id, tableIds, sessionId);

          navigate('/table-quiz-session', {
            state: {
              seriesId: modalState.selectedSeries._id,
              sessionId: response.data.sessionId,
              selectedTables: tableIds
            }
          });
        } else {
          refetchData(); // Just refresh if no tables selected
        }
      } else {
        // Create new session
        const response = await tableSessionAPI.start(modalState.selectedSeries._id, tableIds);

        navigate('/table-quiz-session', {
          state: {
            seriesId: modalState.selectedSeries._id,
            sessionId: response.data.sessionId,
            selectedTables: tableIds
          }
        });
      }
    } catch (error) {
      alert('Failed to update table session. Please try again.');
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