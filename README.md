# SafeBeat AI - Clinical Diagnostic Portal 🩺

**SafeBeat AI** is a professional-grade cardiovascular decision support system. It utilizes a multi-model machine learning ensemble to provide high-accuracy risk assessments based on clinical patient biomarkers.

Developed by **SBTabanar**, this platform is designed for clinical transparency, architectural resilience, and ethical AI explainability.

---

## 👨‍💻 Author & Lead Developer
**Sergei Benjamin S. Tabanar**

---

## 🌟 Senior-Level Features
- **Ensemble Consensus Engine:** Utilizes a majority-vote logic between **Random Forest**, **Logistic Regression**, and **XGBoost** models.
- **Model Transparency:** Individual confidence levels and benchmark accuracies for each model are displayed in real-time and included in clinical reports.
- **Explainable AI (XAI):** Mathematical attribution of biomarkers showing the specific percentage weight (`% Impact`) each factor had on the final result.
- **Interactive Clinical Walkthrough:** A step-by-step guided tour of the diagnostic stations, utilizing a non-dimming sharp spotlight system.
- **Patient Profile Management:** Session-based history tracking with local storage persistence for instant restoration of previous assessments.
- **Executive Clinical Dossier:** Automated PDF report generation (jsPDF) featuring structured clinical sections, reference ranges, and individual model breakdowns.
- **Real-Time 'What-If' Analysis:** Live-update toggle allowing clinicians to adjust biomarkers and see the risk map update in real-time.

---

## 🛠️ Advanced Tech Stack
- **Frontend:** React 19, Recharts (Visualizations), jsPDF-AutoTable (Reporting), Lucide Icons, Axios.
- **Backend:** Python 3.11, Flask (API), Flask-CORS (Security).
- **Machine Learning:** Scikit-Learn (Random Forest, Logistic Regression), XGBoost, Joblib (Serialization), Pandas.
- **UI/UX:** Custom CSS Architecture featuring Glassmorphism, CSS Variables, and responsive Grid/Flexbox layouts.

---

## 📊 Dataset & Model Performance
The system is powered by a consolidated and cleaned dataset of **573 Clinical Records**, merging data from the UCI Heart Disease dataset and a secondary clinical source.

**Key Technical Achievement:** 
Identified and resolved a critical label-swap and feature alignment issue in the combined dataset, resulting in a significant accuracy boost from ~86% to **~94%** for the master model.

- **Master Model Accuracy:** 94.78%
- **Ensemble Validation:**
  - **Logistic Regression:** 89.6%
  - **Random Forest:** 88.7%
  - **XGBoost:** 88.7%
- **Top Predictors:** Major Vessels (CA), Thalassemia (THAL), ST Depression (Oldpeak).

---

## 🚀 Installation & Setup

### 1. Prerequisites
- Python 3.8+
- Node.js (v18+) & npm

### 2. Environment Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd SafebeatAI

# Install Python dependencies (Virtual Environment recommended)
python -m venv venv
./venv/Scripts/activate # Windows
pip install flask flask-cors pandas scikit-learn xgboost joblib
```

### 3. Running the System
You must run both the backend and frontend simultaneously in separate terminals.

**Terminal 1 (Backend API):**
```bash
python app.py
```

**Terminal 2 (Frontend UI):**
```bash
cd frontend
npm install
npm run dev
```

### 4. Access
Open the local URL provided by Vite (usually **[http://localhost:5173](http://localhost:5173)**).

---

## ⚖️ Ethical AI Disclaimer
This application is a software prototype developed for educational and portfolio purposes. It is **not** a certified medical device and should **not** be used for actual clinical diagnosis. Always consult a board-certified physician for medical advice.
