import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useJob } from '../../context/JobContext';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { navigateToPage } = useJob();

  const menuItems = [
    { path: '/', label: 'Home', key: 'home' },
    { path: '/job-tracker', label: 'Job Posting', key: 'job-tracker' },
    { path: '/contacts', label: 'Contacts', key: 'contacts' },
    { path: '/calendar', label: 'Calendar', key: 'calendar' },
    { path: '/notes', label: 'Notes', key: 'notes' },
    { path: '/documents', label: 'Documents', key: 'documents' },
    { path: '/resume', label: 'Resume', key: 'resume' },
    { path: '/cover-letter', label: 'Cover Letter', key: 'cover-letter' },
    { path: '/personal', label: 'Personal', key: 'personal' },
  ];

  const handleMenuClick = (key) => {
    navigateToPage(key);
  };

  return (
    <nav className="navigation">
      <div className="nav-logo-container">
        <img src="/jt_logo-128.png" alt="Job Tracker Logo" className="nav-logo" />
        <img src="/job_tracker.png" alt="Job Tracker" className="nav-title-image" />
      </div>
      <div className="nav-container">
        {menuItems.map((item) => (
          <Link
            key={item.key}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleMenuClick(item.key)}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;