import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const tutorialSteps = [
  { title: 'Clinical History', content: 'Access previous assessments. Click a card to restore patient data and results instantly.', target: 'sidebar', side: 'right' },
  { title: 'Patient Profile', content: 'Enter patient identity here. Use presets for quick data entry.', target: 'profile', side: 'right' },
  { title: 'Biometric Input', content: 'Input clinical biomarkers. Fields highlight if data enters dangerous ranges.', target: 'inputs', side: 'right' },
  { title: 'Auto-Analyze', content: 'Toggle real-time assessment to see risk updates instantly as you type.', target: 'auto', side: 'right' },
  { title: 'Diagnostic Results', content: 'View the Ensemble Consensus, AI confidence, and mathematical impact breakdown.', target: 'results', side: 'left' },
];

export default function Tutorial({ isActive, currentStep, onSetStep, onClose }) {
  if (!isActive) return null;

  const step = tutorialSteps[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        className="tutorial-system-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="tutorial-dimmer"></div>
        <div className={`tutorial-card-wrapper align-${step.side}`}>
          <motion.div
            className="tut-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={currentStep}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            <div className="tut-progress" style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}></div>
            <div className="tut-header-box">
              <span className="tut-step-txt">Step {currentStep + 1}/{tutorialSteps.length}</span>
              <button onClick={onClose} className="tut-close-btn"><X size={18}/></button>
            </div>
            <h3>{step.title}</h3>
            <p>{step.content}</p>
            <div className="tut-nav">
              <button
                disabled={currentStep === 0}
                onClick={() => onSetStep(currentStep - 1)}
                className="tut-btn-action"
              >
                Back
              </button>
              {currentStep < tutorialSteps.length - 1 ? (
                <button onClick={() => onSetStep(currentStep + 1)} className="tut-btn-action primary">
                  Next
                </button>
              ) : (
                <button onClick={onClose} className="tut-btn-action success">
                  Finish
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
