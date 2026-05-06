import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RechartsRadar } from 'recharts';

const friendlyLabels = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain', trestbps: 'BP', chol: 'Chol',
  fbs: 'FBS', restecg: 'EKG', thalach: 'HR', exang: 'Angina',
  oldpeak: 'ST', slope: 'Slope', ca: 'Vessels', thal: 'Thal'
};

export default function ComparisonModal({ isOpen, onClose, itemA, itemB }) {
  if (!isOpen || !itemA || !itemB) return null;

  const makeChartData = (data) => [
    { subject: 'Age', a: Math.min(parseInt(data.age) || 0, 100) },
    { subject: 'BP', a: Math.min((parseInt(data.trestbps) || 0) / 2, 100) },
    { subject: 'Chol', a: Math.min((parseInt(data.chol) || 0) / 4, 100) },
    { subject: 'HR', a: Math.min((parseInt(data.thalach) || 0) / 2, 100) },
    { subject: 'ST', a: Math.min((parseFloat(data.oldpeak) || 0) * 20, 100) },
  ];

  const chartA = makeChartData(itemA.data);
  const chartB = makeChartData(itemB.data);

  const diff = (key) => {
    const a = parseFloat(itemA.data[key]) || 0;
    const b = parseFloat(itemB.data[key]) || 0;
    const delta = b - a;
    return { a, b, delta, higher: delta > 0 ? 'B' : delta < 0 ? 'A' : null };
  };

  const compareFields = ['age', 'trestbps', 'chol', 'thalach', 'oldpeak', 'ca'];

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-content modal-xl"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Patient Comparison</h3>
            <button className="modal-close" onClick={onClose}><X size={18} /></button>
          </div>

          <div className="comparison-body">
            <div className="compare-patients">
              <div className={`compare-card ${itemA.result.prediction === 1 ? 'risk' : 'safe'}`}>
                <div className="compare-verdict">
                  {itemA.result.prediction === 1 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  {itemA.result.result}
                </div>
                <h4>{itemA.name}</h4>
                <span className="compare-age">Age {itemA.age}</span>
                <div className="compare-confidence">{itemA.result.confidence}</div>
              </div>

              <div className="compare-vs"><ArrowRight size={24} /></div>

              <div className={`compare-card ${itemB.result.prediction === 1 ? 'risk' : 'safe'}`}>
                <div className="compare-verdict">
                  {itemB.result.prediction === 1 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  {itemB.result.result}
                </div>
                <h4>{itemB.name}</h4>
                <span className="compare-age">Age {itemB.age}</span>
                <div className="compare-confidence">{itemB.result.confidence}</div>
              </div>
            </div>

            <div className="compare-charts">
              <div className="compare-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartA}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <RechartsRadar dataKey="a" stroke="#2563eb" fill="#2563eb" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
                <span className="chart-label">{itemA.name}</span>
              </div>
              <div className="compare-chart">
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartB}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <RechartsRadar dataKey="a" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                  </RadarChart>
                </ResponsiveContainer>
                <span className="chart-label">{itemB.name}</span>
              </div>
            </div>

            <div className="compare-details">
              <h4>Biomarker Differences</h4>
              <div className="compare-grid">
                {compareFields.map(field => {
                  const d = diff(field);
                  return (
                    <div key={field} className="compare-row">
                      <span className="compare-field">{friendlyLabels[field]}</span>
                      <div className="compare-values">
                        <span className={d.higher === 'A' ? 'higher' : ''}>{d.a}</span>
                        <ArrowRight size={12} />
                        <span className={d.higher === 'B' ? 'higher' : ''}>{d.b}</span>
                      </div>
                      <span className={`compare-delta ${d.delta > 0 ? 'up' : d.delta < 0 ? 'down' : ''}`}>
                        {d.delta > 0 ? '+' : ''}{d.delta}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
