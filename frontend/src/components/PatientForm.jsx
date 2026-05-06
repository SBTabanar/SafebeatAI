import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Zap, RotateCcw, Sparkles, ChevronDown } from 'lucide-react';
import { useSimpleMode } from '../context/SimpleModeContext';

function sanitizeName(name) {
  return name.replace(/[^\w\s\-\.]/g, '').substring(0, 100);
}

const PRESETS = [
  { name: 'Young Healthy', data: { patientName: 'Young Healthy', age: '25', sex: '1', cp: '0', trestbps: '110', chol: '170', fbs: '0', restecg: '0', thalach: '180', exang: '0', oldpeak: '0.0', slope: '1', ca: '0', thal: '2' } },
  { name: 'Middle-Aged Risk', data: { patientName: 'Middle-Aged Risk', age: '55', sex: '1', cp: '2', trestbps: '140', chol: '240', fbs: '1', restecg: '1', thalach: '140', exang: '1', oldpeak: '2.5', slope: '2', ca: '1', thal: '3' } },
  { name: 'Elderly High Risk', data: { patientName: 'Elderly High Risk', age: '72', sex: '0', cp: '3', trestbps: '160', chol: '290', fbs: '1', restecg: '2', thalach: '110', exang: '1', oldpeak: '3.5', slope: '2', ca: '2', thal: '3' } },
  { name: 'Female Typical', data: { patientName: 'Female Typical', age: '45', sex: '0', cp: '1', trestbps: '125', chol: '210', fbs: '0', restecg: '0', thalach: '165', exang: '0', oldpeak: '0.5', slope: '1', ca: '0', thal: '2' } },
];

const FIELD_CONFIG = {
  age:     { clinical: 'Patient Age',            simple: 'Age',                        min: 0, max: 120, step: 1, unit: 'years' },
  sex:     { clinical: 'Biological Sex',           simple: 'Sex',                        options: [['1','Male'],['0','Female']] },
  cp:      { clinical: 'Chest Pain Type',          simple: 'Chest Pain',                 options: [['0','Typical Angina'],['1','Atypical Angina'],['2','Non-anginal Pain'],['3','No Pain']] },
  trestbps:{ clinical: 'Resting Blood Pressure',   simple: 'Blood Pressure',             min: 50, max: 250, step: 1, unit: 'mm Hg' },
  chol:    { clinical: 'Serum Cholesterol',        simple: 'Cholesterol',                min: 50, max: 600, step: 1, unit: 'mg/dl' },
  fbs:     { clinical: 'Fasting Blood Sugar',      simple: 'Blood Sugar (Fasting)',      options: [['0','Normal (<120)'],['1','High (>=120)']] },
  restecg: { clinical: 'EKG Results',              simple: 'Heart Rhythm Test',          options: [['0','Normal'],['1','Abnormal'],['2','Enlarged Heart']] },
  thalach: { clinical: 'Max Heart Rate',           simple: 'Peak Heart Rate',            min: 40, max: 250, step: 1, unit: 'BPM' },
  exang:   { clinical: 'Exercise Angina',          simple: 'Chest Pain During Exercise', options: [['0','No'],['1','Yes']] },
  oldpeak: { clinical: 'ST Depression',            simple: 'Heart Strain (ST)',          min: 0, max: 10, step: 0.1, unit: 'mm' },
  slope:   { clinical: 'ST Slope',                 simple: 'Exercise EKG Curve',         options: [['0','Rising'],['1','Flat'],['2','Falling']] },
  ca:      { clinical: 'Major Vessels',            simple: 'Blocked Arteries',           min: 0, max: 3, step: 1, unit: 'count' },
  thal:    { clinical: 'Thalassemia',              simple: 'Blood Disorder Type',        options: [['1','Normal'],['2','Fixed Defect'],['3','Reversible Defect']] },
};

export default function PatientForm({
  formData,
  onChange,
  onSubmit,
  autoAnalyze,
  onToggleAutoAnalyze,
  isTutorialActive,
  isTutorialTarget,
  loading,
  referenceRanges
}) {
  const { simpleMode } = useSimpleMode();
  const [showPresets, setShowPresets] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const getValidation = (name, value) => {
    const val = parseFloat(value);
    if (isNaN(val)) return 'Invalid number';
    const info = FIELD_CONFIG[name];
    if (info && info.min !== undefined) {
      if (val < info.min) return `Min: ${info.min}`;
      if (val > info.max) return `Max: ${info.max}`;
    }
    if (name === 'trestbps' && val > 140) return 'Elevated BP';
    if (name === 'chol' && val > 240) return 'High Cholesterol';
    return null;
  };

  const applyPreset = (preset) => {
    Object.entries(preset.data).forEach(([key, value]) => {
      onChange({ target: { name: key, value } });
    });
    setShowPresets(false);
  };

  const resetForm = () => {
    const defaults = {
      patientName: 'New Patient', age: '50', sex: '1', cp: '0',
      trestbps: '120', chol: '200', fbs: '0', restecg: '0',
      thalach: '150', exang: '0', oldpeak: '0.0', slope: '1', ca: '0', thal: '2'
    };
    Object.entries(defaults).forEach(([k, v]) => onChange({ target: { name: k, value: v } }));
  };

  const handleNameChange = (e) => {
    const sanitized = sanitizeName(e.target.value);
    onChange({ target: { name: e.target.name, value: sanitized } });
  };

  const renderField = (name) => {
    const config = FIELD_CONFIG[name];
    const label = simpleMode ? config.simple : config.clinical;
    const error = getValidation(name, formData[name]);
    const isDanger = error && (error.includes('Elevated') || error.includes('High'));
    const errorId = error ? `error-${name}` : undefined;
    const refRange = referenceRanges?.[name] || config.ref;

    return (
      <motion.div
        className={`input-field ${error ? 'has-error' : ''} ${isDanger ? 'is-danger' : ''}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 * Object.keys(FIELD_CONFIG).indexOf(name) }}
        onMouseEnter={() => setActiveTooltip(name)}
        onMouseLeave={() => setActiveTooltip(null)}
      >
        <label htmlFor={name}>
          {label}
          {config?.unit && <span className="field-unit">{config.unit}</span>}
          {refRange && <span className="field-ref">Ref: {refRange}</span>}
        </label>
        {config?.options ? (
          <select
            id={name}
            name={name}
            value={formData[name]}
            onChange={onChange}
            aria-describedby={errorId}
          >
            {config.options.map(([val, text]) => (
              <option key={val} value={val}>{text}</option>
            ))}
          </select>
        ) : (
          <input
            id={name}
            type="number"
            name={name}
            value={formData[name]}
            onChange={onChange}
            min={config?.min}
            max={config?.max}
            step={config?.step}
            className={error ? 'err' : ''}
            aria-describedby={errorId}
          />
        )}
        {error && (
          <motion.span
            id={errorId}
            className={`field-error ${isDanger ? 'warning' : ''}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            role="alert"
          >
            {error}
          </motion.span>
        )}
        {activeTooltip === name && !error && config?.min !== undefined && (
          <div className="field-tooltip">
            Range: {config.min} - {config.max} {config.unit}
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <section className={`pane-input ${isTutorialActive && isTutorialTarget ? 'highlight-active' : ''}`}>
      <div className="pane-header-row">
        <div className="title-pair">
          <UserPlus size={18} color="var(--primary)" />
          <h3>{simpleMode ? 'Enter Details' : 'Patient Profile'}</h3>
        </div>
        <div className="header-actions">
          <div className={`auto-toggle-wrap ${isTutorialActive && isTutorialTarget === 'auto' ? 'element-focus' : ''}`}>
            <label>{simpleMode ? 'Auto-check' : 'Auto-Analyze'}</label>
            <label className="ios-switch">
              <input type="checkbox" checked={autoAnalyze} onChange={onToggleAutoAnalyze} />
              <span className="ios-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className={`name-box-highlight ${isTutorialActive && isTutorialTarget === 'profile' ? 'element-focus' : ''}`}>
        <div className="name-row">
          <div className="name-input-wrap">
            <label>{simpleMode ? 'Name' : 'Full Patient Name'}</label>
            <input
              name="patientName"
              type="text"
              value={formData.patientName}
              onChange={handleNameChange}
              className="name-field-large"
              placeholder={simpleMode ? 'Enter name...' : 'Enter patient name...'}
              aria-label={simpleMode ? 'Full name' : 'Full patient name'}
            />
          </div>
          <div className="preset-wrap">
            <button className="preset-btn" onClick={() => setShowPresets(!showPresets)}>
              <Sparkles size={14} /> Quick Fill <ChevronDown size={14} className={showPresets ? 'rotate' : ''} />
            </button>
            <button className="reset-btn" onClick={resetForm} title="Reset form">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        {showPresets && (
          <motion.div
            className="preset-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {PRESETS.map(preset => (
              <button key={preset.name} className="preset-item" onClick={() => applyPreset(preset)}>
                {preset.name}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      <form onSubmit={onSubmit}>
        <div className={`diagnostic-grid ${isTutorialActive && isTutorialTarget === 'inputs' ? 'element-focus' : ''}`}>
          {Object.keys(FIELD_CONFIG).map(key => renderField(key))}
        </div>

        {!autoAnalyze && (
          <motion.button
            type="submit"
            className="analyze-btn-clinical"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="btn-loading">
                <span className="spinner"></span> {simpleMode ? 'Checking...' : 'Analyzing...'}
              </span>
            ) : (
              <><Zap size={18} /> {simpleMode ? 'Check Heart Health' : 'Run Ensemble Analysis'}</>
            )}
          </motion.button>
        )}
      </form>
    </section>
  );
}
