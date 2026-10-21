import sqlite3
import json
import os
import urllib.parse

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "forensier.db")
if not os.path.exists(DB_PATH):
    DB_PATH = "forensier.db"

svg_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "public", "evidence")
svg_cache = {}
if os.path.exists(svg_dir):
    for fname in os.listdir(svg_dir):
        if fname.endswith(".svg"):
            with open(os.path.join(svg_dir, fname), "r") as f:
                svg_cache[fname] = f.read()

def make_att(att_id, filename, name, size, mime="image/svg+xml"):
    svg_content = svg_cache.get(filename, "")
    encoded = urllib.parse.quote(svg_content)
    data_url = f"data:image/svg+xml;utf8,{encoded}"
    return {
        "id": att_id,
        "name": name,
        "filename": filename,
        "size": size,
        "type": mime,
        "dataUrl": data_url,
        "url": f"/evidence/{filename}",
        "uploadedAt": "2026-10-19T10:00:00.000Z"
    }

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Clear previous sample reports
c.execute("DELETE FROM report_revisions")
c.execute("DELETE FROM inspection_reports")

reports_data = [
    # 1. RAMDEV CHEMI-PHARMA (Taloja) - TRUE TAMPERING (Alert 8)
    {
        "report_id": "RPT-2026-0001",
        "alert_id": "8",
        "factory_id": "site_1281",
        "factory_name": "M/s RAMDEV CHEMI-Pharma PVT LTD",
        "case_id": "CASE-TAL-2026-0881",
        "inspector_id": "INSP-TAL-01",
        "inspector_name": "Er. Rajesh Deshmukh (Sr. Environmental Engineer)",
        "inspection_date": "2026-10-19",
        "checks_performed": json.dumps(["sensor_condition_and_calibration", "original_readings", "operational_records", "maintenance_logs", "other"]),
        "other_checks_description": "Concealed plumbing tracer test, CCTV surveillance footage review, and terminal box seal inspection.",
        "findings": """Unannounced midnight physical inspection conducted at 01:15 AM following automated Critical Alert #8 (5 tampering fingerprints triggered).

Upon inspecting the final treated effluent sump, inspection team uncovered an unauthorized 2-inch green flexible reinforced PVC hose concealed beneath wooden cable trays. The hose was actively pumping cooling tower blowdown and municipal freshwater directly into the discharge channel immediately upstream of the OCEMS immersion sensor probe tip.

The CPCB tamper-evident security lead seal (#CPCB-MAH-9921) on the telemetry transmitter enclosure had been snipped and severed. 

Comparative chemical analysis:
• Online Telemetry Stream: COD 142 mg/L, TSS 38 mg/L (Artificially Compliant).
• Mobile Lab Field Grab Sample (drawn from equalization tank upstream of bypass): COD 890 mg/L, TSS 240 mg/L (Massive non-compliance; 356% above CTO limit).

Plant Environmental Manager admitted under interrogation that dilution hose was operated during night hours (22:00 to 05:00) to mask organic load surges during antibiotic synthesis batch discharges.""",
        "outcome": "referred",
        "evidence_references": json.dumps({
            "supporting_reason": "Telemetry deviation confirmed as physical tampering / sensor bypass conduit",
            "doc_reference": "LAB-MAH-TAL-2026-8812 (NABL Accredited Analytical Report)",
            "maintenance_log": "Plant ETP Daily Shift Log #2026/OCT/18 (Seized under Panchanama)",
            "sample_id": "GRAB-TAL-2026-8812 (Triplicate under cold chain)",
            "other": "Seizure Panchanama signed by Factory ETP Head, Sub-Divisional Magistrate, and Police Sub-Inspector.",
            "attachments": [
                make_att("att_01", "evidence_bypass_hose.svg", "Evidence Photo 1 - Concealed 2-inch PVC Dilution Bypass Hose in Discharge Sump.svg", "38.4 KB"),
                make_att("att_02", "evidence_broken_seal.svg", "Evidence Photo 2 - Severed CPCB Security Lead Seal #CPCB-MAH-9921.svg", "44.2 KB"),
                make_att("att_03", "evidence_calibration_cert.svg", "Laboratory Analysis Comparison & Forensic Seizure Certificate.svg", "51.8 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Action completed. Immediate Closure Direction under Section 33(A) of Water (Prevention & Control of Pollution) Act, 1974 issued. MSEDCL directed to disconnect industrial electricity feeder. Environmental Damage Compensation (EDC) levied and Bank Guarantee of Rs 5.0 Lakh forfeited.",
        "admin_decision": "Reviewed",
        "reviewed_by": "Dr. Ananya Sharma (Regional Officer, SPCB Navi Mumbai & Taloja)",
        "reviewed_at": "2026-10-19T14:30:00.000Z",
        "created_at": "2026-10-19T03:15:00.000Z",
        "updated_at": "2026-10-19T14:30:00.000Z",
        "submitted_at": "2026-10-19T04:45:00.000Z"
    },

    # 2. DUCOL ORGANICS (Taloja) - FALSE POSITIVE (Alert 4)
    {
        "report_id": "RPT-2026-0002",
        "alert_id": "4",
        "factory_id": "site_1247",
        "factory_name": "Ducol Organics & Colours Pvt Ltd",
        "case_id": "CASE-TAL-2026-0819",
        "inspector_id": "INSP-TAL-04",
        "inspector_name": "Vikram Kadam (Junior Environmental Officer)",
        "inspection_date": "2026-10-18",
        "checks_performed": json.dumps(["sensor_condition_and_calibration", "original_readings", "operational_records", "maintenance_logs"]),
        "other_checks_description": "Ultrasonic probe solvent bath cleaning and 3-point CPCB buffer recalibration.",
        "findings": """Inspected the ETP Aeration Basin following AI flatline alert on Optical Dissolved Oxygen (DO) and pH parameters.

Physical examination revealed that the optical sensor probe was completely coated in a dense, dark green biological algal slime layer (~3mm thick) and filamentous biomass. The motorized automatic wiper arm had seized mechanically due to a snapped nylon drive gear. With the optical sensing window occluded, telemetry flatlined at 0.02 mg/L.

Plant maintenance team had already logged Maintenance Work Order #MT-8819 at 08:30 AM (4 hours prior to inspector arrival) awaiting replacement wiper motor.

In presence of the inspecting team:
1. Sensor was extracted, subjected to ultrasonic solvent cleaning, and wiped clean.
2. New wiper motor installed and wiper sweep function verified.
3. 3-point buffer calibration conducted (pH 4.01, 7.00, 9.21) and air-saturation DO calibration. Transmitter confirmed 99.4% slope with zero drift of only +0.01 pH.
4. Real-time dynamic readings resumed immediately upon re-immersion.

Factory wastewater treatment process, batch dyeing records, and electrical power meter logs confirmed standard compliant operations. No evidence of intentional manipulation or regulatory breach.""",
        "outcome": "explained",
        "evidence_references": json.dumps({
            "supporting_reason": "Sensor probe recalibration and zero-drift wash verified in plant maintenance log",
            "doc_reference": "NABL Calibration Validation Certificate #CAL-2026-8819",
            "maintenance_log": "Ducol Plant Maintenance Work Order #MT-8819 (Logged 08:30 IST)",
            "sample_id": "GRAB-TAL-2026-4401 (COD: 110 mg/L - Conforms to limit)",
            "other": "Photographic evidence of biofouled probe and post-cleaning recalibration slope.",
            "attachments": [
                make_att("att_04", "evidence_algal_biofouling.svg", "Site Photo - Severe Algal Biofouling Occluding Optical DO Sensing Window.svg", "47.8 KB"),
                make_att("att_05", "evidence_probe_recalibrated.svg", "Calibration Photo - Post-Cleaning 3-Point Calibration on Transmitter (Slope 99.4%).svg", "39.2 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Explanation accepted and verified against plant pre-alert maintenance logbook. Case closed as equipment fault / confirmed FALSE POSITIVE. Facility directed to increase wiper inspection frequency from bi-weekly to weekly during summer season.",
        "admin_decision": "Reviewed",
        "reviewed_by": "Dr. Ananya Sharma (Regional Officer, SPCB Navi Mumbai & Taloja)",
        "reviewed_at": "2026-10-18T16:00:00.000Z",
        "created_at": "2026-10-18T12:00:00.000Z",
        "updated_at": "2026-10-18T16:00:00.000Z",
        "submitted_at": "2026-10-18T13:30:00.000Z"
    },

    # 3. PRIVI SPECIALTY CHEMICALS (Mahad) - FALSE POSITIVE (Alert 12)
    {
        "report_id": "RPT-2026-0003",
        "alert_id": "12",
        "factory_id": "site_1369",
        "factory_name": "M/s.Privi Specialty Chemicals Ltd(Unit-II)",
        "case_id": "CASE-MHD-2026-0774",
        "inspector_id": "INSP-MHD-02",
        "inspector_name": "Sunil More (Scientific Officer, SPCB Mahad)",
        "inspection_date": "2026-10-16",
        "checks_performed": json.dumps(["operational_records", "maintenance_logs", "missing_readings_or_transmission"]),
        "other_checks_description": "Lockout/Tagout (LOTO) physical safety padlock audit and CEMS zero-gas purge diagnostic.",
        "findings": """Physical verification conducted in response to Coordinated Missing Data and Correlation Break flag on CEMS flue gas telemetry (SO2, NOx, and Particulate Matter dropped to zero variance).

Field audit confirmed that the facility had completely shut down Boiler Unit #3 for statutory 5-day annual overhaul, refractory lining replacement, and Directorate of Steam Boilers hydro-testing.

Crucial verification findings:
1. Prior Statutory Intimation Notice was formally submitted by the factory to MPCB Mahad Regional Office on 2026-10-06 (10 days in advance) and registered under Inward Entry #RO-MHD-774.
2. Main steam valves and boiler fuel feeder conveyors were secured under physical Lockout / Tagout (LOTO) safety locks (Permit #LOTO-2026-884).
3. Continuous Emission Monitoring System (CEMS) rack was operating in automated zero-air purge and span gas check cycle. The constant zero baseline output during purging was what triggered the statistical correlation break detector.

No fuel burning occurred during the entire episode. Zero industrial emissions were released.""",
        "outcome": "explained",
        "evidence_references": json.dumps({
            "supporting_reason": "Process batch production paused / ETP plant shut down during telemetry episode",
            "doc_reference": "MPCB Mahad Prior Shutdown Notice Inward #RO-MHD-774 (Dated 06-Oct-2026)",
            "maintenance_log": "Plant Annual Statutory Overhaul Logbook & Boiler Inspector Hydro Permit #B-991",
            "sample_id": "N/A - Zero combustion activity",
            "other": "Photographic verification of physical Lockout/Tagout (LOTO) padlocks and CEMS purge diagnostic.",
            "attachments": [
                make_att("att_06", "evidence_loto_shutdown.svg", "Evidentiary Photo - High Pressure Boiler Steam Valve Secured Under LOTO Padlocks.svg", "41.6 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Approved. Legitimacy of plant shutdown confirmed through verified inward records. Anomaly classified as confirmed FALSE POSITIVE resulting from automated zero-air calibration purge during shutdown.",
        "admin_decision": "Reviewed",
        "reviewed_by": "P. K. Patil (Regional Officer, SPCB Raigad & Mahad)",
        "reviewed_at": "2026-10-16T17:00:00.000Z",
        "created_at": "2026-10-16T13:45:00.000Z",
        "updated_at": "2026-10-16T17:00:00.000Z",
        "submitted_at": "2026-10-16T14:30:00.000Z"
    },

    # 4. SUDARSHAN CHEMICAL (Mahad) - TRUE TAMPERING (Alert 18)
    {
        "report_id": "RPT-2026-0004",
        "alert_id": "18",
        "factory_id": "site_1789",
        "factory_name": "sudarshan chemical industries ltd Mahad",
        "case_id": "CASE-MHD-2026-0902",
        "inspector_id": "INSP-MHD-01",
        "inspector_name": "D. R. Pawar (Sr. Environmental Engineer, SPCB Mahad Enforcement)",
        "inspection_date": "2026-10-17",
        "checks_performed": json.dumps(["original_readings", "operational_records", "sensor_condition_and_calibration", "other"]),
        "other_checks_description": "Forensic audit of SCADA/PLC workstation, Modbus register memory dump, and Wireshark packet capture.",
        "findings": """Investigated persistent Limit Hugging alert where COD readings remained frozen between 244.0 and 248.5 mg/L (immediately below the statutory threshold of 250.0 mg/L) without a single variation outside this 2% band for 18 consecutive days.

During forensic inspection of the central ETP control room, our automation specialist inspected the Siemens WinCC SCADA server and Moxa IoT edge gateway.

Forensic discoveries:
1. An unauthorized background Lua script named 'cpcb_filter_clamp.lua' was running as an active daemon.
2. Code examination revealed that when raw sensor readings exceeded 248.5 mg/L, the script mathematically intercepted the value and substituted it with: (248.5 - math.random() * 2.0).
3. Raw Modbus analog register 40012 was recording actual untreated probe values ranging from 420 to 510 mg/L.
4. The clamped value was the only signal relayed to the SPCB cloud gateway.

The plant automation technician admitted that this override logic was implemented to prevent automatic SMS show-cause alerts from being generated by the SPCB portal during high-strength batch pigment washings.""",
        "outcome": "referred",
        "evidence_references": json.dumps({
            "supporting_reason": "Telemetry deviation confirmed as physical tampering / sensor bypass conduit",
            "doc_reference": "Forensic Cyber-Audit & Modbus Memory Extraction Report #CYBER-MHD-2026-09",
            "maintenance_log": "SCADA Configuration Change Audit Log (User: root_admin, Script Modified 28-Sep-2026)",
            "sample_id": "GRAB-MHD-2026-902 (Laboratory COD: 495 mg/L vs Clamped Telemetry: 247 mg/L)",
            "other": "Photographic evidence of SCADA screen displaying the active clamping script source code.",
            "attachments": [
                make_att("att_07", "evidence_scada_clamp.svg", "Forensic Screenshot - SCADA WinCC Active Clamping Script & Modbus Intercept.svg", "50.9 KB"),
                make_att("att_08", "evidence_calibration_cert.svg", "NABL Accredited Laboratory Comparative Test Report.svg", "51.8 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Criminal prosecution proceedings approved under Section 43/44 of Water Act 1974. FIR lodged against facility directors for fraudulent data falsification. Environmental Damage Compensation (EDC) penalty calculated at Rs 48.5 Lakh.",
        "admin_decision": "Reviewed",
        "reviewed_by": "P. K. Patil (Regional Officer, SPCB Raigad & Mahad)",
        "reviewed_at": "2026-10-17T18:00:00.000Z",
        "created_at": "2026-10-17T15:30:00.000Z",
        "updated_at": "2026-10-17T18:00:00.000Z",
        "submitted_at": "2026-10-17T16:45:00.000Z"
    },

    # 5. CORROGARD CHEMICALS (Taloja) - FALSE POSITIVE (Alert 9)
    {
        "report_id": "RPT-2026-0005",
        "alert_id": "9",
        "factory_id": "site_1284",
        "factory_name": "CORROGARD CHEMICALS",
        "case_id": "CASE-TAL-2026-0841",
        "inspector_id": "INSP-TAL-04",
        "inspector_name": "Vikram Kadam (Junior Environmental Officer)",
        "inspection_date": "2026-10-18",
        "checks_performed": json.dumps(["original_readings", "missing_readings_or_transmission", "maintenance_logs"]),
        "other_checks_description": "Cross-verification with MSEDCL 33kV Substation logbook and RTU diagnostic buffer review.",
        "findings": """Investigated AI flag for Copy-Paste Pattern & Flatline on effluent telemetry occurring between 09:12 and 09:54 IST on 18-Oct-2026.

Field investigation cross-checked with the Maharashtra State Electricity Distribution Co. Ltd. (MSEDCL) 33kV Taloja Substation revealed:
1. Lightning strike occurred at 09:12 IST tripping 33kV Feeder #4 on Earth Fault Relay (51N).
2. Power was interrupted for 42 minutes before being restored via backup transformer TR-2.
3. During the power brownout, the cellular IoT RTU gateway suffered a volatile memory lock. In the absence of an ACK packet from the SPCB server, it entered a loop re-transmitting its last buffered 15-minute data frame 3 consecutive times upon cellular network re-association.
4. Physical inspection of the analyzer internal non-volatile SD-card data recorder confirmed that raw analog sensors were offline during the blackout and resumed normal, dynamic, compliant readings immediately upon generator restoration.

No plant effluent was discharged during the power outage as raw wastewater transfer pumps were interlocked to de-energize on mains loss.""",
        "outcome": "explained",
        "evidence_references": json.dumps({
            "supporting_reason": "Flow meter pulse rate transmission buffer replay",
            "doc_reference": "MSEDCL Official Substation Incident Log #TRIP-TALOJA-2026-8841-A",
            "maintenance_log": "Plant Emergency Generator Auto-Start Log #DG-02",
            "sample_id": "N/A - Zero discharge during grid trip",
            "other": "Photocopy of certified MSEDCL power failure certificate and RTU firmware diagnostic dump.",
            "attachments": [
                make_att("att_09", "evidence_substation_trip.svg", "Official Document - MSEDCL 33kV Substation Lightning Trip & Outage Log.svg", "41.4 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Verified and approved. Anomaly confirmed as telemetry gateway transmission buffer replay caused by grid power trip. Classified as confirmed FALSE POSITIVE. Facility directed to upgrade RTU firmware to prevent repetitive retransmissions during network reconnections.",
        "admin_decision": "Reviewed",
        "reviewed_by": "Dr. Ananya Sharma (Regional Officer, SPCB Navi Mumbai & Taloja)",
        "reviewed_at": "2026-10-18T18:15:00.000Z",
        "created_at": "2026-10-18T14:15:00.000Z",
        "updated_at": "2026-10-18T18:15:00.000Z",
        "submitted_at": "2026-10-18T15:30:00.000Z"
    },

    # 6. NOURYON CHEMICALS (Mahad) - INCONCLUSIVE (Alert 16)
    {
        "report_id": "RPT-2026-0006",
        "alert_id": "16",
        "factory_id": "site_1668",
        "factory_name": "Nouryon Chemicals India Private Limited",
        "case_id": "CASE-MHD-2026-0449",
        "inspector_id": "INSP-MHD-03",
        "inspector_name": "Er. Suresh Shinde (Assistant Environmental Engineer)",
        "inspection_date": "2026-10-19",
        "checks_performed": json.dumps(["sensor_condition_and_calibration", "original_readings", "operational_records", "other"]),
        "other_checks_description": "Triplicate grab sampling under cold-chain chain of custody and chemical solvent odor profiling.",
        "findings": """Conducted surprise regulatory inspection following Inspection Dip flag on effluent discharge telemetry.

On-site observations:
1. Production facility was operating at reduced 50% capacity during daylight inspection hours.
2. Treated effluent exiting through final discharge weir exhibited faint turbidity and noticeable aromatic solvent odor.
3. On-site field probe testing indicated: pH 7.8 (compliant), COD 195 mg/L (marginal vs 250 limit), Dissolved Solids 1,840 mg/L.
4. However, composite sampler storage refrigeration was turned off, raising concern over sample preservation.

Due to conflicting indicators between optical sensor clarity and on-site sensory observation, inspecting team collected sealed triplicate 1000 mL grab samples from the final weir in amber glass containers under Form-IV of Environmental Protection Rules.

Samples were labeled (#NABL-MHD-449-A, B, C), secured with tamper-evident barcoded seals in an ice cooler box at 4°C, and dispatched to the CPCB Central Environmental Laboratory for comprehensive analysis including:
• 5-Day Biochemical Oxygen Demand (BOD) at 20°C (IS 3025 Pt 44)
• Total Organic Carbon (TOC)
• Gas Chromatography-Mass Spectrometry (GC-MS) for volatile solvent detection.

Final enforcement determination deferred pending receipt of accredited analytical certificate (expected within 5 working days).""",
        "outcome": "inconclusive",
        "evidence_references": json.dumps({
            "supporting_reason": "Inconclusive evidence: awaiting 5-day BOD laboratory results",
            "doc_reference": "Form-IV Sample Collection Memorandum & Lab Dispatch Receipt #NABL-MHD-449",
            "maintenance_log": "Plant ETP Operator Shift Logbook (Volume 14, Page 88)",
            "sample_id": "GRAB-MHD-2026-449-A/B/C (Triplicate sealed)",
            "other": "Photographic evidence of sealed amber sample bottles in regulatory cooler box.",
            "attachments": [
                make_att("att_10", "evidence_sealed_samples.svg", "Evidence Photo - Triplicate Amber Sample Bottles in Cold Chain Ice Box with Security Seals.svg", "43.6 KB")
            ]
        }),
        "status": "Submitted for Review",
        "admin_notes": "Interim report reviewed. Matter held open under provisional surveillance. Field officer instructed to monitor daily telemetry pending formal 5-day BOD laboratory results.",
        "admin_decision": None,
        "reviewed_by": None,
        "reviewed_at": None,
        "created_at": "2026-10-19T11:45:00.000Z",
        "updated_at": "2026-10-19T14:00:00.000Z",
        "submitted_at": "2026-10-19T14:00:00.000Z"
    },

    # 7. INDO AMINES (Mahad) - FALSE POSITIVE (Alert 11)
    {
        "report_id": "RPT-2026-0007",
        "alert_id": "11",
        "factory_id": "site_1321",
        "factory_name": "M/s. Indo Amines Ltd.",
        "case_id": "CASE-MHD-2026-0321",
        "inspector_id": "INSP-MHD-02",
        "inspector_name": "Sunil More (Scientific Officer, SPCB Mahad)",
        "inspection_date": "2026-10-17",
        "checks_performed": json.dumps(["sensor_condition_and_calibration", "original_readings", "maintenance_logs"]),
        "other_checks_description": "Electrode diagnostic impedance check, KCl reference electrolyte inspection, and multi-buffer recalibration.",
        "findings": """Investigated Gradual Drift alert on effluent pH sensor (+0.08 pH drift per day over 12 days, rising from 7.2 to 8.4 despite stable acid neutralization dosing).

Inspection findings:
1. Examination of the combination glass electrode revealed that the internal reference potassium chloride (KCl) gel electrolyte had crystallized and dried out at the lower diaphragm.
2. Summer ambient temperatures (>42°C in the unshaded sensor kiosk) accelerated electrolyte depletion.
3. Diagnostic testing showed electrode slope had degraded to 72.1% with zero-point offset of +68 mV (exceeding permissible limit of ±30 mV).
4. Electrode service record indicated probe was 14 months old (rated lifespan: 12 months).

Corrective actions carried out under inspector supervision:
1. Factory maintenance team unboxed a new genuine Horiba glass electrode cartridge (Invoice #INV-HOR-2026-092 confirmed on site).
2. New probe was installed, pre-conditioned, and multi-point calibrated with fresh CPCB buffer standards (pH 4.01, 7.00, 9.21).
3. Transmitter verified slope restored to 98.4% and zero offset to +2.4 mV.
4. Grab sample tested with portable Hanna field meter read 7.28 pH, fully matching the new calibrated sensor reading of 7.30 pH.

No environmental breach or bypass was observed.""",
        "outcome": "explained",
        "evidence_references": json.dumps({
            "supporting_reason": "Sensor probe recalibration and zero-drift wash verified in plant maintenance log",
            "doc_reference": "NABL Calibration Certificate & Manufacturer Warranty Slip #HOR-CAL-2026",
            "maintenance_log": "Indo Amines Instrumentation Preventive Maintenance Log #PM-2026-10-17",
            "sample_id": "GRAB-MHD-2026-321 (pH 7.28, COD 134 mg/L - Fully Compliant)",
            "other": "Photographic evidence of depleted crystallized electrode and restored calibration slope.",
            "attachments": [
                make_att("att_11", "evidence_depleted_electrode.svg", "Macro Photo - Combination Glass Electrode Showing Crystallized KCl Reference Junction.svg", "40.1 KB"),
                make_att("att_12", "evidence_probe_recalibrated.svg", "Verification Photo - Replaced Sensor Calibrated with Slope 98.4% and Normal Zero Offset.svg", "39.2 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Approved as verified FALSE POSITIVE. Sensor had reached operational end-of-life. Timely replacement and calibration documented under regulatory supervision. Facility instructed to install solar heat shield over the sensor mounting kiosk.",
        "admin_decision": "Reviewed",
        "reviewed_by": "P. K. Patil (Regional Officer, SPCB Raigad & Mahad)",
        "reviewed_at": "2026-10-17T16:30:00.000Z",
        "created_at": "2026-10-17T13:00:00.000Z",
        "updated_at": "2026-10-17T16:30:00.000Z",
        "submitted_at": "2026-10-17T14:15:00.000Z"
    },

    # 8. EUROCHEM INDUSTRIES (Taloja) - TRUE TAMPERING (Alert 6)
    {
        "report_id": "RPT-2026-0008",
        "alert_id": "6",
        "factory_id": "site_1259",
        "factory_name": "EUROCHEM INDUSTRIES",
        "case_id": "CASE-TAL-2026-0082",
        "inspector_id": "INSP-TAL-01",
        "inspector_name": "Er. Rajesh Deshmukh (Sr. Environmental Engineer)",
        "inspection_date": "2026-10-19",
        "checks_performed": json.dumps(["sensor_condition_and_calibration", "original_readings", "operational_records", "other"]),
        "other_checks_description": "Tracing underground industrial plumbing and fire hydrant network pressure telemetry.",
        "findings": """Investigated suspicious telemetry pattern showing sudden drops in electrical conductivity accompanied by unnatural flatline periods in COD telemetry during late evening hours.

Surprise evening inspection team traced an underground 3-inch pipeline branching off the factory dedicated fire hydrant ring main. The line terminated inside the underground raw effluent equalization tank via a concealed pneumatic butterfly valve.

During peak chemical synthesis shifts, the valve was actuated to introduce high-pressure municipal/firewater directly into the effluent stream before chemical treatment, diluting toxic organochlorine residues by up to 70% to fool the automated OCEMS analyzers.

Inspectors immediately sealed the bypass valve with a tamper-evident regulatory seal, seized the valve actuator air supply tubing, and took grab samples before and after the dilution point.""",
        "outcome": "referred",
        "evidence_references": json.dumps({
            "supporting_reason": "Telemetry deviation confirmed as physical tampering / sensor bypass conduit",
            "doc_reference": "Enforcement Seizure Memo #SEIZ-TAL-2026-008 & Panchanama",
            "maintenance_log": "Fire Hydrant Pressure Testing Logbook (Showing unexplained pressure drops at 21:00)",
            "sample_id": "GRAB-TAL-2026-1259-RAW (TDS 6,800 mg/L vs Diluted 1,200 mg/L)",
            "other": "Photographic evidence of bypass hose connection and seized pneumatic valve.",
            "attachments": [
                make_att("att_13", "evidence_bypass_hose.svg", "Site Evidence Photo - Illegal Dilution Line Tapped from Fire Hydrant Header.svg", "38.4 KB"),
                make_att("att_14", "evidence_broken_seal.svg", "Physical Evidence - Severed Terminal Security Tag and Bypassed Air Tubing.svg", "44.2 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Emergency closure notice under Section 33(A) of Water Act issued. Bank guarantee of Rs 10 Lakh invoked. Factory directed to dismantle the entire unauthorized branch line under SPCB supervision within 7 days.",
        "admin_decision": "Reviewed",
        "reviewed_by": "Dr. Ananya Sharma (Regional Officer, SPCB Navi Mumbai & Taloja)",
        "reviewed_at": "2026-10-19T17:45:00.000Z",
        "created_at": "2026-10-19T10:15:00.000Z",
        "updated_at": "2026-10-19T17:45:00.000Z",
        "submitted_at": "2026-10-19T11:30:00.000Z"
    },

    # 9. DOW CHEMICAL (Taloja) - ROUTINE AUDIT / CLEAN (Alert 23)
    {
        "report_id": "RPT-2026-0009",
        "alert_id": "23",
        "factory_id": "site_887",
        "factory_name": "Dow Chemical International Pvt Ltd",
        "case_id": "CASE-TAL-2026-0904",
        "inspector_id": "INSP-TAL-01",
        "inspector_name": "Er. Rajesh Deshmukh (Sr. Environmental Engineer)",
        "inspection_date": "2026-10-20",
        "checks_performed": json.dumps(["sensor_condition_and_calibration", "original_readings", "operational_records", "maintenance_logs"]),
        "other_checks_description": "Comprehensive annual regulatory surveillance audit and ZLD system verification.",
        "findings": """Unannounced regulatory surveillance audit conducted at Dow Chemical International (Taloja). 

All environmental pollution abatement facilities inspected in operation:
1. Multi-Stage ETP, Secondary Biological Clarifier, and Zero Liquid Discharge (ZLD) Multi-Effect Evaporator operating in normal parameters.
2. Online OCEMS analyzers (Endress+Hauser Liquiline CM44P) verified in calibrated condition with valid NABL certificates.
3. Split grab sample analyzed on-site: pH 7.42, COD 42 mg/L, TSS 18 mg/L, Ammoniacal Nitrogen 3.2 mg/L — fully compliant with Consent to Operate (CTO) discharge standards.
4. Secondary chemical spill containment berms and automated stormwater isolation gates verified functional.

Comprehensive compliance verified. No deviation or irregularities found.""",
        "outcome": "explained",
        "evidence_references": json.dumps({
            "supporting_reason": "Grab sample analysis conforms to effluent discharge CTO limits",
            "doc_reference": "NABL Calibration Certificate #NABL-CAL-2026-9041",
            "maintenance_log": "Dow ETP Operational Logbook & Daily Preventive Maintenance Sheet",
            "sample_id": "GRAB-DOW-2026-1020 (COD 42 mg/L, pH 7.42)",
            "other": "Annual Comprehensive Compliance Certificate.",
            "attachments": [
                make_att("att_15", "evidence_calibration_cert.svg", "Official NABL Certificate of Calibration & Instrument Traceability #9041.svg", "51.8 KB"),
                make_att("att_16", "evidence_probe_recalibrated.svg", "Site Verification - Sensor Immersion Calibration in NIST Buffer Solution.svg", "39.2 KB")
            ]
        }),
        "status": "Reviewed",
        "admin_notes": "Surveillance audit satisfactory. Clean bill of health issued. Annual compliance renewal approved.",
        "admin_decision": "Reviewed",
        "reviewed_by": "Dr. Ananya Sharma (Regional Officer, SPCB Navi Mumbai & Taloja)",
        "reviewed_at": "2026-10-20T16:00:00.000Z",
        "created_at": "2026-10-20T11:00:00.000Z",
        "updated_at": "2026-10-20T16:00:00.000Z",
        "submitted_at": "2026-10-20T13:00:00.000Z"
    }
]

for r in reports_data:
    c.execute("""
        INSERT INTO inspection_reports (
            report_id, alert_id, factory_id, factory_name, case_id,
            inspector_id, inspector_name, inspection_date, checks_performed,
            other_checks_description, findings, outcome, evidence_references,
            status, admin_notes, admin_decision, reviewed_by, reviewed_at,
            created_at, updated_at, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        r["report_id"], r["alert_id"], r["factory_id"], r["factory_name"], r["case_id"],
        r["inspector_id"], r["inspector_name"], r["inspection_date"], r["checks_performed"],
        r["other_checks_description"], r["findings"], r["outcome"], r["evidence_references"],
        r["status"], r["admin_notes"], r["admin_decision"], r["reviewed_by"], r["reviewed_at"],
        r["created_at"], r["updated_at"], r["submitted_at"]
    ))

    # Add Initial Revision
    c.execute("""
        INSERT INTO report_revisions (
            report_id, revision_number, action, actor_id, actor_role, summary, snapshot_json, created_at
        ) VALUES (?, 1, 'created_and_filed', ?, 'inspector', ?, ?, ?)
    """, (
        r["report_id"], r["inspector_id"],
        f"Inspection verification dossier filed by {r['inspector_name']}",
        json.dumps({"report_id": r["report_id"], "outcome": r["outcome"], "status": r["status"]}),
        r["created_at"]
    ))

    # If reviewed, add second revision for admin sign-off
    if r["status"] == "Reviewed":
        c.execute("""
            INSERT INTO report_revisions (
                report_id, revision_number, action, actor_id, actor_role, summary, snapshot_json, created_at
            ) VALUES (?, 2, 'admin_reviewed', ?, 'admin', ?, ?, ?)
        """, (
            r["report_id"], r["reviewed_by"] or "Admin",
            f"Regulatory decision recorded: {r['admin_decision']}. {r['admin_notes'][:80]}...",
            json.dumps({"report_id": r["report_id"], "status": "Reviewed", "admin_decision": r["admin_decision"]}),
            r["reviewed_at"] or r["updated_at"]
        ))

conn.commit()
conn.close()
print(f"Successfully seeded {len(reports_data)} realistic inspection reports with full proofs & attachments!")
