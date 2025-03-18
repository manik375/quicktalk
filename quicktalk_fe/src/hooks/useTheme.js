import { useMemo } from 'react';
import { useDarkMode } from '../context/DarkModeContext';

/**
 * Custom hook that provides theme variables and utilities for the application
 * Can be used in any component to access the current theme and related functionality
 * 
 * @returns {Object} Theme object with colors, utilities, and functions
 */
export const useTheme = () => {
  // Get dark mode state from context
  const { darkMode, toggleDarkMode, setMode } = useDarkMode();

  // Define the theme configuration - centralized for the entire app
  const theme = useMemo(() => {
    // Base theme configuration
    const baseTheme = {
      light: {
        background: "#edf2f0",
        accentPrimary: "#32C48D",
        accentSecondary: "#4DDBa4",
        textPrimary: "#1A2F28",
        textSecondary: "#4A6259",
        shadow: "rgba(144, 174, 170, 0.4)",
        buttonShadow: "5px 5px 10px #c8d6d0, -5px -5px 10px #ffffff",
        buttonInsetShadow:
          "inset 5px 5px 10px #c8d6d0, inset -5px -5px 10px #ffffff",
        inputShadow:
          "inset 4px 4px 8px rgba(144, 174, 170, 0.4), inset -4px -4px 8px #ffffff",
        chatItemShadow:
          "4px 4px 8px rgba(144, 174, 170, 0.4), -4px -4px 8px #ffffff",
        chatItemActiveShadow:
          "inset 4px 4px 8px rgba(144, 174, 170, 0.4), inset -4px -4px 8px #ffffff",
        featureCardShadow: "8px 8px 16px #c8d6d0, -8px -8px 16px #ffffff",
        scrollbarThumb: "#32C48D",
        hoverBg: "#dfe7e3",
        borderColor: "rgba(26, 47, 40, 0.08)",
        statusActive: "#32C48D",
        statusGlow: "rgba(50, 196, 141, 0.5)",
        success: "#2ecc71",
        error: "#e74c3c",
        warning: "#f39c12",
        info: "#3498db",
      },
      dark: {
        background: "#1A2639",
        accentPrimary: "#5EB2FF",
        accentSecondary: "#8ACBFF",
        textPrimary: "#F0F5FF",
        textSecondary: "#B0C4E0",
        shadow: "rgba(0, 0, 0, 0.6)",
        buttonShadow: "5px 5px 10px #141b2b, -5px -5px 10px #243147",
        buttonInsetShadow:
          "inset 5px 5px 10px #141b2b, inset -5px -5px 10px #243147",
        inputShadow:
          "inset 4px 4px 8px rgba(0, 0, 0, 0.6), inset -4px -4px 8px #243147",
        chatItemShadow: "4px 4px 8px rgba(0, 0, 0, 0.4), -4px -4px 8px #243147",
        chatItemActiveShadow:
          "inset 4px 4px 8px rgba(0, 0, 0, 0.5), inset -4px -4px 8px #243147",
        featureCardShadow: "8px 8px 16px #141b2b, -8px -8px 16px #243147",
        scrollbarThumb: "#5EB2FF",
        hoverBg: "#243147",
        borderColor: "rgba(240, 245, 255, 0.08)",
        statusActive: "#5EB2FF",
        statusGlow: "rgba(94, 178, 255, 0.5)",
        success: "#2ecc71",
        error: "#e74c3c",
        warning: "#f39c12",
        info: "#3498db",
      },
    };

    // Helper functions and derived values
    const currentTheme = darkMode ? baseTheme.dark : baseTheme.light;

    // Button style generator for consistent styling
    const getButtonStyle = (variant = 'default') => {
      const styles = {
        background: currentTheme.background,
        boxShadow: currentTheme.buttonShadow,
      };
      
      if (variant === 'primary') {
        styles.background = currentTheme.accentPrimary;
        styles.color = '#ffffff';
      } else if (variant === 'inset') {
        styles.boxShadow = currentTheme.buttonInsetShadow;
      }
      
      return styles;
    };

    // Input style generator
    const getInputStyle = () => ({
      background: currentTheme.background,
      boxShadow: currentTheme.inputShadow,
      color: currentTheme.textPrimary,
      caretColor: currentTheme.accentPrimary,
    });

    // Component style helpers
    const styles = {
      // Common container style
      container: {
        background: currentTheme.background,
        color: currentTheme.textPrimary,
      },
      // Card style
      card: {
        background: currentTheme.background,
        boxShadow: currentTheme.chatItemShadow,
        color: currentTheme.textPrimary,
        borderRadius: '16px',
      },
      // Text styles
      text: {
        primary: { color: currentTheme.textPrimary },
        secondary: { color: currentTheme.textSecondary },
        accent: { color: currentTheme.accentPrimary },
      }
    };

    return {
      isDarkMode: darkMode,
      toggleDarkMode,
      setDarkMode: setMode,
      colors: currentTheme,
      getButtonStyle,
      getInputStyle,
      styles,
    };
  }, [darkMode, toggleDarkMode, setMode]);

  return theme;
};

export default useTheme; 