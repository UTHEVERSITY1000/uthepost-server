const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'utheversity-enterprise-jwt-secret-key-2026-secure';

// ----------------------------------------------------
// NATIVE CRYPTO AUTH ENGINE (Zero-Dependency JWT & Hash)
// ----------------------------------------------------
function hashPassword(password, salt = null) {
  if (!salt) salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHash] = storedHash.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}

function base64UrlEncode(str) {
  return Buffer.from(str).toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString();
}

function generateJwt(payload, expiresInSeconds = 86400 * 7) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = { ...payload, exp, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (e) {
    return null;
  }
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
  }
  return list;
}

function getAuthenticatedUser(req) {
  const cookies = parseCookies(req);
  let token = cookies['uthe_token'];
  if (!token && req.headers.authorization) {
    const authParts = req.headers.authorization.split(' ');
    if (authParts.length === 2 && authParts[0].toLowerCase() === 'bearer') {
      token = authParts[1];
    }
  }

  if (!token) return null;
  const decoded = verifyJwt(token);
  if (!decoded || !decoded.userId) return null;

  return usersDatabase.find(u => u.id === decoded.userId) || null;
}

// ----------------------------------------------------
// IN-MEMORY USER & ACCOUNT DATABASE
// ----------------------------------------------------
const usersDatabase = [
  {
    id: 'USR-001',
    email: 'admin@utheversity.com',
    passwordHash: hashPassword('AdminPass2026!'),
    name: 'Master Administrator',
    role: 'admin',
    company: 'UTHEVERSITY Inc.',
    phone: '+1 (555) 000-0001',
    createdAt: new Date().toISOString()
  },
  {
    id: 'USR-002',
    email: 'recruiter@quantumtech.io',
    passwordHash: hashPassword('Recruiter2026!'),
    name: 'Quantum Hiring Team',
    role: 'recruiter',
    company: 'Quantum Technologies Corp',
    phone: '+1 (555) 019-2831',
    createdAt: new Date().toISOString()
  },
  {
    id: 'USR-003',
    email: 'alex.morgan@candidate.dev',
    passwordHash: hashPassword('Candidate2026!'),
    name: 'Alex Morgan',
    role: 'candidate',
    company: 'Independent Professional',
    phone: '+1 (555) 448-9102',
    createdAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// MASTER CMS CONFIGURATION STORE
// ----------------------------------------------------
let cmsConfig = {
  labels: {
    postTitle: "U-THEPOST",
    jobsTitle: "U-THEJOBS",
    adminTitle: "U-THEADMIN",
    quickSendBtn: "QUICK SEND",
    sendResumeBtn: "SEND RESUME/CV",
    submitInterviewBtn: "SUBMIT INTERVIEW REQUEST",
    submitTooltip: "REMOVE ATS",
    interviewReqTitle: "Interview Request Title",
    interviewReqTooltip: "What do you want the employer to know to advance your resume?",
    interviewReqPlaceholder: "Quick About Me / Why Hire Me..."
  },
  features: {
    omnichannelEnabled: true,
    spotlightPricing: 49,
    starterMonthly: 99,
    growthMonthly: 299,
    enterpriseMonthly: 699,
    channels: {
      linkedin: { name: "LinkedIn InMail", enabled: true, rate: 0.12 },
      gmail: { name: "Direct Cold Email", enabled: true, rate: 0.10 },
      tiktok: { name: "TikTok Spotlight", enabled: true, rate: 0.08 },
      facebook: { name: "Facebook Business", enabled: true, rate: 0.06 },
      instagram: { name: "Instagram Showcase", enabled: true, rate: 0.07 },
      x: { name: "X / Twitter Stream", enabled: true, rate: 0.09 }
    }
  }
};

// ----------------------------------------------------
// IN-MEMORY JOB & APPLICANT STORES
// ----------------------------------------------------
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
    bestTime: 'Afternoon',
    interviewTitle: 'Senior Full-Stack Architect / WebSockets & Streaming',
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
    bestTime: 'Morning',
    interviewTitle: 'High-Availability Microservices Lead',
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
    bestTime: 'Anytime',
    interviewTitle: 'Executive Engineering Leadership',
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

  // 1. Explicit clean route aliases or direct filenames
  if (cleanPath === '/recruiter' || cleanPath === '/recruiter.html' || cleanPath === '/post' || cleanPath === '/u-thepost-enterprise-edition.html' || cleanPath === '/u-thepost-dual link to u-thejobs.html' || cleanPath === '/u-thepost-dual link & mobile.html') {
    return 'recruiter.html';
  }
  if (cleanPath === '/candidate' || cleanPath === '/candidate.html' || cleanPath === '/jobs' || cleanPath === '/u-thejobs-enterprise-sync.html' || cleanPath === '/u-thejobs-dual link to u-thepost.html') {
    return 'candidate.html';
  }
  if (cleanPath === '/admin' || cleanPath === '/admin.html' || cleanPath === '/u-theadmin-master-suite.html') {
    return 'admin.html';
  }
  if (cleanPath === '/preview' || cleanPath === '/preview-hub.html' || cleanPath === '/hub') {
    return 'preview-hub.html';
  }

  // Static assets on disk
  if (cleanPath !== '' && cleanPath !== '/' && cleanPath !== '/index.html') {
    const rawFile = pathname.replace(/^\//, '');
    const candidatePath = path.join(__dirname, decodeURIComponent(rawFile));
    if (fs.existsSync(candidatePath) && !fs.statSync(candidatePath).isDirectory()) {
      return rawFile;
    }
  }

  // 2. Strict Subdomain Host Resolution
  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const firstHost = rawHost.split(',')[0].trim().toLowerCase();
  const host = firstHost.split(':')[0].trim();

  const subQuery = (parsedUrl.searchParams.get('subdomain') || parsedUrl.searchParams.get('role') || '').toLowerCase().trim();

  // Post / Recruiter -> Serves ONLY recruiter.html
  if (host === 'post.utheversity.com' || host.startsWith('post.') || host.includes('recruiter.') || subQuery === 'post' || subQuery === 'recruiter') {
    return 'recruiter.html';
  }

  // Jobs / Candidate -> Serves ONLY candidate.html
  if (host === 'jobs.utheversity.com' || host.startsWith('jobs.') || host.includes('candidate.') || subQuery === 'jobs' || subQuery === 'candidate') {
    return 'candidate.html';
  }

  // Admin -> Serves ONLY admin.html
  if (host === 'admin.utheversity.com' || host.startsWith('admin.') || subQuery === 'admin') {
    return 'admin.html';
  }

  // Direct IP / Localhost / Fallback -> Serves preview-hub.html
  return 'preview-hub.html';
}

// ----------------------------------------------------
// HTTP SERVER & ROUTING ENGINE
// ----------------------------------------------------
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

  // Helper JSON response
  function sendJson(status, data, extraHeaders = {}) {
    res.writeHead(status, { 'Content-Type': 'application/json', ...extraHeaders });
    res.end(JSON.stringify(data));
  }

  function readBody(callback) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        callback(null, parsed);
      } catch (err) {
        callback(err);
      }
    });
  }

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES
  // ----------------------------------------------------
  if (pathname === '/api/auth/signup' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const { email, password, name, role, company } = body;
      if (!email || !password) return sendJson(400, { error: 'Email and password required' });

      const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) return sendJson(409, { error: 'Email already registered' });

      const newUser = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        name: name || email.split('@')[0],
        role: role || 'candidate',
        company: company || '',
        phone: '',
        createdAt: new Date().toISOString()
      };

      usersDatabase.push(newUser);
      const token = generateJwt({ userId: newUser.id, role: newUser.role, email: newUser.email });

      const safeUser = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, company: newUser.company };
      const cookieHeader = `uthe_token=${token}; Domain=.utheversity.com; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

      sendJson(201, { status: 'created', user: safeUser, token }, { 'Set-Cookie': cookieHeader });
    });
    return;
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const { email, password } = body;
      if (!email || !password) return sendJson(400, { error: 'Email and password required' });

      const user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return sendJson(401, { error: 'Invalid email or password' });
      }

      const token = generateJwt({ userId: user.id, role: user.role, email: user.email });
      const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company };
      const cookieHeader = `uthe_token=${token}; Domain=.utheversity.com; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

      sendJson(200, { status: 'authenticated', user: safeUser, token }, { 'Set-Cookie': cookieHeader });
    });
    return;
  }

  if (pathname === '/api/auth/logout' && req.method === 'POST') {
    const cookieHeader = `uthe_token=; Domain=.utheversity.com; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
    sendJson(200, { status: 'logged_out' }, { 'Set-Cookie': cookieHeader });
    return;
  }

  if (pathname === '/api/auth/me' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(200, { authenticated: false, user: null });
    }
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company, phone: user.phone };
    sendJson(200, { authenticated: true, user: safeUser });
    return;
  }

  if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const { email, newPassword } = body;
      const user = usersDatabase.find(u => u.email.toLowerCase() === (email || '').toLowerCase().trim());
      if (!user) return sendJson(404, { error: 'User not found' });

      user.passwordHash = hashPassword(newPassword || 'NewSecurePass2026!');
      sendJson(200, { status: 'password_reset', email: user.email });
    });
    return;
  }

  // ----------------------------------------------------
  // CMS OVERRIDE & MASTER CONFIGURATION ROUTES
  // ----------------------------------------------------
  if (pathname === '/api/cms/config' && req.method === 'GET') {
    sendJson(200, { status: 'success', config: cmsConfig });
    return;
  }

  if (pathname === '/api/cms/config' && (req.method === 'POST' || req.method === 'PUT')) {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      if (body.labels) cmsConfig.labels = { ...cmsConfig.labels, ...body.labels };
      if (body.features) cmsConfig.features = { ...cmsConfig.features, ...body.features };

      broadcastWebSocketEvent('CMS_CONFIG_UPDATED', { config: cmsConfig });
      sendJson(200, { status: 'updated', config: cmsConfig });
    });
    return;
  }

  // ----------------------------------------------------
  // ADMIN USER CRUD ROUTES
  // ----------------------------------------------------
  if (pathname === '/api/admin/users' && req.method === 'GET') {
    const safeUsers = usersDatabase.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      company: u.company,
      phone: u.phone,
      createdAt: u.createdAt
    }));
    sendJson(200, { users: safeUsers, count: safeUsers.length });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && req.method === 'DELETE') {
    const uid = pathname.split('/')[4];
    const idx = usersDatabase.findIndex(u => u.id === uid);
    if (idx !== -1) {
      usersDatabase.splice(idx, 1);
      sendJson(200, { status: 'deleted', userId: uid });
    } else {
      sendJson(404, { error: 'User not found' });
    }
    return;
  }

  // ----------------------------------------------------
  // SYSTEM HEALTH & ADMIN TELEMETRY
  // ----------------------------------------------------
  if (pathname === '/api/health') {
    sendJson(200, {
      status: 'healthy',
      system: 'u-thePOST Multi-Sync Engine',
      version: '2.0.0-ENTERPRISE',
      uptime: process.uptime(),
      activeJobs: globalJobDatabase.length,
      activeApplicants: applicantsStore.length,
      activeUsers: usersDatabase.length,
      meshConnectedClients: connectedClients.size,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/admin/stats') {
    sendJson(200, {
      status: 'success',
      node: 'u-theADMIN Master Telemetry Core',
      timestamp: new Date().toISOString(),
      metrics: {
        totalJobs: globalJobDatabase.length,
        totalApplicants: applicantsStore.length,
        totalUsers: usersDatabase.length,
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
    });
    return;
  }

  if (pathname === '/api/hunter/domain-search') {
    const payload = handleHunterDomainSearch(parsedUrl.searchParams);
    sendJson(200, payload);
    return;
  }

  if (pathname === '/api/hunter/email-verifier') {
    const payload = handleHunterEmailVerify(parsedUrl.searchParams);
    sendJson(200, payload);
    return;
  }

  if (pathname === '/api/jobs/aggregate') {
    sendJson(200, {
      status: 'success',
      count: openSourceFeeds.length,
      feeds: openSourceFeeds,
      ingestedAt: new Date().toISOString()
    });
    return;
  }

  // ----------------------------------------------------
  // JOBS CRUD & INSTANT REAL-TIME BROADCAST
  // ----------------------------------------------------
  if (pathname === '/api/jobs' && req.method === 'GET') {
    sendJson(200, { jobs: globalJobDatabase });
    return;
  }

  if (pathname === '/api/jobs' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
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
      sendJson(201, { status: 'created', job: newJob });
    });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && req.method === 'DELETE') {
    const jobId = pathname.split('/')[3];
    const index = globalJobDatabase.findIndex(j => j.id === jobId);
    if (index !== -1) {
      const removed = globalJobDatabase.splice(index, 1)[0];
      broadcastWebSocketEvent('JOB_DELETED', { jobId: jobId, removed });
      sendJson(200, { status: 'deleted', jobId });
    } else {
      sendJson(404, { error: 'Job not found' });
    }
    return;
  }

  // ----------------------------------------------------
  // APPLICANTS & QUICK SEND INGESTION
  // ----------------------------------------------------
  if (pathname === '/api/applicants' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      const newApplicant = {
        id: payload.id || `APP-${Math.floor(700 + Math.random() * 200)}`,
        jobId: payload.jobId || 'JOB-101',
        jobTitle: payload.jobTitle || 'General Position',
        name: payload.name || 'Candidate Applicant',
        email: payload.email || 'candidate@domain.com',
        phone: payload.phone || '+1 (555) 000-0000',
        bestTime: payload.bestTime || 'Anytime',
        interviewTitle: payload.interviewTitle || payload.jobTitle || 'General Application',
        resumeFile: payload.resumeFile || 'resume.pdf',
        status: payload.status || 'Applied',
        score: payload.score || Math.floor(84 + Math.random() * 14),
        skills: payload.skills || ['JavaScript', 'System Design', 'Communication'],
        resumeSummary: payload.resumeSummary || 'Candidate interview request.',
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
      sendJson(201, { status: 'submitted', applicant: newApplicant });
    });
    return;
  }

  if (pathname === '/api/applicants' && req.method === 'GET') {
    sendJson(200, { applicants: applicantsStore });
    return;
  }

  // ----------------------------------------------------
  // STATIC FILE SERVING & SUBDOMAIN ROUTING
  // ----------------------------------------------------
  const targetFileName = resolveTargetFileForHost(req, parsedUrl);
  const filePath = path.join(__dirname, decodeURIComponent(targetFileName));

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

// ----------------------------------------------------
// WEBSOCKET MULTI-SYNC ENGINE & AUTO-HEARTBEAT
// ----------------------------------------------------
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
          cmsConfig: cmsConfig,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {}

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());

          // Broadcast to all other connected clients immediately
          for (const client of connectedClients) {
            if (client !== ws && client.readyState === wsModule.OPEN) {
              try { client.send(JSON.stringify(data)); } catch (e) {}
            }
          }

          // Handle server mutations
          if ((data.type === 'SUBMIT_JOB' || data.type === 'JOB_PUBLISHED') && (data.jobPayload || data.job)) {
            const p = data.jobPayload || data.job;
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
            if (!globalJobDatabase.some(j => j.id === newJob.id)) {
              globalJobDatabase.unshift(newJob);
            }
            broadcastWebSocketEvent('JOB_PUBLISHED', { job: newJob, total: globalJobDatabase.length });
          } else if (data.type === 'DELETE_JOB' && data.jobId) {
            const idx = globalJobDatabase.findIndex(j => j.id === data.jobId);
            if (idx !== -1) globalJobDatabase.splice(idx, 1);
          } else if (data.type === 'APPLY_JOB' && data.applicant) {
            applicantsStore.unshift(data.applicant);
            broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: data.applicant });
          }
        } catch (e) {}
      });

      ws.on('close', () => { connectedClients.delete(ws); });
      ws.on('error', () => { connectedClients.delete(ws); });
    });

    // 25-second heartbeat
    setInterval(() => {
      connectedClients.forEach(client => {
        if (client.readyState === 1) {
          try { client.send(JSON.stringify({ type: 'HEARTBEAT', timestamp: Date.now() })); } catch (e) {}
        }
      });
    }, 25000);

  } catch (err) {
    console.log('[WebSocket Bus] notice:', err.message);
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
    if (client.readyState === 1) {
      try { client.send(message); } catch (e) {}
    }
  });
}

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
