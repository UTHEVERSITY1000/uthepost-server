const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'utheversity-professional-jwt-secret-key-2026-secure';

// ----------------------------------------------------
// NATIVE CRYPTO AUTH TOOL (Zero-Dependency JWT & Hash)
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
      return null;
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
// Pre-configured Master Owner: Zion Daye
// ----------------------------------------------------
const usersDatabase = [
  {
    id: 'USR-ZION-001',
    email: 'contact@utheversity.com',
    passwordHash: hashPassword('ZionAdmin2026!'),
    name: 'Zion Daye',
    role: 'admin',
    company: 'UTHEVERSITY Global Inc.',
    phone: '815-980-4272',
    bio: 'Platform Founder & Master System Administrator.',
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'USR-002',
    email: 'recruiter@quantumtech.io',
    passwordHash: hashPassword('Recruiter2026!'),
    name: 'Quantum Talent Team',
    role: 'recruiter',
    company: 'Quantum Technologies Corp',
    phone: '+1 (555) 019-2831',
    bio: 'High-growth technology hiring team.',
    approved: true,
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
    bio: 'Senior Full-Stack Architect with 8+ years experience.',
    approved: true,
    createdAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// MASTER ZERO-CODE CMS CONFIGURATION STORE
// ----------------------------------------------------
let cmsConfig = {
  postStudio: {
    card1Title: "CARD 1: EMPLOYER JOB LISTING & CONNECTED ACCOUNTS",
    jobTitleLabel: "Job Title",
    companyNameLabel: "Company / Organization Name",
    locationLabel: "Location (e.g. Austin, TX or Remote)",
    employmentOptions: "Full-Time, Contract, Part-Time, Temporary",
    salaryLabel: "Estimated Compensation / Salary Range",
    emailFieldLabel: "Employer Contact Email",
    phoneFieldLabel: "Employer Phone Number",
    socialHeader: "Link Social Media Accounts",
    socialInstructions: "Connect your social accounts once. When you publish a position, it automatically formats and broadcasts across your linked networks in one click.",
    linkedinPlaceholder: "LinkedIn Page URL...",
    xPlaceholder: "X Profile URL...",
    tiktokPlaceholder: "TikTok Handle URL...",
    facebookPlaceholder: "Facebook Business Page URL...",
    instagramPlaceholder: "Instagram Profile URL...",
    card2Title: "CARD 2: LIVE JOB CARD PREVIEW",
    previewBadge: "LIVE PREVIEW",
    benefitSummaryLabel: "Selected Compensation & Benefits",
    primaryActionBtn: "QUICK SEND / APPLY NOW",
    card3Title: "CARD 3: LIVE ACTIVE JOB LISTINGS",
    colJobId: "Job ID",
    colTitle: "Position Title",
    colCompany: "Company",
    colLocation: "Location",
    colSalary: "Compensation",
    colStatus: "Status",
    btnEditJob: "EDIT",
    btnPauseJob: "PAUSE",
    btnDeleteJob: "DELETE",
    publishHeader: "PUBLISHING & DISTRIBUTION SETTINGS",
    perksLabel: "Perks & Executive Benefits Summary",
    seniorityOptions: "Entry-Level, Mid-Level, Senior, Executive",
    distributionTitle: "Multi-Platform Distribution Channels",
    publishBtnText: "PUBLISH & BROADCAST POSITION"
  },
  jobsBoard: {
    boardTitle: "U-THEJOBS",
    searchPlaceholder: "Search positions, verified companies, locations, or skills...",
    commitmentOptions: "All Commitments, Full-Time, Contract, Part-Time",
    locationOptions: "All Locations, Remote Only, Hybrid, On-Site",
    quickSendBtn: "QUICK SEND",
    sendResumeBtn: "SEND RESUME/CV",
    salaryBadgeLabel: "COMPENSATION",
    locationBadgeLabel: "LOCATION",
    modalHeader: "UPLOAD RESUME AND COVER LETTER",
    resumeUploadLabel: "Choose Resume (.pdf only)",
    contactTimeOptions: "Morning, Afternoon, Evening, Anytime",
    interviewReqTitle: "Interview Request Title",
    interviewReqTooltip: "What do you want the employer to know to advance your resume?",
    interviewReqPlaceholder: "Quick About Me / Why Hire Me...",
    submitBtnText: "SUBMIT INTERVIEW REQUEST",
    submitTooltip: "DOUBLE CHECK CONTACT INFO ON RESUME",
    messageDrawerHeader: "DIRECT RECRUITER MESSAGES",
    quickReplies: "1. I'M INTERESTED — LET'S TALK | 2. ACCEPTED INTERVIEW TIME | 3. PLEASE SEND MORE DETAILS",
    profileTabName: "MY PROFILE"
  },
  labels: {
    postTitle: "U-THEPOST",
    jobsTitle: "U-THEJOBS",
    adminTitle: "U-THEADMIN",
    quickSendBtn: "QUICK SEND",
    sendResumeBtn: "SEND RESUME/CV",
    submitInterviewBtn: "SUBMIT INTERVIEW REQUEST",
    submitTooltip: "DOUBLE CHECK CONTACT INFO ON RESUME",
    palTierName: "u-thePAL",
    palTierDesc: "Free member tier allowing 1 active posting distributed through Email Only."
  },
  pricing: {
    palMonthly: 0,
    starterMonthly: 99,
    growthMonthly: 299,
    proMonthly: 699,
    yearlyDiscountPct: 20,
    individualSocialAddon: 5.99,
    socialBundleAddon: 19.99
  },
  addOns: {
    topSpotlight: 49,
    urgentBadge: 29,
    directMessages: 19,
    verifiedEmployer: 39,
    individualSocial: 5.99,
    socialBundle5: 19.99
  },
  channels: {
    linkedin: { name: "LinkedIn InMail & Posts", enabled: true },
    email: { name: "Direct Cold Email", enabled: true },
    tiktok: { name: "TikTok Video Spotlight", enabled: true },
    x: { name: "X / Twitter Executive Stream", enabled: true },
    facebook: { name: "Facebook Business Network", enabled: true },
    instagram: { name: "Instagram Stories Showcase", enabled: true }
  }
};

const CMS_FILE = path.join(__dirname, 'cms_config.json');

function loadCmsConfig() {
  try {
    if (fs.existsSync(CMS_FILE)) {
      const data = fs.readFileSync(CMS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed) {
        if (parsed.postStudio) cmsConfig.postStudio = { ...cmsConfig.postStudio, ...parsed.postStudio };
        if (parsed.jobsBoard) cmsConfig.jobsBoard = { ...cmsConfig.jobsBoard, ...parsed.jobsBoard };
        if (parsed.labels) cmsConfig.labels = { ...cmsConfig.labels, ...parsed.labels };
        if (parsed.pricing) cmsConfig.pricing = { ...cmsConfig.pricing, ...parsed.pricing };
        if (parsed.addOns) cmsConfig.addOns = { ...cmsConfig.addOns, ...parsed.addOns };
        if (parsed.channels) cmsConfig.channels = { ...cmsConfig.channels, ...parsed.channels };
        console.log('[CMS STORAGE] Successfully loaded cms_config.json from disk.');
      }
    } else {
      saveCmsConfig();
    }
  } catch (err) {
    console.error('[CMS STORAGE] Error loading cms_config.json:', err.message);
  }
}

function saveCmsConfig() {
  try {
    fs.writeFileSync(CMS_FILE, JSON.stringify(cmsConfig, null, 2), 'utf8');
    console.log('[CMS STORAGE] Saved cms_config.json to disk.');
  } catch (err) {
    console.error('[CMS STORAGE] Error saving cms_config.json:', err.message);
  }
}

// Auto-load persistent CMS config on server startup
loadCmsConfig();

// ----------------------------------------------------
// IN-MEMORY JOB CATALOG & APPLICANTS DATABASE
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
    summary: 'Lead our next-generation live multi-agent sync tool and professional web infrastructure. Modern TypeScript, high-performance UI.',
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
    summary: 'Lead an engineering organization of 45+ distributed developers building high-throughput data systems and cloud infrastructure.',
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
    summary: 'Design and deploy cognitive architectures and autonomous reasoning pipelines for professional customers.',
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
    interviewTitle: 'Senior Full-Stack Architect / Real-Time Systems Specialist',
    status: 'Screened',
    score: 94,
    skills: ['TypeScript', 'Node.js', 'React', 'Live Sync', 'PostgreSQL'],
    resumeSummary: '8+ years full stack architect specialized in reactive client-side state tools and distributed systems.',
    appliedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    scorecard: {
      technical: 5,
      communication: 4,
      culture: 5,
      notes: 'Exceptional architectural grasp. Built similar live synchronization systems in previous company.',
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
    resumeSummary: '6 years scaling high-availability microservices and real-time streaming protocols.',
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

// In-Memory Message Store for Two-Way Recruiter <-> Candidate Communication
const globalMessageStore = [
  {
    id: 'MSG-101',
    applicantId: 'APP-701',
    senderRole: 'recruiter',
    senderName: 'Quantum Talent Acquisition',
    company: 'Quantum Retail Corp',
    jobTitle: 'Sales Manager',
    text: 'Hello Marcus! We reviewed your profile and verified resume for the Sales Manager role. We would love to schedule a 30-minute introductory call this week.',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

// Hunter.io Lead Search Simulation
function handleHunterDomainSearch(params) {
  const domain = (params.get('domain') || 'stripe.com').toLowerCase().trim();
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
    }
  ];

  return {
    data: {
      domain: domain,
      organization: companyName,
      emails: leads
    }
  };
}

// Strict Host-Header Subdomain Resolver
function resolveTargetFileForHost(req, parsedUrl) {
  const pathname = parsedUrl.pathname;
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '');

  // 1. Route aliases
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

  // Static files on disk
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
      const { email, password, name, role, company, phone } = body;
      if (!email || !password) return sendJson(400, { error: 'Email and password required' });
      if (password.length < 8) return sendJson(400, { error: 'Password must be at least 8 characters long' });

      const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) return sendJson(409, { error: 'Email already registered' });

      const newUser = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        name: name || email.split('@')[0],
        role: role || 'candidate',
        company: company || '',
        phone: phone || '',
        bio: '',
        approved: true,
        createdAt: new Date().toISOString()
      };

      usersDatabase.push(newUser);
      const token = generateJwt({ userId: newUser.id, role: newUser.role, email: newUser.email });
      const safeUser = { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role, company: newUser.company, phone: newUser.phone, bio: newUser.bio };
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
      const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company, phone: user.phone, bio: user.bio };
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
    const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company, phone: user.phone, bio: user.bio };
    sendJson(200, { authenticated: true, user: safeUser });
    return;
  }

  if (pathname === '/api/auth/profile' && req.method === 'PUT') {
    const user = getAuthenticatedUser(req);
    if (!user) return sendJson(401, { error: 'Unauthorized' });

    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      if (body.name) user.name = body.name;
      if (body.company) user.company = body.company;
      if (body.phone) user.phone = body.phone;
      if (body.bio) user.bio = body.bio;

      const safeUser = { id: user.id, email: user.email, name: user.name, role: user.role, company: user.company, phone: user.phone, bio: user.bio };
      sendJson(200, { status: 'updated', user: safeUser });
    });
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
  // SMART OMNI-SEARCH FOR MASTER ADMIN
  // ----------------------------------------------------
  if (pathname === '/api/admin/search' && req.method === 'GET') {
    const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
    if (!q) {
      return sendJson(200, { results: { users: usersDatabase, jobs: globalJobDatabase, applicants: applicantsStore } });
    }

    const matchedUsers = usersDatabase.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.company || '').toLowerCase().includes(q)
    );

    const matchedJobs = globalJobDatabase.filter(j =>
      (j.jobTitle || '').toLowerCase().includes(q) ||
      (j.company || '').toLowerCase().includes(q) ||
      (j.id || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );

    const matchedApplicants = applicantsStore.filter(a =>
      (a.name || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.phone || '').toLowerCase().includes(q) ||
      (a.id || '').toLowerCase().includes(q) ||
      (a.jobTitle || '').toLowerCase().includes(q)
    );

    sendJson(200, {
      query: q,
      results: {
        users: matchedUsers,
        jobs: matchedJobs,
        applicants: matchedApplicants
      }
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
      if (body.postStudio) cmsConfig.postStudio = { ...cmsConfig.postStudio, ...body.postStudio };
      if (body.jobsBoard) cmsConfig.jobsBoard = { ...cmsConfig.jobsBoard, ...body.jobsBoard };
      if (body.labels) cmsConfig.labels = { ...cmsConfig.labels, ...body.labels };
      if (body.pricing) cmsConfig.pricing = { ...cmsConfig.pricing, ...body.pricing };
      if (body.addOns) cmsConfig.addOns = { ...cmsConfig.addOns, ...body.addOns };
      if (body.channels) cmsConfig.channels = { ...cmsConfig.channels, ...body.channels };

      saveCmsConfig();
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
      bio: u.bio,
      approved: u.approved !== false,
      createdAt: u.createdAt
    }));
    sendJson(200, { users: safeUsers, count: safeUsers.length });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-password') && req.method === 'POST') {
    const uid = pathname.split('/')[4];
    const user = usersDatabase.find(u => u.id === uid);
    if (!user) return sendJson(404, { error: 'User not found' });
    const tempPass = `Reset${Math.floor(1000 + Math.random() * 9000)}!`;
    user.passwordHash = hashPassword(tempPass);
    sendJson(200, { status: 'reset', tempPassword: tempPass, message: `Password for ${user.email} reset successfully.` });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && (req.method === 'PUT' || req.method === 'POST')) {
    const uid = pathname.split('/')[4];
    const user = usersDatabase.find(u => u.id === uid);
    if (!user) return sendJson(404, { error: 'User not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      if (body.role) user.role = body.role;
      if (body.approved !== undefined) user.approved = Boolean(body.approved);
      if (body.name) user.name = body.name;
      if (body.phone) user.phone = body.phone;
      broadcastWebSocketEvent('USER_UPDATED', { user: { id: user.id, role: user.role, approved: user.approved } });
      sendJson(200, { status: 'updated', user });
    });
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

  if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/feature') && req.method === 'PUT') {
    const jobId = pathname.split('/')[3];
    const job = globalJobDatabase.find(j => j.id === jobId);
    if (!job) return sendJson(404, { error: 'Job not found' });
    job.featured = !job.featured;
    broadcastWebSocketEvent('JOB_FEATURED_UPDATED', { jobId, featured: job.featured });
    sendJson(200, { status: 'updated', job });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/status') && req.method === 'PUT') {
    const jobId = pathname.split('/')[3];
    const job = globalJobDatabase.find(j => j.id === jobId);
    if (!job) return sendJson(404, { error: 'Job not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      job.status = body.status || 'Active';
      broadcastWebSocketEvent('JOB_STATUS_UPDATED', { jobId, status: job.status });
      sendJson(200, { status: 'updated', job });
    });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && req.method === 'PUT') {
    const jobId = pathname.split('/')[3];
    const job = globalJobDatabase.find(j => j.id === jobId);
    if (!job) return sendJson(404, { error: 'Job not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      Object.assign(job, body);
      broadcastWebSocketEvent('JOB_UPDATED', { job });
      sendJson(200, { status: 'updated', job });
    });
    return;
  }

  if (pathname.startsWith('/api/applicants/') && pathname.endsWith('/status') && req.method === 'PUT') {
    const appId = pathname.split('/')[3];
    const app = applicantsStore.find(a => a.id === appId);
    if (!app) return sendJson(404, { error: 'Applicant not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      app.status = body.status || app.status;
      broadcastWebSocketEvent('APPLICANT_STAGE_UPDATED', { applicantId: appId, status: app.status });
      sendJson(200, { status: 'updated', applicant: app });
    });
    return;
  }

  if (pathname.startsWith('/api/applicants/') && req.method === 'DELETE') {
    const appId = pathname.split('/')[3];
    const idx = applicantsStore.findIndex(a => a.id === appId);
    if (idx !== -1) {
      applicantsStore.splice(idx, 1);
      sendJson(200, { status: 'deleted', applicantId: appId });
    } else {
      sendJson(404, { error: 'Applicant not found' });
    }
    return;
  }

  // ----------------------------------------------------
  // SYSTEM HEALTH & ADMIN TELEMETRY
  // ----------------------------------------------------
  if (pathname === '/api/health') {
    sendJson(200, {
      status: 'healthy',
      system: 'u-thePOST Multi-Node Live Sync Studio',
      version: '2.0.0-PROFESSIONAL',
      uptime: process.uptime(),
      activeJobs: globalJobDatabase.length,
      activeApplicants: applicantsStore.length,
      activeUsers: usersDatabase.length,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/admin/stats') {
    sendJson(200, {
      status: 'success',
      owner: 'Zion Daye',
      timestamp: new Date().toISOString(),
      metrics: {
        totalJobs: globalJobDatabase.length,
        totalApplicants: applicantsStore.length,
        totalUsers: usersDatabase.length,
        activeWsClients: connectedClients.size,
        uptimeSeconds: Math.floor(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      }
    });
    return;
  }

  if (pathname === '/api/hunter/domain-search') {
    const payload = handleHunterDomainSearch(parsedUrl.searchParams);
    sendJson(200, payload);
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
        recruiterEmail: payload.recruiterEmail || '',
        socialChannels: payload.socialChannels || {},
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
        appliedAt: new Date().toISOString()
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
  // TWO-WAY CANDIDATE & RECRUITER MESSAGING
  // ----------------------------------------------------
  if (pathname === '/api/messages' && req.method === 'GET') {
    const applicantId = parsedUrl.searchParams ? parsedUrl.searchParams.get('applicantId') : null;
    if (applicantId) {
      const filtered = globalMessageStore.filter(m => m.applicantId === applicantId);
      sendJson(200, { messages: filtered });
    } else {
      sendJson(200, { messages: globalMessageStore });
    }
    return;
  }

  if (pathname === '/api/messages' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      const newMsg = {
        id: payload.id || `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        applicantId: payload.applicantId || 'APP-701',
        senderRole: payload.senderRole || 'candidate', // 'candidate' | 'recruiter'
        senderName: payload.senderName || (payload.senderRole === 'recruiter' ? 'Quantum Talent Acquisition' : 'Marcus Vance'),
        company: payload.company || 'Quantum Retail Corp',
        jobTitle: payload.jobTitle || 'Sales Manager',
        text: payload.text || '',
        timestamp: new Date().toISOString()
      };

      globalMessageStore.push(newMsg);

      if (newMsg.senderRole === 'recruiter') {
        broadcastWebSocketEvent('RECRUITER_MESSAGE_SENT', { message: newMsg });
      } else {
        broadcastWebSocketEvent('CANDIDATE_MESSAGE_SENT', { message: newMsg });
      }

      sendJson(201, { status: 'sent', message: newMsg });
    });
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
// LIVE SYNC RELAY & AUTO-HEARTBEAT
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
          } else if (data.type === 'CANDIDATE_APPLIED' && data.applicant) {
            applicantsStore.unshift(data.applicant);
            broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: data.applicant });
          }

          if ((data.type === 'CANDIDATE_MESSAGE_SENT' || data.type === 'RECRUITER_MESSAGE_SENT') && data.message) {
            const exists = globalMessageStore.some(m => m.id === data.message.id);
            if (!exists) globalMessageStore.push(data.message);
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
    console.log('[Live Sync Bus] notice:', err.message);
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
  console.log(`UTHEVERSITY LIVE SYNC RECRUITMENT STUDIO ACTIVE`);
  console.log(`Local HTTP Server: http://localhost:${PORT}`);
  console.log(`Live Sync WebSocket: ws://localhost:${PORT}`);
  console.log(`Strict Subdomain Routing:`);
  console.log(`  post.utheversity.com  -> recruiter.html (u-thePOST Recruiter Studio)`);
  console.log(`  jobs.utheversity.com  -> candidate.html (u-theJOBS Candidate Board)`);
  console.log(`  admin.utheversity.com -> admin.html (u-theADMIN Master Suite - Zion Daye)`);
  console.log(`================================================================`);
  initWebSocket();
});
