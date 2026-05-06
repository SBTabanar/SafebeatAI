import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Download, Copy, Share2, Info, CheckCircle2,
  AlertTriangle, TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  HeartPulse, ShieldAlert
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RechartsRadar } from 'recharts';
import { useSimpleMode } from '../context/SimpleModeContext';

const friendlyLabels = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain', trestbps: 'Blood Pressure', chol: 'Cholesterol',
  fbs: 'Blood Sugar', restecg: 'Heart Rhythm', thalach: 'Heart Rate', exang: 'Exercise Pain',
  oldpeak: 'Heart Strain', slope: 'EKG Curve', ca: 'Blocked Arteries', thal: 'Blood Disorder'
};

const clinicalLabels = {
  age: 'Patient Age', sex: 'Biological Sex', cp: 'Chest Pain Type', trestbps: 'Resting BP',
  chol: 'Cholesterol', fbs: 'Fasting Blood Sugar', restecg: 'EKG Results', thalach: 'Max Heart Rate',
  exang: 'Exercise Angina', oldpeak: 'ST Depression', slope: 'ST Slope', ca: 'Major Vessels', thal: 'Thalassemia'
};

export default function ResultsPanel({
  result,
  formData,
  isDarkMode,
  isTutorialActive,
  isTutorialTarget,
  onDownloadPDF,
  onCopyResult,
  onShareResult
}) {
  const { simpleMode } = useSimpleMode();
  const [showTechnical, setShowTechnical] = useState(false);

  const chartData = React.useMemo(() => [
    { subject: 'Age', value: Math.min(parseInt(formData.age) || 0, 100) },
    { subject: 'BP', value: Math.min((parseInt(formData.trestbps) || 0) / 2, 100) },
    { subject: 'Chol', value: Math.min((parseInt(formData.chol) || 0) / 4, 100) },
    { subject: 'HR', value: Math.min((parseInt(formData.thalach) || 0) / 2, 100) },
    { subject: 'ST', value: Math.min((parseFloat(formData.oldpeak) || 0) * 20, 100) },
  ], [formData]);

  const getConfidenceColor = (confidence) => {
    const val = parseFloat(confidence);
    if (val >= 90) return '#10b981';
    if (val >= 75) return '#2563eb';
    if (val >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const getSimpleVerdict = (prediction, confidence) => {
    const val = parseFloat(confidence);
    if (prediction === 1) {
      if (val >= 85) return 'High risk detected. Please consult a doctor soon.';
      if (val >= 70) return 'Some risk factors present. Consider seeing a doctor.';
      return 'Uncertain risk. A doctor should review these results.';
    }
    if (val >= 85) return 'Looks healthy! Keep maintaining your lifestyle.';
    if (val >= 70) return 'Mostly healthy, but some numbers could improve.';
    return 'Results unclear. Double-check your inputs or ask a doctor.';
  };

  const getSimpleConfidence = (confidence) => {
    const val = parseFloat(confidence);
    if (val >= 90) return 'Very sure';
    if (val >= 75) return 'Pretty sure';
    if (val >= 60) return 'Somewhat sure';
    return 'Not very sure';
  };

  if (!result) {
    return (
      <section className={`pane-output ${isTutorialActive && isTutorialTarget ? 'highlight-active' : ''}`}>
        <motion.div
          className="waiting-hero"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <HeartPulse size={64} className="pulse-slow" />
          <p>{simpleMode ? 'Ready to check your heart health' : 'Waiting for Clinical Data Consensus'}</p>
          <span className="waiting-sub">
            {simpleMode ? 'Fill in the details and tap the button' : 'Enter patient biomarkers and run analysis'}
          </span>
        </motion.div>
      </section>
    );
  }

  const isRisk = result.prediction === 1;
  const confidenceColor = getConfidenceColor(result.confidence);
  const labels = simpleMode ? friendlyLabels : clinicalLabels;

  return (
    <section className={`pane-output ${isTutorialActive && isTutorialTarget ? 'highlight-active' : ''}`}>
      <motion.div
        className="results-container-compact"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {result.bias_warning && (
          <div className="bias-warning-banner" role="alert">
            <ShieldAlert size={14} aria-hidden="true" />
            <span>{result.bias_warning}</span>
          </div>
        )}

        <div className="result-header">
          {!simpleMode && <div className="consensus-pill">{result.consensus}</div>}
          <div className="result-actions">
            <button onClick={onCopyResult} className="icon-btn" title="Copy result" aria-label="Copy result to clipboard">
              <Copy size={16} aria-hidden="true" />
            </button>
            <button onClick={onShareResult} className="icon-btn" title="Share result" aria-label="Share result">
              <Share2 size={16} aria-hidden="true" />
            </button>
            <button onClick={onDownloadPDF} className="report-btn-pulsing" aria-label={simpleMode ? 'Save PDF report' : 'Generate PDF report'}>
              <Download size={18} aria-hidden="true" /> {simpleMode ? 'Save Report' : 'Generate Report'}
            </button>
          </div>
        </div>

        <motion.div
          className={`result-verdict ${isRisk ? 'risk' : 'safe'}`}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <div className="verdict-icon">
            {isRisk ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
          </div>
          <div className="verdict-text">
            <h3>{simpleMode ? (isRisk ? 'Possible Heart Risk' : 'Heart Looks Healthy') : result.result}</h3>
            <p className="verdict-plain">{getSimpleVerdict(result.prediction, result.confidence)}</p>
          </div>
        </motion.div>

        <div className="confidence-meter-card">
          <div className="meter-header">
            <span className="meter-label">{simpleMode ? 'How sure is the AI?' : 'Ensemble Confidence'}</span>
            <span className="meter-value" style={{ color: confidenceColor }}>
              {simpleMode ? getSimpleConfidence(result.confidence) : result.confidence}
            </span>
          </div>
          <div className="meter-track-v2">
            <motion.div
              className="meter-fill-v2"
              initial={{ width: 0 }}
              animate={{ width: result.confidence }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              style={{ background: `linear-gradient(90deg, ${confidenceColor}, ${confidenceColor}88)` }}
            />
          </div>
        </div>

        {!simpleMode && (
          <div className="model-breakdown-grid">
            {Object.entries(result.models_detail).map(([name, data], i) => (
              <motion.div
                key={name}
                className={`model-stat-mini ${data.pred === 1 ? 'risk' : 'safe'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="m-name">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="m-bar-track">
                  <motion.div
                    className="m-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: data.conf }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <div className="m-meta">
                  <span className="m-conf">{data.conf}</span>
                  <span className="m-acc">Acc: {data.accuracy}</span>
                </div>
                <span className={`m-verdict ${data.pred === 1 ? 'risk' : 'safe'}`}>
                  {data.pred === 1 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {data.pred === 1 ? 'Risk' : 'Healthy'}
                </span>
              </motion.div>
            ))}
          </div>
        )}

        {simpleMode && showTechnical && (
          <motion.div
            className="model-breakdown-grid"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {Object.entries(result.models_detail).map(([name, data], i) => (
              <motion.div
                key={name}
                className={`model-stat-mini ${data.pred === 1 ? 'risk' : 'safe'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <span className="m-name">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                <div className="m-bar-track">
                  <motion.div
                    className="m-bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: data.conf }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                  />
                </div>
                <div className="m-meta">
                  <span className="m-conf">{data.conf}</span>
                  <span className="m-acc">Acc: {data.accuracy}</span>
                </div>
                <span className={`m-verdict ${data.pred === 1 ? 'risk' : 'safe'}`}>
                  {data.pred === 1 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {data.pred === 1 ? 'Risk' : 'Healthy'}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}

        {simpleMode && (
          <button className="show-tech-btn" onClick={() => setShowTechnical(!showTechnical)}>
            {showTechnical ? <><ChevronUp size={14} /> Hide technical details</> : <><ChevronDown size={14} /> Show technical details</>}
          </button>
        )}

        <div className="radar-box-compact">
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid stroke={isDarkMode ? '#334155' : '#e2e8f0'} />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700 }}
              />
              <RechartsRadar
                name="Risk Profile"
                dataKey="value"
                stroke={isRisk ? '#ef4444' : '#2563eb'}
                fill={isRisk ? '#ef4444' : '#2563eb'}
                fillOpacity={0.4}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="insight-list-clinical">
          <div className="insight-title-small">
            <Info size={14} /> {simpleMode ? 'Top Risk Factors' : 'Bio-Impact Analysis'}
          </div>
          <div className="insight-rows-scroll">
            {result.top_factors.map((f, i) => (
              <motion.div
                key={i}
                className="insight-row-item"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <span className="insight-name">{labels[f.name] || f.name}</span>
                <div className="insight-bar-wrap">
                  <motion.div
                    className="insight-bar"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(f.impact * 3, 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                  />
                  <strong>+{f.impact}%</strong>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="disclaimer-box">
          <AlertTriangle size={14} />
          <span>
            {simpleMode
              ? 'This is not a doctor. Please talk to a healthcare professional for real medical advice.'
              : result.disclaimer}
          </span>
        </div>
      </motion.div>
    </section>
  );
}
