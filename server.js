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

// ----------------------------------------------------
// STRICT DATA STORAGE & AUTOMATIC INDEXING SYSTEM
// Subfolders: /data/employers/, /data/candidates/, /data/resumes/,
// /data/listings/, /data/applications/, /data/messages/, /data/logs/,
// and /data/cms_config.json
// ----------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
const DIRS = {
  data: DATA_DIR,
  employers: path.join(DATA_DIR, 'employers'),
  candidates: path.join(DATA_DIR, 'candidates'),
  resumes: path.join(DATA_DIR, 'resumes'),
  listings: path.join(DATA_DIR, 'listings'),
  applications: path.join(DATA_DIR, 'applications'),
  messages: path.join(DATA_DIR, 'messages'),
  logs: path.join(DATA_DIR, 'logs'),
  cmsConfig: path.join(DATA_DIR, 'cms_config.json')
};

const ROOT_CMS_FILE = path.join(__dirname, 'cms_config.json');

function initDataDirectories() {
  const folders = [
    DIRS.data,
    DIRS.employers,
    DIRS.candidates,
    DIRS.resumes,
    DIRS.listings,
    DIRS.applications,
    DIRS.messages,
    DIRS.logs
  ];
  folders.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[DATA STORAGE] Initialized directory: ${dir}`);
    }
  });
}

function writeSystemLog(eventType, details = {}) {
  try {
    initDataDirectories();
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      eventType,
      details
    };
    const logFile = path.join(DIRS.logs, 'log_system.json');
    let logs = [];
    if (fs.existsSync(logFile)) {
      try {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        if (!Array.isArray(logs)) logs = [];
      } catch (e) {
        logs = [];
      }
    }
    logs.unshift(logEntry);
    if (logs.length > 500) logs = logs.slice(0, 500);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('[LOG STORAGE ERROR]', err.message);
  }
}

// 1. Employer Indexing: emp_<id>.json in /data/employers/
function saveEmployerRecord(user) {
  try {
    initDataDirectories();
    const safeId = String(user.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.employers, `emp_${safeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(user, null, 2), 'utf8');
  } catch (e) {
    console.error('[STORAGE ERROR] Failed saving employer:', e.message);
  }
}

function deleteEmployerRecord(userId) {
  try {
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.employers, `emp_${safeId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {}
}

// 2. Candidate Indexing: cand_<id>.json in /data/candidates/
function saveCandidateRecord(user) {
  try {
    initDataDirectories();
    const safeId = String(user.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.candidates, `cand_${safeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(user, null, 2), 'utf8');
  } catch (e) {
    console.error('[STORAGE ERROR] Failed saving candidate:', e.message);
  }
}

function deleteCandidateRecord(userId) {
  try {
    const safeId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.candidates, `cand_${safeId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {}
}

// 3. Listings (Jobs) Indexing: job_<id>.json in /data/listings/
function saveJobRecord(job) {
  try {
    initDataDirectories();
    const safeId = String(job.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.listings, `job_${safeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(job, null, 2), 'utf8');
  } catch (e) {
    console.error('[STORAGE ERROR] Failed saving job listing:', e.message);
  }
}

function deleteJobRecord(jobId) {
  try {
    const safeId = String(jobId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.listings, `job_${safeId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {}
}

// 4. Applications Indexing: app_<id>.json in /data/applications/
function saveApplicantRecord(applicant) {
  try {
    initDataDirectories();
    const safeId = String(applicant.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.applications, `app_${safeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(applicant, null, 2), 'utf8');
  } catch (e) {
    console.error('[STORAGE ERROR] Failed saving applicant:', e.message);
  }
}

function deleteApplicantRecord(applicantId) {
  try {
    const safeId = String(applicantId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.applications, `app_${safeId}.json`);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (e) {}
}

// 5. Messages Indexing: thread_<id>.json in /data/messages/
function saveMessageRecord(msg) {
  try {
    initDataDirectories();
    const safeId = String(msg.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(DIRS.messages, `thread_${safeId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(msg, null, 2), 'utf8');
  } catch (e) {
    console.error('[STORAGE ERROR] Failed saving message thread:', e.message);
  }
}

// 6. CMS Config: /data/cms_config.json & cms_config.json
function saveCmsConfig() {
  try {
    initDataDirectories();
    const content = JSON.stringify(cmsConfig, null, 2);
    fs.writeFileSync(DIRS.cmsConfig, content, 'utf8');
    fs.writeFileSync(ROOT_CMS_FILE, content, 'utf8');
    console.log('[CMS STORAGE] Synchronously saved /data/cms_config.json & root cms_config.json.');
  } catch (err) {
    console.error('[CMS STORAGE] Error saving cms_config.json:', err.message);
  }
}

function loadCmsConfig() {
  try {
    let raw = null;
    if (fs.existsSync(DIRS.cmsConfig)) {
      raw = fs.readFileSync(DIRS.cmsConfig, 'utf8');
    } else if (fs.existsSync(ROOT_CMS_FILE)) {
      raw = fs.readFileSync(ROOT_CMS_FILE, 'utf8');
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (parsed.postStudio) cmsConfig.postStudio = { ...cmsConfig.postStudio, ...parsed.postStudio };
        if (parsed.jobsBoard) cmsConfig.jobsBoard = { ...cmsConfig.jobsBoard, ...parsed.jobsBoard };
        if (parsed.labels) cmsConfig.labels = { ...cmsConfig.labels, ...parsed.labels };
        if (parsed.pricing) cmsConfig.pricing = { ...cmsConfig.pricing, ...parsed.pricing };
        if (parsed.addOns) cmsConfig.addOns = { ...cmsConfig.addOns, ...parsed.addOns };
        if (parsed.channels) cmsConfig.channels = { ...cmsConfig.channels, ...parsed.channels };
        console.log('[CMS STORAGE] Loaded persistent cms_config.json.');
      }
    } else {
      saveCmsConfig();
    }
  } catch (err) {
    console.error('[CMS STORAGE] Error loading cms_config.json:', err.message);
  }
}

// 7. Backend User Aggregation Function (Scans /data/employers/, /data/candidates/, and memory)
function getAllAggregatedUsers() {
  initDataDirectories();
  const userMap = new Map();

  // In-Memory Database scan
  usersDatabase.forEach(u => {
    const rawRole = (u.role || '').toLowerCase();
    const roleNormalized = rawRole === 'admin' ? 'Admin' : (rawRole === 'recruiter' || rawRole === 'employer') ? 'Employer' : 'Candidate';
    const isApproved = u.approved !== false && u.status !== 'Suspended';
    const uid = u.userId || u.id;
    userMap.set(uid, {
      userId: uid,
      id: uid,
      fullName: u.fullName || u.name || 'Anonymous User',
      name: u.fullName || u.name || 'Anonymous User',
      email: u.email,
      phone: u.phone || 'N/A',
      role: roleNormalized,
      status: isApproved ? 'Active' : 'Suspended',
      approved: isApproved,
      company: u.company || '',
      bio: u.bio || '',
      createdAt: u.createdAt || new Date().toISOString()
    });
  });

  // Scan /data/employers/ directory
  try {
    if (fs.existsSync(DIRS.employers)) {
      const empFiles = fs.readdirSync(DIRS.employers);
      empFiles.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(DIRS.employers, file), 'utf8');
            const data = JSON.parse(raw);
            const uid = data.userId || data.id || file.replace(/^emp_/, '').replace(/\.json$/, '');
            const isApproved = data.approved !== false && data.status !== 'Suspended';
            const rawRole = (data.role || 'Employer').toLowerCase();
            const roleNormalized = rawRole === 'admin' ? 'Admin' : (rawRole === 'recruiter' || rawRole === 'employer') ? 'Employer' : 'Candidate';
            userMap.set(uid, {
              userId: uid,
              id: uid,
              fullName: data.fullName || data.name || data.company || 'Employer Account',
              name: data.fullName || data.name || data.company || 'Employer Account',
              email: data.email || 'employer@example.com',
              phone: data.phone || 'N/A',
              role: roleNormalized,
              status: isApproved ? 'Active' : 'Suspended',
              approved: isApproved,
              company: data.company || '',
              bio: data.bio || '',
              createdAt: data.createdAt || new Date().toISOString()
            });
          } catch (e) {}
        }
      });
    }
  } catch (err) {}

  // Scan /data/candidates/ directory
  try {
    if (fs.existsSync(DIRS.candidates)) {
      const candFiles = fs.readdirSync(DIRS.candidates);
      candFiles.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const raw = fs.readFileSync(path.join(DIRS.candidates, file), 'utf8');
            const data = JSON.parse(raw);
            const uid = data.userId || data.id || file.replace(/^cand_/, '').replace(/\.json$/, '');
            const isApproved = data.approved !== false && data.status !== 'Suspended';
            const rawRole = (data.role || 'Candidate').toLowerCase();
            const roleNormalized = rawRole === 'admin' ? 'Admin' : (rawRole === 'recruiter' || rawRole === 'employer') ? 'Employer' : 'Candidate';
            userMap.set(uid, {
              userId: uid,
              id: uid,
              fullName: data.fullName || data.name || 'Candidate User',
              name: data.fullName || data.name || 'Candidate User',
              email: data.email || 'candidate@example.com',
              phone: data.phone || 'N/A',
              role: roleNormalized,
              status: isApproved ? 'Active' : 'Suspended',
              approved: isApproved,
              company: data.company || '',
              bio: data.bio || '',
              createdAt: data.createdAt || new Date().toISOString()
            });
          } catch (e) {}
        }
      });
    }
  } catch (err) {}

  // Fallback seed accounts if store is completely empty
  if (userMap.size === 0) {
    const seedUsers = [
      {
        userId: 'USR-ZION-001',
        id: 'USR-ZION-001',
        fullName: 'Zion Daye',
        name: 'Zion Daye',
        email: 'contact@utheversity.com',
        phone: '815-980-4272',
        role: 'Admin',
        status: 'Active',
        approved: true,
        company: 'UTHEVERSITY Global Inc.',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        userId: 'USR-002',
        id: 'USR-002',
        fullName: 'Quantum Talent Team',
        name: 'Quantum Talent Team',
        email: 'recruiter@quantumtech.io',
        phone: '+1 (555) 019-2831',
        role: 'Employer',
        status: 'Active',
        approved: true,
        company: 'Quantum Technologies Corp',
        createdAt: '2026-01-15T12:00:00.000Z'
      },
      {
        userId: 'USR-003',
        id: 'USR-003',
        fullName: 'Alex Morgan',
        name: 'Alex Morgan',
        email: 'alex.morgan@candidate.dev',
        phone: '+1 (555) 448-9102',
        role: 'Candidate',
        status: 'Active',
        approved: true,
        company: 'Independent Professional',
        createdAt: '2026-02-01T09:30:00.000Z'
      }
    ];
    seedUsers.forEach(u => userMap.set(u.userId, u));
  }

  return Array.from(userMap.values());
}

// Full Disk Sync & Database Ingestion on Startup
function loadAllDataFromDisk() {
  initDataDirectories();
  loadCmsConfig();

  // 1. Ingest Employers
  try {
    const empFiles = fs.readdirSync(DIRS.employers).filter(f => f.startsWith('emp_') && f.endsWith('.json'));
    if (empFiles.length > 0) {
      empFiles.forEach(file => {
        try {
          const u = JSON.parse(fs.readFileSync(path.join(DIRS.employers, file), 'utf8'));
          if (u && !usersDatabase.some(x => x.id === u.id)) usersDatabase.push(u);
        } catch (e) {}
      });
    } else {
      usersDatabase.forEach(u => {
        if (u.role === 'admin' || u.role === 'recruiter') saveEmployerRecord(u);
      });
    }
  } catch (e) {}

  // 2. Ingest Candidates
  try {
    const candFiles = fs.readdirSync(DIRS.candidates).filter(f => f.startsWith('cand_') && f.endsWith('.json'));
    if (candFiles.length > 0) {
      candFiles.forEach(file => {
        try {
          const u = JSON.parse(fs.readFileSync(path.join(DIRS.candidates, file), 'utf8'));
          if (u && !usersDatabase.some(x => x.id === u.id)) usersDatabase.push(u);
        } catch (e) {}
      });
    } else {
      usersDatabase.forEach(u => {
        if (u.role === 'candidate') saveCandidateRecord(u);
      });
    }
  } catch (e) {}

  // 3. Ingest Listings (Jobs)
  try {
    const jobFiles = fs.readdirSync(DIRS.listings).filter(f => f.startsWith('job_') && f.endsWith('.json'));
    if (jobFiles.length > 0) {
      jobFiles.forEach(file => {
        try {
          const j = JSON.parse(fs.readFileSync(path.join(DIRS.listings, file), 'utf8'));
          if (j && !globalJobDatabase.some(x => x.id === j.id)) globalJobDatabase.push(j);
        } catch (e) {}
      });
    } else {
      globalJobDatabase.forEach(j => saveJobRecord(j));
    }
  } catch (e) {}

  // 4. Ingest Applications
  try {
    const appFiles = fs.readdirSync(DIRS.applications).filter(f => f.startsWith('app_') && f.endsWith('.json'));
    if (appFiles.length > 0) {
      appFiles.forEach(file => {
        try {
          const a = JSON.parse(fs.readFileSync(path.join(DIRS.applications, file), 'utf8'));
          if (a && !applicantsStore.some(x => x.id === a.id)) applicantsStore.push(a);
        } catch (e) {}
      });
    } else {
      applicantsStore.forEach(a => saveApplicantRecord(a));
    }
  } catch (e) {}

  // 5. Ingest Messages
  try {
    const msgFiles = fs.readdirSync(DIRS.messages).filter(f => f.startsWith('thread_') && f.endsWith('.json'));
    if (msgFiles.length > 0) {
      msgFiles.forEach(file => {
        try {
          const m = JSON.parse(fs.readFileSync(path.join(DIRS.messages, file), 'utf8'));
          if (m && !globalMessageStore.some(x => x.id === m.id)) globalMessageStore.push(m);
        } catch (e) {}
      });
    } else {
      globalMessageStore.forEach(m => saveMessageRecord(m));
    }
  } catch (e) {}

  // 6. Default PDF Resume in /data/resumes/
  try {
    const sampleResume = path.join(DIRS.resumes, 'Marcus_Vance_Resume_2026.pdf');
    if (!fs.existsSync(sampleResume)) {
      fs.writeFileSync(sampleResume, '%PDF-1.4\n% Marcus Vance Verified PDF Resume - UTHEVERSITY Professional Career Network\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000090 00000 n \n0000000140 00000 n \n0000000200 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n275\n%%EOF\n', 'utf8');
    }
  } catch (e) {}

  writeSystemLog('SYSTEM_BOOT', { message: 'UTHEVERSITY Storage & Indexing Engine Initialized' });
}

// Execute auto-initialization & database loading on startup
loadAllDataFromDisk();

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
      if (newUser.role === 'candidate') {
        saveCandidateRecord(newUser);
      } else {
        saveEmployerRecord(newUser);
      }
      writeSystemLog('USER_SIGNUP', { userId: newUser.id, role: newUser.role, email: newUser.email });

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

      writeSystemLog('USER_LOGIN', { userId: user.id, email: user.email });

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

      if (user.role === 'candidate') {
        saveCandidateRecord(user);
      } else {
        saveEmployerRecord(user);
      }
      writeSystemLog('PROFILE_UPDATED', { userId: user.id });

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
      if (user.role === 'candidate') saveCandidateRecord(user);
      else saveEmployerRecord(user);
      writeSystemLog('PASSWORD_RESET', { userId: user.id, email: user.email });

      sendJson(200, { status: 'password_reset', email: user.email });
    });
    return;
  }

  // ----------------------------------------------------
  // PUBLIC JOB LISTING SANITIZATION HELPER
  // Strips confidential internal fields, applicant counts, and recruiter account details
  // ----------------------------------------------------
  function sanitizeJobForPublic(job) {
    if (!job) return null;
    return {
      id: job.id,
      jobTitle: job.jobTitle || 'Untitled Position',
      company: job.company || 'Confidential Company',
      location: job.location || 'Remote',
      employmentType: job.employmentType || 'Full-Time',
      payStructure: job.payStructure || 'Salary Range',
      minCompensation: job.minCompensation || '0',
      maxCompensation: job.maxCompensation || '0',
      salary: job.salary || `$${Number(job.minCompensation || 0).toLocaleString()} - $${Number(job.maxCompensation || 0).toLocaleString()}`,
      paidVacation: job.paidVacation || 'Standard PTO',
      healthCoverage: job.healthCoverage || 'Medical Included',
      retirement: job.retirement || '401(k)',
      additionalPerks: job.additionalPerks || 'Standard Perks',
      applyLinkUrl: job.applyLinkUrl || '',
      summary: job.summary || '',
      logo: job.logo || '',
      featured: Boolean(job.featured),
      status: job.status || 'Active',
      createdAt: job.createdAt
    };
  }

  // ----------------------------------------------------
  // SMART OMNI-SEARCH FOR MASTER ADMIN (PROTECTED)
  // ----------------------------------------------------
  if (pathname === '/api/admin/search' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const q = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
    const allUsers = getAllAggregatedUsers();
    if (!q) {
      return sendJson(200, { results: { users: allUsers, jobs: globalJobDatabase, applicants: applicantsStore } });
    }

    const matchedUsers = allUsers.filter(u =>
      (u.fullName || u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.company || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.userId || u.id || '').toLowerCase().includes(q)
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
  // Strict Cache-Control Headers for instant live sync & cache invalidation
  // ----------------------------------------------------
  if (pathname.startsWith('/api/cms')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  if (pathname === '/api/cms/config' && req.method === 'GET') {
    sendJson(200, { status: 'success', config: cmsConfig, updatedConfig: cmsConfig });
    return;
  }

  if (pathname === '/api/cms/config' && (req.method === 'POST' || req.method === 'PUT')) {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      if (body.postStudio) cmsConfig.postStudio = { ...cmsConfig.postStudio, ...body.postStudio };
      if (body.jobsBoard) cmsConfig.jobsBoard = { ...cmsConfig.jobsBoard, ...body.jobsBoard };
      if (body.labels) cmsConfig.labels = { ...cmsConfig.labels, ...body.labels };
      if (body.pricing) cmsConfig.pricing = { ...cmsConfig.pricing, ...body.pricing };
      if (body.addOns) cmsConfig.addOns = { ...cmsConfig.addOns, ...body.addOns };
      if (body.channels) cmsConfig.channels = { ...cmsConfig.channels, ...body.channels };

      saveCmsConfig();
      writeSystemLog('CMS_CONFIG_UPDATED', { timestamp: new Date().toISOString() });
      broadcastWebSocketEvent('cms_update', { config: cmsConfig, updatedConfig: cmsConfig });
      broadcastWebSocketEvent('CMS_CONFIG_UPDATED', { config: cmsConfig, updatedConfig: cmsConfig });
      sendJson(200, { status: 'updated', config: cmsConfig, updatedConfig: cmsConfig });
    });
    return;
  }

  // ----------------------------------------------------
  // ADMIN USER CRUD ROUTES (PROTECTED: ADMIN ONLY)
  // Aggregates /data/employers/, /data/candidates/, and memory
  // ----------------------------------------------------
  if (pathname === '/api/admin/users' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const users = getAllAggregatedUsers();
    sendJson(200, { users: users, count: users.length });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-password') && req.method === 'POST') {
    const authAdmin = getAuthenticatedUser(req);
    if (!authAdmin || authAdmin.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const uid = pathname.split('/')[4];
    let user = usersDatabase.find(u => u.id === uid || u.userId === uid);
    if (!user) {
      const allUsers = getAllAggregatedUsers();
      user = allUsers.find(u => u.id === uid || u.userId === uid);
      if (user) {
        usersDatabase.push(user);
      }
    }
    if (!user) return sendJson(404, { error: 'User not found' });
    const tempPass = `Reset${Math.floor(1000 + Math.random() * 9000)}!`;
    user.passwordHash = hashPassword(tempPass);
    if (user.role && user.role.toLowerCase() === 'candidate') saveCandidateRecord(user);
    else saveEmployerRecord(user);
    writeSystemLog('ADMIN_RESET_PASSWORD', { userId: user.id || user.userId, email: user.email });
    sendJson(200, { status: 'reset', tempPassword: tempPass, message: `Password for ${user.email} reset successfully.` });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && (req.method === 'PUT' || req.method === 'POST')) {
    const authAdmin = getAuthenticatedUser(req);
    if (!authAdmin || authAdmin.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const uid = pathname.split('/')[4];
    let user = usersDatabase.find(u => u.id === uid || u.userId === uid);
    if (!user) {
      const allUsers = getAllAggregatedUsers();
      user = allUsers.find(u => u.id === uid || u.userId === uid);
      if (user) {
        usersDatabase.push(user);
      }
    }
    if (!user) return sendJson(404, { error: 'User not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      if (body.role) user.role = body.role;
      if (body.approved !== undefined) user.approved = Boolean(body.approved);
      if (body.status !== undefined) {
        user.status = body.status;
        user.approved = body.status === 'Active';
      }
      if (body.name) user.name = body.name;
      if (body.fullName) { user.fullName = body.fullName; user.name = body.fullName; }
      if (body.phone) user.phone = body.phone;
      if (body.email) user.email = body.email;
      if (user.role && user.role.toLowerCase() === 'candidate') saveCandidateRecord(user);
      else saveEmployerRecord(user);
      writeSystemLog('ADMIN_USER_UPDATED', { userId: user.id || user.userId, role: user.role, approved: user.approved, status: user.status });
      broadcastWebSocketEvent('USER_UPDATED', { user: { id: user.id || user.userId, role: user.role, approved: user.approved } });
      sendJson(200, { status: 'updated', user });
    });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && req.method === 'DELETE') {
    const authAdmin = getAuthenticatedUser(req);
    if (!authAdmin || authAdmin.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const uid = pathname.split('/')[4];
    deleteEmployerRecord(uid);
    deleteCandidateRecord(uid);
    const idx = usersDatabase.findIndex(u => u.id === uid || u.userId === uid);
    if (idx !== -1) {
      usersDatabase.splice(idx, 1);
    }
    writeSystemLog('ADMIN_USER_DELETED', { userId: uid });
    sendJson(200, { status: 'deleted', userId: uid });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/feature') && req.method === 'PUT') {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const jobId = pathname.split('/')[3];
    const job = globalJobDatabase.find(j => j.id === jobId);
    if (!job) return sendJson(404, { error: 'Job not found' });
    job.featured = !job.featured;
    saveJobRecord(job);
    writeSystemLog('JOB_FEATURED_UPDATED', { jobId, featured: job.featured });
    broadcastWebSocketEvent('JOB_FEATURED_UPDATED', { jobId, featured: job.featured });
    sendJson(200, { status: 'updated', job });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && pathname.endsWith('/status') && req.method === 'PUT') {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const jobId = pathname.split('/')[3];
    const job = globalJobDatabase.find(j => j.id === jobId);
    if (!job) return sendJson(404, { error: 'Job not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      job.status = body.status || 'Active';
      saveJobRecord(job);
      writeSystemLog('JOB_STATUS_UPDATED', { jobId, status: job.status });
      broadcastWebSocketEvent('JOB_STATUS_UPDATED', { jobId, status: job.status });
      sendJson(200, { status: 'updated', job });
    });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && req.method === 'PUT') {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const jobId = pathname.split('/')[3];
    const job = globalJobDatabase.find(j => j.id === jobId);
    if (!job) return sendJson(404, { error: 'Job not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      Object.assign(job, body);
      saveJobRecord(job);
      writeSystemLog('JOB_UPDATED', { jobId: job.id });
      broadcastWebSocketEvent('JOB_UPDATED', { job });
      sendJson(200, { status: 'updated', job });
    });
    return;
  }

  if (pathname.startsWith('/api/applicants/') && pathname.endsWith('/status') && req.method === 'PUT') {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const appId = pathname.split('/')[3];
    const app = applicantsStore.find(a => a.id === appId);
    if (!app) return sendJson(404, { error: 'Applicant not found' });
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      app.status = body.status || app.status;
      saveApplicantRecord(app);
      writeSystemLog('APPLICANT_STATUS_UPDATED', { applicantId: appId, status: app.status });
      broadcastWebSocketEvent('APPLICANT_STAGE_UPDATED', { applicantId: appId, status: app.status });
      sendJson(200, { status: 'updated', applicant: app });
    });
    return;
  }

  if (pathname.startsWith('/api/applicants/') && req.method === 'DELETE') {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const appId = pathname.split('/')[3];
    const idx = applicantsStore.findIndex(a => a.id === appId);
    if (idx !== -1) {
      applicantsStore.splice(idx, 1);
      deleteApplicantRecord(appId);
      writeSystemLog('APPLICANT_DELETED', { applicantId: appId });
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
    const user = getAuthenticatedUser(req);
    if (!user || user.role !== 'admin') {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

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
  // PUBLIC JOB BOARD ENDPOINT (/api/listings/public)
  // Sanitized public position details (Title, Company, Location, Salary, Perks, Description)
  // Zero private candidate or employer account leaks
  // ----------------------------------------------------
  if (pathname === '/api/listings/public' && req.method === 'GET') {
    const publicJobs = globalJobDatabase
      .filter(j => (j.status || 'Active') === 'Active')
      .map(sanitizeJobForPublic);
    sendJson(200, { jobs: publicJobs, count: publicJobs.length });
    return;
  }

  // ----------------------------------------------------
  // JOBS CRUD & INSTANT REAL-TIME BROADCAST
  // Public callers receive sanitized listings; authenticated recruiters/admins receive full records
  // ----------------------------------------------------
  if (pathname === '/api/jobs' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (user && (user.role === 'recruiter' || user.role === 'admin')) {
      sendJson(200, { jobs: globalJobDatabase, count: globalJobDatabase.length });
    } else {
      const publicJobs = globalJobDatabase
        .filter(j => (j.status || 'Active') === 'Active')
        .map(sanitizeJobForPublic);
      sendJson(200, { jobs: publicJobs, count: publicJobs.length });
    }
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
      saveJobRecord(newJob);
      writeSystemLog('JOB_PUBLISHED', { jobId: newJob.id, title: newJob.jobTitle, company: newJob.company });

      broadcastWebSocketEvent('JOB_PUBLISHED', { job: newJob, total: globalJobDatabase.length });
      sendJson(201, { status: 'created', job: newJob });
    });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && req.method === 'DELETE') {
    const user = getAuthenticatedUser(req);
    if (!user || (user.role !== 'recruiter' && user.role !== 'admin')) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const jobId = pathname.split('/')[3];
    const index = globalJobDatabase.findIndex(j => j.id === jobId);
    if (index !== -1) {
      const removed = globalJobDatabase.splice(index, 1)[0];
      deleteJobRecord(jobId);
      writeSystemLog('JOB_DELETED', { jobId: jobId });
      broadcastWebSocketEvent('JOB_DELETED', { jobId: jobId, removed });
      sendJson(200, { status: 'deleted', jobId });
    } else {
      sendJson(404, { error: 'Job not found' });
    }
    return;
  }

  // ----------------------------------------------------
  // RESUME UPLOADS & STRICT PDF VALIDATION (AUTHENTICATED)
  // ----------------------------------------------------
  if (pathname === '/api/resumes/upload' && req.method === 'POST') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to upload candidate resumes.' });
    }

    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON payload' });
      const { filename, fileBase64 } = body;
      if (!filename) return sendJson(400, { error: 'Filename is required' });

      // Strictly validate .pdf extension
      const ext = path.extname(filename).toLowerCase();
      if (ext !== '.pdf') {
        return sendJson(400, { error: 'Strict Validation Error: Only .pdf files are permitted for candidate resumes.' });
      }

      const cleanName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
      const targetPath = path.join(DIRS.resumes, cleanName);

      try {
        if (fileBase64) {
          const buffer = Buffer.from(fileBase64, 'base64');
          fs.writeFileSync(targetPath, buffer);
        } else {
          fs.writeFileSync(targetPath, `%PDF-1.4\n% UTHEVERSITY Candidate Resume: ${cleanName}\n%%EOF`, 'utf8');
        }
        writeSystemLog('RESUME_UPLOADED', { filename: cleanName, path: targetPath, uploadedBy: user.id });
        sendJson(201, { status: 'uploaded', filename: cleanName, path: `/data/resumes/${cleanName}` });
      } catch (uploadErr) {
        sendJson(500, { error: 'Failed to write resume file: ' + uploadErr.message });
      }
    });
    return;
  }

  // Protected Candidate Resume Direct PDF Download
  if ((pathname.startsWith('/data/resumes/') || pathname.startsWith('/api/resumes/')) && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to view candidate resumes.' });
    }

    const resumeFileName = path.basename(pathname);
    const resumeFilePath = path.join(DIRS.resumes, resumeFileName);
    if (fs.existsSync(resumeFilePath) && path.extname(resumeFilePath).toLowerCase() === '.pdf') {
      res.writeHead(200, { 'Content-Type': 'application/pdf' });
      fs.createReadStream(resumeFilePath).pipe(res);
    } else {
      sendJson(404, { error: 'Resume PDF not found' });
    }
    return;
  }

  // ----------------------------------------------------
  // APPLICANTS & APPLICATIONS INGESTION & ACCESS CONTROL
  // ----------------------------------------------------
  if (pathname === '/api/applicants' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });

      const resumeFileName = payload.resumeFile || 'Marcus_Vance_Resume_2026.pdf';
      const resumeExt = path.extname(resumeFileName).toLowerCase();
      if (resumeExt !== '.pdf') {
        return sendJson(400, { error: 'Strict Validation Error: Only .pdf files are permitted for candidate resumes.' });
      }

      // Ensure PDF file saved to /data/resumes/
      const cleanResumeName = path.basename(resumeFileName).replace(/[^a-zA-Z0-9._-]/g, '_');
      const resumeTarget = path.join(DIRS.resumes, cleanResumeName);
      if (!fs.existsSync(resumeTarget)) {
        try {
          if (payload.resumeBase64) {
            fs.writeFileSync(resumeTarget, Buffer.from(payload.resumeBase64, 'base64'));
          } else {
            fs.writeFileSync(resumeTarget, `%PDF-1.4\n% UTHEVERSITY Candidate Resume: ${cleanResumeName}\n%%EOF`, 'utf8');
          }
        } catch (e) {}
      }

      const newApplicant = {
        id: payload.id || `APP-${Math.floor(700 + Math.random() * 200)}`,
        jobId: payload.jobId || 'JOB-101',
        jobTitle: payload.jobTitle || 'General Position',
        name: payload.name || 'Candidate Applicant',
        email: payload.email || 'candidate@domain.com',
        phone: payload.phone || '+1 (555) 000-0000',
        bestTime: payload.bestTime || 'Anytime',
        interviewTitle: payload.interviewTitle || payload.jobTitle || 'General Application',
        resumeFile: cleanResumeName,
        status: payload.status || 'Applied',
        score: payload.score || Math.floor(84 + Math.random() * 14),
        skills: payload.skills || ['JavaScript', 'System Design', 'Communication'],
        resumeSummary: payload.resumeSummary || 'Candidate interview request.',
        appliedAt: new Date().toISOString()
      };

      applicantsStore.unshift(newApplicant);
      saveApplicantRecord(newApplicant);
      writeSystemLog('CANDIDATE_APPLIED', { applicantId: newApplicant.id, jobId: newApplicant.jobId, name: newApplicant.name });

      broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: newApplicant });
      sendJson(201, { status: 'submitted', applicant: newApplicant });
    });
    return;
  }

  // Protected applicant list (Recruiters & Admins only)
  if ((pathname === '/api/applicants' || pathname === '/api/applications') && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to view applicant data.' });
    }
    if (user.role !== 'recruiter' && user.role !== 'admin') {
      return sendJson(403, { error: 'Forbidden: Recruiter or Administrator privileges required.' });
    }
    sendJson(200, { applicants: applicantsStore, count: applicantsStore.length });
    return;
  }

  // ----------------------------------------------------
  // TWO-WAY CANDIDATE & RECRUITER MESSAGING (PROTECTED)
  // ----------------------------------------------------
  if (pathname === '/api/messages' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to access private messaging threads.' });
    }

    const applicantId = parsedUrl.searchParams ? parsedUrl.searchParams.get('applicantId') : null;
    if (applicantId) {
      const filtered = globalMessageStore.filter(m => m.applicantId === applicantId);
      sendJson(200, { messages: filtered, count: filtered.length });
    } else {
      sendJson(200, { messages: globalMessageStore, count: globalMessageStore.length });
    }
    return;
  }

  if (pathname === '/api/messages' && req.method === 'POST') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to send messages.' });
    }

    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      const newMsg = {
        id: payload.id || `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        applicantId: payload.applicantId || 'APP-701',
        senderRole: payload.senderRole || user.role || 'candidate',
        senderName: payload.senderName || user.name || (payload.senderRole === 'recruiter' ? 'Quantum Talent Acquisition' : 'Marcus Vance'),
        company: payload.company || user.company || 'Quantum Retail Corp',
        jobTitle: payload.jobTitle || 'Sales Manager',
        text: payload.text || '',
        timestamp: new Date().toISOString()
      };

      globalMessageStore.push(newMsg);
      saveMessageRecord(newMsg);
      writeSystemLog('MESSAGE_SENT', { messageId: newMsg.id, applicantId: newMsg.applicantId, senderRole: newMsg.senderRole, userId: user.id });

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
              saveJobRecord(newJob);
              writeSystemLog('WS_JOB_PUBLISHED', { jobId: newJob.id });
            }
            broadcastWebSocketEvent('JOB_PUBLISHED', { job: newJob, total: globalJobDatabase.length });
          } else if (data.type === 'DELETE_JOB' && data.jobId) {
            const idx = globalJobDatabase.findIndex(j => j.id === data.jobId);
            if (idx !== -1) {
              globalJobDatabase.splice(idx, 1);
              deleteJobRecord(data.jobId);
              writeSystemLog('WS_JOB_DELETED', { jobId: data.jobId });
            }
          } else if (data.type === 'CANDIDATE_APPLIED' && data.applicant) {
            applicantsStore.unshift(data.applicant);
            saveApplicantRecord(data.applicant);
            writeSystemLog('WS_CANDIDATE_APPLIED', { applicantId: data.applicant.id });
            broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: data.applicant });
          }

          if ((data.type === 'CANDIDATE_MESSAGE_SENT' || data.type === 'RECRUITER_MESSAGE_SENT') && data.message) {
            const exists = globalMessageStore.some(m => m.id === data.message.id);
            if (!exists) {
              globalMessageStore.push(data.message);
              saveMessageRecord(data.message);
              writeSystemLog('WS_MESSAGE_SENT', { messageId: data.message.id });
            }
          }

          if ((data.type === 'cms_update' || data.type === 'CMS_CONFIG_UPDATED' || data.event === 'cms_update') && (data.config || data.updatedConfig)) {
            const newCfg = data.config || data.updatedConfig;
            if (newCfg.postStudio) cmsConfig.postStudio = { ...cmsConfig.postStudio, ...newCfg.postStudio };
            if (newCfg.jobsBoard) cmsConfig.jobsBoard = { ...cmsConfig.jobsBoard, ...newCfg.jobsBoard };
            if (newCfg.labels) cmsConfig.labels = { ...cmsConfig.labels, ...newCfg.labels };
            if (newCfg.pricing) cmsConfig.pricing = { ...cmsConfig.pricing, ...newCfg.pricing };
            if (newCfg.addOns) cmsConfig.addOns = { ...cmsConfig.addOns, ...newCfg.addOns };
            if (newCfg.channels) cmsConfig.channels = { ...cmsConfig.channels, ...newCfg.channels };
            saveCmsConfig();
            writeSystemLog('WS_CMS_CONFIG_UPDATED', { timestamp: new Date().toISOString() });
            broadcastWebSocketEvent('cms_update', { config: cmsConfig, updatedConfig: cmsConfig });
            broadcastWebSocketEvent('CMS_CONFIG_UPDATED', { config: cmsConfig, updatedConfig: cmsConfig });
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
    event: type,
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
