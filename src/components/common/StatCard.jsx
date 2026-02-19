import React from 'react';
import CountUp from 'react-countup';
import './StatCard.css';

const StatCard = ({ label, value, icon, color = 'blue', className = '', onClick, isActive, ...props }) => {
  // Determine if we should animate (is it a number?)
  // Also handle loading state (null/undefined/'...')
  const isNumber = typeof value === 'number';
  const isLoading = value === undefined || value === null || value === '...';

  return (
    <div
      className={`stat-card stat-card-${color} ${isActive ? 'active' : ''} ${className} ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      {...props}
    >
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">
        {isLoading ? (
           <div className="stat-skeleton"></div>
        ) : isNumber ? (
          <CountUp end={value} duration={2.5} separator="," />
        ) : (
          value
        )}
      </div>
      {icon && <div className={`stat-card-icon icon-${color}`}>{icon}</div>}
    </div>
  );
};

export default StatCard;
