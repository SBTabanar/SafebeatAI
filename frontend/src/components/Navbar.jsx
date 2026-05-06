import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sun, Moon, HelpCircle, ShieldCheck, WifiOff, Upload, BarChart3, Download, Keyboard, Stethoscope, User, Eye, EyeOff } from 'lucide-react';
import { useSimpleMode } from '../context/SimpleModeContext';

export default function Navbar({
  isDarkMode,
  setIsDarkMode,
  backendStatus,
  isOffline,
  onToggleTutorial,
  onOpenBatch,
  onOpenComparison,
  onOpenExport,
  onShowShortcuts,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  ephemeralMode,
  onToggleEphemeral
}) {
  const { simpleMode, setSimpleMode } = useSimpleMode();

  return (
    <motion.nav
      className="navbar-fixed"
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      aria-label="Main navigation"
    >
      <div className="nav-brand-group">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          <div className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span><span></span><span></span>
          </div>
        </button>
        <motion.div
          className="icon-badge-red"
          whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Heart fill="white" size={20} aria-hidden="true" />
        </motion.div>
        <div className="nav-text">
          <h2>SafeBeat AI</h2>
          <span>{simpleMode ? 'Heart Health Check' : 'Clinical Diagnostic Portal'}</span>
        </div>
      </div>

      <div className="nav-nav">
        {isOffline && (
          <motion.div
            className="offline-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            role="status"
            aria-live="polite"
          >
            <WifiOff size={14} aria-hidden="true" /> Offline
          </motion.div>
        )}

        <div className="nav-actions-desktop">
          <button
            className="mode-toggle-btn"
            onClick={() => setSimpleMode(!simpleMode)}
            title={simpleMode ? 'Switch to Clinical Mode' : 'Switch to Simple Mode'}
            aria-label={simpleMode ? 'Switch to Clinical Mode' : 'Switch to Simple Mode'}
          >
            {simpleMode ? <><Stethoscope size={14} aria-hidden="true" /> Clinical</> : <><User size={14} aria-hidden="true" /> Simple</>}
          </button>
          <button
            className="nav-action-btn"
            onClick={onToggleEphemeral}
            title={ephemeralMode ? 'Disable ephemeral mode' : 'Enable ephemeral mode'}
            aria-label={ephemeralMode ? 'Disable ephemeral mode' : 'Enable ephemeral mode'}
            aria-pressed={ephemeralMode}
          >
            {ephemeralMode ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
          <button className="nav-action-btn" onClick={onOpenBatch} title="Batch Upload (CSV)" aria-label="Batch Upload CSV">
            <Upload size={16} aria-hidden="true" />
          </button>
          <button className="nav-action-btn" onClick={onOpenComparison} title="Compare Patients" aria-label="Compare Patients">
            <BarChart3 size={16} aria-hidden="true" />
          </button>
          <button className="nav-action-btn" onClick={onOpenExport} title="Export / Import" aria-label="Export or Import History">
            <Download size={16} aria-hidden="true" />
          </button>
          <button className="nav-action-btn" onClick={onShowShortcuts} title="Keyboard Shortcuts" aria-label="Keyboard Shortcuts">
            <Keyboard size={16} aria-hidden="true" />
          </button>
        </div>

        <button
          className="theme-toggle-ghost"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        <button className="guide-btn-premium" onClick={onToggleTutorial}>
          <HelpCircle size={16} aria-hidden="true" /> Guide
        </button>

        <div className={`online-status ${backendStatus === 'Online' ? 'live' : 'dead'}`} role="status" aria-live="polite">
          <ShieldCheck size={14} aria-hidden="true" /> {backendStatus}
        </div>
      </div>
    </motion.nav>
  );
}
