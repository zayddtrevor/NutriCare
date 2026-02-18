import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, icon, color = 'blue', className = '' }) => {
  return (
    <div className={`stat-card stat-card-${color} ${className}`}>
      <div className="stat-card-header">
        {icon && <div className={`stat-icon icon-${color}`}>{icon}</div>}
        <h3 className="stat-label">{label}</h3>
      </div>
      <p className="stat-value">{value}</p>
    </div>
  );
};

export default StatCard;
