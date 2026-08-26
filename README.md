# u-thePOST: Enterprise Lead & Multi-Sync Engine

High-performance, AI-powered recruiter portal, B2B lead engine, omnichannel campaign center, and real-time dual-system synchronization mesh for **u-theJOBS**.

---

## 🌟 Key Architecture & Features

1. **Recruiter Studio (`u-thePOST`)**:
   - Clean, high-contrast, minimalist design with zero emojis and plain-English UI tooltips.
   - In-place logo replacement supporting ultra-high resolution **8K PNG** files (`7680x4320`) with zero distortion.
   - Real-time reactive preview card and active job listings dashboard.

2. **1-Click Omni-Channel Publishing Engine**:
   - Master `BROADCAST EVERYWHERE (OMNI-CHANNEL)` trigger.
   - Synchronously broadcasts positions across **u-theJOBS**, **LinkedIn InMail & Feeds**, **Gmail Outreach**, **X (Twitter)**, **TikTok & Instagram**, and **Open-Source Schema.org Feeds**.

3. **B2B Lead Engine (Hunter.io API v2)**:
   - Query filters by department (`hr,management`) and seniority (`executive,senior`).
   - Automated email verification and confidence scoring.

4. **Candidate Board (`u-theJOBS`)**:
   - Real-time sync node over `BroadcastChannel` and WebSocket relay (`ws://localhost:3000`).
   - 1-click candidate application submission with direct delivery to recruiter ATS Kanban.

5. **ATS Kanban & Two-Way Vector Matching**:
   - 5-stage pipeline (`Applied` → `Screened` → `Interviewing` → `Offer` → `Hired`).
   - Candidate evaluation scorecards with technical, communication, and culture rubrics.

6. **Interactive Staging Hub (`preview-hub.html`)**:
   - Side-by-side split screen (`50/50`, `u-thePOST`, `u-theJOBS`).
   - Live packet inspector, latency monitor (< 10ms), and built-in diagnostic test runner.

---

## 🚀 Getting Started

### Installation
```bash
npm install
```

### Start Local Server & Sync Relay
```bash
node server.js
```

### Staging Access Points
- **Master Staging Hub**: `http://localhost:3000/preview-hub.html`
- **Recruiter Portal (`u-thePOST`)**: `http://localhost:3000/u-thePOST-ENTERPRISE-EDITION.html`
- **Candidate Board (`u-theJOBS`)**: `http://localhost:3000/u-theJOBS-ENTERPRISE-SYNC.html`

### Run Automated Diagnostic Tests
```bash
node test-suite.js
```

---

## 📄 License
ISC
