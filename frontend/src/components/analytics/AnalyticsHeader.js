import React from 'react';

const AnalyticsHeader = React.memo(({
  title = "Study Analytics",
  subtitle = "Your learning insights and performance overview"
}) => {
  return (
    <div className="analytics-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-subtitle">{subtitle}</p>
    </div>
  );
});

export default AnalyticsHeader;