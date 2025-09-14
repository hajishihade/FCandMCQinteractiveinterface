import React from 'react';
import './Dashboard.css';

const Dashboard = ({ onCreateSeries, onBrowseSeries }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Flashcard Study System</h1>
        <p>Master your flashcards with intelligent study sessions</p>
      </div>

      <div className="dashboard-buttons">
        <button className="dashboard-btn create-btn" onClick={onCreateSeries}>
          <div className="btn-icon">+</div>
          <div className="btn-text">
            <span>CREATE NEW</span>
            <span>SERIES</span>
          </div>
        </button>

        <button className="dashboard-btn browse-btn" onClick={onBrowseSeries}>
          <div className="btn-icon">📚</div>
          <div className="btn-text">
            <span>BROWSE</span>
            <span>SERIES</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;