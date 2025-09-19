import { useState, useEffect, useCallback } from 'react';
import { flashcardAPI } from '../services/api';
import { mcqAPI } from '../services/mcqApi';

export const useSessionStatsData = (sessionData, isFlashcard) => {
  const [itemsWithContent, setItemsWithContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchItemContent = useCallback(async () => {
    if (!sessionData) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      let items = [];
      let contentResponse;

      if (isFlashcard) {
        // Get flashcard content
        const cardIds = sessionData.cards?.map(card => card.cardId) || [];
        console.log('Fetching flashcard content for cardIds:', cardIds);

        if (cardIds.length > 0) {
          contentResponse = await flashcardAPI.getByIds(cardIds);
          const cardsContent = contentResponse.data.data || [];

          // Combine session data with content
          items = sessionData.cards.map(sessionCard => {
            const content = cardsContent.find(card => card.cardId === sessionCard.cardId);
            return {
              id: sessionCard.cardId,
              content: content || {},
              interaction: sessionCard.interaction || {},
              type: 'flashcard'
            };
          });
        }
      } else {
        // Get MCQ content
        const questionIds = sessionData.questions?.map(question => question.questionId) || [];
        console.log('Fetching MCQ content for questionIds:', questionIds);

        if (questionIds.length > 0) {
          contentResponse = await mcqAPI.getByIds(questionIds);
          const questionsContent = contentResponse.data || [];

          // Combine session data with content
          items = sessionData.questions.map(sessionQuestion => {
            const content = questionsContent.find(mcq => mcq.questionId === sessionQuestion.questionId);
            return {
              id: sessionQuestion.questionId,
              content: content || {},
              interaction: sessionQuestion.interaction || {},
              type: 'mcq'
            };
          });
        }
      }

      console.log('Processed items with content:', items);
      setItemsWithContent(items);

    } catch (error) {
      console.error('Failed to fetch session content:', error);
      setError('Failed to load session details');
      setItemsWithContent([]);
    } finally {
      setLoading(false);
    }
  }, [sessionData, isFlashcard]);

  useEffect(() => {
    fetchItemContent();
  }, [fetchItemContent]);

  return {
    itemsWithContent,
    loading,
    error,
    refetch: fetchItemContent
  };
};