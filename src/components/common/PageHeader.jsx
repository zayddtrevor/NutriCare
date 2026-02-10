import React from 'react';
import './PageHeader.css';

/**
 * Standard Page Header Component
 * @param {string} title - Page Title
 * @param {React.ReactNode} action - Optional action button/component on the right
 */
const PageHeader = ({ title, action }) => {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {action && <div className="page-header-action">{action}</div>}
    </div>
  );
};

export default PageHeader;
