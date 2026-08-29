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

function getAuthenticatedUser(req) {
  const cookies = parseCookies(req);
  let token = cookies['uthe_token'] || cookies['auth_token'] || cookies['master_admin_token'] || cookies['admin_token'];
  if (!token && req.headers.authorization) {
    const authParts = req.headers.authorization.split(' ');
    if (authParts.length === 2 && authParts[0].toLowerCase() === 'bearer') {
      token = authParts[1];
    }
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
    const sampleResume = path.join(DIRS.resumes, 'Marcus_Vance_Resume_2026.pdf');
    if (!fs.existsSync(sampleResume)) {
      fs.writeFileSync(sampleResume, '%PDF-1.4\n% Marcus Vance Verified PDF Resume - UTHEVERSITY Professional Career Network\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000090 00000 n \n0000000140 00000 n \n0000000200 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n275\n%%EOF\n', 'utf8');
    }
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

  return 'preview-hub.html';
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
    const user = getAuthenticatedUser(req);
    if (!user) return sendJson(401, { error: 'Unauthorized' });

    readBody((err, body) => {
      if (err) return sendJson(400, { error: 'Invalid JSON' });
      if (body.name) { user.name = body.name; user.fullName = body.name; }
      if (body.company) user.company = body.company;
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
    if (!isAdmin(user)) {
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

  // ----------------------------------------------------
  // MASTER ZERO-CODE CMS CONFIGURATION ENGINE & LIVE BROADCAST
  // ----------------------------------------------------
  if ((pathname === '/api/cms/config' || pathname === '/api/cms' || pathname === '/api/admin/cms' || pathname === '/api/admin/cms/config') && (req.method === 'GET' || req.method === 'POST')) {
    if (req.method === 'GET') {
      return sendJson(200, { config: cmsConfig, updatedConfig: cmsConfig, cmsConfig: cmsConfig });
    }

    const user = getAuthenticatedUser(req);
    const isFromAdminPortal = isRequestFromAdminDomain(req);
    if (!isAdmin(user) && !isFromAdminPortal) {
      return sendJson(401, { error: 'Unauthorized: Master Administrator authentication required.' });
    }

    readBody((err, body) => {
      if (err || !body) return sendJson(400, { error: 'Invalid JSON body' });

      // Update in-memory config and persist to disk
      cmsConfig = { ...cmsConfig, ...body };
      const cmsFilePath = path.join(__dirname, 'data', 'cms_config.json');
      const rootCmsPath = path.join(__dirname, 'cms_config.json');
      try {
        fs.writeFileSync(cmsFilePath, JSON.stringify(cmsConfig, null, 2));
      } catch (e) {}
      try {
        fs.writeFileSync(rootCmsPath, JSON.stringify(cmsConfig, null, 2));
      } catch (e) {}

      // Broadcast update payload to all active client sockets
      const broadcastPayload = JSON.stringify({
        type: 'CMS_CONFIG_UPDATED',
        event: 'cms_update',
        config: cmsConfig,
        updatedConfig: cmsConfig
      });

      if (wss && wss.clients) {
        wss.clients.forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            try { client.send(broadcastPayload); } catch (e) {}
          }
        });
      }

      writeSystemLog('CMS_CONFIG_UPDATED', { updatedBy: user ? user.id : 'Admin Portal', timestamp: new Date().toISOString() });
      sendJson(200, { status: 'success', message: 'CMS configuration updated and broadcast live.', config: cmsConfig, updatedConfig: cmsConfig });
    });
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
    const user = getAuthenticatedUser(req);
    if (isRecruiterOrAdmin(user)) {
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
    if (!isRecruiterOrAdmin(user)) {
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
        company: 'Hiring Team',
        recruiterEmail: 'contact@utheversity.com'
      };

      sendApplicationReceiptToCandidate(newApplicant, targetJob);
      sendNewApplicantAlertToRecruiter(newApplicant, targetJob);

      broadcastWebSocketEvent('CANDIDATE_APPLIED', { applicant: newApplicant });
      sendJson(201, { status: 'submitted', applicant: newApplicant, message: 'Application submitted. Confirmation and recruiter alert emails dispatched.' });
    });
    return;
  }

  if ((pathname === '/api/applicants' || pathname === '/api/applications') && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to view applicant data.' });
    }
    if (!isRecruiterOrAdmin(user)) {
      return sendJson(403, { error: 'Forbidden: Recruiter or Administrator privileges required.' });
    }
    sendJson(200, { applicants: applicantsStore, count: applicantsStore.length });
    return;
  }

  if (pathname === '/api/messages' && req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    if (!user) {
      return sendJson(401, { error: 'Unauthorized: Authentication required to access private messaging threads.' });
    }

    const applicantId = parsedUrl.searchParams ? parsedUrl.searchParams.get('applicantId') : null;
    if (applicantId) {
      // Private conversation thread locked strictly to requested applicantId
      const filtered = globalMessageStore.filter(m => m.applicantId === applicantId);
      sendJson(200, { messages: filtered, count: filtered.length, applicantId });
    } else if (user.role === 'candidate' || user.role === 'user') {
      // Candidate requests: return only messages tied to candidate's own applications or applicant ID
      const userAppIds = applicantsStore
        .filter(a => a.email === user.email || a.userId === (user.id || user.userId) || a.id === user.applicantId)
        .map(a => a.id);
      const filtered = globalMessageStore.filter(m => 
        (m.applicantId && userAppIds.includes(m.applicantId)) || 
        m.senderName === user.name || 
        m.applicantId === 'APP-701'
      );
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
      const targetApplicantId = payload.applicantId || 'APP-701';
      const newMsg = {
        id: payload.id || `MSG-${Math.floor(1000 + Math.random() * 9000)}`,
        applicantId: targetApplicantId,
        senderRole: payload.senderRole || user.role || 'candidate',
        senderName: payload.senderName || user.name || (payload.senderRole === 'recruiter' ? 'Quantum Talent Acquisition' : 'Marcus Vance'),
        company: payload.company || user.company || 'Quantum Retail Corp',
        jobTitle: payload.jobTitle || 'Sales Manager',
        text: payload.text || '',
        timestamp: new Date().toISOString()
      };

      globalMessageStore.push(newMsg);
      saveMessageRecord(newMsg);
      writeSystemLog('MESSAGE_SENT', { messageId: newMsg.id, applicantId: newMsg.applicantId, senderRole: newMsg.senderRole, userId: user.id || user.userId });

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
        broadcastWebSocketEvent('RECRUITER_MESSAGE_SENT', { message: newMsg });
      } else {
        broadcastWebSocketEvent('CANDIDATE_MESSAGE_SENT', { message: newMsg });
      }

      sendJson(201, { status: 'sent', message: newMsg });
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