import React, { useEffect, useState } from "react";
import {
  ChatDots,
  SignOut,
  Moon,
  Sun,
  List,
  X,
  Archive,
  Gear,
  CaretRight,
  CaretLeft,
} from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../redux/authSlice";
import { persistor } from "../../redux/Store";
import { useTheme } from "../../hooks/useTheme";

export default function Sidebar({
  collapsed = false,
  setCollapsed,
  handleChatSelect,
  handleLogout,
  selectedChat,
  onSettingsClick,
}) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { colors, styles, isDarkMode, toggleDarkMode, getButtonStyle } = useTheme();

  // On mount, check theme and set the initial collapsed mode.
  useEffect(() => {
    // Initialize collapsed state:
    // On mobile, default to hidden; on larger screens, try reading from localStorage.
    const savedCollapsedState = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsedState !== null) {
      setCollapsed(savedCollapsedState === "true");
    } else {
      setCollapsed(window.innerWidth < 640);
    }
  }, [setCollapsed]);

  // Update mobile detection on window resize.
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 640);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle the collapsed state.
  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState.toString());
  };

  // Handle settings click
  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    }
  };

  // The inner content of the sidebar (shared between mobile overlay and desktop).
  const sidebarContent = (
    <>
      {/* Top Controls: Collapse Toggle & Dark Mode Toggle */}
      <div
        className={
          !isMobile && collapsed
            ? "flex flex-col items-center space-y-4"
            : "flex justify-between items-center"
        }
      >
        <button
          onClick={toggleCollapse}
          style={getButtonStyle()}
          className="p-2 rounded-full transition-all duration-200 hover:scale-105"
          aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
        >
          {collapsed ? (
            <CaretRight size={20} style={{ color: colors.accentPrimary }} />
          ) : (
            <CaretLeft size={20} style={{ color: colors.accentPrimary }} />
          )}
        </button>
        <button
          onClick={toggleDarkMode}
          style={getButtonStyle()}
          className="p-2 rounded-full transition-all duration-200 hover:scale-105"
          aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDarkMode ? (
            <Sun size={20} weight="fill" style={{ color: colors.accentSecondary }} />
          ) : (
            <Moon size={20} weight="fill" style={{ color: colors.accentSecondary }} />
          )}
        </button>
      </div>

      {/* Header with Chat Icon */}
      <div className={`flex justify-center ${collapsed ? "mt-6" : "mt-8"}`}>
        {collapsed ? (
          <div
            style={getButtonStyle()}
            className="p-3 rounded-full transition-all duration-200"
          >
            <ChatDots size={22} weight="fill" style={{ color: colors.accentPrimary }} />
          </div>
        ) : (
          <div
            style={styles.card}
            className="w-full rounded-lg p-4 text-center transition-all duration-200"
          >
            <div
              className="inline-flex mb-2 p-2 rounded-full"
              style={getButtonStyle()}
            >
              <ChatDots size={24} weight="fill" style={{ color: colors.accentPrimary }} />
            </div>
            <span style={styles.text.primary} className="block font-medium">
              Messages
            </span>
            <span
              style={styles.text.secondary}
              className="mt-1 block text-xs"
            >
              Your conversations
            </span>
          </div>
        )}
      </div>

      {/* Navigation Area */}
      <div className={`flex flex-col grow mt-8 w-full`}>
        {!collapsed && (
          <h3
            style={styles.text.secondary}
            className="mb-4 text-xs font-semibold uppercase tracking-wider"
          >
            Navigation
          </h3>
        )}
        <nav className="space-y-4 flex flex-col items-center w-full">
          {/* Active Chats */}
          <button
            style={getButtonStyle('inset')}
            className={`flex items-center rounded-lg transition-all duration-200 ${
              collapsed ? "w-12 h-12 justify-center" : "w-full px-3 py-2"
            }`}
          >
            {collapsed ? (
              <ChatDots size={20} style={{ color: colors.accentPrimary }} />
            ) : (
              <>
                <ChatDots size={20} style={{ color: colors.accentPrimary }} />
                <span style={styles.text.primary} className="ml-3">
                  Active
                </span>
              </>
            )}
          </button>

          {/* Archived */}
          <button
            style={getButtonStyle()}
            className={`flex items-center rounded-lg transition-all duration-200 hover:scale-105 ${
              collapsed ? "w-12 h-12 justify-center" : "w-full px-3 py-2"
            }`}
          >
            {collapsed ? (
              <Archive size={20} style={{ color: colors.accentSecondary }} />
            ) : (
              <>
                <Archive size={20} style={{ color: colors.accentSecondary }} />
                <span style={styles.text.primary} className="ml-3">
                  Archived
                </span>
              </>
            )}
          </button>

          {/* Settings */}
          <button
            onClick={handleSettingsClick}
            style={getButtonStyle()}
            className={`flex items-center rounded-lg transition-all duration-200 hover:scale-105 ${
              collapsed ? "w-12 h-12 justify-center" : "w-full px-3 py-2"
            }`}
          >
            {collapsed ? (
              <Gear size={20} style={{ color: colors.accentSecondary }} />
            ) : (
              <>
                <Gear size={20} style={{ color: colors.accentSecondary }} />
                <span style={styles.text.primary} className="ml-3">
                  Settings
                </span>
              </>
            )}
          </button>
        </nav>
      </div>

      {/* Footer with Sign Out */}
      <div className="mt-auto pt-6 flex justify-center w-full">
        <button
          style={getButtonStyle()}
          onClick={handleLogout}
          className={`flex items-center rounded-lg transition-all duration-200 hover:scale-105 ${
            collapsed ? "p-3" : "w-full px-4 py-3"
          }`}
        >
          {collapsed ? (
            <SignOut
              size={20}
              weight="bold"
              style={{ color: colors.error }}
            />
          ) : (
            <>
              <div className="p-1 rounded-full" style={getButtonStyle()}>
                <SignOut
                  size={18}
                  weight="bold"
                  style={{ color: colors.error }}
                />
              </div>
              <span style={styles.text.primary} className="ml-3 font-medium">
                Sign Out
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );

  // Render for mobile vs. desktop.
  if (isMobile) {
    if (collapsed) {
      // On mobile and collapsed, hide the sidebar completely and show a floating toggle.
      return (
        <button
          onClick={toggleCollapse}
          style={getButtonStyle()}
          className="fixed bottom-4 left-4 p-3 rounded-full transition-all duration-300 hover:scale-105 z-50"
          aria-label="Open sidebar"
        >
          <List size={20} style={{ color: colors.accentPrimary }} />
        </button>
      );
    } else {
      // On mobile when expanded, render the sidebar as an overlay.
      return (
        <>
          {/* A semi-transparent backdrop to capture outside clicks */}
          <div
            className="fixed inset-0 z-40 bg-black opacity-30"
            onClick={toggleCollapse}
          ></div>
          <aside
            style={styles.container}
            className="fixed inset-y-0 left-0 z-50 w-64 p-6 transition-transform duration-300"
          >
            {sidebarContent}
          </aside>
        </>
      );
    }
  } else {
    // Desktop view: render the sidebar in its normal (collapsed or expanded) state.
    return (
      <aside
        style={styles.container}
        className={`flex flex-col h-full transition-all duration-300 ${
          collapsed ? "w-20 p-4" : "w-64 p-6"
        }`}
      >
        {sidebarContent}
      </aside>
    );
  }
}
