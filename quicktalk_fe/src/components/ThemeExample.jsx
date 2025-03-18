import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { DarkModeToggle } from '../context/DarkModeContext';

/**
 * Example component that demonstrates how to use the useTheme hook
 * This shows how new components can easily access the dark mode functionality
 */
const ThemeExample = () => {
  // Use the custom theme hook to get all theme-related functionality
  const theme = useTheme();
  
  // Extract values from theme
  const { isDark, colors, styles, getButtonStyle, getInputStyle } = theme;
  
  return (
    <div style={styles.container} className="p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 style={styles.text.primary} className="text-xl font-bold">
          Theme Example Component
        </h2>
        <DarkModeToggle />
      </div>
      
      <div style={styles.card} className="p-4 mb-4">
        <h3 style={styles.text.accent} className="text-lg mb-2">
          Current Theme: {isDark ? 'Dark Mode' : 'Light Mode'}
        </h3>
        <p style={styles.text.secondary} className="mb-4">
          This component demonstrates how to use the centralized theme system in any component.
        </p>
        
        <div className="flex space-x-3 mb-4">
          <button
            style={getButtonStyle()}
            className="px-4 py-2 rounded-lg"
          >
            Default Button
          </button>
          
          <button
            style={getButtonStyle('primary')}
            className="px-4 py-2 rounded-lg"
          >
            Primary Button
          </button>
          
          <button
            style={getButtonStyle('inset')}
            className="px-4 py-2 rounded-lg"
          >
            Inset Button
          </button>
        </div>
        
        <div className="mb-4">
          <label style={styles.text.secondary} className="block mb-2">
            Example Input
          </label>
          <input
            type="text"
            placeholder="Themed input example"
            style={getInputStyle()}
            className="w-full p-3 rounded-lg outline-none"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div style={{...styles.card, background: colors.success}} className="p-3">
          <p className="text-white">Success Card</p>
        </div>
        <div style={{...styles.card, background: colors.error}} className="p-3">
          <p className="text-white">Error Card</p>
        </div>
        <div style={{...styles.card, background: colors.warning}} className="p-3">
          <p className="text-white">Warning Card</p>
        </div>
        <div style={{...styles.card, background: colors.info}} className="p-3">
          <p className="text-white">Info Card</p>
        </div>
      </div>
    </div>
  );
};

export default ThemeExample; 