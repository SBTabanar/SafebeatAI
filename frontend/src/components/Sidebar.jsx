import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Eraser, ChevronRight, Search, BarChart2, Trash2 } from 'lucide-react';
import { useSimpleMode } from '../context/SimpleModeContext';

export default function Sidebar({
  history,
  onLoadItem,
  onClearHistory,
  onCompareItem,
  compareMode,
  isMobileMenuOpen,
  isTutorialActive,
  isCurrentStepTarget
}) {
  const { simpleMode } = useSimpleMode();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState([]);

  const filteredHistory = history.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompareClick = (item) => {
    if (selectedForCompare.find(s => s.id === item.id)) {
      setSelectedForCompare(prev => prev.filter(s => s.id !== item.id));
    } else if (selectedForCompare.length < 2) {
      const next = [...selectedForCompare, item];
      setSelectedForCompare(next);
      if (next.length === 2) {
        onCompareItem(next[0], next[1]);
        setSelectedForCompare([]);
      }
    }
  };

  return (
    <aside
      className={`sidebar-clinical ${isMobileMenuOpen ? 'mobile-open' : ''} ${isTutorialActive && isCurrentStepTarget ? 'highlight-active' : ''}`}
    >
      <div className="sidebar-top">
        <History size={16} />
        <h4>{simpleMode ? 'Past Checks' : 'Activity'}</h4>
        <div className="sidebar-actions">
          <button onClick={onClearHistory} className="eraser-btn" title="Clear History">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="sidebar-search">
        <Search size={14} />
        <input
          type="text"
          placeholder={simpleMode ? 'Find a person...' : 'Search patients...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {compareMode && (
        <div className="compare-hint">
          <BarChart2 size={14} />
          Select 2 patients to compare
        </div>
      )}

      <div className="sidebar-scroll">
        <AnimatePresence>
          {filteredHistory.length === 0 ? (
            <motion.div
              className="empty-history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p>{simpleMode ? 'No checks yet' : 'No assessments yet'}</p>
              <span>{simpleMode ? 'Run your first heart health check' : 'Complete your first analysis to see history here'}</span>
            </motion.div>
          ) : (
            filteredHistory.map((item, index) => {
              const isSelected = selectedForCompare.find(s => s.id === item.id);
              return (
                <motion.div
                  key={item.id}
                  className={`history-card-clinical ${item.result.prediction === 1 ? 'risk' : 'safe'} ${isSelected ? 'selected' : ''}`}
                  onClick={() => compareMode ? handleCompareClick(item) : onLoadItem(item)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <div className="h-text">
                    <strong>{item.name}</strong>
                    <span>{item.date} &middot; Age {item.age}</span>
                  </div>
                  <div className="h-meta">
                    <span className={`h-badge ${item.result.prediction === 1 ? 'risk' : 'safe'}`}>
                      {simpleMode
                        ? (item.result.prediction === 1 ? 'Risk' : 'Healthy')
                        : (item.result.prediction === 1 ? 'Risk' : 'Healthy')
                      }
                    </span>
                    <ChevronRight size={12} opacity={0.4} />
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
