import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Sun, Moon, HelpCircle, ShieldCheck, WifiOff, Upload, BarChart3, Download, Keyboard, Stethoscope, User } from 'lucide-react';
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
  setIsMobileMenuOpen
}) {
  const { simpleMode, setSimpleMode } = useSimpleMode();

  return (
    <motion.nav
      className="navbar-fixed"
      initial={{ y: -64 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="nav-brand-group">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
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
          <Heart fill="white" size={20} />
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
          >
            <WifiOff size={14} /> Offline
          </motion.div>
        )}

        <div className="nav-actions-desktop">
          <button className="mode-toggle-btn" onClick={() => setSimpleMode(!simpleMode)} title={simpleMode ? 'Switch to Clinical Mode' : 'Switch to Simple Mode'}>
            {simpleMode ? <><Stethoscope size={14} /> Clinical</> : <><User size={14} /> Simple</>}
          </button>
          <button className="nav-action-btn" onClick={onOpenBatch} title="Batch Upload (CSV)">
            <Upload size={16} />
          </button>
          <button className="nav-action-btn" onClick={onOpenComparison} title="Compare Patients">
            <BarChart3 size={16} />
          </button>
          <button className="nav-action-btn" onClick={onOpenExport} title="Export / Import">
            <Download size={16} />
          </button>
          <button className="nav-action-btn" onClick={onShowShortcuts} title="Keyboard Shortcuts">
            <Keyboard size={16} />
          </button>
        </div>

        <button
          className="theme-toggle-ghost"
          onClick={() => setIsDarkMode(!isDarkMode)}
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button className="guide-btn-premium" onClick={onToggleTutorial}>
          <HelpCircle size={16} /> Guide
        </button>

        <div className={`online-status ${backendStatus === 'Online' ? 'live' : 'dead'}`}>
          <ShieldCheck size={14} /> {backendStatus}
        </div>
      </div>
    </motion.nav>
  );
}
