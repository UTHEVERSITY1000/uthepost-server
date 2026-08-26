const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

// In-memory state store
const globalJobDatabase = [
  {
    id: 'JOB-101',
    jobTitle: 'Senior Full-Stack Engineer',
    company: 'Quantum Technologies Corp',
    location: 'AUSTIN, TX (REMOTE)',
    employmentType: 'Full-Time',
    payStructure: 'Salary Range',
    minCompensation: '135000',
    maxCompensation: '175000',
    salary: '$135,000 - $175,000',
    paidVacation: 'Unlimited PTO',
    healthCoverage: 'Premium Medical, Dental, Vision',
    retirement: '401(k) 5% Match',
    additionalPerks: '$3,000 Home Office Stipend + Equity',
    applyLinkUrl: 'https://careers.quantumtech.io/apply/101',
    summary: 'Lead our next-generation real-time multi-agent sync engine and enterprise web infrastructure. Modern TypeScript, WebSockets, high-performance UI.',
    logo: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'JOB-102',
    jobTitle: 'VP of Engineering',
    company: 'Apex Cloud Systems',
    location: 'SAN FRANCISCO, CA (HYBRID)',
    employmentType: 'Full-Time',
    payStructure: 'Salary Range',
    minCompensation: '220000',
    maxCompensation: '290000',
    salary: '$220,000 - $290,000',
    paidVacation: '25 Days PTO',
    healthCoverage: '100% Covered Platinum Health',
    retirement: '401(k) Matching',
    additionalPerks: 'Annual Executive Retreats & Relocation',
    applyLinkUrl: 'https://apexcloud.com/careers/vp-eng',
    summary: 'Lead an engineering organization of 45+ distributed developers building high-throughput data pipelines and cloud infra.',
    logo: '',
    createdAt: new Date().toISOString()
  },
  {
    id: 'JOB-103',
    jobTitle: 'AI Prompt & Integration Engineer',
    company: 'NeuralFlow Labs',
    location: 'NEW YORK, NY (REMOTE)',
    employmentType: 'Contract',
    payStructure: 'Hourly Rate',
    minCompensation: '95',
    maxCompensation: '130',
    salary: '$95 - $130 / hr',
    paidVacation: 'Flexible Schedule',
    healthCoverage: 'Health Stipend',
    retirement: 'Optional SEP-IRA',
    additionalPerks: 'Latest M3 Max Hardware & Cloud Credits',
    applyLinkUrl: 'https://neuralflow.ai/jobs/prompt-eng',
    summary: 'Design and deploy multi-agent cognitive architectures and autonomous reasoning pipelines for enterprise customers.',
    logo: '',
    createdAt: new Date().toISOString()
  }
];

const applicantsStore = [
  {
    id: 'APP-701',
    jobId: 'JOB-101',
    jobTitle: 'Senior Full-Stack Engineer',
    name: 'Marcus Vance',
    email: 'marcus.vance@techdev.io',
    phone: '+1 (512) 555-0192',
    status: 'Screened',
    score: 94,
    skills: ['TypeScript', 'WebSockets', 'React', 'Node.js', 'PostgreSQL'],
    resumeSummary: '8+ years full stack architect specialized in reactive client-side state engines and distributed WebSockets.',
    appliedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    scorecard: {
      technical: 5,
      communication: 4,
      culture: 5,
      notes: 'Exceptional architectural grasp. Built similar dual-sync systems in previous startup.',
      decision: 'Strong Hire'
    }
  },
  {
    id: 'APP-702',
    jobId: 'JOB-101',
    jobTitle: 'Senior Full-Stack Engineer',
    name: 'Elena Rostova',
    email: 'elena.rostova@cloudscale.net',
    phone: '+1 (415) 555-0844',
    status: 'Interviewing',
    score: 88,
    skills: ['Go', 'Node.js', 'Distributed Systems', 'Vue', 'Docker'],
    resumeSummary: '6 years scaling high-availability microservices and real-time frontend streaming protocols.',
    appliedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    scorecard: {
      technical: 4,
      communication: 5,
      culture: 4,
      notes: 'Great culture fit and solid systems design skills.',
      decision: 'Hire'
    }
  },
  {
    id: 'APP-703',
    jobId: 'JOB-102',
    jobTitle: 'VP of Engineering',
    name: 'David K. Mercer',
    email: 'd.mercer@executiveleads.com',
    phone: '+1 (206) 555-0331',
    status: 'Offer',
    score: 97,
    skills: ['Executive Leadership', 'Hiring', 'Cloud Architecture', 'Agile Scale'],
    resumeSummary: 'Former Director of Engineering at Series C fintech. Scaled engineering org from 15 to 85 engineers.',
    appliedAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    scorecard: {
      technical: 5,
      communication: 5,
      culture: 5,
      notes: 'Proven track record scaling organizations from 15 to 85+ developers.',
      decision: 'Offer Extended'
    }
  }
];

// Open-Source Job Feed Aggregator Mock Sources
const openSourceFeeds = [
  {
    id: 'FEED-SCHEMA-01',
    source: 'Schema.org JobPosting Ingestion',
    title: 'Lead Distributed Systems Architect',
    company: 'Nexus Scale Labs',
    location: 'Remote (US/EU)',
    type: 'Full-Time',
    minComp: 185000,
    maxComp: 240000,
    salary: '$185,000 - $240,000',
    pto: 'Unlimited PTO + Sabbatical',
    health: '100% Premium Covered',
    retirement: '401(k) 6% Match',
    perks: '$5,000 Hardware Setup Allowance',
    url: 'https://nexusscale.io/careers/lead-architect',
    summary: 'Lead next-gen distributed messaging broker with raft consensus and real-time WebSocket multiplexing.'
  },
  {
    id: 'FEED-GITHUB-02',
    source: 'GitHub Jobs Schema Ingestion',
    title: 'Staff Frontend Engineer (TypeScript & Canvas)',
    company: 'Vector Canvas Corp',
    location: 'Austin, TX',
    type: 'Full-Time',
    minComp: 160000,
    maxComp: 210000,
    salary: '$160,000 - $210,000',
    pto: '25 Days PTO',
    health: 'Comprehensive PPO',
    retirement: '401(k) Matching',
    perks: 'Annual Conference & Travel Budget',
    url: 'https://vectorcanvas.dev/jobs/staff-fe',
    summary: 'Design high-performance 60fps web application canvases, rendering engines, and real-time collaborative state.'
  },
  {
    id: 'FEED-RSS-03',
    source: 'TechCareers Open RSS Aggregator',
    title: 'Senior DevOps & Reliability Engineer',
    company: 'Kubernetes Cloud Network',
    location: 'Remote',
    type: 'Contract',
    minComp: 90,
    maxComp: 125,
    salary: '$90 - $125 / hr',
    pto: 'Flexible Hours',
    health: 'Health Insurance Stipend',
    retirement: 'SEP-IRA Eligible',
    perks: 'Full Remote Freedom',
    url: 'https://k8scloud.net/openings/sr-sre',
    summary: 'Manage multi-region Kubernetes clusters, automated zero-downtime canary pipelines, and edge network routing.'
  }
];

// Hunter.io Lead Engine Search Simulation
function handleHunterDomainSearch(params) {
  const domain = (params.get('domain') || 'stripe.com').toLowerCase().trim();
  const department = params.get('department') || 'hr,management';
  const seniority = params.get('seniority') || 'executive,senior';

  const companyName = domain.split('.')[0].toUpperCase();

  const leads = [
    {
      company_name: companyName,
      domain: domain,
      contact_name: 'Sarah Jenkins',
      position: 'Head of Global Talent Acquisition',
      department: 'human_resources',
      seniority: 'senior',
      verified_email: `sarah.jenkins@${domain}`,
      confidence_score: 98,
      status: 'verified',
      sources: ['linkedin.com', 'company_about_page'],
      phone: '+1 (415) 890-2100',
      last_verified: new Date().toISOString().split('T')[0]
    },
    {
      company_name: companyName,
      domain: domain,
      contact_name: 'David Chang',
      position: 'VP of Engineering & Hiring Manager',
      department: 'management',
      seniority: 'executive',
      verified_email: `d.chang@${domain}`,
      confidence_score: 95,
      status: 'verified',
      sources: ['github.com', 'press_release'],
      phone: '+1 (415) 890-2104',
      last_verified: new Date().toISOString().split('T')[0]
    },
    {
      company_name: companyName,
      domain: domain,
      contact_name: 'Rachel Adams',
      position: 'Director of Technical Recruiting',
      department: 'human_resources',
      seniority: 'senior',
      verified_email: `rachel.a@${domain}`,
      confidence_score: 91,
      status: 'verified',
      sources: ['linkedin.com'],
      phone: '+1 (415) 890-2118',
      last_verified: new Date().toISOString().split('T')[0]
    },
    {
      company_name: companyName,
      domain: domain,
      contact_name: 'Michael Torres',
      position: 'Chief Operations Officer',
      department: 'management',
      seniority: 'executive',
      verified_email: `mtorres@${domain}`,
      confidence_score: 89,
      status: 'verified',
      sources: ['sec_filings', 'corporate_directory'],
      phone: '+1 (415) 890-2101',
      last_verified: new Date().toISOString().split('T')[0]
    }
  ];

  return {
    data: {
      domain: domain,
      disposable: false,
      webmail: false,
      accept_all: false,
      pattern: '{first}.{last}',
      organization: companyName,
      emails: leads
    },
    meta: {
      results: leads.length,
      limit: 10,
      offset: 0,
      params: { domain, department, seniority }
    }
  };
}

function handleHunterEmailVerify(params) {
  const email = (params.get('email') || 'recruiter@company.com').toLowerCase().trim();
  const domain = email.split('@')[1] || 'company.com';
  return {
    data: {
      status: 'valid',
      result: 'deliverable',
      score: 96,
      email: email,
      regexp: true,
      gibberish: false,
      disposable: false,
      webmail: false,
      mx_records: true,
      smtp_server: true,
      smtp_check: true,
      accept_all: false,
      block: false,
      sources: 6
    }
  };
}

// Strict Host-Header Subdomain Resolver
function resolveTargetFileForHost(req, parsedUrl) {
  const pathname = parsedUrl.pathname;
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '');

  // 1. Explicit clean route aliases or legacy direct filenames
  if (cleanPath === '/recruiter' || cleanPath === '/recruiter.html' || cleanPath === '/post' || cleanPath === '/u-thepost-enterprise-edition.html') {
    return 'recruiter.html';
  }
  if (cleanPath === '/candidate' || cleanPath === '/candidate.html' || cleanPath === '/jobs' || cleanPath === '/u-thejobs-enterprise-sync.html') {
    return 'candidate.html';
  }
  if (cleanPath === '/admin' || cleanPath === '/admin.html' || cleanPath === '/u-theadmin-master-suite.html') {
    return 'admin.html';
  }
  if (cleanPath === '/preview' || cleanPath === '/preview-hub.html' || cleanPath === '/hub') {
    return 'preview-hub.html';
  }

  // If asking for a specific non-root static asset on disk (e.g. css, js, png)
  if (cleanPath !== '' && cleanPath !== '/' && cleanPath !== '/index.html') {
    const rawFile = pathname.replace(/^\//, '');
    const candidatePath = path.join(__dirname, decodeURIComponent(rawFile));
    if (fs.existsSync(candidatePath) && !fs.statSync(candidatePath).isDirectory()) {
      return rawFile;
    }
  }

  // 2. Strict Host-Header Subdomain Resolution for root / index requests
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const firstHost = rawHost.split(',')[0].trim().toLowerCase();
  const host = firstHost.split(':')[0].trim();

  const subQuery = (parsedUrl.searchParams.get('subdomain') || parsedUrl.searchParams.get('role') || '').toLowerCase().trim();

  // Post / Recruiter subdomain
  if (host === 'post.utheversity.com' || host.startsWith('post.') || host.includes('recruiter.') || subQuery === 'post' || subQuery === 'recruiter') {
    return 'recruiter.html';
  }

  // Jobs / Candidate subdomain
  if (host === 'jobs.utheversity.com' || host.startsWith('jobs.') || host.includes('candidate.') || subQuery === 'jobs' || subQuery === 'candidate') {
    return 'candidate.html';
  }

  // Admin subdomain
  if (host === 'admin.utheversity.com' || host.startsWith('admin.') || subQuery === 'admin') {
    return 'admin.html';
  }

  // Direct IP / Localhost / Fallback
  return 'preview-hub.html';
}

// HTTP Server
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      system: 'u-thePOST Multi-Sync Engine',
      version: '2.0.0-ENTERPRISE',
      uptime: process.uptime(),
      activeJobs: globalJobDatabase.length,
      activeApplicants: applicantsStore.length,
      meshConnectedClients: connectedClients.size,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Admin Telemetry & Metrics API
  if (pathname === '/api/admin/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      node: 'u-theADMIN Master Telemetry Core',
      timestamp: new Date().toISOString(),
      metrics: {
        totalJobs: globalJobDatabase.length,
        totalApplicants: applicantsStore.length,
        externalFeeds: openSourceFeeds.length,
        activeWsClients: connectedClients.size,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      roles: {
        recruiter: { host: 'post.utheversity.com', target: 'recruiter.html', status: 'ONLINE' },
        candidate: { host: 'jobs.utheversity.com', target: 'candidate.html', status: 'ONLINE' },
        admin: { host: 'admin.utheversity.com', target: 'admin.html', status: 'ACTIVE CORE' },
        fallback: { host: '*', target: 'preview-hub.html', status: 'STANDBY' }
      }
    }));
    return;
  }

  // Hunter.io Lead Engine API Proxy
  if (pathname === '/api/hunter/domain-search') {
    const payload = handleHunterDomainSearch(parsedUrl.searchParams);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  if (pathname === '/api/hunter/email-verifier') {
    const payload = handleHunterEmailVerify(parsedUrl.searchParams);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  // Open-Source Job Feed Aggregator API
  if (pathname === '/api/jobs/aggregate') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'success',
      count: openSourceFeeds.length,
      feeds: openSourceFeeds,
      ingestedAt: new Date().toISOString()
    }));
    return;
  }

  // REST API: Jobs CRUD
  if (pathname === '/api/jobs' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jobs: globalJobDatabase }));
    return;
  }

  if (pathname === '/api/jobs' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newJob = {
          id: payload.id || `JOB-${Math.floor(100 + Math.random() * 900)}`,
          jobTitle: payload.jobTitle || 'Untitled Position',
          company: payload.company || 'Confidential Company',
          location: payload.location || 'Remote',
          employmentType: payload.employmentType || 'Full-Time',
          payStructure: payload.payStructure || 'Salary Range',
          minCompensation: payload.minCompensation || '0',
          maxCompensation: payload.maxCompensation || '0',
          salary: payload.salary || `$${Number(payload.minCompensation || 0).toLocaleString()} - $${Number(payload.maxCompensation || 0).toLocaleString()}`,
          paidVacation: payload.paidVacation || 'Standard PTO',
          healthCoverage: payload.healthCoverage || 'Medical Included',
          retirement: payload.retirement || '401(k)',
          additionalPerks: payload.additionalPerks || 'Standard Perks',
          applyLinkUrl: payload.applyLinkUrl || 'https://careers.company.com',
          summary: payload.summary || '',
          logo: payload.logo || '',
          createdAt: new Date().toISOString()
        };

        globalJobDatabase.unshift(newJob);
        broadcastWebSocketEvent('JOB_PUBLISHED', { job: newJob, total: globalJobDatabase.length });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'created', job: newJob }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && req.method === 'DELETE') {
    const jobId = pathname.split('/')[3];
    const index = globalJobDatabase.findIndex(j => j.id === jobId);
    if (index !== -1) {
      const removed = globalJobDatabase.splice(index, 1)[0];
      broadcastWebSocketEvent('JOB_DELETED', { jobId: jobId, removed: removed });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'deleted', jobId: jobId }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Job not found' }));
    }
    return;
  }

  // Applicant Submission API
  if (pathname === '/api/applicants' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newApplicant = {
          id: `APP-${Math.floor(700 + Math.random() * 200)}`,
          jobId: payload.jobId || 'JOB-101',
          jobTitle: payload.jobTitle || 'General Position',
          name: payload.name || 'Candidate Applicant',
          email: payload.email || 'candidate@domain.com',
          phone: payload.phone || '+1 (555) 000-0000',
          status: 'Applied',
          score: Math.floor(82 + Math.random() * 16),
          skills: payload.skills || ['JavaScript', 'System Design', 'Communication'],
          resumeSummary: payload.resumeSummary || 'Experienced software professional with passion for distributed engineering.',
          appliedAt: new Date().toISOString(),
          scorecard: {
            technical: 0,
            communication: 0,
            culture: 0,
            notes: 'Pending review',
            decision: 'Pending'
          }
        };

        applicantsStore.unshift(newApplicant);
        broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: newApplicant });

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'submitted', applicant: newApplicant }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  if (pathname === '/api/applicants' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ applicants: applicantsStore }));
    return;
  }

  // Static File Serving with Strict Host-Header Subdomain Resolution
  const targetFileName = resolveTargetFileForHost(req, parsedUrl);
  const filePath = path.join(__dirname, decodeURIComponent(targetFileName));

  // Extension check
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  switch (extname) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`<h1>404 Not Found</h1><p>Resource ${pathname} not found.</p>`);
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// WebSocket Sync Relay Setup
let wss = null;
const connectedClients = new Set();

function initWebSocket() {
  try {
    const wsModule = require('ws');
    const ServerClass = wsModule.WebSocketServer || wsModule.Server;
    wss = new ServerClass({ server });

    wss.on('connection', (ws, req) => {
      connectedClients.add(ws);

      // Send initial state snapshot
      try {
        ws.send(JSON.stringify({
          type: 'INITIAL_STATE',
          jobs: globalJobDatabase,
          applicants: applicantsStore,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {}

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Broadcast to all other clients
          for (const client of connectedClients) {
            if (client !== ws && client.readyState === wsModule.OPEN) {
              try {
                client.send(JSON.stringify(data));
              } catch (e) {}
            }
          }

          // Handle server-side data mutations
          if (data.type === 'SUBMIT_JOB' && data.jobPayload) {
            const p = data.jobPayload;
            const newJob = {
              id: p.id || `JOB-${Math.floor(100 + Math.random() * 900)}`,
              jobTitle: p.jobTitle,
              company: p.company,
              location: p.location,
              employmentType: p.employmentType,
              payStructure: p.payStructure,
              minCompensation: p.minCompensation,
              maxCompensation: p.maxCompensation,
              salary: p.salary || `$${Number(p.minCompensation || 0).toLocaleString()} - $${Number(p.maxCompensation || 0).toLocaleString()}`,
              paidVacation: p.paidVacation,
              healthCoverage: p.healthCoverage,
              retirement: p.retirement,
              additionalPerks: p.additionalPerks,
              applyLinkUrl: p.applyLinkUrl,
              summary: p.summary,
              logo: p.logo,
              createdAt: new Date().toISOString()
            };
            globalJobDatabase.unshift(newJob);
          } else if (data.type === 'DELETE_JOB' && data.jobId) {
            const idx = globalJobDatabase.findIndex(j => j.id === data.jobId);
            if (idx !== -1) globalJobDatabase.splice(idx, 1);
          } else if (data.type === 'APPLY_JOB' && data.applicant) {
            applicantsStore.unshift(data.applicant);
          }
        } catch (e) {}
      });

      ws.on('close', () => {
        connectedClients.delete(ws);
      });

      ws.on('error', () => {
        connectedClients.delete(ws);
      });
    });
  } catch (err) {
    console.log('[WebSocket Bus] ws notice:', err.message);
  }
}

function broadcastWebSocketEvent(type, payload) {
  if (!wss) return;
  const message = JSON.stringify({
    type: type,
    ...payload,
    timestamp: new Date().toISOString()
  });

  connectedClients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      try {
        client.send(message);
      } catch (e) {}
    }
  });
}

// Process error catching to prevent unexpected exits
process.on('uncaughtException', (err) => {
  console.error('[Process Error Caught]', err.message);
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`U-THEPOST & U-THEJOBS ENTERPRISE MULTI-SYNC ENGINE ACTIVE`);
  console.log(`Local HTTP Server: http://localhost:${PORT}`);
  console.log(`WebSocket Sync Mesh: ws://localhost:${PORT}`);
  console.log(`Strict Subdomain Routing:`);
  console.log(`  post.utheversity.com  -> recruiter.html (u-thePOST Standalone)`);
  console.log(`  jobs.utheversity.com  -> candidate.html (u-theJOBS Standalone)`);
  console.log(`  admin.utheversity.com -> admin.html (u-theADMIN Master Suite)`);
  console.log(`  Direct / Fallback     -> preview-hub.html (Staging Workbench)`);
  console.log(`================================================================`);
  initWebSocket();
});
