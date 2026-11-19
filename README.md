# ForensiAir — AI-Powered Environmental Surveillance & OCEMS Tamper Forensics

An enterprise-grade regulatory surveillance and forensic audit system designed for State and Central Pollution Control Boards (SPCB / CPCB). **ForensiAir** detects suspicious telemetry manipulation and sensor tampering in Industrial Online Continuous Emission/Effluent Monitoring Systems (OCEMS) using Machine Learning, Behavioral Fingerprints, and Explainable AI (SHAP).

---

## 🏛️ Executive Summary

Industrial facilities continuously transmit environmental telemetry (pH, COD, BOD, TSS, Flow, SO₂, NOx) to environmental regulators. Traditional monitoring relies on static threshold checks, which fail when industrial facilities tamper with sensors, dilute effluent streams, calibrate probes artificially, or freeze transmitters during unannounced regulatory inspections.

**ForensiAir** shifts regulatory surveillance from reactive threshold violation alerts to proactive, data-integrity behavioral anomaly detection:
- **15 Behavioral Tampering Fingerprints**: Identifies flatlining, limit hugging, copy-paste autocorrelation, pre-inspection dips, correlation breaks, and BDL (Below Detection Limit) gaming.
- **Dual-Perspective Interface**: Toggle between **Plain (Officer)** view (plain-language summaries, statutory notices, non-adversarial compliance labeling) and **Technical (ML)** view (SHAP feature attributions, raw tree margins, feature vectors).
- **Chain-of-Custody Field Verification Workflow**: Time-limited inspection visit windows prevent retroactive tampering of field reports, supported by formal administrator unlock requests and an immutable server-side revision audit trail.
- **Institutional Oversight & Dataset Quality**: Continuous data-quality grading (Grades A through F), missing/duplicate telemetry tracking, and regional surveillance across Maharashtra industrial corridors (Taloja & Mahad).

---

## ⚡ Key Features

- **Dual-Mode System Interface**: Single click toggles between Plain Officer compliance reporting and Technical ML diagnostics site-wide.
- **Behavioral Tampering Fingerprints**: Statistical, hydraulic, and physical invariant checks identifying sophisticated manipulation beyond standard thresholds.
- **Forensic Verification Reports**: Formal dossiers linking AI alerts to physical on-site checks (sensor probe inspection, wastewater sampling, SCADA ladder logic verification, unmetered bypass pipe tracing).
- **Time-Window Locking & Admin Unlock**: Automated visit cutoff enforcement locks inspection reports upon visit conclusion; amendments require formal justification and administrator approval with permanent audit trail logging.
- **Regulatory Print & PDF Exports**: One-click generation of court-admissible Official Officer Briefs and Comprehensive Technical Dossiers with evidentiary photographic appendices.
- **Explainable AI (SHAP)**: Waterfall and beeswarm visualizations decomposing model decisions into exact physical sensor contributions.
- **Dataset Quality Audits**: Real-time network health surveillance monitoring sensor dropouts, transmission latency, and telemetry integrity.

---

## 🔬 Tampering Fingerprint Engine

| Fingerprint | Technical Detection Mechanism | Physical Indicator |
|---|---|---|
| **FP1 — Flatline Detection** | Rolling standard deviation invariant signal cutoff | Probe immersed in calibration buffer or frozen analog output |
| **FP2 — Correlation Break** | Rolling Pearson correlation between COD & BOD effluent streams | Dilution hose inserted into treated effluent tank |
| **FP3 — Pre-Inspection Dip** | Significant negative deviation preceding scheduled audit dates | Sudden chemical dosing overdrive or effluent diversion |
| **FP7 — Limit Hugging** | Telemetry values hovering unnaturally within 5% below consent limit | Artificial clamp or PLC scaling cap applied to analog signal |
| **FP8 — Copy-Paste Repetition** | Lag-96 (24-hour period) autocorrelation repetition (> 0.95) | Recorded loop or simulated telemetry replay |
| **FP11 — BDL Gaming** | Zero-variance reporting below detection limits (> 15% rate) | Purposely blinded or detached optical sensors |
| **FP12 — Duplicate Run Length** | > 12 consecutive identical raw transmitter readings | Modbus gateway buffer freeze or stuck analog-to-digital converter |
| **FP13 — Impossible Bounds** | Physical range violations (e.g., pH ∉ [0, 14] or negative values) | Broken reference junction or transmitter hardware failure |

---

## 🛠️ Technology Stack

- **Backend**: Python 3.12, FastAPI, Uvicorn, SQLite / PostgreSQL, SQLAlchemy
- **Machine Learning**: Scikit-Learn, XGBoost, Isolation Forest, SHAP, NumPy, Pandas
- **Frontend**: React 19, Vite, Tailwind CSS v4, Lucide React, Recharts
- **Deployment**: Render (Backend Web Service), Vercel (Frontend Static SPA)

---

## 🚀 Local Development Quickstart

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/bgauri05/ForensiAir---AI-powered-surveillance.git
cd ForensiAir---AI-powered-surveillance
```

### 2. Backend Setup
```bash
# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI backend (defaults to port 8000)
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API and interactive documentation will be available at:
- API Base: `http://127.0.0.1:8000`
- Swagger UI: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```
The application will launch at:
- Web Application: `http://127.0.0.1:5173`

---

## 🔐 Evaluation & Test Credentials

The pre-seeded database includes roles for evaluating multi-user workflows:

| Role | Username | Password | Permitted Modules |
|---|---|---|---|
| **System Administrator** | `admin` | `admin123` | Full Access: Administration Portal, Unlock Approvals, Thresholds, Model Config |
| **Field Inspector / Officer** | `inspector` | `inspector123` | Field Verification, Reports Center, Anomaly Alerts, Dossier Generation |

---

## 📁 Repository Structure

```
├── backend/
│   ├── main.py                     # FastAPI REST API routes and authentication
│   ├── reports_service.py          # Inspection reports, time-window locks & audit trail
│   ├── models.py                   # SQLAlchemy database schemas
│   ├── v2_adapter.py               # Evaluation dataset adapter
│   └── seed_realistic_reports.py   # Seeding script for verification dossiers
├── frontend/
│   ├── src/
│   │   ├── components/             # React views (Dashboard, Alerts, Reports, Admin Portal)
│   │   ├── context/                # ViewModeContext (Plain vs Technical state)
│   │   ├── utils/                  # Glossary dual labels & report PDF export generators
│   │   └── App.jsx                 # Main application router and auth coordinator
│   ├── public/evidence/            # Forensic photographic proof SVGs
│   └── vite.config.js              # Vite configuration
├── ml_pipeline/
│   ├── risk_engine.py              # Composite risk calculation engine
│   ├── train_xgboost_weak_supervision.py # Supervised model trainer
│   └── compute_shap_explanations.py# SHAP explainability attribution generator
├── forensier.db                    # Pre-seeded production SQLite database
├── render.yaml                     # Render backend deployment manifest
└── requirements.txt                # Python backend dependencies
```

---

## 📄 License & Attribution

Developed for academic and research purposes in automated environmental telemetry integrity verification and AI-assisted regulatory oversight.
