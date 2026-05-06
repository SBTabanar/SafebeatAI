import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Command } from 'lucide-react';

import { ToastProvider, useToast } from './context/ToastContext';
import { SimpleModeProvider, useSimpleMode } from './context/SimpleModeContext';
import { useOffline } from './hooks/useOffline';
import { useLocalStorage } from './hooks/useLocalStorage';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import PatientForm from './components/PatientForm';
import ResultsPanel from './components/ResultsPanel';
import Tutorial from './components/Tutorial';
import BatchUploadModal from './components/BatchUploadModal';
import ComparisonModal from './components/ComparisonModal';
import ExportModal from './components/ExportModal';

import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const tutorialStepsTargets = ['sidebar', 'profile', 'inputs', 'auto', 'results'];

function AppContent() {
  const { addToast } = useToast();
  const { simpleMode } = useSimpleMode();
  const isOffline = useOffline();

  const initialData = {
    patientName: 'New Patient',
    age: '50', sex: '1', cp: '0', trestbps: '120', chol: '200', fbs: '0',
    restecg: '0', thalach: '150', exang: '0', oldpeak: '0.0', slope: '1', ca: '0', thal: '2'
  };

  const [formData, setFormData] = useState(initialData);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [history, setHistory, clearHistoryStorage] = useLocalStorage('safebeat_history_v2', []);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('safebeat_theme', false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [showBatch, setShowBatch] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [compareItems, setCompareItems] = useState([null, null]);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOffline) addToast('You are offline. Some features may be unavailable.', 'error', 6000);
  }, [isOffline, addToast]);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
      setBackendStatus(response.ok ? 'Online' : 'Offline');
    } catch { setBackendStatus('Offline'); }
  };

  const updateHistory = useCallback((data, res) => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleString(),
      name: data.patientName,
      age: data.age,
      data: { ...data },
      result: { ...res }
    };
    setHistory(prev => {
      const filtered = prev.filter(h => h.name !== data.patientName || JSON.stringify(h.data) !== JSON.stringify(data));
      return [entry, ...filtered].slice(0, 50);
    });
  }, [setHistory]);

  const triggerAnalysis = useCallback(async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, data);
      setResult(response.data);
      updateHistory(data, response.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Analysis failed. Please try again.', 'error');
    }
  }, [addToast, updateHistory]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData);
      setResult(response.data);
      updateHistory(formData, response.data);
      addToast(simpleMode ? 'Check complete!' : 'Analysis complete!', 'success');
    } catch (err) {
      const msg = err.response?.data?.error || 'Server Connection Failed.';
      addToast(msg, 'error');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      if (autoAnalyze && name !== 'patientName') {
        triggerAnalysis(newData);
      }
      return newData;
    });
  };

  const loadHistoryItem = (item) => {
    setFormData(item.data);
    setResult(item.result);
    setIsMobileMenuOpen(false);
    addToast(simpleMode ? `Loaded check for ${item.name}` : `Loaded assessment for ${item.name}`, 'info');
  };

  const clearHistory = () => {
    clearHistoryStorage();
    addToast(simpleMode ? 'History cleared' : 'History cleared', 'info');
  };

  const handleBatchPredict = async (rows) => {
    const predictions = [];
    for (const row of rows) {
      try {
        const res = await axios.post(`${API_BASE_URL}/predict`, row);
        predictions.push({ ...row, ...res.data });
      } catch {
        predictions.push({ ...row, error: 'Prediction failed' });
      }
    }
    addToast(simpleMode ? `Done! ${predictions.length} people checked` : `Batch complete: ${predictions.length} patients processed`, 'success');
    return predictions;
  };

  const handleCompare = (a, b) => {
    setCompareItems([a, b]);
    setShowComparison(true);
    setCompareMode(false);
    setIsMobileMenuOpen(false);
  };

  const downloadPDF = () => {
    if (!result) return;
    import('jspdf').then(({ default: jsPDF }) => {
      import('jspdf-autotable').then(({ default: autoTable }) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 50, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28); doc.setFont('helvetica', 'bold');
        doc.text('SafeBeat AI', 20, 28);
        doc.setFontSize(9); doc.setFont('helvetica', 'normal');
        doc.text('CONFIDENTIAL CLINICAL DIAGNOSTIC DOSSIER', 20, 38);
        doc.text(`REPORT ID: SB-${Date.now()}`, pageWidth - 80, 28);
        doc.text(`ISSUED: ${new Date().toLocaleString()}`, pageWidth - 80, 34);

        doc.setTextColor(15, 23, 42); doc.setFontSize(14); doc.setFont('helvetica', 'bold');
        doc.text('Section I: Patient Clinical Record', 20, 65);
        autoTable(doc, {
          startY: 70,
          head: [['Biomarker', 'Measured Value', 'Ref. Range']],
          body: [
            ['Patient Name', formData.patientName, 'N/A'],
            ['Age', formData.age, '1-110'],
            ['Resting BP', `${formData.trestbps} mm Hg`, '90-140'],
            ['Cholesterol', `${formData.chol} mg/dl`, '125-200'],
            ['Peak Heart Rate', `${formData.thalach} BPM`, '60-200'],
          ],
          theme: 'striped', headStyles: { fillColor: [37, 99, 235] }
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFillColor(241, 245, 249); doc.rect(20, finalY, pageWidth - 40, 55, 'F');
        doc.setTextColor(15, 23, 42); doc.setFontSize(11);
        doc.text('Section II: Ensemble AI Consensus', 25, finalY + 10);
        doc.setFontSize(20);
        const riskColor = result.prediction === 1 ? [239, 68, 68] : [16, 185, 129];
        doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
        doc.text(result.result.toUpperCase(), 25, finalY + 22);
        doc.setTextColor(100, 116, 139); doc.setFontSize(9);
        doc.text(`Ensemble Confidence: ${result.confidence} | Consensus: ${result.consensus}`, 25, finalY + 32);

        doc.setFontSize(8); doc.setTextColor(15, 23, 42);
        let modelY = finalY + 40;
        Object.entries(result.models_detail).forEach(([name, data]) => {
          const modelName = name.replace(/([A-Z])/g, ' $1').trim();
          const status = data.pred === 1 ? 'RISK' : 'HEALTHY';
          doc.text(`${modelName}: ${data.conf} Confidence (${status}) | Benchmark: ${data.accuracy}`, 25, modelY);
          modelY += 4;
        });

        doc.setTextColor(15, 23, 42); doc.setFontSize(14);
        doc.text('Section III: Bio-Impact Attribution', 20, finalY + 60);
        const drivers = result.top_factors.map(f => [
          f.name,
          `${f.impact}%`,
          'Clinical risk factor contribution'
        ]);
        autoTable(doc, {
          startY: finalY + 65,
          head: [['Biomarker', 'Weight', 'Context']],
          body: drivers,
          theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
        });

        const lastY = doc.lastAutoTable.finalY + 25;
        doc.setDrawColor(200, 200, 200); doc.line(20, lastY, 80, lastY);
        doc.line(pageWidth - 80, lastY, pageWidth - 20, lastY);
        doc.setFontSize(8); doc.text('System Engineer (SBTabanar)', 20, lastY + 5);
        doc.text('Reviewing Clinician', pageWidth - 80, lastY + 5);

        doc.save(`SafeBeat_Report_${formData.patientName.replace(/\s+/g, '_')}.pdf`);
        addToast(simpleMode ? 'Report saved!' : 'PDF report downloaded', 'success');
      });
    });
  };

  const copyResult = () => {
    if (!result) return;
    const text = simpleMode
      ? `SafeBeat AI Result\nName: ${formData.patientName}\nResult: ${result.prediction === 1 ? 'Possible heart risk' : 'Heart looks healthy'}\nConfidence: ${result.confidence}\n\nTop factors:\n${result.top_factors.map(f => `- ${f.name}: ${f.impact}%`).join('\n')}`
      : `SafeBeat AI Assessment\nPatient: ${formData.patientName}\nResult: ${result.result}\nConfidence: ${result.confidence}\nConsensus: ${result.consensus}\n\nTop Factors:\n${result.top_factors.map(f => `- ${f.name}: ${f.impact}%`).join('\n')}`;
    navigator.clipboard.writeText(text).then(() => addToast('Result copied to clipboard', 'success'));
  };

  const shareResult = async () => {
    if (!result) return;
    const shareData = {
      title: 'SafeBeat AI Result',
      text: simpleMode
        ? `${formData.patientName}: ${result.prediction === 1 ? 'Possible heart risk' : 'Heart looks healthy'} (${result.confidence})`
        : `${formData.patientName}: ${result.result} (${result.confidence} confidence)`
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      copyResult();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === 'b') {
          e.preventDefault();
          setShowBatch(true);
        }
        if (e.key === 'e') {
          e.preventDefault();
          setShowExport(true);
        }
        if (e.key === 'k') {
          e.preventDefault();
          setShowShortcuts(true);
        }
        if (e.key === 'd') {
          e.preventDefault();
          setIsDarkMode(prev => !prev);
        }
      }
      if (e.key === 'Escape') {
        setShowBatch(false);
        setShowComparison(false);
        setShowExport(false);
        setShowShortcuts(false);
        setIsTutorialActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsDarkMode]);

  const getTutorialTarget = () => {
    if (!isTutorialActive) return null;
    return tutorialStepsTargets[currentStep];
  };

  return (
    <div className={`root-layout ${isTutorialActive ? 'tutorial-active' : ''}`}>
      <Tutorial
        isActive={isTutorialActive}
        currentStep={currentStep}
        onSetStep={setCurrentStep}
        onClose={() => setIsTutorialActive(false)}
      />

      <BatchUploadModal
        isOpen={showBatch}
        onClose={() => setShowBatch(false)}
        onBatchPredict={handleBatchPredict}
      />

      <ComparisonModal
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        itemA={compareItems[0]}
        itemB={compareItems[1]}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        history={history}
        onImportHistory={(data) => { setHistory(data); addToast('History imported', 'success'); }}
      />

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              className="modal-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3><Keyboard size={18} /> Keyboard Shortcuts</h3>
                <button className="modal-close" onClick={() => setShowShortcuts(false)}><X size={18} /></button>
              </div>
              <div className="modal-body shortcuts-body">
                <div className="shortcut-row"><kbd><Command size={12} /> Enter</kbd><span>Run Analysis</span></div>
                <div className="shortcut-row"><kbd><Command size={12} /> B</kbd><span>Batch Upload</span></div>
                <div className="shortcut-row"><kbd><Command size={12} /> E</kbd><span>Export / Import</span></div>
                <div className="shortcut-row"><kbd><Command size={12} /> D</kbd><span>Toggle Dark Mode</span></div>
                <div className="shortcut-row"><kbd><Command size={12} /> K</kbd><span>Keyboard Shortcuts</span></div>
                <div className="shortcut-row"><kbd>Esc</kbd><span>Close Modals</span></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="main-card">
        <Navbar
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          backendStatus={backendStatus}
          isOffline={isOffline}
          onToggleTutorial={() => { setIsTutorialActive(true); setCurrentStep(0); }}
          onOpenBatch={() => setShowBatch(true)}
          onOpenComparison={() => {
            if (history.length < 2) {
              addToast(simpleMode ? 'Need at least 2 past checks to compare' : 'Need at least 2 history items to compare', 'error');
              return;
            }
            setCompareMode(true);
            setIsMobileMenuOpen(true);
            addToast(simpleMode ? 'Tap 2 people to compare' : 'Select 2 patients from the sidebar to compare', 'info', 5000);
          }}
          onOpenExport={() => setShowExport(true)}
          onShowShortcuts={() => setShowShortcuts(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className="app-main-body">
          <Sidebar
            history={history}
            onLoadItem={loadHistoryItem}
            onClearHistory={clearHistory}
            onCompareItem={handleCompare}
            compareMode={compareMode}
            isMobileMenuOpen={isMobileMenuOpen}
            isTutorialActive={isTutorialActive}
            isCurrentStepTarget={getTutorialTarget() === 'sidebar'}
          />

          <main className="diagnostic-view">
            <PatientForm
              formData={formData}
              onChange={handleChange}
              onSubmit={handleSubmit}
              autoAnalyze={autoAnalyze}
              onToggleAutoAnalyze={() => setAutoAnalyze(!autoAnalyze)}
              isTutorialActive={isTutorialActive}
              isTutorialTarget={getTutorialTarget()}
              loading={loading}
            />

            <ResultsPanel
              result={result}
              formData={formData}
              isDarkMode={isDarkMode}
              isTutorialActive={isTutorialActive}
              isTutorialTarget={getTutorialTarget() === 'results'}
              onDownloadPDF={downloadPDF}
              onCopyResult={copyResult}
              onShareResult={shareResult}
            />
          </main>
        </div>

        <footer className="footer-bar-clinical">
          <div className="footer-inner">
            <span>Lead Developer: <strong>SBTabanar</strong></span>
            <span>SafeBeat AI v2.8 &middot; <button className="footer-link" onClick={() => setShowShortcuts(true)}>Shortcuts</button></span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SimpleModeProvider>
        <AppContent />
      </SimpleModeProvider>
    </ToastProvider>
  );
}
