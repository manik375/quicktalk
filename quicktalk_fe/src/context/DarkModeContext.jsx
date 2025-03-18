import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the Dark Mode context
const DarkModeContext = createContext();

// Custom hook to easily use the dark mode context
export const useDarkMode = () => useContext(DarkModeContext);

// Provider component for the dark mode context
export const DarkModeProvider = ({ children }) => {
  // Initialize state from localStorage or system preference
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first
    if (localStorage.getItem('theme') === 'dark') {
      return true;
    }
    
    // If not in localStorage, check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // Default to light mode
    return false;
  });

  // Update localStorage and apply class to document when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Set a specific mode
  const setMode = (isDark) => {
    setDarkMode(isDark);
  };

  // Value to provide to consumers
  const value = {
    darkMode,
    toggleDarkMode,
    setMode
  };

  return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
};

// DarkMode toggle component that can be used anywhere in the app
export const DarkModeToggle = ({ className = '' }) => {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <button 
      onClick={toggleDarkMode} 
      className={`p-2 rounded-full transition-all duration-200 ${className}`}
      style={{
        background: darkMode ? '#1A2639' : '#edf2f0',
        boxShadow: darkMode 
          ? '5px 5px 10px #141b2b, -5px -5px 10px #243147'
          : '5px 5px 10px #c8d6d0, -5px -5px 10px #ffffff',
      }}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? (
        // Sun icon for dark mode (clicking changes to light)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5EB2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      ) : (
        // Moon icon for light mode (clicking changes to dark)
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#32C48D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
      )}
    </button>
  );
};

export default DarkModeContext; 