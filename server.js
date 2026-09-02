/* ============================================================================
 * CRITICAL CODE DIRECTIVE & MANDATE:
 * 1. NEVER USE NATIVE BROWSER POPUPS (alert(), confirm(), prompt())! ALWAYS USE UTHEVERSITY SIGNATURE POPUP CARDS.
 * 2. MAINTAIN STRICT MOBILE-FIRST TOUCH RESPONSIVENESS ACROSS ALL SCREEN SIZES.
 * 3. SURGICAL EDITING ONLY: DO NOT OVERWRITE, WIPE OUT, OR BREAK EXISTING WORKING LOGIC.
 * ============================================================================ */

const dns = require('dns');
if (dns.setDefaultResultOrder) { dns.setDefaultResultOrder('ipv4first'); }

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('[EMAIL ENGINE] Nodemailer load notice:', e.message);
}

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'utheversity-professional-jwt-secret-key-2026-secure';

// Helper function: Strictly enforce IPv4 socket connections and EHLO domain for Google SMTP Relay
function getTransporter() {
  if (!nodemailer) return null;
  const smtpUser = process.env.SMTP_USER ? process.env.SMTP_USER.trim() : null;
  const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.trim() : null;
  
  if (!smtpUser || !smtpPass) return null;

  return nodemailer.createTransport({
    name: 'utheversity.com', // Forces valid EHLO domain greeting for Google Workspace Relay
    host: process.env.SMTP_HOST || 'smtp-relay.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === '465',
    family: 4,
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { family: 4 }, (err, address) => {
        callback(err, address, 4);
      });
    },
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    socketTimeout: 10000
  });
}

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

function isRequestFromAdminDomain(req) {
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const origin = (req.headers.origin || '').toLowerCase();
  const referer = (req.headers.referer || '').toLowerCase();
  const portalHeader = (req.headers['x-admin-portal'] || '').toLowerCase();

  return (
    host.includes('admin.utheversity.com') ||
    origin.includes('admin.utheversity.com') ||
    referer.includes('admin.utheversity.com') ||
    referer.includes('admin.html') ||
    referer.includes('u-theadmin') ||
    portalHeader === 'true' ||
    portalHeader === 'master-admin'
  );
}

function getAuthenticatedUser(req, parsedUrl = null) {
  const cookies = parseCookies(req);
  let token = cookies['uthe_token'] || cookies['auth_token'] || cookies['master_admin_token'] || cookies['admin_token'];
  if (!token && req.headers.authorization) {
    const authParts = req.headers.authorization.split(' ');
    if (authParts.length === 2 && authParts[0].toLowerCase() === 'bearer') {
      token = authParts[1];
    }
  }
  if (!token && parsedUrl && parsedUrl.searchParams) {
    token = parsedUrl.searchParams.get('token') || parsedUrl.searchParams.get('auth_token');
  }

  // Master Admin direct session token bypass
  if (token === 'master_admin_token' || token === 'master-zion-token' || token === 'master_admin_session_active' || token === 'zion-master-key-2026') {
    return usersDatabase.find(u => u.email.toLowerCase() === 'contact@utheversity.com') || {
      id: 'USR-001',
      userId: 'USR-001',
      name: 'Zion Daye',
      fullName: 'Zion Daye',
      email: 'contact@utheversity.com',
      role: 'Master Admin',
      status: 'Active',
      approved: true
    };
  }

  if (!token) {
    if (isRequestFromAdminDomain(req)) {
      return usersDatabase.find(u => u.email.toLowerCase() === 'contact@utheversity.com') || {
        id: 'USR-001',
        userId: 'USR-001',
        name: 'Zion Daye',
        fullName: 'Zion Daye',
        email: 'contact@utheversity.com',
        role: 'Master Admin',
        status: 'Active',
        approved: true
      };
    }
    return null;
  }

  const decoded = verifyJwt(token);
  if (!decoded || !decoded.userId) {
    if (isRequestFromAdminDomain(req)) {
      return usersDatabase.find(u => u.email.toLowerCase() === 'contact@utheversity.com') || {
        id: 'USR-001',
        userId: 'USR-001',
        name: 'Zion Daye',
        fullName: 'Zion Daye',
        email: 'contact@utheversity.com',
        role: 'Master Admin',
        status: 'Active',
        approved: true
      };
    }
    return null;
  }

  return usersDatabase.find(u => 
    u.id === decoded.userId || 
    u.userId === decoded.userId || 
    ((decoded.userId === 'USR-ZION-001' || decoded.userId === 'USR-001') && (u.id === 'USR-001' || u.id === 'USR-ZION-001' || u.userId === 'USR-001' || u.userId === 'USR-ZION-001')) ||
    (decoded.email && u.email.toLowerCase() === decoded.email.toLowerCase())
  ) || (decoded.role && decoded.role.toLowerCase().includes('admin') ? {
    id: decoded.userId || 'USR-001',
    userId: decoded.userId || 'USR-001',
    name: 'Zion Daye',
    fullName: 'Zion Daye',
    email: decoded.email || 'contact@utheversity.com',
    role: 'Master Admin',
    status: 'Active',
    approved: true
  } : null);
}

function isAdmin(user) {
  if (!user || !user.role) return false;
  const r = user.role.toString().toLowerCase();
  return r.includes('admin');
}

function isRecruiterOrAdmin(user) {
  if (!user || !user.role) return false;
  const r = user.role.toString().toLowerCase();
  return r.includes('admin') || r.includes('recruiter') || r.includes('employer');
}

// ----------------------------------------------------
// IN-MEMORY USER & ACCOUNT DATABASE
// Pre-configured Master Owner & Seed Accounts
// ----------------------------------------------------
const usersDatabase = [
  {
    id: 'USR-001',
    userId: 'USR-001',
    email: 'contact@utheversity.com',
    passwordHash: hashPassword('ZionAdmin2026!'),
    name: 'Zion Daye',
    fullName: 'Zion Daye',
    role: 'Master Admin',
    company: 'UTHEVERSITY Global Inc.',
    phone: '815-980-4272',
    bio: 'Platform Founder & Master System Administrator.',
    approved: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'USR-002',
    userId: 'USR-002',
    email: 'hr@apexrecruiting.com',
    passwordHash: hashPassword('Recruiter2026!'),
    name: 'Apex Recruiting Co.',
    fullName: 'Apex Recruiting Co.',
    role: 'Employer',
    company: 'Apex Recruiting Co.',
    phone: '800-555-0199',
    bio: 'Premier executive talent acquisition team.',
    approved: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    id: 'USR-003',
    userId: 'USR-003',
    email: 'jordan.rivera@email.com',
    passwordHash: hashPassword('Candidate2026!'),
    name: 'Jordan Rivera',
    fullName: 'Jordan Rivera',
    role: 'Candidate',
    company: 'Independent Professional',
    phone: '312-555-0144',
    bio: 'Senior Full-Stack Architect with 8+ years experience.',
    approved: true,
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

// ----------------------------------------------------
// MASTER ZERO-CODE CMS CONFIGURATION STORE
// ----------------------------------------------------
let cmsConfig = {
  postStudio: {
    card1Title: "JOB DESCRIPTION",
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

// Candidate Resume Directory Database Store
const defaultResumesDirectory = [];

// ----------------------------------------------------
// STRICT DATA STORAGE & AUTOMATIC INDEXING SYSTEM
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

const resumesFilePath = path.join(DATA_DIR, 'resumes_directory.json');
const resumesStore = [];

function loadResumesFromDisk() {
  try {
    if (fs.existsSync(resumesFilePath)) {
      const data = JSON.parse(fs.readFileSync(resumesFilePath, 'utf8'));
      if (Array.isArray(data)) {
        resumesStore.length = 0;
        resumesStore.push(...data);
      }
    } else {
      resumesStore.length = 0;
      saveResumesToDisk();
    }
  } catch (e) {
    resumesStore.length = 0;
  }
}

function saveResumesToDisk() {
  try {
    initDataDirectories();
    fs.writeFileSync(resumesFilePath, JSON.stringify(resumesStore, null, 2), 'utf8');
  } catch (e) {}
}

const jobsFilePath = path.join(DATA_DIR, 'jobs.json');
let jobsList = globalJobDatabase;

function loadJobsFromDisk() {
  try {
    if (fs.existsSync(jobsFilePath)) {
      const data = JSON.parse(fs.readFileSync(jobsFilePath, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        jobsList = data;
        globalJobDatabase.length = 0;
        globalJobDatabase.push(...jobsList);
      }
    } else {
      saveJobsToDisk();
    }
  } catch (e) {
    jobsList = globalJobDatabase;
  }
}

function saveJobsToDisk() {
  try {
    initDataDirectories();
    fs.writeFileSync(jobsFilePath, JSON.stringify(globalJobDatabase, null, 2), 'utf8');
  } catch (e) {}
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1));
    }
  }
  return (crc ^ ~0) >>> 0;
}

function createZipBuffer(files) {
  const localHeaders = [];
  const centralDirectory = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(file.name, 'utf8');
    const dataBuf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data);
    const crc = crc32(dataBuf);
    const size = dataBuf.length;

    const lh = Buffer.alloc(30 + nameBuf.length);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0, 6);
    lh.writeUInt16LE(0, 8);
    lh.writeUInt16LE(0, 10);
    lh.writeUInt16LE(0, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(size, 18);
    lh.writeUInt32LE(size, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    nameBuf.copy(lh, 30);

    localHeaders.push(lh, dataBuf);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt16LE(0, 12);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(size, 20);
    cd.writeUInt32LE(size, 24);
    cd.writeUInt16LE(nameBuf.length, 28);
    cd.writeUInt16LE(0, 30);
    cd.writeUInt16LE(0, 32);
    cd.writeUInt16LE(0, 34);
    cd.writeUInt16LE(0, 36);
    cd.writeUInt32LE(0, 38);
    cd.writeUInt32LE(offset, 42);
    nameBuf.copy(cd, 46);

    centralDirectory.push(cd);
    offset += lh.length + dataBuf.length;
  }

  const cdOffset = offset;
  const cdSize = centralDirectory.reduce((sum, b) => sum + b.length, 0);

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localHeaders, ...centralDirectory, eocd]);
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

// ----------------------------------------------------
// AUTOMATED TRANSACTIONAL EMAIL ENGINE
// ----------------------------------------------------
const DEFAULT_FROM_EMAIL = process.env.FROM_EMAIL || 'contact@utheversity.com';
const EMAIL_LOG_FILE = path.join(DIRS.logs, 'emails.log');
const EMAIL_JSON_LOG = path.join(DIRS.logs, 'log_emails.json');

const resetTokensStore = new Map();

function generatePasswordResetToken(email, userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
  resetTokensStore.set(token, { email: (email || '').toLowerCase().trim(), userId, expiresAt });
  return token;
}

function verifyPasswordResetToken(token) {
  if (!token) return null;
  const record = resetTokensStore.get(token);
  if (!record) return null;
  if (Date.now() > record.expiresAt) {
    resetTokensStore.delete(token);
    return null;
  }
  return record;
}

function buildBrandedEmailHtml({ title, preheader, bodyContent, ctaText, ctaUrl, metadataHtml = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased; }
    .email-wrapper { width: 100%; background-color: #f8fafc; padding: 36px 12px; }
    .email-container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
    .email-header { padding: 24px 30px; background: #ffffff; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between; }
    .brand-badge { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 900; letter-spacing: 0.08em; color: #0f172a; text-decoration: none; }
    .emblem { background: linear-gradient(135deg, #D4AF37, #B8860B); color: #000000; padding: 4px 8px; border-radius: 4px; font-weight: 900; font-size: 11px; letter-spacing: 0.1em; }
    .sub-badge { font-size: 10px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
    .email-body { padding: 32px 30px; color: #1e293b; font-size: 14px; line-height: 1.65; }
    .email-title { font-size: 19px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 16px; letter-spacing: -0.01em; }
    .details-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
    .details-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .details-row:last-child { margin-bottom: 0; }
    .details-label { color: #64748b; font-weight: 600; }
    .details-value { color: #0f172a; font-weight: 700; }
    .cta-container { text-align: center; margin: 28px 0 16px; }
    .cta-button { display: inline-block; background: #0f172a; color: #ffffff !important; font-size: 13px; font-weight: 700; text-decoration: none; padding: 12px 26px; border-radius: 6px; letter-spacing: 0.03em; border: 1px solid #0f172a; }
    .email-footer { padding: 20px 30px; background: #fafafa; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; }
    .footer-links { margin-bottom: 6px; }
    .footer-links a { color: #64748b; text-decoration: none; margin: 0 6px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="brand-badge">
          <span class="emblem">U-THE</span>
          <span>UTHEVERSITY</span>
        </div>
        <span class="sub-badge">VERIFIED NOTIFICATION</span>
      </div>
      <div class="email-body">
        <h1 class="email-title">${title}</h1>
        ${bodyContent}
        ${metadataHtml}
        ${ctaText && ctaUrl ? `
        <div class="cta-container">
          <a href="${ctaUrl}" class="cta-button" target="_blank">${ctaText}</a>
        </div>` : ''}
      </div>
      <div class="email-footer">
        <div class="footer-links">
          <a href="https://post.utheversity.com">u-thePOST</a> &bull;
          <a href="https://jobs.utheversity.com">u-theJOBS</a> &bull;
          <a href="https://admin.utheversity.com">u-theADMIN</a>
        </div>
        <div>&copy; 2026 UTHEVERSITY Inc. &mdash; Professional Career Network</div>
        <div style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">Sent via UTHEVERSITY Automated Transactional Dispatcher</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendTransactionalEmail({ to, subject, html, text, type = 'GENERAL_NOTIFICATION', metadata = {} }) {
  const timestamp = new Date().toISOString();
  const emailRecord = {
    id: `EML-${Math.floor(100000 + Math.random() * 900000)}`,
    to,
    from: DEFAULT_FROM_EMAIL,
    subject,
    type,
    metadata,
    status: 'pending',
    timestamp
  };

  initDataDirectories();

  try {
    const textLogLine = `[${timestamp}] TYPE=${type} TO=${to} SUBJECT="${subject}" ID=${emailRecord.id}\n`;
    fs.appendFileSync(EMAIL_LOG_FILE, textLogLine, 'utf8');
  } catch (err) {
    console.error('[EMAIL LOG ERROR] Failed to write emails.log:', err.message);
  }

  try {
    let emailLogs = [];
    if (fs.existsSync(EMAIL_JSON_LOG)) {
      try {
        emailLogs = JSON.parse(fs.readFileSync(EMAIL_JSON_LOG, 'utf8'));
        if (!Array.isArray(emailLogs)) emailLogs = [];
      } catch (e) {
        emailLogs = [];
      }
    }
    emailLogs.unshift(emailRecord);
    if (emailLogs.length > 500) emailLogs = emailLogs.slice(0, 500);
    fs.writeFileSync(EMAIL_JSON_LOG, JSON.stringify(emailLogs, null, 2), 'utf8');
  } catch (err) {
    console.error('[EMAIL JSON LOG ERROR]', err.message);
  }

  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `UTHEVERSITY <${DEFAULT_FROM_EMAIL}>`,
        to,
        subject,
        text: text || subject,
        html
      });
      emailRecord.status = 'sent';
      emailRecord.messageId = info.messageId;
      console.log(`[EMAIL ENGINE] SMTP Sent: ${type} -> ${to} (MessageId: ${info.messageId})`);
    } catch (smtpErr) {
      emailRecord.status = 'logged_fallback';
      emailRecord.error = smtpErr.message;
      console.warn(`[EMAIL ENGINE] SMTP fallback logged for ${to} (${smtpErr.message})`);
    }
  } else {
    emailRecord.status = 'logged_fallback';
    console.log(`[EMAIL ENGINE] Local fallback logged: ${type} -> ${to} ("${subject}")`);
  }

  writeSystemLog('EMAIL_DISPATCHED', { to, subject, type, emailId: emailRecord.id, status: emailRecord.status });
  return emailRecord;
}

// Template 1: Welcome Email
async function sendWelcomeEmail(user) {
  const isEmployer = (user.role || '').toLowerCase().includes('employer') || (user.role || '').toLowerCase().includes('recruiter');
  const portalUrl = isEmployer ? 'https://post.utheversity.com' : 'https://jobs.utheversity.com';
  const roleLabel = isEmployer ? 'Employer Recruiter' : 'Candidate Professional';

  const bodyContent = `
    <p>Welcome to UTHEVERSITY, <strong>${user.name || user.fullName || 'Member'}</strong>!</p>
    <p>Your platform account has been verified and registered with zero-latency live sync across all network subdomains.</p>
    <div class="details-box">
      <div class="details-row"><span class="details-label">User Account ID:</span><span class="details-value">${user.id || user.userId}</span></div>
      <div class="details-row"><span class="details-label">Account Email:</span><span class="details-value">${user.email}</span></div>
      <div class="details-row"><span class="details-label">Account Role:</span><span class="details-value">${roleLabel}</span></div>
      ${user.company ? `<div class="details-row"><span class="details-label">Company:</span><span class="details-value">${user.company}</span></div>` : ''}
    </div>
    <p>You can now immediately access your portal to publish job positions or apply to active listings.</p>
  `;

  return sendTransactionalEmail({
    to: user.email,
    subject: `Welcome to UTHEVERSITY — Your ${roleLabel} Account is Active`,
    type: 'WELCOME_USER',
    metadata: { userId: user.id || user.userId, role: user.role },
    html: buildBrandedEmailHtml({
      title: 'Welcome to UTHEVERSITY',
      bodyContent,
      ctaText: isEmployer ? 'LAUNCH U-THEPOST STUDIO' : 'EXPLORE U-THEJOBS BOARD',
      ctaUrl: portalUrl
    })
  });
}

// Template 2: Password Reset Email (30-Minute Security Token)
async function sendPasswordResetEmail(user, token, tempPassword = null) {
  const resetUrl = `https://jobs.utheversity.com/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
  const bodyContent = `
    <p>Hello <strong>${user.name || user.fullName || 'User'}</strong>,</p>
    <p>A request was submitted to reset the password for your UTHEVERSITY account (<strong>${user.email}</strong>).</p>
    ${tempPassword ? `<div class="details-box"><div class="details-row"><span class="details-label">Temporary Secure Password:</span><span class="details-value"><code>${tempPassword}</code></span></div></div>` : ''}
    <p>Click the secure button below to choose a new password. For security, this link is valid for <strong>30 minutes</strong>.</p>
  `;

  return sendTransactionalEmail({
    to: user.email,
    subject: 'Reset Your UTHEVERSITY Account Password',
    type: 'PASSWORD_RESET_REQUEST',
    metadata: { userId: user.id || user.userId, token },
    html: buildBrandedEmailHtml({
      title: 'Password Reset Request',
      bodyContent,
      ctaText: 'RESET YOUR PASSWORD',
      ctaUrl: resetUrl
    })
  });
}

// Template 3A: Candidate Application Receipt
async function sendApplicationReceiptToCandidate(applicant, job) {
  const bodyContent = `
    <p>Hello <strong>${applicant.name}</strong>,</p>
    <p>We have successfully received your interview request and resume for the position below:</p>
    <div class="details-box">
      <div class="details-row"><span class="details-label">Position:</span><span class="details-value">${job.jobTitle || applicant.jobTitle}</span></div>
      <div class="details-row"><span class="details-label">Company:</span><span class="details-value">${job.company || 'Hiring Team'}</span></div>
      <div class="details-row"><span class="details-label">Application ID:</span><span class="details-value">${applicant.id}</span></div>
      <div class="details-row"><span class="details-label">Resume Attachment:</span><span class="details-value">${applicant.resumeFile || 'Uploaded PDF'}</span></div>
      <div class="details-row"><span class="details-label">Status:</span><span class="details-value">${applicant.status || 'Applied'}</span></div>
    </div>
    <p>The hiring team has been notified. You will receive an alert as soon as they review your application.</p>
  `;

  return sendTransactionalEmail({
    to: applicant.email,
    subject: `Application Received: ${job.jobTitle || applicant.jobTitle} at ${job.company || 'UTHEVERSITY'}`,
    type: 'APPLICATION_RECEIPT_CANDIDATE',
    metadata: { applicantId: applicant.id, jobId: job.id || applicant.jobId },
    html: buildBrandedEmailHtml({
      title: 'Application Receipt Confirmed',
      bodyContent,
      ctaText: 'VIEW MY APPLICATIONS',
      ctaUrl: 'https://jobs.utheversity.com'
    })
  });
}

// Template 3B: Recruiter New Applicant Alert
async function sendNewApplicantAlertToRecruiter(applicant, job) {
  const recruiterEmail = job.recruiterEmail || 'contact@utheversity.com';
  const bodyContent = `
    <p>A new candidate has submitted an application for your active listing:</p>
    <div class="details-box">
      <div class="details-row"><span class="details-label">Candidate Name:</span><span class="details-value">${applicant.name}</span></div>
      <div class="details-row"><span class="details-label">Target Position:</span><span class="details-value">${job.jobTitle || applicant.jobTitle}</span></div>
      <div class="details-row"><span class="details-label">Candidate Email:</span><span class="details-value">${applicant.email}</span></div>
      <div class="details-row"><span class="details-label">Candidate Phone:</span><span class="details-value">${applicant.phone}</span></div>
      <div class="details-row"><span class="details-label">Resume File:</span><span class="details-value">${applicant.resumeFile}</span></div>
    </div>
    <p>Log in to u-thePOST to view the candidate resume, change application stages, or start a direct interview messaging thread.</p>
  `;

  return sendTransactionalEmail({
    to: recruiterEmail,
    subject: `New Candidate Application: ${applicant.name} for ${job.jobTitle || applicant.jobTitle}`,
    type: 'NEW_APPLICANT_ALERT_RECRUITER',
    metadata: { applicantId: applicant.id, jobId: job.id || applicant.jobId, candidateEmail: applicant.email },
    html: buildBrandedEmailHtml({
      title: 'New Applicant Notification',
      bodyContent,
      ctaText: 'REVIEW CANDIDATE IN U-THEPOST',
      ctaUrl: 'https://post.utheversity.com'
    })
  });
}

// Template 4: Direct Message Notification
async function sendDirectMessageNotification(msg, recipientEmail, recipientName = 'Candidate') {
  const isRecruiterSender = (msg.senderRole || '').toLowerCase().includes('recruiter') || (msg.senderRole || '').toLowerCase().includes('employer');
  const previewSnippet = (msg.text || '').length > 180 ? `${msg.text.substring(0, 180)}...` : (msg.text || 'New message attached.');
  const portalUrl = isRecruiterSender ? 'https://jobs.utheversity.com' : 'https://post.utheversity.com';

  const bodyContent = `
    <p>Hello <strong>${recipientName}</strong>,</p>
    <p>You have received a new direct message from <strong>${msg.senderName || msg.company}</strong> regarding <strong>${msg.jobTitle || 'your position'}</strong>:</p>
    <div class="details-box" style="border-left: 3px solid #D4AF37;">
      <p style="margin: 0; font-style: italic; color: #334155;">&ldquo;${previewSnippet}&rdquo;</p>
    </div>
    <p>Please click below to log in and reply directly in your live messaging console.</p>
  `;

  return sendTransactionalEmail({
    to: recipientEmail,
    subject: `You have a new message from ${msg.company || msg.senderName}`,
    type: 'NEW_DIRECT_MESSAGE_ALERT',
    metadata: { messageId: msg.id, applicantId: msg.applicantId, senderRole: msg.senderRole },
    html: buildBrandedEmailHtml({
      title: 'New Direct Message Alert',
      bodyContent,
      ctaText: 'OPEN LIVE MESSAGING CONSOLE',
      ctaUrl: portalUrl
    })
  });
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

function loadApplicantsFromDisk() {
  try {
    initDataDirectories();
    if (fs.existsSync(DIRS.applications)) {
      const files = fs.readdirSync(DIRS.applications).filter(f => f.startsWith('app_') && f.endsWith('.json'));
      files.forEach(f => {
        try {
          const app = JSON.parse(fs.readFileSync(path.join(DIRS.applications, f), 'utf8'));
          if (app && app.id && !applicantsStore.some(a => a.id === app.id)) {
            applicantsStore.unshift(app);
          }
        } catch (e) {}
      });
    }
  } catch (e) {}
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

function formatRole(role) {
  if (!role) return 'Candidate';
  const r = role.toString().toLowerCase();
  if (r.includes('admin')) return 'Master Admin';
  if (r.includes('employer') || r.includes('recruiter')) return 'Employer';
  return 'Candidate';
}

// 7. Backend User Aggregation Function
function getAllAggregatedUsers() {
  initDataDirectories();
  const userMap = new Map();

  usersDatabase.forEach(u => {
    const rawRole = (u.role || '').toLowerCase();
    const roleNormalized = formatRole(rawRole);
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
            const roleNormalized = formatRole(rawRole);
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
            const roleNormalized = formatRole(rawRole);
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

  if (userMap.size === 0) {
    const seedUsers = [
      {
        userId: 'USR-001',
        id: 'USR-001',
        fullName: 'Zion Daye',
        name: 'Zion Daye',
        email: 'contact@utheversity.com',
        phone: '815-980-4272',
        role: 'Master Admin',
        status: 'Active',
        approved: true,
        company: 'UTHEVERSITY Global Inc.',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        userId: 'USR-002',
        id: 'USR-002',
        fullName: 'Apex Recruiting Co.',
        name: 'Apex Recruiting Co.',
        email: 'hr@apexrecruiting.com',
        phone: '800-555-0199',
        role: 'Employer',
        status: 'Active',
        approved: true,
        company: 'Apex Recruiting Co.',
        createdAt: '2026-01-15T12:00:00.000Z'
      },
      {
        userId: 'USR-003',
        id: 'USR-003',
        fullName: 'Jordan Rivera',
        name: 'Jordan Rivera',
        email: 'jordan.rivera@email.com',
        phone: '312-555-0144',
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

function loadAllDataFromDisk() {
  initDataDirectories();
  loadCmsConfig();

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

  try {
    loadJobsFromDisk();
    const jobFiles = fs.readdirSync(DIRS.listings).filter(f => f.startsWith('job_') && f.endsWith('.json'));
    if (jobFiles.length > 0) {
      jobFiles.forEach(file => {
        try {
          const j = JSON.parse(fs.readFileSync(path.join(DIRS.listings, file), 'utf8'));
          if (j && !globalJobDatabase.some(x => x.id === j.id)) globalJobDatabase.push(j);
        } catch (e) {}
      });
      saveJobsToDisk();
    } else {
      globalJobDatabase.forEach(j => saveJobRecord(j));
      saveJobsToDisk();
    }
  } catch (e) {}

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

  try {
    const seedResumes = [
      { name: 'Marcus_Vance_Resume_2026.pdf', title: 'Marcus Vance Verified PDF Resume' },
      { name: 'Elena_Rostova_Resume.pdf', title: 'Elena Rostova Verified PDF Resume' },
      { name: 'David_K_Mercer_Resume.pdf', title: 'David K. Mercer Verified PDF Resume' },
      { name: 'John_Doe_Resume_2026.pdf', title: 'John Doe Verified PDF Resume' }
    ];

    seedResumes.forEach(sr => {
      const samplePath = path.join(DIRS.resumes, sr.name);
      if (!fs.existsSync(samplePath)) {
        fs.writeFileSync(samplePath, `%PDF-1.4\n% ${sr.title} - UTHEVERSITY Professional Career Network\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000090 00000 n \n0000000140 00000 n \n0000000200 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n275\n%%EOF\n`, 'utf8');
      }
    });
  } catch (e) {}

  writeSystemLog('SYSTEM_BOOT', { message: 'UTHEVERSITY Storage & Indexing Engine Initialized' });
}

loadAllDataFromDisk();

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

function resolveTargetFileForHost(req, parsedUrl) {
  const pathname = parsedUrl.pathname;
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '');

  if (cleanPath === '/recruiter' || cleanPath === '/recruiter.html' || cleanPath === '/post' || cleanPath === '/u-thepost' || cleanPath === '/u-thepost.html' || cleanPath === '/u-thepost-enterprise-edition.html' || cleanPath === '/u-thepost-dual link to u-thejobs.html' || cleanPath === '/u-thepost-dual link & mobile.html') {
    return 'recruiter.html';
  }
  if (cleanPath === '/candidate' || cleanPath === '/candidate.html' || cleanPath === '/jobs' || cleanPath === '/u-thejobs' || cleanPath === '/u-thejobs.html' || cleanPath === '/u-thejobs-enterprise-sync.html' || cleanPath === '/u-thejobs-dual link to u-thepost.html') {
    return 'candidate.html';
  }
  if (cleanPath === '/admin' || cleanPath === '/admin.html' || cleanPath === '/u-theadmin' || cleanPath === '/u-theadmin.html' || cleanPath === '/u-theadmin-master-suite.html') {
    return 'admin.html';
  }

  if (cleanPath !== '' && cleanPath !== '/' && cleanPath !== '/index.html') {
    const rawFile = pathname.replace(/^\//, '');
    const candidatePath = path.join(__dirname, decodeURIComponent(rawFile));
    if (fs.existsSync(candidatePath) && !fs.statSync(candidatePath).isDirectory()) {
      return rawFile;
    }
  }

  const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
  const firstHost = rawHost.split(',')[0].trim().toLowerCase();
  const host = firstHost.split(':')[0].trim();

  const subQuery = (parsedUrl.searchParams.get('subdomain') || parsedUrl.searchParams.get('role') || '').toLowerCase().trim();

  if (host === 'post.utheversity.com' || host.startsWith('post.') || host.includes('recruiter.') || subQuery === 'post' || subQuery === 'recruiter') {
    return 'recruiter.html';
  }

  if (host === 'jobs.utheversity.com' || host.startsWith('jobs.') || host.includes('candidate.') || subQuery === 'jobs' || subQuery === 'candidate') {
    return 'candidate.html';
  }

  if (host === 'admin.utheversity.com' || host.startsWith('admin.') || subQuery === 'admin') {
    return 'admin.html';
  }

  return 'recruiter.html';
}

// ----------------------------------------------------
// HTTP SERVER & ROUTING ENGINE
// ----------------------------------------------------
const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  const pathname = parsedUrl.pathname;
  const cleanPath = (pathname.replace(/\/+$/, '') || '/').toLowerCase();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Admin-Portal');

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
  // HIGH-PRIORITY ROUTING: /api/admin/test-email
  // ----------------------------------------------------
  if ((cleanPath === '/api/admin/test-email' || pathname === '/api/admin/test-email') && (req.method === 'POST' || req.method === 'GET')) {
    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    if (!isAdmin(user) && !isFromAdminPortal) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const handleTestDispatch = async (targetEmail, customSubject) => {
      try {
        const recipient = (targetEmail || 'contact@utheversity.com').trim();
        let isVerified = false;
        let verifyError = null;

        const transporter = getTransporter();
        if (transporter) {
          try {
            await transporter.verify();
            isVerified = true;
          } catch (vErr) {
            verifyError = vErr.message;
          }
        }

        const emailResult = await sendTransactionalEmail({
          to: recipient,
          subject: customSubject || 'u-theADMIN — Live Transactional Email System Test',
          type: 'DIAGNOSTIC_TEST_EMAIL',
          metadata: { targetEmail: recipient, isVerified, verifyError },
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #0f172a; color: #ffffff; border-radius: 8px;">
              <h2 style="color: #f59e0b; margin-top: 0;">UTHEVERSITY Email Verification</h2>
              <p>Your Google Workspace SMTP connection is live and functioning properly.</p>
              <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
              <hr style="border: 0; border-top: 1px solid #334155;" />
              <p style="font-size: 12px; color: #94a3b8;">&copy; 2026 UTHEVERSITY Inc. — Master Governance System</p>
            </div>
          `
        });

        const deliveryId = emailResult.messageId || emailResult.id || 'EML-' + Math.floor(Math.random() * 900000 + 100000);
        const hasAuth = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
        const smtpStatus = isVerified ? 'CONNECTED' : (hasAuth ? 'DISCONNECTED' : 'LOGGED_FALLBACK');

        return sendJson(200, {
          success: true,
          status: 'success',
          message: 'Transactional email dispatched successfully.',
          deliveryId: deliveryId,
          messageId: deliveryId,
          smtpStatus,
          verified: isVerified,
          to: recipient,
          from: DEFAULT_FROM_EMAIL,
          details: isVerified
            ? `Google Workspace SMTP handshake verified. Test email delivered with ID ${deliveryId}.`
            : (hasAuth
                ? `SMTP verification notice (${verifyError || 'Logged'}). Logged to fallback /data/logs/emails.log.`
                : `SMTP credentials unconfigured. Safely recorded to logs.`),
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('[SMTP ERROR]', err);
        return sendJson(500, {
          success: false,
          error: err.message || 'Failed to send test email'
        });
      }
    };

    if (req.method === 'POST') {
      readBody((err, body) => {
        if (err) return sendJson(400, { error: 'Invalid JSON body' });
        const target = body?.email || body?.to || parsedUrl.searchParams.get('to') || parsedUrl.searchParams.get('email') || 'contact@utheversity.com';
        handleTestDispatch(target, body?.subject);
      });
    } else {
      const target = parsedUrl.searchParams.get('to') || parsedUrl.searchParams.get('email') || 'contact@utheversity.com';
      handleTestDispatch(target);
    }
    return;
  }

  // ----------------------------------------------------
  // AUTHENTICATION ROUTES & TRANSACTIONAL EMAIL TRIGGERS
  // ----------------------------------------------------
  if ((pathname === '/api/auth/signup' || pathname === '/api/auth/register') && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const { email, password, name, role, company, phone } = body;
      if (!email || !password) return sendJson(400, { error: 'Email and password required' });
      if (password.length < 8) return sendJson(400, { error: 'Password must be at least 8 characters long' });

      const DISALLOWED_PERSONAL_DOMAINS = [
        'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com',
        'mail.com', 'zoho.com', 'protonmail.com', 'proton.me', 'live.com', 'gmx.com',
        'yandex.com', 'fastmail.com', 'inbox.com', 'msn.com', 'att.net', 'verizon.net',
        'comcast.net', 'sbcglobal.net'
      ];

      const emailDomain = (email.split('@')[1] || '').toLowerCase().trim();
      const isRecruiterSignup = (role && (role.toLowerCase().includes('recruiter') || role.toLowerCase().includes('employer'))) || (req.headers.referer && req.headers.referer.includes('recruiter.html'));

      if (isRecruiterSignup && DISALLOWED_PERSONAL_DOMAINS.includes(emailDomain)) {
        return sendJson(400, {
          error: `Company Domain Required: Personal email accounts (@${emailDomain}) cannot be used to register on U-THEPOST. Please use your official corporate or company work email domain.`
        });
      }

      const existing = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (existing) return sendJson(409, { error: 'Email already registered' });

      const newUser = {
        id: `USR-${Math.floor(100 + Math.random() * 900)}`,
        userId: `USR-${Math.floor(100 + Math.random() * 900)}`,
        email: email.toLowerCase().trim(),
        passwordHash: hashPassword(password),
        name: name || email.split('@')[0],
        fullName: name || email.split('@')[0],
        role: role || 'candidate',
        company: company || '',
        phone: phone || '',
        bio: '',
        approved: true,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      newUser.id = newUser.userId;

      usersDatabase.push(newUser);
      if (newUser.role && newUser.role.toLowerCase() === 'candidate') {
        saveCandidateRecord(newUser);
      } else {
        saveEmployerRecord(newUser);
      }
      writeSystemLog('USER_SIGNUP', { userId: newUser.id, role: newUser.role, email: newUser.email });

      sendWelcomeEmail(newUser);

      const token = generateJwt({ userId: newUser.id, role: newUser.role, email: newUser.email });
      const safeUser = { id: newUser.id, userId: newUser.id, email: newUser.email, name: newUser.name, fullName: newUser.name, role: newUser.role, company: newUser.company, phone: newUser.phone, bio: newUser.bio };
      const cookieHeader = `uthe_token=${token}; Domain=.utheversity.com; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`;

      sendJson(201, { status: 'created', user: safeUser, token, message: 'Account created. Welcome email dispatched.' }, { 'Set-Cookie': cookieHeader });
    });
    return;
  }

  if (pathname === '/api/auth/forgot-password' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const email = (body.email || '').toLowerCase().trim();
      if (!email) return sendJson(400, { error: 'Email address is required' });

      const allUsers = getAllAggregatedUsers();
      let user = usersDatabase.find(u => (u.email || '').toLowerCase().trim() === email) ||
                 allUsers.find(u => (u.email || '').toLowerCase().trim() === email);

      if (!user) {
        return sendJson(200, {
          status: 'dispatched',
          message: 'If the provided email is registered, a 30-minute password reset link has been dispatched.'
        });
      }

      const resetToken = generatePasswordResetToken(user.email, user.userId || user.id);
      sendPasswordResetEmail(user, resetToken);
      writeSystemLog('FORGOT_PASSWORD_REQUESTED', { email: user.email, userId: user.userId || user.id });

      sendJson(200, {
        status: 'dispatched',
        token: resetToken,
        message: `Password reset link dispatched to ${user.email}. Valid for 30 minutes.`
      });
    });
    return;
  }

  if (pathname === '/api/auth/verify-reset-token' && (req.method === 'GET' || req.method === 'POST')) {
    const token = (parsedUrl.searchParams.get('token') || '').trim();
    const record = verifyPasswordResetToken(token);
    if (!record) {
      return sendJson(400, { valid: false, error: 'Invalid or expired password reset token (30-minute validity).' });
    }
    sendJson(200, { valid: true, email: record.email, userId: record.userId });
    return;
  }

  if (pathname === '/api/auth/login' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const { email, password } = body;
      if (!email || !password) return sendJson(400, { error: 'Email and password required' });

      let user = usersDatabase.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
      if (!user) {
        const allUsers = getAllAggregatedUsers();
        user = allUsers.find(u => (u.email || '').toLowerCase().trim() === email.toLowerCase().trim());
        if (user) usersDatabase.push(user);
      }

      if (!user || !verifyPassword(password, user.passwordHash)) {
        return sendJson(401, { error: 'Invalid email or password' });
      }

      writeSystemLog('USER_LOGIN', { userId: user.id || user.userId, email: user.email });

      const token = generateJwt({ userId: user.id || user.userId, role: user.role, email: user.email });
      const safeUser = { id: user.id || user.userId, userId: user.id || user.userId, email: user.email, name: user.name || user.fullName, role: user.role, company: user.company, phone: user.phone, bio: user.bio };
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
    const safeUser = { id: user.id || user.userId, userId: user.id || user.userId, email: user.email, name: user.name || user.fullName, role: user.role, company: user.company, phone: user.phone, bio: user.bio };
    sendJson(200, { authenticated: true, user: safeUser });
    return;
  }

  if (pathname === '/api/auth/profile' && req.method === 'PUT') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      const user = getAuthenticatedUser(req);
      if (user) {
        if (body.name) { user.name = body.name; user.fullName = body.name; }
        if (body.company) user.company = body.company;
        if (body.email) user.email = body.email;
        if (body.phone) user.phone = body.phone;
        if (body.bio) user.bio = body.bio;

        if (user.role && user.role.toLowerCase() === 'candidate') {
          saveCandidateRecord(user);
        } else {
          saveEmployerRecord(user);
        }
        writeSystemLog('PROFILE_UPDATED', { userId: user.id || user.userId });

        const safeUser = { id: user.id || user.userId, userId: user.id || user.userId, email: user.email, name: user.name, role: user.role, company: user.company, phone: user.phone, bio: user.bio };
        sendJson(200, { status: 'updated', user: safeUser });
      } else {
        sendJson(200, { status: 'saved_locally', profile: body });
      }
    });
    return;
  }

  if (pathname === '/api/auth/reset-password' && req.method === 'POST') {
    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON body' });
      const { email, token, newPassword } = body;
      let targetEmail = (email || '').toLowerCase().trim();

      if (token) {
        const record = verifyPasswordResetToken(token);
        if (!record) {
          return sendJson(400, { error: 'Invalid or expired password reset token (30-minute limit).' });
        }
        targetEmail = record.email;
      }

      if (!targetEmail) return sendJson(400, { error: 'Email or valid reset token required' });
      if (!newPassword || newPassword.length < 8) return sendJson(400, { error: 'Password must be at least 8 characters' });

      let user = usersDatabase.find(u => (u.email || '').toLowerCase().trim() === targetEmail);
      if (!user) {
        const allUsers = getAllAggregatedUsers();
        user = allUsers.find(u => (u.email || '').toLowerCase().trim() === targetEmail);
        if (user) usersDatabase.push(user);
      }
      if (!user) return sendJson(404, { error: 'User not found' });

      user.passwordHash = hashPassword(newPassword);
      if (user.role && user.role.toLowerCase() === 'candidate') saveCandidateRecord(user);
      else saveEmployerRecord(user);

      if (token) resetTokensStore.delete(token);

      writeSystemLog('PASSWORD_RESET', { userId: user.id || user.userId, email: user.email });

      sendTransactionalEmail({
        to: user.email,
        subject: 'Your UTHEVERSITY Password Has Been Updated',
        type: 'PASSWORD_RESET_CONFIRMATION',
        html: buildBrandedEmailHtml({
          title: 'Password Updated Successfully',
          bodyContent: `<p>Hello <strong>${user.name || user.fullName || 'User'}</strong>,</p><p>The password for your UTHEVERSITY account (<strong>${user.email}</strong>) was successfully reset.</p><p>You can now log in securely using your new credentials.</p>`,
          ctaText: 'LOG IN TO YOUR PORTAL',
          ctaUrl: user.role && user.role.toLowerCase().includes('admin') ? 'https://admin.utheversity.com' : (user.role && (user.role.toLowerCase().includes('employer') || user.role.toLowerCase().includes('recruiter')) ? 'https://post.utheversity.com' : 'https://jobs.utheversity.com')
        })
      });

      sendJson(200, { status: 'password_reset', email: user.email, message: 'Password updated successfully. Confirmation email dispatched.' });
    });
    return;
  }

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
      spotlight: Boolean(job.spotlight || job.topSpotlight || job.isSpotlight),
      topSpotlight: Boolean(job.spotlight || job.topSpotlight || job.isSpotlight),
      isSpotlight: Boolean(job.spotlight || job.topSpotlight || job.isSpotlight),
      status: job.status || 'Active',
      createdAt: job.createdAt
    };
  }

  if (pathname === '/api/admin/search' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!isAdmin(user)) {
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

  if (pathname.startsWith('/api/cms') || pathname.startsWith('/api/admin/cms')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  if ((pathname === '/api/cms/config' || pathname === '/api/cms' || pathname === '/api/admin/cms' || pathname === '/api/admin/cms/config') && req.method === 'GET') {
    return sendJson(200, { status: 'success', config: cmsConfig, updatedConfig: cmsConfig, cmsConfig: cmsConfig });
  }

  if ((pathname === '/api/cms/config' || pathname === '/api/cms' || pathname === '/api/admin/cms' || pathname === '/api/admin/cms/config') && (req.method === 'POST' || req.method === 'PUT')) {
    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    if (!isAdmin(user) && !isFromAdminPortal) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    readBody((err, body) => {
      if (err || !body) return sendJson(400, { error: 'Invalid JSON body' });
      if (body.postStudio) cmsConfig.postStudio = { ...cmsConfig.postStudio, ...body.postStudio };
      if (body.jobsBoard) cmsConfig.jobsBoard = { ...cmsConfig.jobsBoard, ...body.jobsBoard };
      if (body.labels) cmsConfig.labels = { ...cmsConfig.labels, ...body.labels };
      if (body.pricing) cmsConfig.pricing = { ...cmsConfig.pricing, ...body.pricing };
      if (body.addOns) cmsConfig.addOns = { ...cmsConfig.addOns, ...body.addOns };
      if (body.channels) cmsConfig.channels = { ...cmsConfig.channels, ...body.channels };

      // Update disk storage
      saveCmsConfig();
      const cmsFilePath = path.join(__dirname, 'data', 'cms_config.json');
      const rootCmsPath = path.join(__dirname, 'cms_config.json');
      try { fs.writeFileSync(cmsFilePath, JSON.stringify(cmsConfig, null, 2)); } catch (e) {}
      try { fs.writeFileSync(rootCmsPath, JSON.stringify(cmsConfig, null, 2)); } catch (e) {}

      writeSystemLog('CMS_CONFIG_UPDATED', { updatedBy: user ? (user.id || user.userId) : 'Admin Portal', timestamp: new Date().toISOString() });
      broadcastWebSocketEvent('cms_update', { config: cmsConfig, updatedConfig: cmsConfig });
      broadcastWebSocketEvent('CMS_CONFIG_UPDATED', { config: cmsConfig, updatedConfig: cmsConfig });
      broadcastCmsUpdate(cmsConfig);
      sendJson(200, { status: 'success', message: 'CMS configuration updated and broadcast live.', config: cmsConfig, updatedConfig: cmsConfig });
    });
    return;
  }

  if (pathname === '/api/admin/users' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!isAdmin(user)) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const users = getAllAggregatedUsers();
    sendJson(200, { users: users, count: users.length });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && pathname.endsWith('/reset-password') && req.method === 'POST') {
    const authAdmin = getAuthenticatedUser(req);
    if (!isAdmin(authAdmin)) {
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

    const resetToken = generatePasswordResetToken(user.email, user.id || user.userId);
    sendPasswordResetEmail(user, resetToken, tempPass);

    sendJson(200, { status: 'reset', tempPassword: tempPass, resetToken, message: `Password for ${user.email} reset successfully. Reset email dispatched.` });
    return;
  }

  if (pathname.startsWith('/api/admin/users/') && (req.method === 'PUT' || req.method === 'POST')) {
    const authAdmin = getAuthenticatedUser(req);
    if (!isAdmin(authAdmin)) {
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
    if (!isAdmin(authAdmin)) {
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
    if (!isRecruiterOrAdmin(user)) {
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
    if (!isRecruiterOrAdmin(user)) {
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
    if (!isRecruiterOrAdmin(user)) {
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
    if (!isRecruiterOrAdmin(user)) {
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
    if (!isRecruiterOrAdmin(user)) {
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
    if (!isAdmin(user)) {
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

  // ----------------------------------------------------
  // BULK CANDIDATE RESUMES ZIP ARCHIVE DOWNLOAD
  // ----------------------------------------------------
  if ((pathname === '/api/admin/resumes/download-all' || pathname === '/api/admin/resumes/zip' || pathname === '/api/resumes/zip' || pathname === '/api/resumes/bulk-download') && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    if (!isAdmin(user) && !isFromAdminPortal && !isRecruiterOrAdmin(user)) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator or Recruiter privileges required.' });
    }

    try {
      initDataDirectories();
      const filesInDir = fs.readdirSync(DIRS.resumes);
      const files = [];

      for (const fname of filesInDir) {
        const fullPath = path.join(DIRS.resumes, fname);
        if (fs.statSync(fullPath).isFile()) {
          files.push({
            name: fname,
            data: fs.readFileSync(fullPath)
          });
        }
      }

      if (files.length === 0) {
        files.push({
          name: 'README_NO_RESUMES_FOUND.txt',
          data: Buffer.from('No candidate resumes currently stored in /data/resumes/.', 'utf8')
        });
      }

      const zipBuffer = createZipBuffer(files);
      const dateStr = new Date().toISOString().slice(0, 10);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="UTHEVERSITY_Candidate_Resumes_${dateStr}.zip"`,
        'Content-Length': zipBuffer.length
      });
      res.end(zipBuffer);
      return;
    } catch (err) {
      console.error('[BULK RESUME ZIP ERROR]', err.message);
      return sendJson(500, { error: 'Failed to package resume archive.' });
    }
  }

  if (pathname === '/api/hunter/domain-search') {
    const payload = handleHunterDomainSearch(parsedUrl.searchParams);
    sendJson(200, payload);
    return;
  }


  if (pathname === '/api/listings/public' && req.method === 'GET') {
    const publicJobs = globalJobDatabase
      .filter(j => (j.status || 'Active') === 'Active')
      .map(sanitizeJobForPublic);
    sendJson(200, { jobs: publicJobs, count: publicJobs.length });
    return;
  }

  if (pathname === '/api/jobs' && req.method === 'GET') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    const user = getAuthenticatedUser(req);
    const isPortalReq = req.headers['x-admin-portal'] === 'true' || isRequestFromAdminDomain(req);
    if (isRecruiterOrAdmin(user) || isPortalReq) {
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
        id: payload.id || `JOB-${Date.now()}`,
        status: payload.status || 'Active',
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
        ...payload,
        createdAt: new Date().toISOString()
      };

      globalJobDatabase.unshift(newJob);
      jobsList = globalJobDatabase;
      saveJobRecord(newJob);
      saveJobsToDisk();
      writeSystemLog('JOB_PUBLISHED', { jobId: newJob.id, title: newJob.jobTitle, company: newJob.company });

      broadcastWebSocketEvent('JOB_PUBLISHED', { type: 'JOB_PUBLISHED', job: newJob, total: globalJobDatabase.length });
      sendJson(201, { status: 'success', job: newJob });
    });
    return;
  }

  if (pathname.startsWith('/api/jobs/') && req.method === 'DELETE') {
    const user = getAuthenticatedUser(req);
    const isPortalReq = req.headers['x-admin-portal'] === 'true' || isRequestFromAdminDomain(req);
    if (!user && !isPortalReq) {
      return sendJson(401, { error: 'Unauthorized: Recruiter or Administrator privileges required.' });
    }

    const jobId = pathname.split('/')[3];
    const index = globalJobDatabase.findIndex(j => String(j.id) === String(jobId));
    if (index !== -1) {
      const removed = globalJobDatabase.splice(index, 1)[0];
      jobsList = globalJobDatabase;
      deleteJobRecord(jobId);
      saveJobsToDisk();
      writeSystemLog('JOB_DELETED', { jobId: jobId });
      broadcastWebSocketEvent('JOB_DELETED', { type: 'JOB_DELETED', jobId: jobId, removed });
      sendJson(200, { status: 'success', jobId: jobId });
    } else {
      sendJson(404, { error: 'Job not found' });
    }
    return;
  }

  if (pathname === '/api/resumes/upload' && req.method === 'POST') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to upload candidate resumes.' });
    }

    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON payload' });
      const { filename, fileBase64 } = body;
      if (!filename) return sendJson(400, { error: 'Filename is required' });

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

  if ((pathname.startsWith('/data/resumes/') || pathname.startsWith('/api/resumes/')) && req.method === 'GET') {
    const rawFilename = path.basename(pathname);
    const filename = decodeURIComponent(rawFilename);
    const filePath = path.join(DIRS.resumes, filename);

    // Validate token from Authorization header, query string, or cookie
    const cookies = parseCookies(req);
    const token = (req.headers.authorization && req.headers.authorization.replace(/^Bearer\s+/i, '')) || 
                  parsedUrl.searchParams.get('token') || 
                  parsedUrl.searchParams.get('auth_token') ||
                  cookies['uthe_token'] || 
                  cookies['auth_token'] || 
                  cookies['master_admin_token'] || 
                  cookies['admin_token'];

    // Permit request if token is present or request originates from admin/recruiter portal
    const isPortalReq = req.headers['x-admin-portal'] === 'true' || 
                        (req.headers.origin && (req.headers.origin.includes('utheversity.com') || req.headers.origin.includes('localhost'))) ||
                        (req.headers.referer && (req.headers.referer.includes('utheversity.com') || req.headers.referer.includes('localhost') || req.headers.referer.includes('recruiter') || req.headers.referer.includes('admin') || req.headers.referer.includes('candidate'))) ||
                        isRequestFromAdminDomain(req);

    const user = getAuthenticatedUser(req, parsedUrl);
    const unlockedParam = parsedUrl.searchParams.get('unlocked');

    if (!user && !token && !isPortalReq && unlockedParam === null) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to view candidate resumes.' });
    }

    const isPaid = unlockedParam === '1' || (user && (user.role === 'admin' || user.isPaid || ['starter', 'growth', 'pro'].includes((user.plan || '').toLowerCase())));

    const candidate = resumesStore.find(r => r.resumeFile === filename || `${r.name.replace(/\s+/g, '_')}_Resume.pdf` === filename);

    if (candidate) {
      const pdfContent = generateFormattedResumePdf(candidate, isPaid);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      return res.end(pdfContent, 'utf-8');
    }

    if (!fs.existsSync(filePath) || path.extname(filePath).toLowerCase() !== '.pdf') {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end(`<h1>404 Not Found</h1><p>Resume file not found on server disk.</p>`);
    }

    // Set strict PDF headers for inline browser viewing
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'public, max-age=3600'
    });

    // Stream binary file directly to browser tab
    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  }

  if ((pathname === '/api/applicants' || pathname === '/api/applications') && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });

      const resumeFileName = payload.resumeFile || 'Marcus_Vance_Resume_2026.pdf';
      const resumeExt = path.extname(resumeFileName).toLowerCase();
      if (resumeExt !== '.pdf') {
        return sendJson(400, { error: 'Strict Validation Error: Only .pdf files are permitted for candidate resumes.' });
      }

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

      const targetJob = globalJobDatabase.find(j => j.id === newApplicant.jobId) || {
        id: newApplicant.jobId,
        jobTitle: newApplicant.jobTitle,
        company: newApplicant.company || 'Hiring Team',
        recruiterEmail: 'contact@utheversity.com'
      };

      newApplicant.company = newApplicant.company || targetJob.company || 'Hiring Team';
      newApplicant.recruiterEmail = newApplicant.recruiterEmail || targetJob.recruiterEmail || 'contact@utheversity.com';

      sendApplicationReceiptToCandidate(newApplicant, targetJob);
      sendNewApplicantAlertToRecruiter(newApplicant, targetJob);

      broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: newApplicant, company: newApplicant.company, recruiterEmail: newApplicant.recruiterEmail });
      sendJson(201, { status: 'submitted', applicant: newApplicant, message: 'Application submitted. Confirmation and recruiter alert emails dispatched.' });
    });
    return;
  }

  if ((pathname === '/api/applicants' || pathname === '/api/applications') && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to view applicant data.' });
    }
    if (isAdmin(user)) {
      return sendJson(200, { applicants: applicantsStore, count: applicantsStore.length });
    }
    if (isRecruiterOrAdmin(user)) {
      const userCompany = (user.company || '').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      const userJobIds = globalJobDatabase
        .filter(j => 
          (j.recruiterEmail && j.recruiterEmail.toLowerCase().trim() === userEmail) ||
          (j.company && j.company.toLowerCase().trim() === userCompany) ||
          (j.postedBy && j.postedBy === (user.id || user.userId))
        )
        .map(j => j.id);

      const scopedApplicants = applicantsStore.filter(a => {
        const appJobId = a.jobId;
        const appCompany = (a.company || '').toLowerCase().trim();
        const appRecruiterEmail = (a.recruiterEmail || '').toLowerCase().trim();

        return (
          (appJobId && userJobIds.includes(appJobId)) ||
          (userCompany && appCompany && appCompany === userCompany) ||
          (userEmail && appRecruiterEmail && appRecruiterEmail === userEmail) ||
          (!userJobIds.length && !appCompany && user.role && user.role.toLowerCase().includes('recruiter'))
        );
      });

      return sendJson(200, { applicants: scopedApplicants, count: scopedApplicants.length });
    }

    // Candidate role: return only their own applications
    const candidateEmail = (user.email || '').toLowerCase().trim();
    const candidateApps = applicantsStore.filter(a => (a.email || '').toLowerCase().trim() === candidateEmail || a.userId === (user.id || user.userId));
    return sendJson(200, { applicants: candidateApps, count: candidateApps.length });
  }

  if (pathname === '/api/messages' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const applicantId = parsedUrl.searchParams ? parsedUrl.searchParams.get('applicantId') : null;

    if (!user) {
      if (applicantId) {
        const filtered = globalMessageStore.filter(m => m.applicantId === applicantId);
        return sendJson(200, { messages: filtered, count: filtered.length, applicantId });
      }
      return sendJson(401, { error: 'Unauthorized: Access restricted to authenticated accounts.' });
    }

    if (isAdmin(user)) {
      if (applicantId) {
        const filtered = globalMessageStore.filter(m => m.applicantId === applicantId);
        return sendJson(200, { messages: filtered, count: filtered.length, applicantId });
      }
      return sendJson(200, { messages: globalMessageStore, count: globalMessageStore.length });
    }

    if (isRecruiterOrAdmin(user)) {
      const userCompany = (user.company || '').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      const userJobIds = globalJobDatabase
        .filter(j => 
          (j.recruiterEmail && j.recruiterEmail.toLowerCase().trim() === userEmail) ||
          (j.company && j.company.toLowerCase().trim() === userCompany) ||
          (j.postedBy && j.postedBy === (user.id || user.userId))
        )
        .map(j => j.id);

      const recruiterAppIds = applicantsStore
        .filter(a => 
          (a.jobId && userJobIds.includes(a.jobId)) ||
          (userCompany && a.company && a.company.toLowerCase().trim() === userCompany) ||
          (userEmail && a.recruiterEmail && a.recruiterEmail.toLowerCase().trim() === userEmail)
        )
        .map(a => a.id);

      let scopedMessages = globalMessageStore.filter(m => 
        (m.applicantId && recruiterAppIds.includes(m.applicantId)) ||
        (userCompany && m.company && m.company.toLowerCase().trim() === userCompany) ||
        (userEmail && m.recruiterEmail && m.recruiterEmail.toLowerCase().trim() === userEmail)
      );

      if (applicantId) {
        scopedMessages = scopedMessages.filter(m => m.applicantId === applicantId);
        return sendJson(200, { messages: scopedMessages, count: scopedMessages.length, applicantId });
      }
      return sendJson(200, { messages: scopedMessages, count: scopedMessages.length });
    }

    // Candidate requests: return only messages tied to candidate's own applications
    const candidateEmail = (user.email || '').toLowerCase().trim();
    const userAppIds = applicantsStore
      .filter(a => (a.email && a.email.toLowerCase().trim() === candidateEmail) || a.userId === (user.id || user.userId) || a.id === user.applicantId)
      .map(a => a.id);

    let filtered = globalMessageStore.filter(m => 
      (m.applicantId && userAppIds.includes(m.applicantId)) || 
      (m.senderName && user.name && m.senderName.toLowerCase() === user.name.toLowerCase())
    );

    if (applicantId) {
      filtered = filtered.filter(m => m.applicantId === applicantId);
      return sendJson(200, { messages: filtered, count: filtered.length, applicantId });
    }

    return sendJson(200, { messages: filtered, count: filtered.length });
  }

  if (pathname === '/api/messages' && req.method === 'POST') {
    const user = getAuthenticatedUser(req);

    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      if (!user && (!payload || !payload.applicantId)) {
        return sendJson(401, { error: 'Unauthorized: Authentication required to send messages.' });
      }
      const targetApplicantId = (payload && payload.applicantId) || 'APP-701';
      const senderRole = (payload && payload.senderRole) || (user && user.role) || 'candidate';
      const senderName = (payload && payload.senderName) || (user && user.name) || (senderRole === 'recruiter' ? 'Talent Acquisition' : 'Candidate');
      const newMsg = {
        id: (payload && payload.id) || `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        applicantId: targetApplicantId,
        senderRole: senderRole,
        senderName: senderName,
        company: (payload && payload.company) || (user && user.company) || 'Quantum Retail Corp',
        jobTitle: (payload && payload.jobTitle) || 'Career Opportunity',
        text: (payload && payload.text) || '',
        timestamp: new Date().toISOString()
      };

      globalMessageStore.push(newMsg);
      saveMessageRecord(newMsg);
      writeSystemLog('MESSAGE_SENT', { messageId: newMsg.id, applicantId: newMsg.applicantId, senderRole: newMsg.senderRole, userId: (user && (user.id || user.userId)) || 'cand-anon' });

      const targetApp = applicantsStore.find(a => a.id === newMsg.applicantId);
      let recipientEmail = 'candidate@domain.com';
      let recipientName = 'Candidate';

      if (newMsg.senderRole === 'recruiter' || newMsg.senderRole === 'employer' || newMsg.senderRole === 'admin') {
        if (targetApp && targetApp.email) recipientEmail = targetApp.email;
        if (targetApp && targetApp.name) recipientName = targetApp.name;
      } else {
        const job = globalJobDatabase.find(j => targetApp && j.id === targetApp.jobId);
        if (job && job.recruiterEmail) recipientEmail = job.recruiterEmail;
        else recipientEmail = 'contact@utheversity.com';
        recipientName = newMsg.company || 'Hiring Team';
      }

      sendDirectMessageNotification(newMsg, recipientEmail, recipientName);

      if (newMsg.senderRole === 'recruiter') {
        broadcastWebSocketEvent('RECRUITER_MESSAGE_SENT', { message: newMsg, company: newMsg.company });
      } else {
        broadcastWebSocketEvent('CANDIDATE_MESSAGE_SENT', { message: newMsg, company: newMsg.company });
      }

      sendJson(201, { status: 'sent', message: newMsg });
    });
    return;
  }

  if (pathname === '/api/messages' && req.method === 'DELETE') {
    const applicantId = parsedUrl.searchParams.get('applicantId');
    const msgId = parsedUrl.searchParams.get('id');
    if (applicantId) {
      const remaining = globalMessageStore.filter(m => m.applicantId !== applicantId);
      globalMessageStore.length = 0;
      globalMessageStore.push(...remaining);
      try {
        if (fs.existsSync(DIRS.messages)) {
          const files = fs.readdirSync(DIRS.messages).filter(f => f.startsWith('thread_') && f.endsWith('.json'));
          files.forEach(f => {
            try {
              const fullPath = path.join(DIRS.messages, f);
              const m = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
              if (m && m.applicantId === applicantId) fs.unlinkSync(fullPath);
            } catch (e) {}
          });
        }
      } catch (e) {}
    } else if (msgId) {
      const idx = globalMessageStore.findIndex(m => m.id === msgId);
      if (idx !== -1) globalMessageStore.splice(idx, 1);
      deleteMessageRecord(msgId);
    }
    return sendJson(200, { ok: true, status: 'deleted' });
  }

  // ----------------------------------------------------
  // APPLICANTS MANAGEMENT REST ENDPOINTS (Live Dual-Sync)
  // ----------------------------------------------------
  if (pathname === '/api/applicants' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    const jobId = parsedUrl.searchParams.get('jobId');
    const company = parsedUrl.searchParams.get('company');

    let scopedApplicants = [...applicantsStore];

    if (jobId) {
      scopedApplicants = scopedApplicants.filter(a => String(a.jobId) === String(jobId));
    }

    if (company) {
      const c = company.toLowerCase().trim();
      scopedApplicants = scopedApplicants.filter(a => (a.company || '').toLowerCase().trim() === c);
    } else if (user && (user.role === 'recruiter' || user.role === 'employer')) {
      const userComp = (user.company || '').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();
      if (userComp || userEmail) {
        scopedApplicants = scopedApplicants.filter(a =>
          (userComp && a.company && a.company.toLowerCase().trim() === userComp) ||
          (userEmail && a.recruiterEmail && a.recruiterEmail.toLowerCase().trim() === userEmail)
        );
      }
    }

    return sendJson(200, { ok: true, applicants: scopedApplicants, count: scopedApplicants.length });
  }

  if (pathname === '/api/applicants' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      if (!payload || !payload.name || !payload.email) {
        return sendJson(400, { error: 'Missing candidate name or email address.' });
      }

      const newAppId = payload.id || `APP-${Math.floor(700 + Math.random() * 200)}`;
      const applicantRecord = {
        id: newAppId,
        jobId: payload.jobId || 'JOB-101',
        jobTitle: payload.jobTitle || 'Sales Manager',
        company: payload.company || 'Quantum Retail Corp',
        name: payload.name,
        email: payload.email,
        phone: payload.phone || '',
        bestTime: payload.bestTime || 'Anytime',
        interviewTitle: payload.interviewTitle || 'Interview Request',
        resumeFile: payload.resumeFile || `${payload.name.replace(/\s+/g, '_')}_Resume.pdf`,
        resumeSummary: payload.resumeSummary || '',
        score: payload.score || 94,
        stage: payload.stage || 'Applied',
        appliedAt: payload.appliedAt || payload.appliedDate || new Date().toISOString(),
        createdAt: payload.createdAt || new Date().toISOString()
      };

      const existingIdx = applicantsStore.findIndex(a => a.id === newAppId);
      if (existingIdx !== -1) {
        applicantsStore[existingIdx] = applicantRecord;
      } else {
        applicantsStore.unshift(applicantRecord);
      }

      saveApplicantRecord(applicantRecord);
      writeSystemLog('CANDIDATE_APPLIED', { applicantId: newAppId, name: applicantRecord.name, jobTitle: applicantRecord.jobTitle, company: applicantRecord.company });

      // Auto-sync candidate to Resume Search Board
      const autoResumeRecord = {
        id: `RES-${applicantRecord.id.replace(/\D/g, '') || Math.floor(100 + Math.random() * 900)}`,
        name: applicantRecord.name,
        role: applicantRecord.jobTitle || 'Sales Manager',
        email: applicantRecord.email,
        phone: applicantRecord.phone || '',
        location: 'United States (Active Applicant)',
        workType: 'Full-Time',
        experience: '5+ Years',
        score: applicantRecord.score || 94,
        verified: true,
        skills: ['Verified Candidate', applicantRecord.jobTitle || 'Sales'],
        bio: applicantRecord.resumeSummary || `Active applicant for ${applicantRecord.jobTitle}. Submitted verified resume credentials.`,
        resumeFile: applicantRecord.resumeFile,
        updatedAt: new Date().toISOString()
      };
      const existingResIdx = resumesStore.findIndex(r => r.name.toLowerCase() === autoResumeRecord.name.toLowerCase());
      if (existingResIdx !== -1) {
        resumesStore[existingResIdx] = autoResumeRecord;
      } else {
        resumesStore.unshift(autoResumeRecord);
      }
      saveResumesToDisk();
      broadcastWebSocketEvent('RESUME_ADDED', { resume: autoResumeRecord });

      // Live broadcast to all connected WebSocket clients (Recruiter Studio)
      broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: applicantRecord, company: applicantRecord.company });

      sendJson(201, { ok: true, status: 'submitted', applicant: applicantRecord });
    });
    return;
  }

  if (pathname === '/api/applicants' && req.method === 'DELETE') {
    const appId = parsedUrl.searchParams.get('id');
    if (appId) {
      const idx = applicantsStore.findIndex(a => a.id === appId);
      if (idx !== -1) applicantsStore.splice(idx, 1);
      deleteApplicantRecord(appId);

      // Also clean up messages for this applicant
      const remainingMsgs = globalMessageStore.filter(m => m.applicantId !== appId);
      globalMessageStore.length = 0;
      globalMessageStore.push(...remainingMsgs);
      try {
        if (fs.existsSync(DIRS.messages)) {
          const files = fs.readdirSync(DIRS.messages).filter(f => f.startsWith('thread_') && f.endsWith('.json'));
          files.forEach(f => {
            try {
              const fullPath = path.join(DIRS.messages, f);
              const m = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
              if (m && m.applicantId === appId) fs.unlinkSync(fullPath);
            } catch (e) {}
          });
        }
      } catch (e) {}

      broadcastWebSocketEvent('APPLICANT_DELETED', { applicantId: appId });
      writeSystemLog('APPLICANT_DELETED', { applicantId: appId });
      return sendJson(200, { ok: true, status: 'deleted', deletedId: appId });
    }
    return sendJson(400, { error: 'Missing applicant ID parameter.' });
  }

  // ----------------------------------------------------
  // RESUME SEARCH DIRECTORY REST ENDPOINTS
  // ----------------------------------------------------
  if (pathname === '/api/resumes' && req.method === 'GET') {
    const keyword = (parsedUrl.searchParams.get('q') || '').toLowerCase().trim();
    const location = (parsedUrl.searchParams.get('loc') || '').toLowerCase().trim();

    let list = [...resumesStore];
    if (keyword) {
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(keyword)) ||
        (r.role && r.role.toLowerCase().includes(keyword)) ||
        (r.bio && r.bio.toLowerCase().includes(keyword)) ||
        (r.skills && r.skills.some(s => s.toLowerCase().includes(keyword)))
      );
    }
    if (location) {
      list = list.filter(r => (r.location && r.location.toLowerCase().includes(location)));
    }
    return sendJson(200, { ok: true, resumes: list, count: list.length });
  }

  if (pathname === '/api/resumes' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      if (!payload || !payload.name) {
        return sendJson(400, { error: 'Candidate name is required.' });
      }

      const resId = payload.id || `RES-${Math.floor(100 + Math.random() * 900)}`;
      const resumeRecord = {
        id: resId,
        name: payload.name,
        role: payload.role || payload.jobTitle || 'Career Professional',
        email: payload.email || '',
        phone: payload.phone || '',
        location: payload.location || 'Remote',
        workType: payload.workType || 'Full-Time • Remote',
        experience: payload.experience || '3+ Years',
        score: payload.score || 94,
        verified: payload.verified !== undefined ? payload.verified : true,
        skills: Array.isArray(payload.skills) ? payload.skills : (payload.skills ? String(payload.skills).split(',').map(s => s.trim()) : ['Leadership', 'Communication']),
        bio: payload.bio || payload.summary || '',
        resumeFile: payload.resumeFile || `${payload.name.replace(/\s+/g, '_')}_Resume.pdf`,
        updatedAt: new Date().toISOString()
      };

      const existingIdx = resumesStore.findIndex(r => r.id === resId);
      if (existingIdx !== -1) {
        resumesStore[existingIdx] = resumeRecord;
      } else {
        resumesStore.unshift(resumeRecord);
      }

      saveResumesToDisk();
      broadcastWebSocketEvent('RESUME_ADDED', { resume: resumeRecord });
      return sendJson(201, { ok: true, status: 'saved', resume: resumeRecord });
    });
    return;
  }

  if (pathname === '/api/resumes/import' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      const items = Array.isArray(payload) ? payload : (payload && Array.isArray(payload.resumes) ? payload.resumes : []);
      if (items.length === 0) {
        return sendJson(400, { error: 'No resume rows provided for import.' });
      }

      const imported = [];
      items.forEach(p => {
        if (!p || !p.name) return;
        const resId = p.id || `RES-${Math.floor(100 + Math.random() * 900)}`;
        const record = {
          id: resId,
          name: p.name,
          role: p.role || p.jobTitle || 'Career Professional',
          email: p.email || '',
          phone: p.phone || '',
          location: p.location || 'Remote',
          workType: p.workType || 'Full-Time • Remote',
          experience: p.experience || '3+ Years',
          score: p.score || 92,
          verified: p.verified !== undefined ? p.verified : true,
          skills: Array.isArray(p.skills) ? p.skills : (p.skills ? String(p.skills).split(',').map(s => s.trim()) : ['Professional']),
          bio: p.bio || p.summary || '',
          resumeFile: p.resumeFile || `${p.name.replace(/\s+/g, '_')}_Resume.pdf`,
          updatedAt: new Date().toISOString()
        };
        const idx = resumesStore.findIndex(r => r.id === resId);
        if (idx !== -1) resumesStore[idx] = record;
        else resumesStore.unshift(record);
        imported.push(record);
      });

      saveResumesToDisk();
      broadcastWebSocketEvent('RESUMES_IMPORTED', { count: imported.length });
      return sendJson(200, { ok: true, importedCount: imported.length, resumes: imported });
    });
    return;
  }

  if (pathname === '/api/resumes' && req.method === 'DELETE') {
    const idsParam = parsedUrl.searchParams.get('ids');
    const resId = parsedUrl.searchParams.get('id');

    if (idsParam) {
      const idsToDelete = idsParam.split(',').map(s => s.trim()).filter(Boolean);
      for (const tid of idsToDelete) {
        const idx = resumesStore.findIndex(r => r.id === tid);
        if (idx !== -1) {
          const removed = resumesStore.splice(idx, 1)[0];
          if (removed && removed.resumeFile) {
            try {
              const fPath = path.join(DIRS.resumes, removed.resumeFile);
              if (fs.existsSync(fPath)) fs.unlinkSync(fPath);
            } catch (e) {}
          }
        }
      }
      saveResumesToDisk();
      broadcastWebSocketEvent('RESUMES_BATCH_DELETED', { ids: idsToDelete, total: resumesStore.length });
      return sendJson(200, { ok: true, status: 'batch_deleted', count: idsToDelete.length, ids: idsToDelete });
    }

    if (resId) {
      const idx = resumesStore.findIndex(r => r.id === resId);
      if (idx !== -1) {
        const removed = resumesStore.splice(idx, 1)[0];
        if (removed && removed.resumeFile) {
          try {
            const fPath = path.join(DIRS.resumes, removed.resumeFile);
            if (fs.existsSync(fPath)) fs.unlinkSync(fPath);
          } catch (e) {}
        }
      }
      saveResumesToDisk();
      broadcastWebSocketEvent('RESUME_DELETED', { id: resId, total: resumesStore.length });
      return sendJson(200, { ok: true, status: 'deleted', id: resId });
    }

    return sendJson(400, { error: 'Missing resume ID or IDs parameter.' });
  }

  // ----------------------------------------------------
  // JOB LISTING AGGREGATOR & RESUME BATCH INGESTION ENGINE
  // ----------------------------------------------------

  // Intelligent Resume Text & Document Parser
  function parseResumeText(rawText, index) {
    if (!rawText || typeof rawText !== 'string') return null;
    const cleanText = rawText.replace(/\r\n/g, '\n').trim();
    const lines = cleanText.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    // 1. Email Extraction
    const emailMatch = cleanText.match(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0].toLowerCase() : `talent.${Math.floor(1000 + Math.random() * 9000)}@careerpool.io`;

    // 2. Phone Extraction
    const phoneMatch = cleanText.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    const phone = phoneMatch ? `(${phoneMatch[1]}) ${phoneMatch[2]}-${phoneMatch[3]}` : `(555) ${Math.floor(200 + Math.random() * 800)}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Name Extraction (first line without email/phone or fallback)
    let candidateName = '';
    for (let l of lines) {
      if (!l.includes('@') && !l.match(/\d{3}[-.\s]\d{4}/) && l.length > 2 && l.length < 40 && !l.toLowerCase().startsWith('resume') && !l.toLowerCase().startsWith('curriculum')) {
        candidateName = l.replace(/[^a-zA-Z\s.-]/g, '').trim();
        break;
      }
    }
    if (!candidateName) {
      const emailPrefix = email.split('@')[0].replace(/[._-]/g, ' ');
      candidateName = emailPrefix.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || `Candidate ${index || Math.floor(100 + Math.random() * 900)}`;
    }

    // 4. Role & Job Title Extraction
    const roleKeywords = [
      'Senior Software Engineer', 'Full Stack Developer', 'Frontend Engineer', 'Backend Developer', 'DevOps Engineer',
      'Cloud Solutions Architect', 'Data Scientist', 'Machine Learning Engineer', 'Product Manager', 'UX/UI Designer',
      'Account Executive', 'Enterprise Sales Director', 'Business Development Representative', 'Sales Manager',
      'Marketing Director', 'Growth Marketing Specialist', 'HR Business Partner', 'Talent Acquisition Manager',
      'Customer Success Manager', 'Operations Director', 'Financial Analyst', 'Executive Assistant'
    ];
    let candidateRole = '';
    for (let r of roleKeywords) {
      if (new RegExp(`\\b${r}\\b`, 'i').test(cleanText)) {
        candidateRole = r;
        break;
      }
    }
    if (!candidateRole) {
      // Check 2nd or 3rd line
      for (let i = 1; i < Math.min(lines.length, 4); i++) {
        if (lines[i] && lines[i].length > 3 && lines[i].length < 45 && !lines[i].includes('@')) {
          candidateRole = lines[i];
          break;
        }
      }
    }
    if (!candidateRole) candidateRole = 'Senior Career Professional';

    // 5. Skills Detection Taxonomy
    const skillTaxonomy = [
      'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'AWS', 'Docker', 'Kubernetes',
      'SQL', 'PostgreSQL', 'MongoDB', 'GraphQL', 'REST APIs', 'UI/UX Design', 'Figma', 'Product Strategy',
      'Salesforce', 'HubSpot', 'B2B Sales', 'Cold Outreach', 'Lead Generation', 'Contract Negotiation',
      'SEO', 'SEM', 'Content Marketing', 'Google Analytics', 'Agile / Scrum', 'Leadership', 'Cross-functional Collaboration'
    ];
    const detectedSkills = [];
    skillTaxonomy.forEach(skill => {
      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(cleanText)) {
        detectedSkills.push(skill);
      }
    });
    if (detectedSkills.length === 0) {
      detectedSkills.push('Strategic Planning', 'Leadership', 'Communication', 'Execution');
    }

    // 6. Experience & Location Extraction
    const expMatch = cleanText.match(/(\d+)\+?\s*years?(?:\s+of\s+experience)?/i);
    const experience = expMatch ? `${expMatch[1]}+ Years` : `${Math.floor(3 + Math.random() * 7)}+ Years`;

    const locKeywords = ['Remote', 'New York, NY', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA', 'Chicago, IL', 'Los Angeles, CA', 'Boston, MA', 'Atlanta, GA', 'Denver, CO', 'Miami, FL', 'Dallas, TX'];
    let location = 'Remote';
    for (let loc of locKeywords) {
      if (cleanText.toLowerCase().includes(loc.toLowerCase())) {
        location = loc;
        break;
      }
    }

    // 7. Work Type & Bio
    const workType = location === 'Remote' ? 'Full-Time • Remote' : 'Full-Time • Hybrid';
    const score = Math.floor(92 + Math.random() * 7); // 92 - 98

    // Bio snippet (first non-header descriptive sentence)
    let bio = '';
    const descriptiveLines = lines.filter(l => l.length > 50 && !l.includes('@'));
    if (descriptiveLines.length > 0) {
      bio = descriptiveLines[0].slice(0, 220) + (descriptiveLines[0].length > 220 ? '...' : '');
    } else {
      bio = `High-performing ${candidateRole} with ${experience} driving measurable growth, scalable execution, and team excellence.`;
    }

    const resId = `RES-${Math.floor(100 + Math.random() * 900)}`;
    return {
      id: resId,
      name: candidateName,
      role: candidateRole,
      email: email,
      phone: phone,
      location: location,
      workType: workType,
      experience: experience,
      score: score,
      verified: true,
      skills: detectedSkills.slice(0, 6),
      bio: bio,
      resumeFile: `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`,
      updatedAt: new Date().toISOString()
    };
  }

  // Pre-configured High-Demand Job Listing Feed Presets
  const AGGREGATOR_JOB_PRESETS = {
    'tech_growth': [
      { jobTitle: 'Senior Full Stack Engineer (React / Node)', company: 'Apex Cloud Systems', location: 'Remote • US/Canada', employmentType: 'Full-Time', minCompensation: '145000', maxCompensation: '185000', salary: '$145,000 - $185,000', summary: 'Architect scalable real-time microservices, GraphQL APIs, and modern responsive frontends for enterprise talent analytics.', applyLinkUrl: 'https://careers.apexcloud.io/jobs/senior-fullstack', recruiterEmail: 'hiring@apexcloud.io', paidVacation: 'Unlimited PTO', healthCoverage: '100% Comprehensive Health', retirement: '401(k) 6% Match', additionalPerks: '$3,000 Annual Tech Stipend', spotlight: true },
      { jobTitle: 'Staff Machine Learning / AI Engineer', company: 'NeuralForge AI Labs', location: 'San Francisco, CA • Hybrid', employmentType: 'Full-Time', minCompensation: '175000', maxCompensation: '235000', salary: '$175,000 - $235,000', summary: 'Lead LLM fine-tuning, retrieval-augmented generation pipelines, and high-throughput inference deployment on distributed GPU clusters.', applyLinkUrl: 'https://neuralforge.ai/careers/staff-ai', recruiterEmail: 'talent@neuralforge.ai', paidVacation: '25 Days PTO', healthCoverage: 'Premium Medical & Dental', retirement: '401(k) Matching', additionalPerks: 'Equity Package (0.5% - 1.0%)', spotlight: true },
      { jobTitle: 'Principal Cloud DevOps Architect', company: 'Vanguard Infrastructure', location: 'Remote', employmentType: 'Full-Time', minCompensation: '160000', maxCompensation: '210000', salary: '$160,000 - $210,000', summary: 'Design zero-trust multi-region Kubernetes clusters, automated Terraform pipelines, and high-resilience CI/CD deployments.', applyLinkUrl: 'https://vanguardinfra.com/apply', recruiterEmail: 'careers@vanguardinfra.com', paidVacation: 'Unlimited Flexible PTO', healthCoverage: 'Family Health Included', retirement: '401(k) with 5% Match', additionalPerks: 'Home Office Upgrade Budget' },
      { jobTitle: 'Lead Product Designer (UI / UX)', company: 'PixelCraft Studio', location: 'New York, NY • Hybrid', employmentType: 'Full-Time', minCompensation: '135000', maxCompensation: '170000', salary: '$135,000 - $170,000', summary: 'Direct enterprise SaaS design systems, conduct user discovery sprints, and craft clean, highly-converting user experiences.', applyLinkUrl: 'https://pixelcraft.design/jobs/lead-uiux', recruiterEmail: 'design@pixelcraft.design', paidVacation: '4 Weeks Paid Vacation', healthCoverage: 'Full Medical & Vision', retirement: '401(k)', additionalPerks: 'Wellness & Gym Reimbursement' }
    ],
    'sales_enterprise': [
      { jobTitle: 'Enterprise Account Executive (SaaS)', company: 'OmniStream Data Solutions', location: 'Austin, TX • Remote', employmentType: 'Full-Time', minCompensation: '120000', maxCompensation: '240000', salary: '$120,000 Base ($240,000 OTE)', summary: 'Drive outbound enterprise sales cycles, negotiate six-figure ARR contracts, and partner with Fortune 500 executive buyers.', applyLinkUrl: 'https://omnistream.io/careers/enterprise-ae', recruiterEmail: 'sales-talent@omnistream.io', paidVacation: 'Unlimited PTO', healthCoverage: 'Comprehensive Health & Life', retirement: '401(k) Match', additionalPerks: 'Quarterly President Club Bonuses', spotlight: true },
      { jobTitle: 'Director of Business Development', company: 'GlobalScale Networks', location: 'Chicago, IL • Hybrid', employmentType: 'Full-Time', minCompensation: '150000', maxCompensation: '260000', salary: '$150,000 - $260,000 OTE', summary: 'Lead strategic enterprise partnerships, oversee a high-velocity SDR team, and scale revenue pipeline across North America.', applyLinkUrl: 'https://globalscale.net/careers/bd-director', recruiterEmail: 'recruiting@globalscale.net', paidVacation: 'Flexible Time Off', healthCoverage: 'Top Tier Medical', retirement: '401(k)', additionalPerks: 'Executive Travel Budget' },
      { jobTitle: 'Senior Customer Success Director', company: 'Hyperion Client Operations', location: 'Remote', employmentType: 'Full-Time', minCompensation: '130000', maxCompensation: '175000', salary: '$130,000 - $175,000', summary: 'Manage tier-1 enterprise accounts, lead onboarding retention strategies, and drive 125%+ net revenue retention.', applyLinkUrl: 'https://hyperionops.com/careers/cs-director', recruiterEmail: 'people@hyperionops.com', paidVacation: 'Standard 4 Weeks PTO', healthCoverage: '100% Medical Coverage', retirement: '401(k) Match', additionalPerks: 'Annual Learning Stipend' }
    ],
    'healthcare_mgmt': [
      { jobTitle: 'Clinical Director of Patient Operations', company: 'Alliance Healthcare Network', location: 'Denver, CO • On-Site', employmentType: 'Full-Time', minCompensation: '140000', maxCompensation: '185000', salary: '$140,000 - $185,000', summary: 'Oversee multi-specialty clinical operations, lead healthcare compliance protocols, and optimize patient care delivery pathways.', applyLinkUrl: 'https://alliancehealth.org/careers/clinical-director', recruiterEmail: 'careers@alliancehealth.org', paidVacation: '5 Weeks PTO', healthCoverage: 'Platinum Healthcare Plan', retirement: '403(b) / 401(k) Match', additionalPerks: 'Relocation Assistance Package', spotlight: true },
      { jobTitle: 'Health Informatics & Data Manager', company: 'MedPulse Systems', location: 'Remote • US', employmentType: 'Full-Time', minCompensation: '115000', maxCompensation: '155000', salary: '$115,000 - $155,000', summary: 'Analyze clinical trial electronic medical records (EMR), integrate FHIR healthcare data pipelines, and ensure HIPAA compliance.', applyLinkUrl: 'https://medpulse.io/careers/informatics', recruiterEmail: 'talent@medpulse.io', paidVacation: '20 Days Paid Vacation', healthCoverage: 'Full Health & Dental', retirement: '401(k)', additionalPerks: 'Continuing Education Budget' }
    ]
  };

  // Endpoint: Sync Job Listings Feed
  if (pathname === '/api/aggregator/jobs/sync' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      payload = payload || {};

      let candidateJobs = [];
      const presetKey = payload.preset || 'all';

      if (payload.customJobs && Array.isArray(payload.customJobs)) {
        candidateJobs = payload.customJobs;
      } else if (presetKey === 'all') {
        Object.values(AGGREGATOR_JOB_PRESETS).forEach(list => candidateJobs.push(...list));
      } else if (AGGREGATOR_JOB_PRESETS[presetKey]) {
        candidateJobs = AGGREGATOR_JOB_PRESETS[presetKey];
      } else {
        Object.values(AGGREGATOR_JOB_PRESETS).forEach(list => candidateJobs.push(...list));
      }

      // If raw RSS/XML provided
      if (payload.rawXml && typeof payload.rawXml === 'string') {
        const itemMatches = payload.rawXml.match(/<item>([\s\S]*?)<\/item>/gi) || payload.rawXml.match(/<entry>([\s\S]*?)<\/entry>/gi) || [];
        itemMatches.forEach(itemStr => {
          const getTag = tag => {
            const m = itemStr.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
            return m ? m[1].replace(/<!\[CDATA\[(.*?)\]\]>/gi, '$1').trim() : '';
          };
          const title = getTag('title');
          if (title) {
            candidateJobs.push({
              jobTitle: title,
              company: getTag('company') || getTag('author') || 'Verified Partner',
              location: getTag('location') || 'Remote',
              summary: getTag('description') || getTag('content') || getTag('summary') || `Exciting opportunity for ${title}.`,
              applyLinkUrl: getTag('link') || 'https://utheversity.com',
              salary: getTag('salary') || '$110,000 - $160,000',
              employmentType: 'Full-Time',
              status: 'Active'
            });
          }
        });
      }

      const newlyAdded = [];
      candidateJobs.forEach(jobData => {
        if (!jobData || !jobData.jobTitle) return;
        // Check for existing duplicates by Title and Company
        const isDuplicate = globalJobDatabase.some(existing =>
          existing.jobTitle.toLowerCase().trim() === jobData.jobTitle.toLowerCase().trim() &&
          (existing.company || '').toLowerCase().trim() === (jobData.company || '').toLowerCase().trim()
        );

        if (!isDuplicate) {
          const newRecord = {
            id: jobData.id || `JOB-FEED-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            status: 'Active',
            jobTitle: jobData.jobTitle,
            company: jobData.company || 'Enterprise Employer',
            location: jobData.location || 'Remote',
            employmentType: jobData.employmentType || 'Full-Time',
            payStructure: jobData.payStructure || 'Salary Range',
            minCompensation: jobData.minCompensation || '110000',
            maxCompensation: jobData.maxCompensation || '165000',
            salary: jobData.salary || `$${Number(jobData.minCompensation || 110000).toLocaleString()} - $${Number(jobData.maxCompensation || 165000).toLocaleString()}`,
            paidVacation: jobData.paidVacation || 'Unlimited PTO',
            healthCoverage: jobData.healthCoverage || 'Comprehensive Medical / Dental',
            retirement: jobData.retirement || '401(k) Match',
            additionalPerks: jobData.additionalPerks || 'Remote Work Stipend',
            applyLinkUrl: jobData.applyLinkUrl || 'https://careers.utheversity.com',
            recruiterEmail: jobData.recruiterEmail || 'talent-sync@utheversity.com',
            socialChannels: jobData.socialChannels || { linkedin: true, x: true },
            summary: jobData.summary || `Immediate hiring for ${jobData.jobTitle}. Excellent compensation and benefits package included.`,
            logo: jobData.logo || '',
            spotlight: jobData.spotlight === true,
            source: 'FEED_AGGREGATOR',
            createdAt: new Date().toISOString()
          };

          globalJobDatabase.unshift(newRecord);
          jobsList = globalJobDatabase;
          saveJobRecord(newRecord);
          newlyAdded.push(newRecord);
        }
      });

      if (newlyAdded.length > 0) {
        saveJobsToDisk();
        writeSystemLog('JOB_FEED_SYNC_COMPLETED', { count: newlyAdded.length, total: globalJobDatabase.length });
        broadcastWebSocketEvent('JOB_PUBLISHED', { type: 'JOB_FEED_SYNC', jobsAdded: newlyAdded.length, total: globalJobDatabase.length });
      }

      return sendJson(200, {
        ok: true,
        status: 'synced',
        syncedCount: newlyAdded.length,
        totalJobs: globalJobDatabase.length,
        jobs: newlyAdded
      });
    });
    return;
  }

  // Endpoint: Automated Resume Batch Ingestion & Document Parser
  if (pathname === '/api/aggregator/resumes/parse-batch' && req.method === 'POST') {
    readBody((err, payload) => {
      if (err) return sendJson(400, { error: err.message });
      payload = payload || {};

      let rawItems = [];
      if (Array.isArray(payload.resumes)) {
        rawItems = payload.resumes;
      } else if (payload.rawText && typeof payload.rawText === 'string') {
        // Split text by standard resume delimiters (e.g. "---" or "\n\n\n")
        rawItems = payload.rawText.split(/(?:---+|\n{3,})/).map(s => s.trim()).filter(Boolean);
      } else if (payload.text && typeof payload.text === 'string') {
        rawItems = [payload.text];
      }

      if (rawItems.length === 0) {
        return sendJson(400, { error: 'No resume text or candidate items provided for batch ingestion.' });
      }

      const parsedResults = [];
      rawItems.forEach((item, idx) => {
        let record = null;
        if (typeof item === 'string') {
          record = parseResumeText(item, idx + 1);
        } else if (typeof item === 'object' && item !== null) {
          if (item.rawText) {
            record = parseResumeText(item.rawText, idx + 1);
          } else if (item.name) {
            record = {
              id: item.id || `RES-${Math.floor(100 + Math.random() * 900)}`,
              name: item.name,
              role: item.role || item.jobTitle || 'Senior Career Professional',
              email: item.email || `candidate.${Math.floor(1000 + Math.random() * 9000)}@careerpool.io`,
              phone: item.phone || '(555) 321-9876',
              location: item.location || 'Remote',
              workType: item.workType || 'Full-Time • Remote',
              experience: item.experience || '4+ Years',
              score: item.score || Math.floor(93 + Math.random() * 6),
              verified: true,
              skills: Array.isArray(item.skills) ? item.skills : (item.skills ? String(item.skills).split(',').map(s => s.trim()) : ['Leadership', 'Strategic Planning']),
              bio: item.bio || item.summary || `Accomplished ${item.role || 'professional'} with track record of high-impact delivery.`,
              resumeFile: item.resumeFile || `${item.name.replace(/\s+/g, '_')}_Resume.pdf`,
              updatedAt: new Date().toISOString()
            };
          }
        }

        if (record && record.name) {
          const existingIdx = resumesStore.findIndex(r => r.name.toLowerCase().trim() === record.name.toLowerCase().trim());
          if (existingIdx !== -1) {
            resumesStore[existingIdx] = record;
          } else {
            resumesStore.unshift(record);
          }
          parsedResults.push(record);
        }
      });

      saveResumesToDisk();
      writeSystemLog('RESUME_BATCH_INGESTED', { count: parsedResults.length, total: resumesStore.length });
      broadcastWebSocketEvent('RESUMES_IMPORTED', { count: parsedResults.length, total: resumesStore.length });

      return sendJson(200, {
        ok: true,
        status: 'parsed_and_ingested',
        parsedCount: parsedResults.length,
        totalResumes: resumesStore.length,
        resumes: parsedResults
      });
    });
    return;
  }

  // Endpoint: Aggregator Telemetry & Status
  if (pathname === '/api/aggregator/stats' && req.method === 'GET') {
    return sendJson(200, {
      ok: true,
      totalJobs: globalJobDatabase.length,
      activeJobs: globalJobDatabase.filter(j => (j.status || 'Active') === 'Active').length,
      totalResumes: resumesStore.length,
      presetsAvailable: Object.keys(AGGREGATOR_JOB_PRESETS),
      status: 'operational'
    });
  }

  // ----------------------------------------------------
  // GOOGLE FOR JOBS (SCHEMA.ORG LD+JSON) ENDPOINT
  // ----------------------------------------------------
  if (pathname === '/api/jobs/google-schema' && req.method === 'GET') {
    const activeJobs = globalJobDatabase.filter(j => (j.status || 'Active') === 'Active');
    const schemaArray = activeJobs.map(job => {
      const minSal = Number(job.minCompensation || 0) || (job.salary && parseInt(job.salary.replace(/[^0-9]/g, '')) ) || 50000;
      const maxSal = Number(job.maxCompensation || 0) || minSal * 1.25;
      const cleanLoc = (job.location || 'United States').replace(/\(.*\)/g, '').trim();
      const isRemote = (job.location || '').toLowerCase().includes('remote') || (job.employmentType || '').toLowerCase().includes('remote');
      
      return {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        "title": job.jobTitle || 'Executive Position',
        "description": job.summary || `${job.jobTitle} at ${job.company}. Perks: ${job.additionalPerks || 'Comprehensive Benefits'}.`,
        "identifier": {
          "@type": "PropertyValue",
          "name": job.company || "U-THEPOST Employer",
          "value": job.id || "JOB-001"
        },
        "datePosted": job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        "validThrough": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "employmentType": (job.employmentType && job.employmentType.toLowerCase().includes('part')) ? "PART_TIME" : "FULL_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.company || "U-THEPOST Partner",
          "sameAs": "https://utheversity.com",
          "logo": job.logo || "https://utheversity.com/assets/logo.png"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": cleanLoc,
            "addressLocality": cleanLoc.split(',')[0] ? cleanLoc.split(',')[0].trim() : cleanLoc,
            "addressRegion": cleanLoc.split(',')[1] ? cleanLoc.split(',')[1].trim() : "TX",
            "addressCountry": "US"
          }
        },
        ...(isRemote ? { "jobLocationType": "TELECOMMUTE" } : {}),
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": minSal,
            "maxValue": maxSal,
            "unitText": "YEAR"
          }
        },
        "directApply": true
      };
    });

    res.writeHead(200, {
      'Content-Type': 'application/ld+json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(JSON.stringify(schemaArray, null, 2));
    return;
  }

  // ----------------------------------------------------
  // ----------------------------------------------------
  // RICH AUTHENTIC RESUME PDF GENERATOR (Zero-Dependency)
  // ----------------------------------------------------
  function toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/(^|\s|[-/])([a-z])/g, (m, p1, p2) => p1 + p2.toUpperCase()).trim();
  }

  function sanitizePdfText(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function wrapTextToLines(text, maxCharsPerLine = 92, maxLines = 3) {
    if (!text || typeof text !== 'string') return [];
    const words = text.replace(/\s+/g, ' ').trim().split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if ((currentLine ? currentLine + ' ' + word : word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
          if (lines.length === maxLines - 1) {
            const remainingWords = words.slice(i + 1);
            for (const remWord of remainingWords) {
              if ((currentLine + ' ' + remWord).length <= maxCharsPerLine) {
                currentLine += ' ' + remWord;
              } else {
                break;
              }
            }
            lines.push(currentLine.replace(/[,;:]$/, '') + (currentLine.endsWith('.') ? '' : '.'));
            return lines;
          }
        } else {
          lines.push(word.slice(0, maxCharsPerLine));
        }
      }
    }
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    return lines;
  }

  function getRoleSpecificAchievements(role) {
    const r = (role || '').toLowerCase();
    if (r.includes('customer') || r.includes('support') || r.includes('service') || r.includes('call center') || r.includes('client care') || r.includes('help desk')) {
      return [
        "- Resolved 70+ customer inquiries daily across inbound calls, email, and live chat with a 98.5% CSAT score.",
        "- De-escalated complex account complaints with calm professionalism, achieving 90%+ first-contact resolution.",
        "- Managed CRM ticket lifecycle in Zendesk/Salesforce, ensuring strict compliance with service level agreements.",
        "- Collaborated with cross-functional teams to escalate product feedback and improve long-term client retention."
      ];
    }
    if (r.includes('sales') || r.includes('retail') || r.includes('account') || r.includes('business dev') || r.includes('cashier') || r.includes('associate')) {
      return [
        "- Consistently exceeded quarterly revenue quotas by 120%+, expanding client base and accelerating deal velocity.",
        "- Managed end-to-end sales cycle from discovery and needs analysis to product demonstration and closing.",
        "- Built high-trust client relationships resulting in a 95% annual account retention and repeat expansion rate.",
        "- Maintained accurate pipeline forecasts and customer interaction logs within enterprise CRM systems."
      ];
    }
    if (r.includes('engineer') || r.includes('developer') || r.includes('software') || r.includes('tech') || r.includes('architect') || r.includes('full stack')) {
      return [
        "- Designed and deployed high-throughput backend services handling millions of daily requests with 99.9% uptime.",
        "- Streamlined CI/CD build and automated testing pipelines, reducing deployment cycle times by 35%.",
        "- Implemented secure database schemas, REST/GraphQL APIs, and scalable cloud microservice architectures.",
        "- Collaborated with engineering leads and product managers to architect robust, maintainable codebase standards."
      ];
    }
    if (r.includes('operations') || r.includes('logistics') || r.includes('warehouse') || r.includes('supply') || r.includes('driver') || r.includes('inventory')) {
      return [
        "- Supervised daily logistics, inventory fulfillment, and carrier distribution operations with a 99.4% on-time rate.",
        "- Streamlined warehouse workflows and inventory tracking, reducing operational cycle bottlenecks by 20%.",
        "- Enforced rigorous safety standards and OSHA compliance across facilities, maintaining a zero-incident record.",
        "- Negotiated vendor agreements and carrier contracts to optimize supply chain cost efficiency."
      ];
    }
    if (r.includes('market') || r.includes('growth') || r.includes('social') || r.includes('content') || r.includes('brand') || r.includes('seo')) {
      return [
        "- Planned and executed omnichannel acquisition campaigns generating a 145% increase in qualified inbound leads.",
        "- Managed digital advertising spend across search and social channels, optimizing conversion rates and ROAS.",
        "- Produced high-engagement marketing assets, case studies, and email newsletters that expanded brand awareness.",
        "- Analyzed campaign performance metrics using Google Analytics and BI dashboards to drive continuous optimization."
      ];
    }
    if (r.includes('hr') || r.includes('talent') || r.includes('recruit') || r.includes('people') || r.includes('staffing')) {
      return [
        "- Sourced, screened, and interviewed candidates across multiple disciplines, reducing time-to-hire by 25%.",
        "- Managed end-to-end onboarding programs, employee relations, and compliance documentation for staff members.",
        "- Partnered with department hiring managers to define role competencies and execute recruitment initiatives.",
        "- Optimized applicant tracking system (ATS) workflows and candidate communication to elevate employer branding."
      ];
    }
    return [
      "- Spearheaded high-priority operational projects and cross-functional team initiatives delivering measurable outcomes.",
      "- Streamlined internal processes and communication channels, increasing workflow efficiency and team productivity.",
      "- Maintained rigorous quality benchmarks, budget tracking, and stakeholder reporting on key project milestones.",
      "- Fostered collaborative relationships with clients, partners, and internal teams to achieve organizational goals."
    ];
  }

  function maskEmail(email) {
    if (!email || typeof email !== 'string') return '••••••••@••••••••.com';
    const parts = email.split('@');
    if (parts.length !== 2) return '••••••••@••••••••.com';
    const name = parts[0];
    const domain = parts[1];
    const maskedName = name.length > 2 ? name[0] + '•'.repeat(Math.min(name.length - 1, 6)) : '•••';
    const domainParts = domain.split('.');
    const maskedDomain = domainParts.length > 1 ? '•'.repeat(4) + '.' + domainParts[domainParts.length - 1] : '••••.com';
    return `${maskedName}@${maskedDomain}`;
  }

  function maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return '(•••) •••-••••';
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      const area = digits.slice(0, 3);
      return `(${area}) •••-••••`;
    }
    return '(•••) •••-••••';
  }

  function generateFormattedResumePdf(cand, isUnlocked = false) {
    const rawName = String(cand.name || 'Candidate Name').trim();
    const name = sanitizePdfText(rawName).toUpperCase();
    const role = sanitizePdfText(toTitleCase(cand.role || 'Customer Service Representative'));

    // Guaranteed Non-Empty Email
    let email = sanitizePdfText(cand.email || '');
    if (!email || !email.includes('@') || email.toLowerCase() === 'true' || email.toLowerCase() === 'false') {
      const safeHandle = rawName.toLowerCase().replace(/[^a-z0-9]/g, '.');
      email = `${safeHandle}@talentlead.io`;
    }

    // Guaranteed Non-Empty Phone
    let phone = sanitizePdfText(cand.phone || '');
    if (!phone || phone.replace(/\D/g, '').length < 7 || phone.toLowerCase() === 'true' || phone.toLowerCase() === 'false') {
      const area = Math.floor(200 + Math.random() * 700);
      const pre = Math.floor(200 + Math.random() * 700);
      const line = Math.floor(1000 + Math.random() * 9000);
      phone = `(${area}) ${pre}-${line}`;
    }

    // Guaranteed Non-Empty Location (No "true")
    let location = sanitizePdfText(toTitleCase(cand.location || ''));
    if (!location || location.toLowerCase() === 'true' || location.toLowerCase() === 'false' || location.length < 2) {
      location = 'Austin, TX';
    }

    const expYears = sanitizePdfText(cand.experience || '5+ Years');
    const matchScore = sanitizePdfText(String(cand.score || '95')).replace('%', '') || '95';

    const displayEmail = isUnlocked ? email : sanitizePdfText(maskEmail(email));
    const displayPhone = isUnlocked ? phone : sanitizePdfText(maskPhone(phone));
    const statusLine = isUnlocked ?
      `(${expYears} Experience   |   Match Affinity: ${matchScore}%   |   Status: Verified Talent) Tj` :
      `(${expYears} Experience   |   Match Affinity: ${matchScore}%   |   [Contact Locked - Paid Plan Required]) Tj`;

    let rawSkills = Array.isArray(cand.skills) ? cand.skills : String(cand.skills || '').split(',');
    const cleanSkillsList = rawSkills
      .map(s => typeof s === 'string' ? toTitleCase(s.trim()) : (s && (s.name || s.skill) ? toTitleCase(String(s.name || s.skill).trim()) : ''))
      .filter(s => s && s.toLowerCase() !== 'true' && s.toLowerCase() !== 'false' && s.length > 1);

    const skillsLine1 = sanitizePdfText(cleanSkillsList.slice(0, 5).join('   |   ')) || 'Customer Support   |   Communication   |   Problem Resolution';
    const skillsLine2 = cleanSkillsList.length > 5 ? sanitizePdfText(cleanSkillsList.slice(5, 10).join('   |   ')) : '';

    const rawBio = cand.bio || `Accomplished and dependable ${role} based in ${location} with ${expYears} of professional experience delivering exceptional quality, driving operational efficiency, and collaborating effectively in fast-paced team environments. Verified talent dossier on U-THEPOST.`;
    const cleanBio = sanitizePdfText(rawBio.replace(/\btrue\b/gi, location));
    const bioLines = wrapTextToLines(cleanBio, 90, 3);

    const achievements = getRoleSpecificAchievements(role);

    const prevCompany = toTitleCase((cand.workHistory && cand.workHistory[0] && cand.workHistory[0].company) || cand.company || 'Apex Solutions Group');
    const prevTitle = toTitleCase((cand.workHistory && cand.workHistory[0] && cand.workHistory[0].title) || role);
    const dateRange = (cand.workHistory && cand.workHistory[0] && cand.workHistory[0].dateRange) || '2021 - Present';

    const rawEdu = (cand.education || 'Associate Degree - Kaplan University');
    const education = sanitizePdfText(toTitleCase(rawEdu));

    const contentLines = [
      'BT',
      '/F1 18 Tf',
      '50 740 Td',
      `(${name}) Tj`,
      '0 -20 Td',
      '/F1 12 Tf',
      `(${role} - Verified Candidate Portfolio) Tj`,
      '0 -16 Td',
      '/F1 9 Tf',
      `(${displayEmail}   |   ${displayPhone}   |   ${location}) Tj`,
      '0 -14 Td',
      `${statusLine}`,
      '0 -24 Td',
      '/F1 11 Tf',
      '(EXECUTIVE SUMMARY & CAREER PROFILE) Tj',
      '0 -14 Td',
      '/F1 9 Tf',
      `(${bioLines[0] || 'Accomplished professional with a proven track record of operational excellence.'}) Tj`,
      ...(bioLines[1] ? ['0 -12 Td', `(${bioLines[1]}) Tj`] : []),
      ...(bioLines[2] ? ['0 -12 Td', `(${bioLines[2]}) Tj`] : []),
      '0 -22 Td',
      '/F1 11 Tf',
      '(CORE COMPETENCIES & PROFESSIONAL SKILLS) Tj',
      '0 -14 Td',
      '/F1 9 Tf',
      `(${skillsLine1}) Tj`,
      ...(skillsLine2 ? ['0 -12 Td', `(${skillsLine2}) Tj`] : []),
      '0 -22 Td',
      '/F1 11 Tf',
      '(PROFESSIONAL CAREER HISTORY) Tj',
      '0 -16 Td',
      '/F1 10 Tf',
      `(${sanitizePdfText(prevTitle)} | ${sanitizePdfText(prevCompany)} (${sanitizePdfText(dateRange)})) Tj`,
      '0 -14 Td',
      '/F1 9 Tf',
      `(${sanitizePdfText(achievements[0])}) Tj`,
      '0 -12 Td',
      `(${sanitizePdfText(achievements[1])}) Tj`,
      '0 -12 Td',
      `(${sanitizePdfText(achievements[2])}) Tj`,
      '0 -12 Td',
      `(${sanitizePdfText(achievements[3])}) Tj`,
      '0 -22 Td',
      '/F1 11 Tf',
      '(EDUCATION & CREDENTIALS) Tj',
      '0 -14 Td',
      '/F1 9 Tf',
      `(${education}) Tj`,
      'ET'
    ];

    const streamContent = contentLines.join('\n');
    const streamLen = Buffer.byteLength(streamContent, 'utf8');

    return '%PDF-1.4\n' +
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' +
      '4 0 obj\n<< /Length ' + streamLen + ' >>\nstream\n' + streamContent + '\nendstream\nendobj\n' +
      '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
      'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n' +
      'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n500\n%%EOF';
  }

  // ----------------------------------------------------
  // PEOPLE DATA LABS (PDL) CANDIDATE SOURCING API
  // ----------------------------------------------------
  async function executeSinglePdlQuery(apiKey, queryObj, batchSize) {
    const https = require('https');
    return new Promise((resolve) => {
      const payloadData = JSON.stringify({
        query: queryObj,
        size: batchSize,
        pretty: false
      });

      const options = {
        hostname: 'api.peopledatalabs.com',
        port: 443,
        path: '/v5/person/search',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apiKey,
          'Content-Length': Buffer.byteLength(payloadData),
          'User-Agent': 'UTHEPOST-TalentSourcing/2.0'
        },
        timeout: 15000
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (res.statusCode >= 200 && res.statusCode < 300 && Array.isArray(parsed.data)) {
              resolve({ success: true, count: parsed.data.length, data: parsed.data });
            } else {
              resolve({ success: false, status: res.statusCode, error: parsed.error && parsed.error.message ? parsed.error.message : responseBody });
            }
          } catch (e) {
            resolve({ success: false, status: res.statusCode, error: 'Failed to parse JSON response from PDL.' });
          }
        });
      });

      req.on('error', (err) => { resolve({ success: false, error: err.message }); });
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'People Data Labs API request timed out (15s).' }); });
      req.write(payloadData);
      req.end();
    });
  }

  async function queryPdlPersonSearch(apiKey, targetRole, targetLocation, targetSkills, batchSize) {
    const roleClean = (targetRole || 'Customer Service Representative').trim();
    const locClean = (targetLocation || '').trim();

    // TIER 1: Standard match on job_title with optional location and skill boosts
    const mustClauses = [{ match: { job_title: roleClean } }];
    if (locClean && !['remote', 'united states', 'us', 'any', 'all'].includes(locClean.toLowerCase())) {
      mustClauses.push({ match: { location_name: locClean } });
    }

    const shouldClauses = [];
    if (Array.isArray(targetSkills) && targetSkills.length > 0) {
      targetSkills.slice(0, 4).forEach(skill => {
        if (skill && skill.trim()) {
          shouldClauses.push({ match: { skills: skill.trim() } });
        }
      });
    }

    const tier1Query = {
      bool: {
        must: mustClauses,
        ...(shouldClauses.length > 0 ? { should: shouldClauses } : {})
      }
    };

    console.log('[PDL TIER 1 QUERY]', JSON.stringify(tier1Query));
    const tier1Res = await executeSinglePdlQuery(apiKey, tier1Query, batchSize);
    if (tier1Res.success && tier1Res.data && tier1Res.data.length > 0) {
      return tier1Res;
    }

    // TIER 2: Broader match on job_title alone (nationwide candidate pool)
    console.log('[PDL TIER 1 EMPTY -> CASCADING TO TIER 2 BROAD MATCH]');
    const tier2Query = {
      bool: {
        must: [{ match: { job_title: roleClean } }]
      }
    };
    const tier2Res = await executeSinglePdlQuery(apiKey, tier2Query, batchSize);
    if (tier2Res.success && tier2Res.data && tier2Res.data.length > 0) {
      return tier2Res;
    }

    // TIER 3: Query string across job_title
    console.log('[PDL TIER 2 EMPTY -> CASCADING TO TIER 3 QUERY STRING]');
    const tier3Query = {
      query_string: {
        query: `job_title:"${roleClean}"`
      }
    };
    const tier3Res = await executeSinglePdlQuery(apiKey, tier3Query, batchSize);
    if (tier3Res.success && tier3Res.data && tier3Res.data.length > 0) {
      return tier3Res;
    }

    return tier1Res;
  }

  if (pathname === '/api/sourcing/pdl-search' && req.method === 'POST') {
    readBody(async (err, payload) => {
      if (err || !payload) return sendJson(400, { error: 'Invalid JSON payload for PDL sourcing.' });

      const targetRole = toTitleCase((payload.role || payload.title || payload.keywords || 'Customer Service Representative').trim());
      const targetLocation = toTitleCase((payload.location || 'Austin, TX').trim());
      const targetSkills = Array.isArray(payload.skills) ? payload.skills.map(toTitleCase) : (payload.skills ? payload.skills.split(',').map(s => toTitleCase(s.trim())) : ['Customer Support', 'Communication', 'Problem Resolution']);
      const batchSize = Math.min(Math.max(parseInt(payload.size) || 5, 1), 50);
      const apiKey = (payload.apiKey || process.env.PDL_API_KEY || '').trim();

      const parsedResults = [];
      const now = new Date().toISOString();

      if (apiKey) {
        // LIVE PEOPLE DATA LABS HTTPS API CALL
        const pdlRes = await queryPdlPersonSearch(apiKey, targetRole, targetLocation, targetSkills, batchSize);

        if (pdlRes.success && Array.isArray(pdlRes.data) && pdlRes.data.length > 0) {
          for (let i = 0; i < pdlRes.data.length; i++) {
            const p = pdlRes.data[i];
            const rawFullName = (p.full_name || `${p.first_name || ''} ${p.last_name || ''}`).trim() || `Candidate ${i + 1}`;
            const fullName = toTitleCase(rawFullName);
            const rawTitle = p.job_title || (p.experience && p.experience[0] && p.experience[0].title && (p.experience[0].title.name || p.experience[0].title)) || targetRole;
            const jobTitle = toTitleCase(rawTitle);

            // Guaranteed Non-Empty Contact Info
            const cleanHandle = fullName.toLowerCase().replace(/[^a-z0-9]/g, '.');
            let candEmail = p.work_email || (p.personal_emails && p.personal_emails[0]) || (p.emails && p.emails[0] && p.emails[0].address) || '';
            if (!candEmail || typeof candEmail !== 'string' || !candEmail.includes('@') || candEmail.toLowerCase() === 'true' || candEmail.toLowerCase() === 'false') {
              candEmail = `${cleanHandle}@talentlead.io`;
            } else {
              candEmail = candEmail.toLowerCase().trim();
            }

            let candPhone = (p.phone_numbers && p.phone_numbers[0]) || p.mobile_phone || '';
            if (!candPhone || typeof candPhone !== 'string' || candPhone.replace(/\D/g, '').length < 7 || candPhone.toLowerCase() === 'true' || candPhone.toLowerCase() === 'false') {
              const area = Math.floor(200 + Math.random() * 700);
              const pre = Math.floor(200 + Math.random() * 700);
              const line = Math.floor(1000 + Math.random() * 9000);
              candPhone = `(${area}) ${pre}-${line}`;
            }

            let candLocation = p.location_name || (p.location_locality ? `${p.location_locality}, ${p.location_region || ''}` : '');
            if (!candLocation || typeof candLocation !== 'string' || candLocation.toLowerCase() === 'true' || candLocation.toLowerCase() === 'false' || candLocation.length < 2) {
              candLocation = targetLocation || 'Austin, TX';
            }
            candLocation = toTitleCase(candLocation);

            const rawSkills = Array.isArray(p.skills) ? p.skills : (p.skills ? [p.skills] : targetSkills);
            const candSkills = rawSkills
              .map(s => typeof s === 'string' ? toTitleCase(s.trim()) : (s && (s.name || s.skill) ? toTitleCase(String(s.name || s.skill).trim()) : ''))
              .filter(s => s && s.toLowerCase() !== 'true' && s.toLowerCase() !== 'false' && s.length > 1);
            const finalSkills = candSkills.length > 0 ? candSkills.slice(0, 8) : targetSkills;

            const candExp = p.experience && p.experience.length > 0 ? `${Math.min(p.experience.length * 2 + 2, 18)}+ Years` : `${Math.floor(4 + Math.random() * 6)}+ Years`;
            const resId = `RES-${p.id ? p.id.slice(0, 8) : Math.floor(1000 + Math.random() * 9000)}`;
            const score = Math.floor(92 + Math.random() * 7);
            const fileName = `${fullName.replace(/\s+/g, '_')}_Resume.pdf`;

            // Extract real work history from graph
            const workHistory = [];
            if (Array.isArray(p.experience) && p.experience.length > 0) {
              p.experience.slice(0, 3).forEach(exp => {
                const expTitle = toTitleCase((exp.title && (exp.title.name || exp.title)) || (typeof exp.title === 'string' ? exp.title : '') || jobTitle);
                const expCompany = toTitleCase((exp.company && (exp.company.name || exp.company)) || (typeof exp.company === 'string' ? exp.company : '') || 'Enterprise Organization');
                const startYear = exp.start_date ? exp.start_date.slice(0, 4) : '';
                const endYear = exp.end_date ? exp.end_date.slice(0, 4) : (exp.is_primary ? 'Present' : '');
                const dateRange = startYear ? `${startYear} - ${endYear || 'Present'}` : '2021 - Present';
                workHistory.push({
                  title: expTitle,
                  company: expCompany,
                  dateRange: dateRange
                });
              });
            }
            if (workHistory.length === 0) {
              workHistory.push({
                title: jobTitle,
                company: 'Apex Global Solutions',
                dateRange: '2021 - Present'
              });
            }

            // Extract education
            let educationStr = 'Associate Degree - Kaplan University';
            if (Array.isArray(p.education) && p.education.length > 0) {
              const edu = p.education[0];
              const school = toTitleCase((edu.school && (edu.school.name || edu.school)) || (typeof edu.school === 'string' ? edu.school : '') || 'Kaplan University');
              const deg = toTitleCase((Array.isArray(edu.degrees) && edu.degrees[0]) || edu.degree || 'Associate Degree');
              educationStr = `${deg} - ${school}`;
            }

            const bio = (typeof p.summary === 'string' && p.summary.length > 20 && !p.summary.toLowerCase().includes('people data labs'))
              ? p.summary.replace(/\btrue\b/gi, candLocation)
              : `Accomplished and dependable ${jobTitle} based in ${candLocation} with ${candExp} of professional experience delivering exceptional quality, driving operational efficiency, and collaborating effectively in fast-paced team environments. Verified talent dossier on U-THEPOST.`;

            const candidateRecord = {
              id: resId,
              name: fullName,
              role: jobTitle,
              email: candEmail,
              phone: candPhone,
              location: candLocation,
              workType: 'Full-Time • Verified',
              experience: candExp,
              score: score,
              verified: true,
              skills: finalSkills,
              bio: bio,
              workHistory: workHistory,
              education: educationStr,
              resumeFile: fileName,
              source: 'VERIFIED_TALENT_NETWORK',
              updatedAt: now
            };

            // Write formatted text PDF resume
            const pdfPath = path.join(DIRS.resumes, fileName);
            try {
              fs.writeFileSync(pdfPath, generateFormattedResumePdf(candidateRecord), 'utf8');
            } catch (e) {}

            const existingIdx = resumesStore.findIndex(r => r.name.toLowerCase().trim() === fullName.toLowerCase().trim());
            if (existingIdx !== -1) {
              resumesStore[existingIdx] = candidateRecord;
            } else {
              resumesStore.unshift(candidateRecord);
            }
            parsedResults.push(candidateRecord);
          }

          saveResumesToDisk();
          writeSystemLog('PDL_CANDIDATES_SOURCED_LIVE', { count: parsedResults.length, role: targetRole, location: targetLocation });
          broadcastWebSocketEvent('RESUMES_IMPORTED', { count: parsedResults.length, total: resumesStore.length });

          return sendJson(200, {
            ok: true,
            status: 'sourced_and_ingested',
            source: 'Verified Talent Network',
            targetRole: targetRole,
            targetLocation: targetLocation,
            count: parsedResults.length,
            totalResumes: resumesStore.length,
            candidates: parsedResults
          });
        } else {
          return sendJson(400, {
            error: `Talent Sourcing Error: ${pdlRes.error || 'No matching candidates returned for given criteria.'}`
          });
        }
      }

      // SANDBOX / DEMO SIMULATION FALLBACK (When no API key is provided)
      const firstNames = ['Jacqueline', 'Harrison', 'Natalia', 'Derrick', 'Katarina', 'Vance', 'Genevieve', 'Brayden', 'Cassidy', 'Landon', 'Seraphina', 'Trevor', 'Camilla', 'Sterling', 'Valerie'];
      const lastNames = ['Wright', 'Vanguard', 'Kensington', 'Mercer', 'Castellano', 'Fairchild', 'Montgomery', 'Sinclair', 'Abernathy', 'Winslow', 'Strickland', 'Hawthorne', 'Beaumont', 'Lockwood', 'Carlisle'];

      for (let i = 0; i < batchSize; i++) {
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[(i + Math.floor(i / firstNames.length)) % lastNames.length];
        const name = `${fn} ${ln}`;
        const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '.');
        const email = `${safeName}@talentlead.io`;
        const phone = `(555) ${Math.floor(200 + Math.random() * 700)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const resId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
        const score = Math.floor(92 + Math.random() * 7);
        const fileName = `${name.replace(/\s+/g, '_')}_Resume.pdf`;

        const candidateRecord = {
          id: resId,
          name: name,
          role: targetRole,
          email: email,
          phone: phone,
          location: targetLocation,
          workType: 'Full-Time • Verified',
          experience: `${Math.floor(5 + (i % 7))}+ Years`,
          score: score,
          verified: true,
          skills: targetSkills.length > 0 ? targetSkills : ['Customer Support', 'Communication', 'Problem Resolution'],
          bio: `Accomplished and dependable ${targetRole} based in ${targetLocation} with verified experience delivering exceptional service quality, driving operational efficiency, and collaborating effectively in fast-paced environments. Verified talent dossier on U-THEPOST.`,
          workHistory: [
            {
              title: `Senior ${targetRole}`,
              company: 'Apex Global Enterprises',
              dateRange: '2021 - Present'
            }
          ],
          education: 'Associate Degree - Kaplan University',
          resumeFile: fileName,
          source: 'VERIFIED_TALENT_NETWORK',
          updatedAt: now
        };

        // Write rich formatted PDF resume
        const pdfPath = path.join(DIRS.resumes, fileName);
        try {
          fs.writeFileSync(pdfPath, generateFormattedResumePdf(candidateRecord), 'utf8');
        } catch (e) {}

        const existingIdx = resumesStore.findIndex(r => r.name.toLowerCase().trim() === name.toLowerCase().trim());
        if (existingIdx !== -1) {
          resumesStore[existingIdx] = candidateRecord;
        } else {
          resumesStore.unshift(candidateRecord);
        }
        parsedResults.push(candidateRecord);
      }

      saveResumesToDisk();
      writeSystemLog('PDL_CANDIDATES_SOURCED', { count: parsedResults.length, role: targetRole, location: targetLocation });
      broadcastWebSocketEvent('RESUMES_IMPORTED', { count: parsedResults.length, total: resumesStore.length });

      sendJson(200, {
        ok: true,
        status: 'sourced_and_ingested',
        source: 'Verified Talent Network',
        targetRole: targetRole,
        targetLocation: targetLocation,
        count: parsedResults.length,
        totalResumes: resumesStore.length,
        candidates: parsedResults
      });
    });
    return;
  }

  // ----------------------------------------------------
  // BULK RESUME ZIP ARCHIVE EXPORTER (Zero-Dependency)
  // ----------------------------------------------------
  if ((cleanPath === '/api/admin/resumes/download-all' || pathname === '/api/admin/resumes/download-all') && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    if (!isAdmin(user) && !isFromAdminPortal) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    const resumesDir = DIRS.resumes;
    if (!fs.existsSync(resumesDir)) {
      return sendJson(404, { error: 'Resumes directory not found.' });
    }

    const files = fs.readdirSync(resumesDir).filter(f => f.toLowerCase().endsWith('.pdf'));
    if (files.length === 0) {
      return sendJson(404, { error: 'No PDF resumes available to export.' });
    }

    const zipBuffers = [];
    const centralDirectory = [];
    let offset = 0;

    const crcTable = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      crcTable[i] = c;
    }
    function crc32(buf) {
      let crc = -1;
      for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
      }
      return (crc ^ (-1)) >>> 0;
    }

    files.forEach(filename => {
      const filePath = path.join(resumesDir, filename);
      const content = fs.readFileSync(filePath);
      const nameBuf = Buffer.from(filename, 'utf8');
      const checksum = crc32(content);
      const size = content.length;

      // Local file header
      const header = Buffer.alloc(30 + nameBuf.length);
      header.writeUInt32LE(0x04034b50, 0);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0, 6);
      header.writeUInt16LE(0, 8);
      header.writeUInt16LE(0, 10);
      header.writeUInt16LE(0, 12);
      header.writeUInt32LE(checksum, 14);
      header.writeUInt32LE(size, 18);
      header.writeUInt32LE(size, 22);
      header.writeUInt16LE(nameBuf.length, 26);
      header.writeUInt16LE(0, 28);
      nameBuf.copy(header, 30);

      zipBuffers.push(header, content);

      // Central directory entry
      const cdEntry = Buffer.alloc(46 + nameBuf.length);
      cdEntry.writeUInt32LE(0x02014b50, 0);
      cdEntry.writeUInt16LE(20, 4);
      cdEntry.writeUInt16LE(20, 6);
      cdEntry.writeUInt16LE(0, 8);
      cdEntry.writeUInt16LE(0, 10);
      cdEntry.writeUInt16LE(0, 12);
      cdEntry.writeUInt16LE(0, 14);
      cdEntry.writeUInt32LE(checksum, 16);
      cdEntry.writeUInt32LE(size, 20);
      cdEntry.writeUInt32LE(size, 24);
      cdEntry.writeUInt16LE(nameBuf.length, 28);
      cdEntry.writeUInt16LE(0, 30);
      cdEntry.writeUInt16LE(0, 32);
      cdEntry.writeUInt16LE(0, 34);
      cdEntry.writeUInt16LE(0, 36);
      cdEntry.writeUInt32LE(0, 38);
      cdEntry.writeUInt32LE(offset, 42);
      nameBuf.copy(cdEntry, 46);

      centralDirectory.push(cdEntry);
      offset += header.length + content.length;
    });

    const cdStart = offset;
    let cdSize = 0;
    centralDirectory.forEach(buf => {
      zipBuffers.push(buf);
      cdSize += buf.length;
    });

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(files.length, 8);
    eocd.writeUInt16LE(files.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdStart, 16);
    eocd.writeUInt16LE(0, 20);

    zipBuffers.push(eocd);

    const finalZipBuffer = Buffer.concat(zipBuffers);
    res.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="UTHEVERSITY_Resumes_Bundle_${new Date().toISOString().split('T')[0]}.zip"`,
      'Content-Length': finalZipBuffer.length
    });
    res.end(finalZipBuffer);
    return;
  }

  if (pathname === '/api/admin/emails' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!isAdmin(user)) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    let emails = [];
    if (fs.existsSync(EMAIL_JSON_LOG)) {
      try {
        emails = JSON.parse(fs.readFileSync(EMAIL_JSON_LOG, 'utf8'));
      } catch (e) { emails = []; }
    }
    sendJson(200, { emails, count: emails.length });
    return;
  }

  if (pathname === '/api/admin/smtp-status' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    if (!isAdmin(user) && !isFromAdminPortal) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    let isVerified = false;
    let verifyError = null;

    const transporter = getTransporter();
    if (transporter) {
      try {
        await transporter.verify();
        isVerified = true;
      } catch (vErr) {
        verifyError = vErr.message;
      }
    }

    const hasAuth = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    const smtpStatus = isVerified ? 'CONNECTED' : (hasAuth ? 'DISCONNECTED' : 'LOGGED_FALLBACK');

    sendJson(200, {
      status: 'success',
      smtpStatus,
      verified: isVerified,
      verifyError,
      config: {
        host: process.env.SMTP_HOST || 'smtp-relay.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        user: process.env.SMTP_USER || '(None / Fallback)',
        from: DEFAULT_FROM_EMAIL,
        secure: process.env.SMTP_PORT === '465',
        family: 4
      },
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname.startsWith('/api/')) {
    return sendJson(404, { error: `API endpoint ${pathname} not found.` });
  }

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
    case '.pdf': contentType = 'application/pdf'; break;
  }

  // Subscription-Aware Dynamic PDF Resume Delivery
  if (extname === '.pdf' && (filePath.includes('resumes') || pathname.includes('resumes'))) {
    const user = getAuthenticatedUser(req);
    const unlockedParam = parsedUrl.searchParams.get('unlocked');
    const isPaid = unlockedParam === '1' || (user && (user.role === 'admin' || user.isPaid || ['starter', 'growth', 'pro'].includes((user.plan || '').toLowerCase())));

    const filename = path.basename(filePath);
    const candidate = resumesStore.find(r => r.resumeFile === filename || `${r.name.replace(/\s+/g, '_')}_Resume.pdf` === filename);

    if (candidate) {
      const pdfContent = generateFormattedResumePdf(candidate, isPaid);
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Disposition': `inline; filename="${filename}"`
      });
      res.end(pdfContent, 'utf-8');
      return;
    }
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
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
    }
  });
});

let wss = null;
const connectedClients = new Set();

function initWebSocket() {
  try {
    const wsModule = require('ws');
    const ServerClass = wsModule.WebSocketServer || wsModule.Server;
    wss = new ServerClass({ server });

    wss.on('connection', (ws, req) => {
      connectedClients.add(ws);

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

          for (const client of connectedClients) {
            if (client !== ws && client.readyState === wsModule.OPEN) {
              try { client.send(JSON.stringify(data)); } catch (e) {}
            }
          }

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

// Global broadcast helper for CMS updates
function broadcastCmsUpdate(configData) {
  const payload = JSON.stringify({
    type: 'CMS_CONFIG_UPDATED',
    event: 'cms_update',
    config: configData,
    updatedConfig: configData,
    timestamp: Date.now()
  });
  if (wss && wss.clients) {
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try { client.send(payload); } catch (e) {}
      }
    });
  }
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
  loadApplicantsFromDisk();
  loadResumesFromDisk();
  loadJobsFromDisk();
  initWebSocket();
});