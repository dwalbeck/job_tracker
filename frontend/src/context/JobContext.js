import React, { createContext, useContext, useState } from 'react';

const JobContext = createContext();

export const useJob = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJob must be used within a JobProvider');
  }
  return context;
};

export const JobProvider = ({ children }) => {
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');

  const selectJob = (jobId) => {
    setSelectedJobId(jobId);
  };

  const clearSelection = () => {
    setSelectedJobId(null);
  };

  const navigateToPage = (page) => {
    if (currentPage === page && selectedJobId) {
      clearSelection();
    }
    setCurrentPage(page);
  };

  return (
    <JobContext.Provider value={{
      selectedJobId,
      currentPage,
      selectJob,
      clearSelection,
      navigateToPage
    }}>
      {children}
    </JobContext.Provider>
  );
};