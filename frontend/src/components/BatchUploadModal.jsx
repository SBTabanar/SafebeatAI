import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import Papa from 'papaparse';

const REQUIRED_FIELDS = ['age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','oldpeak','slope','ca','thal'];

export default function BatchUploadModal({ isOpen, onClose, onBatchPredict }) {
  const [dragActive, setDragActive] = useState(false);
  const [results, setResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    if (e.type === 'dragleave') setDragActive(false);
  }, []);

  const processFile = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }
    setError(null);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        const rows = parsed.data;
        if (!rows.length) {
          setError('CSV file is empty.');
          setIsProcessing(false);
          return;
        }
        const missing = REQUIRED_FIELDS.filter(f => !(f in rows[0]));
        if (missing.length) {
          setError(`Missing columns: ${missing.join(', ')}`);
          setIsProcessing(false);
          return;
        }

        const predictions = await onBatchPredict(rows);
        setResults(predictions);
        setIsProcessing(false);
      },
      error: (err) => {
        setError(err.message);
        setIsProcessing(false);
      }
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  }, [onBatchPredict]);

  const handleFileInput = (e) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const downloadResults = () => {
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `safebeat_batch_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
            className="modal-content modal-lg"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3><Upload size={18} /> Batch Upload</h3>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            {results.length === 0 ? (
              <div className="modal-body">
                <div
                  className={`dropzone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <FileSpreadsheet size={48} />
                  <p>Drag & drop a CSV file here</p>
                  <span>or</span>
                  <label className="file-input-label">
                    Browse Files
                    <input type="file" accept=".csv" onChange={handleFileInput} hidden />
                  </label>
                </div>

                <div className="csv-template">
                  <p>CSV must include these columns:</p>
                  <code>{REQUIRED_FIELDS.join(', ')}</code>
                </div>

                {error && (
                  <motion.div className="modal-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <AlertCircle size={16} /> {error}
                  </motion.div>
                )}

                {isProcessing && (
                  <div className="modal-processing">
                    <span className="spinner"></span> Processing batch predictions...
                  </div>
                )}
              </div>
            ) : (
              <div className="modal-body">
                <div className="batch-success">
                  <CheckCircle2 size={24} />
                  <span>Processed {results.length} patients</span>
                </div>
                <div className="batch-table-wrap">
                  <table className="batch-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Age</th>
                        <th>Sex</th>
                        <th>Result</th>
                        <th>Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.slice(0, 20).map((r, i) => (
                        <tr key={i} className={r.prediction === 1 ? 'risk' : 'safe'}>
                          <td>{i + 1}</td>
                          <td>{r.age}</td>
                          <td>{r.sex === '1' ? 'M' : 'F'}</td>
                          <td>{r.result}</td>
                          <td>{r.confidence}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {results.length > 20 && (
                    <p className="batch-more">...and {results.length - 20} more</p>
                  )}
                </div>
                <div className="modal-actions">
                  <button className="btn-primary" onClick={downloadResults}>
                    <Download size={16} /> Download Results
                  </button>
                  <button className="btn-secondary" onClick={() => { setResults([]); setError(null); }}>
                    Upload Another
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
