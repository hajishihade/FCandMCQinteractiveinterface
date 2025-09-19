import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { mcqAPI, mcqSeriesAPI, mcqSessionAPI } from '../services/mcqApi';
import { sessionPersistence } from '../utils/sessionPersistence';
import './MCQSession.css';

const MCQSession = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [seriesId, setSeriesId] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [confidence, setConfidence] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionInfo = location.state;

    if (!sessionInfo || !sessionInfo.seriesId) {
      navigate('/browse-mcq-series');
      return;
    }

    if (sessionInfo.mode === 'continue') {
      // Continue existing session
      continueExistingSession(sessionInfo);
    } else {
      // Start new session (from CreateMCQSeries)
      initializeSession(sessionInfo);
    }
  }, [location.state, navigate]);

  const continueExistingSession = async (sessionInfo) => {
    try {
      setLoading(true);

      // Get the series data to find which questions to continue with
      const seriesResponse = await mcqSeriesAPI.getById(sessionInfo.seriesId);
      const seriesData = seriesResponse.data.data || seriesResponse.data;

      if (!seriesData || !seriesData.sessions) {
        throw new Error('MCQ Series data not found or invalid format');
      }

      const session = seriesData.sessions.find(s => s.sessionId === sessionInfo.sessionId);

      if (!session) {
        throw new Error('MCQ Session not found in series');
      }

      // Use the existing session's questions
      const selectedQuestions = session.questions && session.questions.length > 0
        ? session.questions.map(q => q.questionId)
        : [1, 2, 3]; // Fallback to some questions if empty


      // Use exact same logic as CreateMCQSeries -> MCQSession
      const response = await mcqAPI.getByIds(selectedQuestions);
      const mcqs = response.data; // MCQ API returns data directly

      setSeriesId(sessionInfo.seriesId);
      setSessionId(sessionInfo.sessionId); // Use existing session
      setQuestions(mcqs);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error continuing session:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to continue study session: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const initializeSession = async (seriesInfo) => {
    try {
      setLoading(true);

      const response = await mcqAPI.getByIds(seriesInfo.selectedQuestions);
      const mcqs = response.data; // MCQ API returns data directly, not nested

      setSeriesId(seriesInfo.seriesId);
      setSessionId(seriesInfo.sessionId); // Session already created
      setQuestions(mcqs);
      setStartTime(Date.now());

    } catch (error) {
      console.error('Error initializing session:', error);
      console.error('Error details:', error.response?.data);
      setError(`Failed to start study session: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleConfidenceSelect = (level) => {
    setConfidence(level);
    // Auto-show answer if all requirements are met
    if (selectedAnswer && difficulty && level) {
      setTimeout(() => setShowingAnswer(true), 300);
    }
  };

  const handleDifficultySelect = (level) => {
    setDifficulty(level);
    // Auto-show answer if all requirements are met
    if (selectedAnswer && confidence && level) {
      setTimeout(() => setShowingAnswer(true), 300);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    // Automatically show answer when an option is selected and confidence/difficulty are set
    if (confidence && difficulty) {
      setTimeout(() => setShowingAnswer(true), 300);
    }
  };

  const handleResult = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    const currentResult = {
      questionId: currentQuestion.questionId,
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      subject: currentQuestion.subject,
      difficulty,
      confidenceWhileSolving: confidence,
      timeSpent,
      explanation: currentQuestion.explanation
    };

    try {
      await mcqSessionAPI.recordInteraction(seriesId, sessionId, {
        questionId: currentQuestion.questionId,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        difficulty,
        confidenceWhileSolving: confidence,
        timeSpent
      });

      setSessionResults(prev => [...prev, currentResult]);

      if (currentQuestionIndex + 1 < questions.length) {
        // Trigger slide out animation
        setIsTransitioning(true);

        setTimeout(() => {
          setCurrentQuestionIndex(prev => prev + 1);
          resetQuestionState();
          setIsTransitioning(false);
        }, 500);
      } else {
        finishSessionWithSummary();
      }

    } catch (error) {
      console.error('Error recording interaction:', error);
      setError('Failed to record your answer');
    }
  };

  // Timer effect
  useEffect(() => {
    if (startTime) {
      const timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [startTime]);

  const resetQuestionState = () => {
    setSelectedAnswer('');
    setShowingAnswer(false);
    setConfidence('');
    setDifficulty('');
    setStartTime(Date.now());
    setElapsedTime(0);
  };


  const finishSessionWithSummary = async () => {
    try {
      await mcqSessionAPI.complete(seriesId, sessionId);
      setSessionComplete(true);
    } catch (error) {
      console.error('Error completing session:', error);
      setError('Session finished but there was an error saving.');
    }
  };

  if (loading) {
    return (
      <div className="mcq-loading">
        <div className="loading-text">Starting your MCQ session...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mcq-error">
        <div className="error-text">{error}</div>
        <div className="navigation-buttons">
          <button onClick={() => navigate('/browse-mcq-series')} className="series-btn">
            ← MCQ Series
          </button>
          <button onClick={() => navigate('/')} className="dashboard-btn">
            🏠 Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="mcq-empty">
        <div className="empty-text">No questions to study</div>
        <div className="navigation-buttons">
          <button onClick={() => navigate('/browse-mcq-series')} className="series-btn">
            ← MCQ Series
          </button>
          <button onClick={() => navigate('/')} className="dashboard-btn">
            🏠 Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions?.[currentQuestionIndex];

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateSummaryStats = () => {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const totalTime = sessionResults.reduce((sum, r) => sum + r.timeSpent, 0);
    const avgTime = totalTime / sessionResults.length;
    const successRate = (correctCount / sessionResults.length) * 100;

    return {
      correctCount,
      totalQuestions: sessionResults.length,
      successRate: Math.round(successRate),
      totalTime: formatTime(totalTime),
      avgTime: Math.round(avgTime)
    };
  };

  if (sessionComplete) {
    const stats = calculateSummaryStats();

    return (
      <div className="mcq-container">
        <div className="summary-header">
          <div className="summary-title">session complete!</div>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">score</span>
              <span className="stat-value">{stats.correctCount}/{stats.totalQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">success</span>
              <span className="stat-value">{stats.successRate}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">time</span>
              <span className="stat-value">{stats.totalTime}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">avg/question</span>
              <span className="stat-value">{stats.avgTime}s</span>
            </div>
          </div>
        </div>

        <div className="results-list">
          {sessionResults.map((result, index) => (
            <div key={result.questionId} className="result-item">
              <div className="result-header">
                <span className="question-number">#{result.questionId}</span>
                <span className={`result-badge ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                  {result.isCorrect ? '✓' : '✗'}
                </span>
              </div>

              <div className="result-content">
                <div className="result-question">{result.question}</div>
                <div className="result-answers">
                  <div className="answer-row">
                    <span className="answer-label">Your answer:</span>
                    <span className={`answer-value ${result.isCorrect ? 'correct' : 'incorrect'}`}>
                      {result.selectedAnswer}
                    </span>
                  </div>
                  {!result.isCorrect && (
                    <div className="answer-row">
                      <span className="answer-label">Correct:</span>
                      <span className="answer-value correct">{result.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="result-meta">
                <div className="meta-item">
                  {result.confidenceWhileSolving === 'High' ? '↑' : '↓'}
                </div>
                <div className="meta-item">
                  {result.difficulty === 'Easy' ? '−' : result.difficulty === 'Medium' ? '=' : '≡'}
                </div>
                <div className="meta-item">
                  {result.isCorrect ? '✓' : '✗'}
                </div>
                <div className="meta-item">
                  {result.timeSpent}s
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="summary-footer">
          <button onClick={() => navigate('/browse-mcq-series')} className="home-btn">
            ← MCQ Series
          </button>
          <button onClick={() => navigate('/')} className="dashboard-btn">
            🏠 Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mcq-container">
      {/* Header section */}
      <div className="mcq-header">
        <div className="timer-section">
          <div className="timer">{formatTime(elapsedTime)}</div>
        </div>
        <div className="progress-section">
          <div className="progress-numbers">
            {currentQuestionIndex + 1} / {questions?.length || 0}
          </div>
        </div>
      </div>

      {/* Question section */}
      <div className="question-section">
        <div className="question-meta">
          ID: {currentQuestion?.questionId} • {currentQuestion?.subject}
        </div>

        <div className={`floating-content ${isTransitioning ? 'question-transition-out' : 'question-transition-in'}`}>
          <div className="question-text">
            {currentQuestion?.question}
          </div>

          {/* Answer options */}
          <div className="answer-options">
            {currentQuestion?.options && Object.entries(currentQuestion.options).map(([key, option]) => (
              <button
                key={key}
                className={`option-btn ${selectedAnswer === key ? 'selected' : ''} ${
                  showingAnswer
                    ? (key === currentQuestion.correctAnswer ? 'correct' :
                       key === selectedAnswer && key !== currentQuestion.correctAnswer ? 'incorrect' : 'disabled')
                    : ''
                }`}
                onClick={() => !showingAnswer && handleAnswerSelect(key)}
                disabled={showingAnswer}
              >
                <span className="option-letter">{key}</span>
                <span className="option-text">{option.text}</span>
              </button>
            ))}
          </div>

          {showingAnswer && (
            <div className="explanation-section">
              <div className="divider-line"></div>
              <div className="explanation-title">Explanation:</div>
              <div className="explanation-text">
                {currentQuestion.explanation}
              </div>
            </div>
          )}
        </div>
      </div>

      {!showingAnswer ? (
        <div className="mcq-controls">
          {/* Confidence selection */}
          <div className="control-row">
            <span className="control-label">confidence</span>
            <div className="minimal-buttons">
              <button
                className={`minimal-btn ${confidence === 'High' ? 'selected' : ''}`}
                onClick={() => handleConfidenceSelect('High')}
                title="High Confidence"
              >
                ↑
              </button>
              <button
                className={`minimal-btn ${confidence === 'Low' ? 'selected' : ''}`}
                onClick={() => handleConfidenceSelect('Low')}
                title="Low Confidence"
              >
                ↓
              </button>
            </div>
          </div>

          {/* Difficulty selection */}
          <div className="control-row">
            <span className="control-label">difficulty</span>
            <div className="minimal-buttons">
              <button
                className={`minimal-btn ${difficulty === 'Easy' ? 'selected' : ''}`}
                onClick={() => handleDifficultySelect('Easy')}
                title="Easy"
              >
                −
              </button>
              <button
                className={`minimal-btn ${difficulty === 'Medium' ? 'selected' : ''}`}
                onClick={() => handleDifficultySelect('Medium')}
                title="Medium"
              >
                =
              </button>
              <button
                className={`minimal-btn ${difficulty === 'Hard' ? 'selected' : ''}`}
                onClick={() => handleDifficultySelect('Hard')}
                title="Hard"
              >
                ≡
              </button>
            </div>
          </div>

        </div>
      ) : (
        <div className="result-controls">
          <h3>Ready for next question?</h3>
          <div className="result-buttons">
            <button
              className="continue-btn"
              onClick={handleResult}
              title="Continue to next question"
            >
              {currentQuestionIndex + 1 < (questions?.length || 0) ? 'Next Question →' : 'Finish Session →'}
            </button>
          </div>
        </div>
      )}

      <div className="session-info">
        <div className="navigation-buttons">
          <button onClick={() => navigate('/browse-mcq-series')} className="series-btn">
            ← MCQ Series
          </button>
          <button onClick={() => navigate('/')} className="dashboard-btn">
            🏠 Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default MCQSession;