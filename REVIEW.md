# SafeBeat AI — Senior Developer & Clinical Review

**Reviewer:** Senior Full-Stack Engineer + Healthcare Informatics Consultant  
**Date:** 2026-05-06  
**Version Reviewed:** 2.8.0  
**Scope:** Architecture, security, clinical safety, UX, and production readiness

---

## Executive Summary

SafeBeat AI is a well-architected, containerized cardiovascular risk assessment tool that successfully bridges clinical machine learning with consumer-grade UX. The Simple/Clinical mode toggle is a standout feature for accessibility. However, as a system handling health data, there are material gaps in security hardening, clinical auditability, and accessibility compliance that must be addressed before any real-world deployment.

**Overall Grade: B+** (Strong engineering foundation, needs hardening for healthcare contexts)

---

## 1. Architecture & Engineering

### What Was Done Well
- **Clean separation of concerns:** Backend API, React frontend, and ML ensemble are properly decoupled
- **Containerization:** Multi-stage Docker builds, non-root user, health checks, and compose orchestration
- **App factory pattern:** Flask app factory enables proper testing and configuration injection
- **Environment-based config:** All tunables exposed via env vars (PORT, CORS, rate limits, model path)
- **Structured logging:** JSON-formatted logs with timestamps and levels—observability-ready
- **Component modularity:** Frontend is well-decomposed (Navbar, Sidebar, PatientForm, ResultsPanel, modals)
- **Custom hooks:** `useOffline`, `useLocalStorage`, `useToast`, `useSimpleMode` show mature React patterns

### Critical Gaps
1. **No API versioning.** The `/predict` endpoint is unversioned. If the schema changes, all clients break. Recommendation: prefix with `/v1/`.
2. **No request timeouts.** The batch upload in `App.jsx` fires requests sequentially with no timeout. A slow backend could hang the UI indefinitely. Add Axios timeout config.
3. **No React Error Boundaries.** A single runtime exception in any component crashes the entire SPA. Wrap the app in an error boundary with a graceful fallback.
4. **No frontend test suite.** Zero Jest or React Testing Library coverage. At minimum, test `validate_payload`, `getSimpleVerdict`, and the toast system.
5. **Missing `key` prop stability.** Some mapped elements use array index as key (BatchUploadModal results table). Use a stable ID if available.

---

## 2. Security & Privacy

### What Was Done Well
- **Rate limiting:** Flask-Limiter caps `/predict` at 20/minute per IP
- **Non-root container:** Backend Dockerfile runs as `safebeat` user
- **CORS configurable:** `CORS_ORIGINS` env var prevents wildcard in production
- **Input validation:** Backend validates all 13 biomarkers with range checks
- **No secrets in repo:** `.env` is gitignored, `.env.example` provided

### Critical Gaps
1. **No authentication or authorization.** Anyone with network access can call `/predict` and exfiltrate model behavior. Even for a prototype, add a simple API key gate.
2. **Patient data stored in plaintext LocalStorage.** Names, ages, and all 13 biomarkers are persisted in the browser's LocalStorage without encryption. This is a HIPAA red flag. Recommendation: 
   - Add a clear data retention warning
   - Offer an "ephemeral mode" that never writes to storage
   - Encrypt at rest using `crypto.subtle` if storage is required
3. **No input sanitization on `patientName`.** The name flows directly into jsPDF and localStorage without escaping. Malicious input like `<script>` could cause XSS or PDF injection.
4. **`CORS_ORIGINS=*` in docker-compose.yml.** The default compose file opens CORS to any origin. Add a `.env.production` example with strict origins.
5. **No Content Security Policy headers.** The frontend is served by Nginx but lacks CSP headers to prevent XSS.
6. **Flask debug mode can be enabled via env var.** `FLASK_DEBUG=true` in production exposes stack traces. Add a startup guard that refuses to start in debug if `HOST=0.0.0.0`.
7. **Model file is readable by any container user.** `ensemble_models.pkl` is inside the container image. If the image is pushed to a public registry, the model is exposed.

---

## 3. Clinical Safety & Healthcare Compliance

### What Was Done Well
- **Clear disclaimer:** "Not a medical diagnosis" is displayed in results and PDFs
- **Simple Mode:** Plain-English labels and verdicts reduce cognitive load for non-clinical users
- **Consensus logic:** Majority vote across 3 models reduces single-model bias
- **Explainability:** Top 3 risk drivers are surfaced with percentage weights
- **Reference ranges:** PDF includes reference ranges for key biomarkers

### Critical Gaps
1. **Hardcoded model accuracy strings.** `app.py` returns `"accuracy": "88.7%"` as a hardcoded string. If the model is retrained, this becomes a lie. Accuracy should be computed at training time and stored in the model artifact metadata.
2. **No model versioning or provenance.** Predictions cannot be traced back to a specific model version, training dataset hash, or timestamp. In clinical ML, every prediction must be auditable. Add `model_version`, `trained_at`, and `dataset_hash` to the model artifact and API response.
3. **No confidence interval or uncertainty quantification.** The system returns a point estimate (`94.78%`) without variance. Clinical decision support should communicate uncertainty.
4. **Missing demographic bias warnings.** The dataset is primarily UCI Heart Disease data, which skews male and Caucasian. There is no warning that predictions may be less accurate for underrepresented populations.
5. **No clinical reference ranges in the form.** Users enter raw numbers without seeing what "normal" looks like. Add contextual helper text (e.g., "Normal BP: 90-120") per field.
6. **Color-only risk indicators.** The red/green badges fail WCAG color contrast requirements for colorblind users. Add icons (already partially done) but ensure text labels are always visible.
7. **Auto-Analyze is risky.** Real-time analysis as the user types could cause anxiety with incomplete data. Consider debouncing or requiring explicit submission for risk-flagged results.
8. **No audit trail.** There is no log of who ran what prediction when. Even for a prototype, add a simple `prediction_log` table or structured log line with hashed patient ID and timestamp.
9. **Batch upload lacks row-level error handling.** If one row in a 100-row CSV fails, the entire batch may behave unpredictably. Each row should be validated independently with per-row error reporting.
10. **PDF reports lack digital integrity.** A downloaded PDF could be altered and re-shared. Consider adding a hash footer or QR code linking to a verification endpoint.

---

## 4. UX & Accessibility

### What Was Done Well
- **Simple/Clinical toggle:** Best-in-class accessibility feature for non-technical users
- **Keyboard shortcuts:** Power-user friendly (`Ctrl+Enter`, `Ctrl+B`, etc.)
- **Toast notifications:** Non-blocking feedback instead of alert dialogs
- **Responsive design:** Mobile sidebar, touch-friendly targets, safe-area insets
- **Loading states:** Spinner inside the analyze button with disabled state
- **Dark mode:** Full theme system with CSS variables
- **Offline detection:** Badge and toast when network drops

### Critical Gaps
1. **Missing ARIA labels.** Many icon buttons lack `aria-label`. Screen reader users cannot identify the "Copy result" or "Share result" buttons.
2. **Form inputs lack `aria-describedby` for errors.** Validation errors are visual only; assistive tech users may not know why a field is flagged.
3. **No focus management in modals.** When a modal opens, focus does not trap inside it. Keyboard users can tab behind the overlay.
4. **Tutorial is not keyboard-navigable.** The step-through system has buttons but no arrow-key or Enter-to-advance support.
5. **No reduced-motion respect.** The CSS has animations (`pulse-slow`, `glow-pulse`) that may trigger vestibular disorders. Respect `prefers-reduced-motion`.
6. **Radar chart is not accessible.** Charts without alt text or data tables are invisible to screen readers. Add a visually hidden data table fallback.
7. **History cards use color alone.** Risk vs Safe is indicated by border color. Add text labels or icons inside the card for colorblind users.

---

## 5. DevOps & Deployment

### What Was Done Well
- **Docker Compose:** One-command startup with health checks and dependency ordering
- **GitHub Actions CI:** Tests Python imports, Node build, and Docker image builds
- **Makefile:** Common tasks abstracted (`make docker-up`, `make backend`)
- **Nginx reverse proxy:** `/api` prefix routing in the frontend container
- **Health endpoint:** Backend exposes `/health` with proper HTTP status codes

### Critical Gaps
1. **No staging environment config.** There's only docker-compose.yml (production-ish). Add `docker-compose.override.yml` for local dev with hot-reload.
2. **No database or persistent storage backend.** History is client-side only. If the user clears their browser, all assessments vanish. For a clinical tool, even a prototype should offer optional server-side persistence (SQLite at minimum).
3. **No secrets management.** The `SECRET_KEY` for Flask sessions is not set (Flask defaults to an insecure key). If sessions or CSRF are ever added, this is a vulnerability.
4. **No monitoring or alerting.** No Prometheus metrics, Sentry integration, or uptime checks beyond the Docker healthcheck.
5. **No automated dependency updates.** Dependabot or Renovate should be configured to flag security vulnerabilities in `requirements.txt` and `package.json`.
6. **Image size could be smaller.** The backend image includes `gcc` build tools briefly, but still bundles training scripts (`train_ensemble.py`) and raw CSVs that aren't needed at runtime. Remove them from the production image.

---

## 6. Data Science & ML Engineering

### What Was Done Well
- **Ensemble approach:** Random Forest + Logistic Regression + XGBoost with majority voting
- **Feature importance attribution:** RF importances used for explainability
- **Dataset merging:** Combined UCI + secondary source for 573 records

### Critical Gaps
1. **No model retraining pipeline.** The training scripts exist but there's no automated pipeline (Airflow, GitHub Actions, etc.) to retrain and validate on schedule.
2. **No data drift detection.** If deployed in production, input distributions could shift over time. There is no monitoring for concept drift or data drift.
3. **Model artifact lacks metadata.** `ensemble_models.pkl` is an opaque blob. Use MLflow, DVC, or at minimum a `model_card.md` documenting training data, performance metrics, and known limitations.
4. **No fairness metrics.** No demographic parity, equalized odds, or calibration analysis across sex/age groups.
5. **SHAP explainer is bundled but unused.** `shap_explainer.pkl` exists in the repo but the backend returns only feature importances, not SHAP values. SHAP provides more robust individual-level explanations.

---

## 7. Recommended Priority Roadmap

### P0 — Before Any Demo or Public Use
1. Add API key or basic auth to `/predict`
2. Sanitize `patientName` before PDF generation and storage
3. Add model version/provenance to every prediction response
4. Replace hardcoded accuracy strings with artifact metadata
5. Add `prefers-reduced-motion` media query support
6. Add ARIA labels to all icon-only buttons
7. Set Flask `SECRET_KEY` via environment variable

### P1 — Before Clinical Pilot
1. Encrypt LocalStorage PHI or add ephemeral mode
2. Add row-level validation and error reporting to batch upload
3. Implement React Error Boundaries
4. Add API versioning (`/v1/predict`)
5. Add demographic bias warnings to UI and PDF
6. Set up Sentry or similar for frontend error tracking
7. Add per-row audit logging on the backend

### P2 — Production Hardening
1. Add SQLite/PostgreSQL for optional server-side history
2. Implement SHAP-based explanations instead of static importances
3. Add data drift monitoring
4. Create a model card (`model_card.md`)
5. Add Prometheus metrics endpoint
6. Configure Dependabot for dependency updates
7. Add focus trap and `Esc-to-close` to all modals (partially done)

---

## 8. Final Verdict

SafeBeat AI is an impressive portfolio piece that demonstrates solid full-stack engineering, thoughtful UX design, and awareness of clinical transparency. The Simple/Clinical mode toggle alone shows product maturity rare in open-source health tools.

However, the jump from "portfolio project" to "clinical decision support" requires addressing the security, auditability, and accessibility gaps outlined above. The good news: none of these are architectural blockers. They are well-scoped incremental improvements.

**Would I recommend deploying this today?**  
As a **research prototype or educational demo**: Yes.  
As a **clinical tool for real patients**: No—not without P0 and P1 hardening.

The codebase is clean enough that the required hardening is achievable within 2–3 sprints by a small team.

---

*Review conducted independently. No affiliation with the project maintainer.*
