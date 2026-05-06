import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ExportModal({ isOpen, onClose, history, onImportHistory }) {
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const exportJSON = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safebeat_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    if (!history.length) return;
    const headers = ['Date', 'Name', 'Age', 'Sex', 'CP', 'BP', 'Chol', 'FBS', 'EKG', 'HR', 'Angina', 'ST', 'Slope', 'CA', 'Thal', 'Result', 'Confidence'];
    const rows = history.map(h => [
      h.date, h.name, h.data.age, h.data.sex, h.data.cp, h.data.trestbps, h.data.chol,
      h.data.fbs, h.data.restecg, h.data.thalach, h.data.exang, h.data.oldpeak,
      h.data.slope, h.data.ca, h.data.thal, h.result.result, h.result.confidence
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safebeat_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) throw new Error('Invalid format: expected an array');
        onImportHistory(data);
        setImportSuccess(true);
      } catch (err) {
        setImportError(err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3><Download size={18} /> Export & Import</h3>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="modal-body">
              <div className="export-section">
                <h4>Export History</h4>
                <p>{history.length} assessments stored</p>
                <div className="export-buttons">
                  <button className="btn-export" onClick={exportJSON}>
                    <FileJson size={16} /> JSON
                  </button>
                  <button className="btn-export" onClick={exportCSV}>
                    <FileSpreadsheet size={16} /> CSV
                  </button>
                </div>
              </div>

              <div className="import-section">
                <h4>Import History</h4>
                <p>Restore assessments from a JSON backup</p>
                <label className="file-input-label import-label">
                  <Upload size={16} /> Choose JSON File
                  <input type="file" accept=".json" onChange={handleImport} hidden />
                </label>

                {importError && (
                  <motion.div className="modal-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AlertCircle size={16} /> {importError}
                  </motion.div>
                )}
                {importSuccess && (
                  <motion.div className="modal-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <CheckCircle2 size={16} /> Import successful!
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
