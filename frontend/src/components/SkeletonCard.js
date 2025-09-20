import React from 'react';
import './SkeletonCard.css';

const SkeletonCard = ({ count = 3 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-header">
            <div className="skeleton-title skeleton-shimmer"></div>
            <div className="skeleton-badge skeleton-shimmer"></div>
          </div>
          <div className="skeleton-content">
            <div className="skeleton-line skeleton-shimmer"></div>
            <div className="skeleton-line skeleton-shimmer" style={{ width: '80%' }}></div>
            <div className="skeleton-line skeleton-shimmer" style={{ width: '60%' }}></div>
          </div>
          <div className="skeleton-footer">
            <div className="skeleton-button skeleton-shimmer"></div>
            <div className="skeleton-button skeleton-shimmer"></div>
            <div className="skeleton-button skeleton-shimmer"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="skeleton-container">
      <SkeletonCard count={count} />
    </div>
  );
};

export default SkeletonCard;