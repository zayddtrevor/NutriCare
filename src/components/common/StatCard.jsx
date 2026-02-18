import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, icon, color = 'blue', className = '' }) => {
  return (
    <div className={`stat-card stat-card-${color} ${className}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
      {icon && <div className={`stat-card-icon icon-${color}`}>{icon}</div>}
    </div>
  );
};

export default StatCard;
