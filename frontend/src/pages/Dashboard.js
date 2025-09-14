import React from 'react';
import './Dashboard.css';

const Dashboard = ({ onCreateSeries, onBrowseSeries, onCreateMCQSeries, onBrowseMCQSeries }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Study System</h1>
        <p>Master your flashcards and MCQs with intelligent study sessions</p>
      </div>

      {/* Flashcard Section */}
      <div className="study-section">
        <h2 className="section-title">📇 Flashcards</h2>
        <div className="dashboard-buttons">
          <button className="dashboard-btn create-btn" onClick={onCreateSeries}>
            <div className="btn-icon">+</div>
            <div className="btn-text">
              <span>CREATE NEW</span>
              <span>FLASHCARD SERIES</span>
            </div>
          </button>

          <button className="dashboard-btn browse-btn" onClick={onBrowseSeries}>
            <div className="btn-icon">📚</div>
            <div className="btn-text">
              <span>BROWSE</span>
              <span>FLASHCARD SERIES</span>
            </div>
          </button>
        </div>
      </div>

      {/* MCQ Section */}
      <div className="study-section">
        <h2 className="section-title">❓ Multiple Choice Questions</h2>
        <div className="dashboard-buttons">
          <button className="dashboard-btn create-btn" onClick={onCreateMCQSeries}>
            <div className="btn-icon">+</div>
            <div className="btn-text">
              <span>CREATE NEW</span>
              <span>MCQ SERIES</span>
            </div>
          </button>

          <button className="dashboard-btn browse-btn" onClick={onBrowseMCQSeries}>
            <div className="btn-icon">🧠</div>
            <div className="btn-text">
              <span>BROWSE</span>
              <span>MCQ SERIES</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;