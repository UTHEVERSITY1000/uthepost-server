# u-thePOST & u-theJOBS Enterprise Multi-Sync Engine

High-performance, AI-powered recruiter portal, candidate discovery board, master governance suite, B2B lead engine, omnichannel campaign center, and real-time dual-system synchronization mesh for **UTHEVERSITY**.

---

## 3-Role Enterprise Ecosystem & Subdomain Routing

The server dynamically resolves incoming HTTP Host headers to provide seamless role-based routing:

| Role / Subsystem | Host Header Subdomain | Target Interface | Description |
| :--- | :--- | :--- | :--- |
| **Recruiter Studio** | `post.utheversity.com` | `u-thePOST-ENTERPRISE-EDITION.html` | Job creation studio, lead discovery, omnichannel CRM & ATS Kanban. |
| **Candidate Board** | `jobs.utheversity.com` | `u-theJOBS-ENTERPRISE-SYNC.html` | Live reactive candidate discovery board and 1-click application submission. |
| **Master Governance** | `admin.utheversity.com` | `u-theADMIN-MASTER-SUITE.html` | Master cluster oversight, telemetry telemetry, audit logs, and catalog control. |
| **Staging Workbench** | Direct IP / Fallback | `preview-hub.html` | Multi-view split-screen staging canvas and live event packet inspector. |

Clean URL aliases are also supported: `/post`, `/jobs`, `/admin`, and `/preview`.

---

## Mobile Optimization & Touch-Friendly UI

- **Viewport & Touch Scaling**: Strict `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">` enforced across all interfaces.
- **48px Minimum Touch Targets**: All buttons, inputs, dropdowns, and navigation elements meet or exceed 48px by 48px interactive target dimensions with active touch scaling (`transform: scale(0.97)`), visible `:focus-visible` rings, and touch momentum scrolling (`-webkit-overflow-scrolling: touch`).
- **Thumb-Zone Ergonomics**: Sticky bottom mobile action bars ("Publish Job", "Submit Resume", "Run Diagnostics") keep primary controls within thumb reach on mobile devices.
- **Collapsible Navigation Drawers**: Slide-in mobile drawers with smooth cubic-bezier transitions for frictionless navigation.
- **Zero Horizontal Wobble**: `overflow-x: hidden` prevents sideways drift on iOS Safari and Android Chrome.

---

## Enterprise Refresh & Plain-English Tooltips

- **Symbol & Emoji Removal**: Stripped decorative emojis in favor of clean high-contrast text badges (`[ACTIVE]`, `[SYNC 100%]`, `[MATCH 92%]`, `[VERIFIED]`).
- **8K PNG Logo Support**: Crisp header logo upload supporting ultra-high resolution 8K PNG files (`7680x4320`) with in-place distortion-free scaling across mobile and high-DPI desktop displays.
- **Plain-English Tooltips**: Contextual `[data-tooltip]` hover and tap tooltips across all form inputs and interactive triggers.

---

## Getting Started

### Installation
```bash
npm install
```

### Start Local Server & Sync Mesh
```bash
node server.js
```

### Run Automated Diagnostic Tests
```bash
node test-suite.js
```

---

## Automated CI/CD & Deployment
All pushes to the `main` branch of `UTHEVERSITY1000/uthepost-server` trigger automatic zero-downtime deployment on Render.

---

## License
ISC
