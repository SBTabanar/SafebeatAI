import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  Activity, Heart, AlertCircle, CheckCircle2, ShieldCheck, 
  Database, Zap, Stethoscope, RefreshCcw, HelpCircle, User, X,
  Download, History, Moon, Sun, Trash2, ChevronRight, FileText, UserPlus,
  ArrowUpRight, ArrowDownRight, Info, ChevronLeft, Eraser, Menu
} from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Radar as RechartsRadar } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './App.css';

// 1. Clinical Mappings
let API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
if (API_BASE_URL && !API_BASE_URL.startsWith('http')) {
  API_BASE_URL = `https://${API_BASE_URL}`;
}

const friendlyLabels = {
  age: { label: "Patient Age", desc: "Risk naturally increases with physiological age." },
  sex: { label: "Biological Sex", desc: "Statistical variance based on biological markers." },
  cp: { label: "Chest Pain Type", desc: "Typical angina is a high-weight clinical indicator." },
  trestbps: { label: "Resting Blood Pressure", desc: "High pressure strains the cardiac muscle over time." },
  chol: { label: "Serum Cholesterol", desc: "Elevated levels contribute to arterial plaque buildup." },
  fbs: { label: "Fasting Blood Sugar", desc: "High sugar levels can damage blood vessels." },
  restecg: { label: "EKG Results", desc: "Abnormalities in resting EKG signals." },
  thalach: { label: "Maximum Heart Rate", desc: "Lower peak rates during stress tests can signal risk." },
  exang: { label: "Exercise Angina", desc: "Pain during physical activity is a significant marker." },
  oldpeak: { label: "ST Depression", desc: "Stress-induced heart strain measured via EKG." },
  slope: { label: "ST Slope", desc: "The shape of the EKG curve during peak exercise." },
  ca: { label: "Major Vessels (Fluoroscopy)", desc: "Number of major vessels (0-3) colored by flourosopy." },
  thal: { label: "Thalassemia Type", desc: "Genetic blood flow markers impacting oxygen delivery." }
};

const tutorialSteps = [
  { title: "Clinical History", content: "Access previous assessments. Click a card to restore patient data and results instantly.", target: "sidebar", side: "right" },
  { title: "Patient Profile", content: "Enter patient identity here. This name is used for history tracking and official reports.", target: "profile", side: "right" },
  { title: "Biometric Input", content: "Input clinical biomarkers. Fields highlight red if data enters dangerous physiological ranges.", target: "inputs", side: "right" },
  { title: "Auto-Analyze", content: "Toggle real-time assessment to see risk updates instantly as you type.", target: "auto", side: "right" },
  { title: "Diagnostic Results", content: "View the Ensemble Consensus, AI confidence, and mathematical impact breakdown.", target: "results", side: "left" }
];

function App() {
  // 2. State
  const initialData = {
    patientName: "New Patient",
    age: "50", sex: "1", cp: "0", trestbps: "120", chol: "200", fbs: "0", 
    restecg: "0", thalach: "150", exang: "0", oldpeak: "0.0", slope: "1", ca: "0", thal: "2"
  };

  const [formData, setFormData] = useState(initialData);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState("Checking...");
  const [history, setHistory] = useState([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 3. Lifecycle
  useEffect(() => {
    const savedHistory = localStorage.getItem('safebeat_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedTheme = localStorage.getItem('safebeat_theme');
    if (savedTheme === 'dark') setIsDarkMode(true);
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('safebeat_theme', isDarkMode ? 'dark' : 'light');
    document.body.className = isDarkMode ? 'dark-theme' : 'light-theme';
  }, [isDarkMode]);

  // 4. Handlers
  const checkHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) setBackendStatus("Online");
      else setBackendStatus("Offline");
    } catch (err) { setBackendStatus("Offline"); }
  };

  const triggerAnalysis = async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, data);
      setResult(response.data);
      updateHistory(data, response.data);
    } catch (err) {}
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/predict`, formData);
      setResult(response.data);
      updateHistory(formData, response.data);
    } catch (err) { setError("Server Connection Failed."); } finally { setLoading(false); }
  };

  const updateHistory = (data, res) => {
    const entry = { id: Date.now(), date: new Date().toLocaleTimeString(), name: data.patientName, age: data.age, data: { ...data }, result: { ...res } };
    setHistory(prev => {
        const filtered = prev.filter(h => h.name !== data.patientName || JSON.stringify(h.data) !== JSON.stringify(data));
        const newHistory = [entry, ...filtered].slice(0, 10);
        localStorage.setItem('safebeat_history', JSON.stringify(newHistory));
        return newHistory;
    });
  };

  const loadHistoryItem = (item) => {
    setFormData(item.data);
    setResult(item.result);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('safebeat_history');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (autoAnalyze && name !== 'patientName') triggerAnalysis(newData);
        return newData;
    });
  };

  const downloadPDF = () => {
    if (!result) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 50, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28); doc.setFont("helvetica", "bold");
    doc.text("SafeBeat AI", 20, 28);
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text("CONFIDENTIAL CLINICAL DIAGNOSTIC DOSSIER", 20, 38);
    doc.text(`REPORT ID: SB-${Date.now()}`, pageWidth - 80, 28);
    doc.text(`ISSUED: ${new Date().toLocaleString()}`, pageWidth - 80, 34);

    // Section I
    doc.setTextColor(15, 23, 42); doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Section I: Patient Clinical Record", 20, 65);
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

    // Section II
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFillColor(241, 245, 249); doc.rect(20, finalY, pageWidth - 40, 50, 'F');
    doc.setTextColor(15, 23, 42); doc.setFontSize(11);
    doc.text("Section II: Ensemble AI Consensus", 25, finalY + 10);
    doc.setFontSize(20);
    const riskColor = result.prediction === 1 ? [239, 68, 68] : [16, 185, 129];
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.text(result.result.toUpperCase(), 25, finalY + 22);
    
    doc.setTextColor(100, 116, 139); doc.setFontSize(9);
    doc.text(`Ensemble Confidence: ${result.confidence} | Consensus: ${result.consensus}`, 25, finalY + 32);
    
    // Model Breakdown in PDF
    doc.setFontSize(8); doc.setTextColor(15, 23, 42);
    let modelY = finalY + 40;
    Object.entries(result.models_detail).forEach(([name, data]) => {
      const modelName = name.replace(/([A-Z])/g, ' $1').trim();
      const status = data.pred === 1 ? 'RISK' : 'HEALTHY';
      doc.text(`${modelName}: ${data.conf} Confidence (${status}) | Benchmark Accuracy: ${data.accuracy}`, 25, modelY);
      modelY += 4;
    });

    // Section III
    doc.setTextColor(15, 23, 42); doc.setFontSize(14);
    doc.text("Section III: Bio-Impact Attribution", 20, finalY + 55);
    const drivers = result.top_factors.map(f => [friendlyLabels[f.name]?.label || f.name, `${f.impact}%`, friendlyLabels[f.name]?.desc]);
    autoTable(doc, {
      startY: finalY + 60,
      head: [['Biomarker', 'Weight', 'Clinical Context']],
      body: drivers,
      theme: 'grid', headStyles: { fillColor: [15, 23, 42] }
    });

    // Signature
    const lastY = doc.lastAutoTable.finalY + 25;
    doc.setDrawColor(200, 200, 200); doc.line(20, lastY, 80, lastY);
    doc.line(pageWidth - 80, lastY, pageWidth - 20, lastY);
    doc.setFontSize(8); doc.text("System Engineer (SBTabanar)", 20, lastY + 5);
    doc.text("Reviewing Clinician", pageWidth - 80, lastY + 5);

    doc.save(`SafeBeat_Report_${formData.patientName}.pdf`);
  };

  const chartData = useMemo(() => [
    { subject: 'Age', value: Math.min(parseInt(formData.age), 100) },
    { subject: 'BP', value: Math.min(parseInt(formData.trestbps) / 2, 100) },
    { subject: 'Chol', value: Math.min(parseInt(formData.chol) / 4, 100) },
    { subject: 'HR', value: Math.min(parseInt(formData.thalach) / 2, 100) },
    { subject: 'ST', value: Math.min(parseFloat(formData.oldpeak) * 20, 100) },
  ], [formData]);

  const getValidation = (name, value) => {
    const val = parseFloat(value);
    if (name === 'trestbps' && (val < 80 || val > 200)) return "Range: 80-200";
    if (name === 'chol' && val > 400) return "Critical: >400";
    return null;
  };

  // 5. Render
  return (
    <div className={`root-layout ${isTutorialActive ? 'tutorial-active' : ''}`}>
      {isTutorialActive && (
        <div className="tutorial-system-overlay">
          <div className="tutorial-dimmer"></div>
          <div className={`tutorial-card-wrapper align-${tutorialSteps[currentStep].side}`}>
            <div className="tut-card">
              <div className="tut-progress" style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}></div>
              <div className="tut-header-box">
                <span className="tut-step-txt">Step {currentStep + 1}/{tutorialSteps.length}</span>
                <button onClick={() => setIsTutorialActive(false)}><X size={18}/></button>
              </div>
              <h3>{tutorialSteps[currentStep].title}</h3>
              <p>{tutorialSteps[currentStep].content}</p>
              <div className="tut-nav">
                <button disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)} className="tut-btn-action">Back</button>
                {currentStep < tutorialSteps.length - 1 ? (
                  <button onClick={() => setCurrentStep(currentStep + 1)} className="tut-btn-action primary">Next</button>
                ) : (
                  <button onClick={() => setIsTutorialActive(false)} className="tut-btn-action success">Finish</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="main-card">
        <nav className="navbar-fixed">
          <div className="nav-brand-group">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="icon-badge-red"><Heart fill="white" size={20} /></div>
            <div className="nav-text"><h2>SafeBeat AI</h2><span>Diagnostic Portal</span></div>
          </div>
          <div className="nav-nav">
            <button className="theme-toggle-ghost" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button className="guide-btn-premium" onClick={() => { setIsTutorialActive(true); setCurrentStep(0); }}><HelpCircle size={16} /> Guide</button>
            <div className={`online-status ${backendStatus === 'Online' ? 'live' : 'dead'}`}><ShieldCheck size={14}/> {backendStatus}</div>
          </div>
        </nav>

        <div className="app-main-body">
          <aside className={`sidebar-clinical ${isMobileMenuOpen ? 'mobile-open' : ''} ${isTutorialActive && tutorialSteps[currentStep].target === 'sidebar' ? 'highlight-active' : ''}`}>
            <div className="sidebar-top"><History size={16} /> <h4>Activity</h4><button onClick={clearHistory} className="eraser-btn"><Eraser size={16}/></button></div>
            <div className="sidebar-scroll">
              {history.map(item => (
                <div key={item.id} className={`history-card-clinical ${item.result.prediction === 1 ? 'risk' : 'safe'}`} onClick={() => loadHistoryItem(item)}>
                  <div className="h-text"><strong>{item.name}</strong><span>{item.date}</span></div>
                  <ChevronRight size={12} opacity={0.4} />
                </div>
              ))}
            </div>
          </aside>

          <main className="diagnostic-view">
            <section className={`pane-input ${isTutorialActive && ['profile', 'inputs', 'auto'].includes(tutorialSteps[currentStep].target) ? 'highlight-active' : ''}`}>
              <div className="pane-header-row">
                <div className="title-pair"><UserPlus size={18} color="#2563eb" /><h3>Patient Profile</h3></div>
                <div className={`auto-toggle-wrap ${isTutorialActive && tutorialSteps[currentStep].target === 'auto' ? 'element-focus' : ''}`}>
                    <label>Auto-Analyze</label>
                    <label className="ios-switch"><input type="checkbox" checked={autoAnalyze} onChange={() => setAutoAnalyze(!autoAnalyze)} /><span className="ios-slider"></span></label>
                </div>
              </div>
              <div className={`name-box-highlight ${isTutorialActive && tutorialSteps[currentStep].target === 'profile' ? 'element-focus' : ''}`}>
                <label>Full Patient Name</label>
                <input name="patientName" type="text" value={formData.patientName} onChange={handleChange} className="name-field-large" />
              </div>
              <form onSubmit={handleSubmit}>
                <div className={`diagnostic-grid ${isTutorialActive && tutorialSteps[currentStep].target === 'inputs' ? 'element-focus' : ''}`}>
                  <div className="input-field"><label>Patient Age</label><input name="age" value={formData.age} onChange={handleChange} className={getValidation('age', formData.age) ? 'err' : ''}/></div>
                  <div className="input-field"><label>Biological Sex</label><select name="sex" value={formData.sex} onChange={handleChange}><option value="1">Male</option><option value="0">Female</option></select></div>
                  <div className="input-field"><label>Chest Pain Type</label><select name="cp" value={formData.cp} onChange={handleChange}><option value="0">Typical Angina</option><option value="1">Atypical Angina</option><option value="2">Non-anginal Pain</option><option value="3">Asymptomatic (None)</option></select></div>
                  <div className="input-field"><label>Resting Blood Pressure (mm Hg)</label><input name="trestbps" value={formData.trestbps} onChange={handleChange} className={getValidation('trestbps', formData.trestbps) ? 'err' : ''}/></div>
                  <div className="input-field"><label>Cholesterol (mg/dl)</label><input name="chol" value={formData.chol} onChange={handleChange} className={getValidation('chol', formData.chol) ? 'err' : ''}/></div>
                  <div className="input-field"><label>Max Heart Rate (BPM)</label><input name="thalach" value={formData.thalach} onChange={handleChange}/></div>
                  <div className="input-field"><label>Major Vessels (0-3 Colored)</label><input name="ca" value={formData.ca} onChange={handleChange}/></div>
                  <div className="input-field"><label>Thalassemia Genetic Marker</label><select name="thal" value={formData.thal} onChange={handleChange}><option value="1">Normal</option><option value="2">Fixed Defect</option><option value="3">Reversible Defect</option></select></div>
                </div>
                {!autoAnalyze && <button type="submit" className="analyze-btn-clinical">Analyze</button>}
              </form>
            </section>

            <section className={`pane-output ${isTutorialActive && tutorialSteps[currentStep].target === 'results' ? 'highlight-active' : ''}`}>
              {result ? (
                <div className="results-container-compact">
                  <div className="consensus-pill">{result.consensus}</div>
                  <div className="result-title-row"><h3>{result.result}</h3><button onClick={downloadPDF} className="report-btn-pulsing"><Download size={18} /> Generate Report</button></div>
                  <div className="confidence-meter-card">
                    <div className="meter-info-text">Ensemble Confidence: <strong>{result.confidence}</strong></div>
                    <div className="meter-track-v2"><div className="meter-fill-v2" style={{ width: result.confidence }}></div></div>
                  </div>

                  <div className="model-breakdown-grid">
                    {Object.entries(result.models_detail).map(([name, data]) => (
                      <div key={name} className={`model-stat-mini ${data.pred === 1 ? 'risk' : 'safe'}`}>
                        <span className="m-name">{name.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="m-conf">{data.conf} Sure</span>
                      </div>
                    ))}
                  </div>

                  <div className="radar-box-compact">
                    <ResponsiveContainer width="100%" height={180}>
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                        <PolarGrid stroke={isDarkMode ? "#334155" : "#e2e8f0"} />
                        <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b', fontWeight: 700}} />
                        <RechartsRadar name="Risk" dataKey="value" stroke="#2563eb" fill="#2563eb" fillOpacity={0.5} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="insight-list-clinical">
                    <div className="insight-title-small"><Info size={14}/> Bio-Impact Analysis</div>
                    <div className="insight-rows-scroll">
                      {result.top_factors.map((f, i) => (<div key={i} className="insight-row-item"><span>{friendlyLabels[f.name]?.label || f.name}</span><strong>+{f.impact}% Impact</strong></div>))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="waiting-hero"><Activity size={64} className="pulse-slow" /><p>Waiting for Clinical Data Consensus</p></div>
              )}
            </section>
          </main>
        </div>
        <footer className="footer-bar-clinical"><div className="footer-inner"><span>Lead Developer: <strong>SBTabanar</strong></span><span>Certified Build v2.8</span></div></footer>
      </div>
    </div>
  );
}

export default App;
