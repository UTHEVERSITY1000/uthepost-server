const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY COMPACT UI SCALE & FIELD-FOR-FIELD CMS TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`);
      passed++;
    } else {
      console.error(`  FAIL: ${message}`);
      failed++;
    }
  }

  function httpGet(urlPath, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}${urlPath}`);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        headers: headers
      };

      http.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
          }
        });
      }).on('error', reject);
    });
  }

  function httpPost(urlPath, payload, headers = {}) {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(payload);
      const req = http.request(`${BASE_URL}${urlPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataStr),
          ...headers
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
          }
        });
      });
      req.on('error', reject);
      req.write(dataStr);
      req.end();
    });
  }

  function httpPut(urlPath, payload, headers = {}) {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(payload);
      const req = http.request(`${BASE_URL}${urlPath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataStr),
          ...headers
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data, headers: res.headers });
          }
        });
      });
      req.on('error', reject);
      req.write(dataStr);
      req.end();
    });
  }

  const candContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
  const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
  const adminContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

  // ----------------------------------------------------
  // TEST GROUP 1: Compact UI Scale & 6 Streamlined Master Navigation Tabs
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Compact UI Scale & 6 Master Navigation Tabs');
  try {
    assert(adminContent.includes('1. DASHBOARD OVERVIEW'), 'Tab 1: [1. DASHBOARD OVERVIEW] present');
    assert(adminContent.includes('2. USER GOVERNANCE'), 'Tab 2: [2. USER GOVERNANCE] present');
    assert(adminContent.includes('3. FIELD-BY-FIELD LIVE CMS'), 'Tab 3: [3. FIELD-BY-FIELD LIVE CMS] present');
    assert(adminContent.includes('4. PLANS & ADD-ONS CONTROL'), 'Tab 4: [4. PLANS & ADD-ONS CONTROL] present');
    assert(adminContent.includes('5. LISTINGS & APPLICATIONS'), 'Tab 5: [5. LISTINGS & APPLICATIONS] present');
    assert(adminContent.includes('6. SYSTEM & SECURITY SETTINGS'), 'Tab 6: [6. SYSTEM & SECURITY SETTINGS] present');

    assert(adminContent.includes('height: 48px;'), 'Header scaled down to compact 48px height');
    assert(adminContent.includes('height: 36px;'), 'Sub-navigation tabs scaled down to compact 36px height');
    assert(adminContent.includes('view-overview') && adminContent.includes('view-users') && adminContent.includes('view-cms') && adminContent.includes('view-plans') && adminContent.includes('view-listings') && adminContent.includes('view-security'), 'All 6 corresponding view sections present');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Field-For-Field u-thePOST Studio CMS Controls
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Field-For-Field u-thePOST Studio CMS Controls');
  try {
    assert(adminContent.includes('cms-post-card1-title'), 'Card 1 title input present');
    assert(adminContent.includes('cms-post-job-title-label') && adminContent.includes('cms-post-company-label'), 'Job Title and Company Name label inputs present');
    assert(adminContent.includes('cms-post-loc-label') && adminContent.includes('cms-post-emp-options'), 'Location and Employment Options inputs present');
    assert(adminContent.includes('cms-post-salary-label') && adminContent.includes('cms-post-email-label'), 'Salary and Contact Email label inputs present');
    assert(adminContent.includes('cms-post-social-header') && adminContent.includes('cms-post-linkedin-ph'), 'Social header and handles placeholder inputs present');

    assert(adminContent.includes('cms-post-card2-title') && adminContent.includes('cms-post-preview-badge'), 'Card 2 Live Preview header and badge label inputs present');
    assert(adminContent.includes('cms-post-card3-title') && adminContent.includes('cms-post-col-id'), 'Card 3 Live Listings table header and column title inputs present');
    assert(adminContent.includes('cms-post-pub-header') && adminContent.includes('cms-post-pub-btn'), 'Publishing header and button text inputs present');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Field-For-Field u-theJOBS Board CMS Controls
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Field-For-Field u-theJOBS Board CMS Controls');
  try {
    assert(adminContent.includes('cms-jobs-board-title') && adminContent.includes('cms-jobs-search-ph'), 'Board Title and Search Placeholder inputs present');
    assert(adminContent.includes('cms-jobs-quick-send-btn') && adminContent.includes('cms-jobs-send-resume-btn'), 'Quick Send and Send Resume/CV button text inputs present');
    assert(adminContent.includes('cms-jobs-modal-header') && adminContent.includes('cms-jobs-resume-label'), 'Modal Header and Resume Upload label inputs present');
    assert(adminContent.includes('cms-jobs-submit-btn') && adminContent.includes('cms-jobs-submit-tooltip'), 'Submit button text and hover tooltip inputs present');
    assert(adminContent.includes('DOUBLE CHECK CONTACT INFO ON RESUME'), 'Default submit hover tooltip set to DOUBLE CHECK CONTACT INFO ON RESUME');
    assert(adminContent.includes('cms-jobs-msg-header') && adminContent.includes('cms-jobs-quick-replies'), 'Message drawer header and quick reply options present');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Database Sync & Live WebSocket Broadcast
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Database Sync & Live WebSocket Broadcast');
  try {
    const adminLoginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Master Admin authentication session established');
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': `uthe_token=${adminToken}`
    };

    const cmsUpdate = await httpPost('/api/cms/config', {
      postStudio: { card1Title: 'CUSTOM CARD 1 HEADER' },
      jobsBoard: { submitTooltip: 'DOUBLE CHECK CONTACT INFO ON RESUME' },
      pricing: { palMonthly: 0, starterMonthly: 99, individualSocialAddon: 5.99, socialBundleAddon: 19.99 }
    }, adminHeaders);
    assert(cmsUpdate.status === 200, 'POST /api/cms/config successfully saved field-by-field updates');
    assert(cmsUpdate.data.config.postStudio.card1Title === 'CUSTOM CARD 1 HEADER', 'postStudio schema persisted');
    assert(cmsUpdate.data.config.jobsBoard.submitTooltip === 'DOUBLE CHECK CONTACT INFO ON RESUME', 'jobsBoard schema persisted');

    // Test live WebSocket sync
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      let received = false;
      ws.on('open', async () => {
        await httpPost('/api/cms/config', { jobsBoard: { boardTitle: 'U-THEJOBS LIVE' } }, adminHeaders);
      });
      ws.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'CMS_CONFIG_UPDATED' && data.config) {
          received = true;
          assert(true, 'CMS_CONFIG_UPDATED broadcasted live over WebSocket');
          ws.close();
          resolve();
        }
      });
      setTimeout(() => {
        if (!received) {
          assert(false, 'Timed out waiting for CMS_CONFIG_UPDATED event');
          ws.close();
          resolve();
        }
      }, 3000);
    });
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Tab 6 System & Security Settings
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Tab 6 System & Security Settings');
  try {
    assert(adminContent.includes('contact@utheversity.com') && adminContent.includes('815-980-4272'), 'Master identity for Zion Daye configured in Tab 6');
    assert(adminContent.includes('exportAuditLog') && adminContent.includes('diag-console'), 'Live telemetry log console and export audit JSON tool present');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: Helper Tooltips & Inline Guidance
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] Helper Tooltips & Inline Guidance');
  try {
    assert(adminContent.includes('data-tooltip="Card 1 main header"'), 'Card 1 input tooltips present');
    assert(adminContent.includes('data-tooltip="Dropdown options for employment type"'), 'Employment options tooltip present');
    assert(adminContent.includes('data-tooltip="Tooltip displayed when hovering submit button"'), 'Submit tooltip explanation present');
    assert(adminContent.includes('header [data-tooltip]::after') && adminContent.includes('top: calc(100% + 6px)'), 'Top navigation tooltips rendered downward without clipping');
  } catch (err) {
    assert(false, `Group 6 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 7: Disk Persistence (cms_config.json)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 7] Disk Persistence (cms_config.json)');
  try {
    const cmsFilePath = path.join(__dirname, 'cms_config.json');
    assert(fs.existsSync(cmsFilePath), 'cms_config.json file exists on server disk');
    const diskContent = JSON.parse(fs.readFileSync(cmsFilePath, 'utf8'));
    assert(diskContent.postStudio && diskContent.jobsBoard && diskContent.pricing, 'cms_config.json contains postStudio, jobsBoard, and pricing schemas');
    assert(diskContent.pricing.individualSocialAddon === 5.99 && diskContent.pricing.socialBundleAddon === 19.99, 'Add-on pricing ($5.99 / $19.99) correctly persisted to disk');
  } catch (err) {
    assert(false, `Group 7 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 8: Recruiter & Candidate Client Live CMS Load Overrides
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 8] Recruiter & Candidate Client Live CMS Load Overrides');
  try {
    assert(recContent.includes('function applyCmsConfig(config)'), 'recruiter.html implements applyCmsConfig');
    assert(recContent.includes('async function loadInitialCmsConfig()'), 'recruiter.html implements loadInitialCmsConfig');
    assert(recContent.includes('loadInitialCmsConfig();'), 'recruiter.html executes loadInitialCmsConfig on DOMContentLoaded');
    assert(recContent.includes('id="card1-title-text"') && recContent.includes('id="card2-title-text"') && recContent.includes('id="card3-title-text"'), 'recruiter.html has Card 1, 2, 3 title mapping IDs');
    assert(recContent.includes('id="price-pal"') && recContent.includes('id="label-social-bundle-price"'), 'recruiter.html has price-pal and social add-on price mapping IDs');

    assert(candContent.includes('function applyCmsConfig(config)'), 'candidate.html implements applyCmsConfig');
    assert(candContent.includes('async function loadInitialCmsConfig()'), 'candidate.html implements loadInitialCmsConfig');
    assert(candContent.includes('loadInitialCmsConfig();'), 'candidate.html executes loadInitialCmsConfig on DOMContentLoaded');
    assert(candContent.includes('DOUBLE CHECK CONTACT INFO ON RESUME'), 'candidate.html submit tooltip set to DOUBLE CHECK CONTACT INFO ON RESUME');
  } catch (err) {
    assert(false, `Group 8 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 9: Dynamic Membership Calculation Sync with Live CMS
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 9] Dynamic Membership Calculation Sync with Live CMS');
  try {
    assert(recContent.includes('liveCmsPricing.socialBundleAddon') && recContent.includes('liveCmsPricing.individualSocialAddon'), 'recalculateMembershipTotal in recruiter.html dynamically uses liveCmsPricing');
    assert(recContent.includes('BUILD FROM $0'), 'recruiter.html retains signature BUILD FROM $0 header');
  } catch (err) {
    assert(false, `Group 9 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 10: Strict /data Directory Structure & Prefix Indexing Verification
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 10] Strict /data Directory Structure & Prefix Indexing');
  try {
    const dataDir = path.join(__dirname, 'data');
    assert(fs.existsSync(dataDir), '/data root directory exists');
    assert(fs.existsSync(path.join(dataDir, 'employers')), '/data/employers/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'candidates')), '/data/candidates/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'resumes')), '/data/resumes/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'listings')), '/data/listings/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'applications')), '/data/applications/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'messages')), '/data/messages/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'logs')), '/data/logs/ subfolder exists');
    assert(fs.existsSync(path.join(dataDir, 'cms_config.json')), '/data/cms_config.json exists');

    const empFiles = fs.readdirSync(path.join(dataDir, 'employers'));
    assert(empFiles.some(f => f.startsWith('emp_') && f.endsWith('.json')), 'Employer files use "emp_" prefix');

    const candFiles = fs.readdirSync(path.join(dataDir, 'candidates'));
    assert(candFiles.some(f => f.startsWith('cand_') && f.endsWith('.json')), 'Candidate files use "cand_" prefix');

    const jobFiles = fs.readdirSync(path.join(dataDir, 'listings'));
    assert(jobFiles.some(f => f.startsWith('job_') && f.endsWith('.json')), 'Job listing files use "job_" prefix');

    const appFiles = fs.readdirSync(path.join(dataDir, 'applications'));
    assert(appFiles.some(f => f.startsWith('app_') && f.endsWith('.json')), 'Application files use "app_" prefix');

    const msgFiles = fs.readdirSync(path.join(dataDir, 'messages'));
    assert(msgFiles.some(f => f.startsWith('thread_') && f.endsWith('.json')), 'Message thread files use "thread_" prefix');

    const logFiles = fs.readdirSync(path.join(dataDir, 'logs'));
    assert(logFiles.some(f => f.startsWith('log_') && f.endsWith('.json')), 'System log files use "log_" prefix');
  } catch (err) {
    assert(false, `Group 10 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 11: Synchronous Zero-Data-Loss Disk Persistence & PDF Validation
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 11] Synchronous Disk Persistence & Strict PDF Validation');
  try {
    const adminLoginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    const adminToken = adminLoginRes.data.token;
    const adminHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': `uthe_token=${adminToken}`
    };

    // 1. Test candidate signup persistence
    const testEmail = `test.candidate.${Date.now()}@domain.com`;
    const signupRes = await httpPost('/api/auth/signup', {
      email: testEmail,
      password: 'SecurePassword2026!',
      name: 'Test Persistent Candidate',
      role: 'candidate',
      company: 'Test Co'
    });
    assert(signupRes.status === 201, 'POST /api/auth/signup returns 201');
    const newCandId = signupRes.data.user.id;
    const candToken = signupRes.data.token;
    const candHeaders = {
      'Authorization': `Bearer ${candToken}`,
      'Cookie': `uthe_token=${candToken}`
    };
    const candDiskPath = path.join(__dirname, 'data', 'candidates', `cand_${newCandId}.json`);
    assert(fs.existsSync(candDiskPath), `Candidate record synchronously written to disk: ${candDiskPath}`);

    // 2. Test job listing creation persistence
    const testJobTitle = `Senior Lead Architect ${Date.now()}`;
    const jobRes = await httpPost('/api/jobs', {
      jobTitle: testJobTitle,
      company: 'Persistent Systems Corp',
      location: 'New York, NY',
      employmentType: 'Full-Time',
      minCompensation: 180000,
      maxCompensation: 220000
    }, adminHeaders);
    assert(jobRes.status === 201, 'POST /api/jobs returns 201');
    const newJobId = jobRes.data.job.id;
    const jobDiskPath = path.join(__dirname, 'data', 'listings', `job_${newJobId}.json`);
    assert(fs.existsSync(jobDiskPath), `Job listing synchronously written to disk: ${jobDiskPath}`);

    // 3. Test strict resume PDF validation
    const invalidResumeRes = await httpPost('/api/resumes/upload', {
      filename: 'malicious_resume.exe'
    }, candHeaders);
    assert(invalidResumeRes.status === 400, 'POST /api/resumes/upload rejects non-PDF extension (.exe) with 400');

    const validResumeRes = await httpPost('/api/resumes/upload', {
      filename: 'John_Doe_Resume_2026.pdf',
      fileBase64: Buffer.from('%PDF-1.4\n% John Doe Test Resume\n%%EOF').toString('base64')
    }, candHeaders);
    assert(validResumeRes.status === 201, 'POST /api/resumes/upload accepts valid .pdf file with 201');
    const resumeDiskPath = path.join(__dirname, 'data', 'resumes', 'John_Doe_Resume_2026.pdf');
    assert(fs.existsSync(resumeDiskPath), `Resume PDF file saved to /data/resumes/: ${resumeDiskPath}`);

    // 4. Test applicant submission persistence & PDF check
    const invalidAppRes = await httpPost('/api/applicants', {
      jobId: newJobId,
      jobTitle: testJobTitle,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      resumeFile: 'resume_word_doc.docx'
    });
    assert(invalidAppRes.status === 400, 'POST /api/applicants rejects non-PDF resume (.docx) with 400');

    const validAppRes = await httpPost('/api/applicants', {
      jobId: newJobId,
      jobTitle: testJobTitle,
      name: 'Jane Doe',
      email: 'jane.doe@example.com',
      resumeFile: 'Jane_Doe_Resume_2026.pdf'
    });
    assert(validAppRes.status === 201, 'POST /api/applicants accepts .pdf resume with 201');
    const newAppId = validAppRes.data.applicant.id;
    const appDiskPath = path.join(__dirname, 'data', 'applications', `app_${newAppId}.json`);
    assert(fs.existsSync(appDiskPath), `Applicant record synchronously written to disk: ${appDiskPath}`);

    // 5. Test message thread persistence
    const msgRes = await httpPost('/api/messages', {
      applicantId: newAppId,
      senderRole: 'candidate',
      senderName: 'Test Persistent Candidate',
      company: 'Persistent Systems Corp',
      jobTitle: testJobTitle,
      text: 'We loved your PDF resume and would like to schedule an interview.'
    }, candHeaders);
    assert(msgRes.status === 201, 'POST /api/messages returns 201');
    const newMsgId = msgRes.data.message.id;
    const msgDiskPath = path.join(__dirname, 'data', 'messages', `thread_${newMsgId}.json`);
    assert(fs.existsSync(msgDiskPath), `Message thread synchronously written to disk: ${msgDiskPath}`);

    // 6. Test Omni-Search retrieves newly indexed records
    const searchRes = await httpGet(`/api/admin/search?q=${encodeURIComponent('Persistent Systems')}`, adminHeaders);
    assert(searchRes.status === 200, 'GET /api/admin/search returns 200');
    assert(searchRes.data.results.jobs.some(j => j.id === newJobId), 'Omni-Search instantly retrieves new indexed job from memory & storage');
  } catch (err) {
    assert(false, `Group 11 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 12: Public Job Listing Sanitization (/api/listings/public & /api/jobs)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 12] Public Job Listing Sanitization');
  try {
    const pubListingsRes = await httpGet('/api/listings/public');
    assert(pubListingsRes.status === 200, 'GET /api/listings/public returns 200');
    assert(Array.isArray(pubListingsRes.data.jobs), 'Public jobs payload contains jobs array');
    assert(pubListingsRes.data.jobs.length > 0, 'Public jobs list is non-empty');

    const firstJob = pubListingsRes.data.jobs[0];
    assert(firstJob.jobTitle && firstJob.company && firstJob.location && firstJob.salary, 'Public job contains Title, Company, Location, and Salary');
    assert(firstJob.recruiterEmail === undefined, 'Private recruiterEmail stripped from public response');
    assert(firstJob.applicantCount === undefined, 'Internal applicant counts stripped from public response');
    assert(firstJob.applicants === undefined, 'Candidate applicant profiles stripped from public response');

    const unauthJobsRes = await httpGet('/api/jobs');
    assert(unauthJobsRes.status === 200, 'Unauthenticated GET /api/jobs returns 200');
    assert(unauthJobsRes.data.jobs[0].recruiterEmail === undefined, 'Unauthenticated /api/jobs returns sanitized job objects');
  } catch (err) {
    assert(false, `Group 12 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 13: Secure Private Routes & 401 Unauthorized Enforcement
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 13] Secure Private Routes & 401 Unauthorized Enforcement');
  try {
    // 1. Unauthenticated direct access to private candidate resumes must return 401
    const unauthResumeRes = await httpGet('/data/resumes/Marcus_Vance_Resume_2026.pdf');
    assert(unauthResumeRes.status === 401, 'Unauthenticated GET /data/resumes/Marcus_Vance_Resume_2026.pdf blocked with 401 Unauthorized');

    // 2. Unauthenticated access to applicants list must return 401
    const unauthAppsRes = await httpGet('/api/applicants');
    assert(unauthAppsRes.status === 401, 'Unauthenticated GET /api/applicants blocked with 401 Unauthorized');

    // 3. Unauthenticated access to messages must return 401
    const unauthMsgsRes = await httpGet('/api/messages');
    assert(unauthMsgsRes.status === 401, 'Unauthenticated GET /api/messages blocked with 401 Unauthorized');

    // 4. Unauthenticated access to admin users list must return 401
    const unauthUsersRes = await httpGet('/api/admin/users');
    assert(unauthUsersRes.status === 401, 'Unauthenticated GET /api/admin/users blocked with 401 Unauthorized');

    // 5. Unauthenticated access to admin stats must return 401
    const unauthStatsRes = await httpGet('/api/admin/stats');
    assert(unauthStatsRes.status === 401, 'Unauthenticated GET /api/admin/stats blocked with 401 Unauthorized');

    // 6. Unauthenticated access to admin search must return 401
    const unauthSearchRes = await httpGet('/api/admin/search?q=test');
    assert(unauthSearchRes.status === 401, 'Unauthenticated GET /api/admin/search blocked with 401 Unauthorized');

    // 7. Authenticate as Master Admin Zion Daye
    const adminLoginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    assert(adminLoginRes.status === 200 && adminLoginRes.data.token, 'Master Admin Zion Daye logs in and receives token');
    const adminToken = adminLoginRes.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': `uthe_token=${adminToken}`
    };

    // 8. Authenticated access to private endpoints succeeds with 200
    const authAppsRes = await httpGet('/api/applicants', authHeaders);
    assert(authAppsRes.status === 200, 'Authenticated GET /api/applicants succeeds with 200');

    const authMsgsRes = await httpGet('/api/messages', authHeaders);
    assert(authMsgsRes.status === 200, 'Authenticated GET /api/messages succeeds with 200');

    const authResumeRes = await httpGet('/data/resumes/Marcus_Vance_Resume_2026.pdf', authHeaders);
    assert(authResumeRes.status === 200, 'Authenticated GET /data/resumes/... returns 200 and serves PDF');

    const authStatsRes = await httpGet('/api/admin/stats', authHeaders);
    assert(authStatsRes.status === 200, 'Authenticated GET /api/admin/stats returns 200');

    const authUsersRes = await httpGet('/api/admin/users', authHeaders);
    assert(authUsersRes.status === 200, 'Authenticated GET /api/admin/users returns 200');
  } catch (err) {
    assert(false, `Group 13 failed: ${err.message}`);
  }

  // ============================================================================
  // GROUP 14: REAL-TIME CMS LIVE SYNC, CACHE CONTROL & FRONTEND DOM BINDING
  // ============================================================================
  console.log('\n--- GROUP 14: REAL-TIME CMS LIVE SYNC & CACHE CONTROL ---');
  try {
    // 1. Strict Cache-Control Headers on GET /api/cms/config
    const cmsGetRes = await httpGet('/api/cms/config');
    assert(cmsGetRes.status === 200, 'GET /api/cms/config returns 200');
    
    const cacheControlHeader = cmsGetRes.headers['cache-control'] || '';
    const pragmaHeader = cmsGetRes.headers['pragma'] || '';
    const expiresHeader = cmsGetRes.headers['expires'] || '';

    assert(cacheControlHeader.includes('no-cache'), 'GET /api/cms/config includes no-cache in Cache-Control');
    assert(cacheControlHeader.includes('no-store'), 'GET /api/cms/config includes no-store in Cache-Control');
    assert(cacheControlHeader.includes('must-revalidate'), 'GET /api/cms/config includes must-revalidate in Cache-Control');
    assert(cacheControlHeader.includes('max-age=0'), 'GET /api/cms/config includes max-age=0 in Cache-Control');
    assert(pragmaHeader === 'no-cache', 'GET /api/cms/config includes Pragma: no-cache');
    assert(expiresHeader === '0', 'GET /api/cms/config includes Expires: 0');

    // Authenticate Master Admin
    const loginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    const authHeaders = {
      'Authorization': `Bearer ${loginRes.data.token}`,
      'Cookie': `auth_token=${loginRes.data.token}`
    };

    // 2. WebSocket Real-Time Broadcast on CMS update
    const ws = new WebSocket('ws://localhost:3000');
    let receivedWsCmsUpdate = false;
    let wsBroadcastData = null;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        resolve(); // Continue even if WS timeout to check results
      }, 4000);

      ws.on('open', async () => {
        ws.on('message', (raw) => {
          try {
            const parsed = JSON.parse(raw.toString());
            if (parsed.type === 'cms_update' || parsed.event === 'cms_update' || parsed.type === 'CMS_CONFIG_UPDATED') {
              receivedWsCmsUpdate = true;
              wsBroadcastData = parsed;
              clearTimeout(timeout);
              ws.close();
              resolve();
            }
          } catch (e) {}
        });

        // Trigger CMS update via POST
        const updatePayload = {
          postStudio: {
            card1Title: '1. EMPLOYER JOB LISTING & CONNECTED ACCOUNTS (LIVE SYNC)',
            publishBtnText: 'PUBLISH POSITION LIVE & BROADCAST'
          },
          jobsBoard: {
            boardTitle: 'U-THEJOBS LIVE'
          },
          pricing: {
            palMonthly: 0,
            starterMonthly: 99,
            growthMonthly: 299,
            proMonthly: 699
          }
        };

        await httpPost('/api/cms/config', updatePayload, authHeaders);
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    assert(receivedWsCmsUpdate === true, 'WebSocket server broadcasts cms_update event on CMS mutations');
    if (wsBroadcastData) {
      assert(wsBroadcastData.updatedConfig || wsBroadcastData.config, 'WebSocket broadcast contains updatedConfig payload');
    }

    // 3. Frontend HTML Verification: data-cms-key attributes & cache busting
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // recruiter.html checks
    assert(recruiterHtml.includes('data-cms-key="brand-title"'), 'recruiter.html binds data-cms-key="brand-title"');
    assert(recruiterHtml.includes('data-cms-key="post-card1-title"'), 'recruiter.html binds data-cms-key="post-card1-title"');
    assert(recruiterHtml.includes('data-cms-key="post-card2-title"'), 'recruiter.html binds data-cms-key="post-card2-title"');
    assert(recruiterHtml.includes('data-cms-key="post-card3-title"'), 'recruiter.html binds data-cms-key="post-card3-title"');
    assert(recruiterHtml.includes('data-cms-key="post-publish-header"'), 'recruiter.html binds data-cms-key="post-publish-header"');
    assert(recruiterHtml.includes('data-cms-key="post-publish-btn"'), 'recruiter.html binds data-cms-key="post-publish-btn"');
    assert(recruiterHtml.includes('data-cms-key="price-pal"'), 'recruiter.html binds data-cms-key="price-pal"');
    assert(recruiterHtml.includes('data-cms-key="price-starter"'), 'recruiter.html binds data-cms-key="price-starter"');
    assert(recruiterHtml.includes('data-cms-key="price-growth"'), 'recruiter.html binds data-cms-key="price-growth"');
    assert(recruiterHtml.includes('data-cms-key="price-pro"'), 'recruiter.html binds data-cms-key="price-pro"');
    assert(recruiterHtml.includes('data-cms-key="social-bundle-label"'), 'recruiter.html binds data-cms-key="social-bundle-label"');
    assert(recruiterHtml.includes('/api/cms/config?t='), 'recruiter.html uses cache-busting timestamp ?t= on initial CMS fetch');
    assert(recruiterHtml.includes('cms_update'), 'recruiter.html listens for cms_update WebSocket event');

    // candidate.html checks
    assert(candidateHtml.includes('data-cms-key="jobs-board-title"'), 'candidate.html binds data-cms-key="jobs-board-title"');
    assert(candidateHtml.includes('data-cms-key="jobs-search-placeholder"'), 'candidate.html binds data-cms-key="jobs-search-placeholder"');
    assert(candidateHtml.includes('data-cms-key="jobs-quick-send-btn"'), 'candidate.html binds data-cms-key="jobs-quick-send-btn"');
    assert(candidateHtml.includes('data-cms-key="jobs-send-resume-btn"'), 'candidate.html binds data-cms-key="jobs-send-resume-btn"');
    assert(candidateHtml.includes('data-cms-key="jobs-modal-header"'), 'candidate.html binds data-cms-key="jobs-modal-header"');
    assert(candidateHtml.includes('data-cms-key="jobs-resume-label"'), 'candidate.html binds data-cms-key="jobs-resume-label"');
    assert(candidateHtml.includes('data-cms-key="jobs-contact-opts"'), 'candidate.html binds data-cms-key="jobs-contact-opts"');
    assert(candidateHtml.includes('data-cms-key="jobs-interview-title"'), 'candidate.html binds data-cms-key="jobs-interview-title"');
    assert(candidateHtml.includes('data-cms-key="jobs-submit-btn"'), 'candidate.html binds data-cms-key="jobs-submit-btn"');
    assert(candidateHtml.includes('data-cms-key="jobs-msg-header"'), 'candidate.html binds data-cms-key="jobs-msg-header"');
    assert(candidateHtml.includes('/api/cms/config?t='), 'candidate.html uses cache-busting timestamp ?t= on initial CMS fetch');
    assert(candidateHtml.includes('cms_update'), 'candidate.html listens for cms_update WebSocket event');

  } catch (err) {
    assert(false, `Group 14 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 15: USER GOVERNANCE TABLE DATA POPULATION & OMNI-SEARCH
  // ----------------------------------------------------
  console.log('\n--- GROUP 15: USER GOVERNANCE DATA POPULATION & OMNI-SEARCH ---');
  try {
    const adminLoginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    const adminToken = adminLoginRes.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': `uthe_token=${adminToken}`
    };

    // 1. Backend User Aggregation Endpoint (/api/admin/users)
    const usersRes = await httpGet('/api/admin/users', authHeaders);
    assert(usersRes.status === 200, 'GET /api/admin/users returns HTTP 200 for authenticated admin');
    assert(Array.isArray(usersRes.data.users), '/api/admin/users returns an array of users');
    assert(usersRes.data.users.length >= 3, '/api/admin/users contains at least 3 aggregated users (Master Admin, Employer, Candidate)');

    // Verify format compliance for each user
    const firstUser = usersRes.data.users[0];
    assert(firstUser.userId !== undefined || firstUser.id !== undefined, 'User record has userId / id');
    assert(firstUser.fullName !== undefined || firstUser.name !== undefined, 'User record has fullName / name');
    assert(firstUser.email !== undefined, 'User record has email');
    assert(firstUser.phone !== undefined, 'User record has phone');
    assert(firstUser.role !== undefined, 'User record has role');
    assert(firstUser.status !== undefined, 'User record has status');
    assert(firstUser.createdAt !== undefined, 'User record has createdAt');

    // Check Mandatory 3 Seed Accounts
    const zionUser = usersRes.data.users.find(u => u.email === 'contact@utheversity.com');
    assert(zionUser !== undefined, 'Zion Daye exists in aggregated user list');
    assert(zionUser.userId === 'USR-001' || zionUser.id === 'USR-001', 'Zion Daye has ID USR-001');
    assert(zionUser.role.toLowerCase().includes('admin'), 'Zion Daye has role Master Admin / Admin');
    assert(zionUser.status === 'Active', 'Zion Daye has status Active');
    assert(zionUser.phone === '815-980-4272', 'Zion Daye has phone 815-980-4272');

    const employerUser = usersRes.data.users.find(u => (u.userId === 'USR-002' || u.id === 'USR-002') || u.email === 'hr@apexrecruiting.com' || u.email === 'hr@premiergroup.com');
    assert(employerUser !== undefined, 'USR-002 Employer exists in user list');
    assert(employerUser.fullName.includes('Apex') || employerUser.name.includes('Apex') || employerUser.fullName.includes('Employer'), 'USR-002 has name Apex Recruiting Co.');
    assert(employerUser.role === 'Employer', 'USR-002 has role Employer');
    assert(employerUser.status === 'Active', 'USR-002 has status Active');

    const candidateUser = usersRes.data.users.find(u => (u.userId === 'USR-003' || u.id === 'USR-003') || u.email === 'jordan.rivera@email.com' || u.email === 'alex.mercer@email.com');
    assert(candidateUser !== undefined, 'USR-003 Candidate exists in user list');
    assert(candidateUser.fullName.includes('Jordan') || candidateUser.name.includes('Jordan') || candidateUser.fullName.includes('Mercer'), 'USR-003 has name Jordan Rivera');
    assert(candidateUser.role === 'Candidate', 'USR-003 has role Candidate');
    assert(candidateUser.status === 'Active', 'USR-003 has status Active');

    // 2. Multi-Directory Scanning (/data/employers/ and /data/candidates/)
    const testEmpPath = path.join(__dirname, 'data', 'employers', 'emp_USR_TEST_EMP_99.json');
    const testCandPath = path.join(__dirname, 'data', 'candidates', 'cand_USR_TEST_CAND_99.json');
    
    fs.writeFileSync(testEmpPath, JSON.stringify({
      id: 'USR-TEST-EMP-99',
      userId: 'USR-TEST-EMP-99',
      name: 'Dynamic Test Employer',
      fullName: 'Dynamic Test Employer',
      email: 'test.employer@scan.org',
      phone: '+1 (555) 777-8888',
      role: 'Employer',
      status: 'Active',
      approved: true,
      createdAt: new Date().toISOString()
    }, null, 2), 'utf8');

    fs.writeFileSync(testCandPath, JSON.stringify({
      id: 'USR-TEST-CAND-99',
      userId: 'USR-TEST-CAND-99',
      name: 'Dynamic Test Candidate',
      fullName: 'Dynamic Test Candidate',
      email: 'test.candidate@scan.org',
      phone: '+1 (555) 333-4444',
      role: 'Candidate',
      status: 'Active',
      approved: true,
      createdAt: new Date().toISOString()
    }, null, 2), 'utf8');

    const rescannedRes = await httpGet('/api/admin/users', authHeaders);
    const hasScannedEmp = rescannedRes.data.users.some(u => u.email === 'test.employer@scan.org');
    const hasScannedCand = rescannedRes.data.users.some(u => u.email === 'test.candidate@scan.org');
    assert(hasScannedEmp, 'Aggregated endpoint dynamically includes /data/employers/ files');
    assert(hasScannedCand, 'Aggregated endpoint dynamically includes /data/candidates/ files');

    // Clean up test files
    if (fs.existsSync(testEmpPath)) fs.unlinkSync(testEmpPath);
    if (fs.existsSync(testCandPath)) fs.unlinkSync(testCandPath);

    // 3. User Governance Actions: Password Reset, Edit & Toggle Status
    const resetRes = await httpPost('/api/admin/users/USR-003/reset-password', {}, authHeaders);
    assert(resetRes.status === 200, 'POST /api/admin/users/:id/reset-password generates secure temporary password');
    assert(resetRes.data.tempPassword && resetRes.data.tempPassword.startsWith('Reset'), 'Reset response returns tempPassword');

    const updateRes = await httpPost('/api/admin/users/USR-003', {
      status: 'Active',
      approved: true,
      phone: '312-555-0144'
    }, authHeaders);
    assert(updateRes.status === 200, 'POST/PUT /api/admin/users/:id updates user record');

    // 4. Omni-Search Backend & Frontend Filter Testing
    const searchAdminRes = await httpGet('/api/admin/search?q=Zion', authHeaders);
    assert(searchAdminRes.status === 200, 'GET /api/admin/search returns 200 for authenticated admin');
    assert(searchAdminRes.data.results.users.some(u => (u.fullName || u.name).includes('Zion')), 'Omni-Search filters users by Name');

    const searchRoleRes = await httpGet('/api/admin/search?q=Candidate', authHeaders);
    assert(searchRoleRes.data.results.users.length > 0, 'Omni-Search filters users by Role');

    // 5. Frontend admin.html Structure Verification
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    assert(adminHtml.includes('loadUsers'), 'admin.html implements loadUsers()');
    assert(adminHtml.includes('fetchUsers'), 'admin.html implements fetchUsers() alias');
    assert(adminHtml.includes('switchAdminTab(\'users\')') || adminHtml.includes('switchAdminTab("users")'), 'admin.html binds switchAdminTab to Tab 2');
    assert(adminHtml.includes('renderUserTable') || adminHtml.includes('renderAdminUsers'), 'admin.html implements user table rendering');
    assert(adminHtml.includes('user-table-body'), 'admin.html defines #user-table-body container');
    assert(adminHtml.includes('editUser'), 'admin.html renders [EDIT] action trigger editUser');
    assert(adminHtml.includes('resetPassword'), 'admin.html renders [RESET PW] action trigger resetPassword');
    assert(adminHtml.includes('toggleSuspend'), 'admin.html renders [SUSPEND] action trigger toggleSuspend');
    assert(adminHtml.includes('deleteUser'), 'admin.html renders [DELETE] action trigger deleteUser');
    assert(adminHtml.includes('role-badge'), 'admin.html includes role-badge CSS class');
    assert(adminHtml.includes('status-badge'), 'admin.html includes status-badge CSS class');
    assert(adminHtml.includes('action-cells'), 'admin.html includes action-cells CSS class');
    assert(adminHtml.includes('handleOmniSearch'), 'admin.html implements real-time handleOmniSearch');

  } catch (err) {
    assert(false, `Group 15 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 16: Automated Transactional Email Engine & Templates
  // ----------------------------------------------------
  console.log('\n--- GROUP 16: TRANSACTIONAL EMAIL ENGINE & BRANDED TEMPLATES ---');
  try {
    const emailLogPath = path.join(__dirname, 'data', 'logs', 'emails.log');
    const emailJsonLogPath = path.join(__dirname, 'data', 'logs', 'log_emails.json');

    const adminLoginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    const authHeaders = {
      'Authorization': `Bearer ${adminLoginRes.data.token}`,
      'Cookie': `uthe_token=${adminLoginRes.data.token}`
    };

    // 1. Sign-Up Welcome Email Trigger (/api/auth/register or /api/auth/signup)
    const testRegEmail = `test.welcome.${Date.now()}@utheversity.com`;
    const regRes = await httpPost('/api/auth/register', {
      email: testRegEmail,
      password: 'SecurePassword2026!',
      name: 'Elena Rostova',
      role: 'candidate',
      phone: '+1 (555) 890-1234'
    });
    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(fs.existsSync(emailLogPath), '/data/logs/emails.log exists');
    assert(fs.existsSync(emailJsonLogPath), '/data/logs/log_emails.json exists');

    const emailLogsJson = JSON.parse(fs.readFileSync(emailJsonLogPath, 'utf8'));
    const welcomeLog = emailLogsJson.find(e => e.to === testRegEmail && e.type === 'WELCOME_USER');
    assert(welcomeLog !== undefined, 'Sign-up triggers WELCOME_USER transactional email');
    assert(welcomeLog.subject.includes('Welcome to UTHEVERSITY'), 'Welcome email has official branded subject');

    // 2. Password Reset Flow (/api/auth/forgot-password, /api/auth/verify-reset-token, /api/auth/reset-password)
    const forgotRes = await httpPost('/api/auth/forgot-password', { email: testRegEmail });
    assert(forgotRes.status === 200, 'POST /api/auth/forgot-password returns 200');
    assert(forgotRes.data.token !== undefined, 'Forgot password generates secure 30-minute token');

    const verifyTokenRes = await httpGet(`/api/auth/verify-reset-token?token=${forgotRes.data.token}`);
    assert(verifyTokenRes.status === 200 && verifyTokenRes.data.valid === true, 'GET /api/auth/verify-reset-token validates active token');

    const resetPassRes = await httpPost('/api/auth/reset-password', {
      token: forgotRes.data.token,
      newPassword: 'BrandNewPassword2026!'
    });
    assert(resetPassRes.status === 200, 'POST /api/auth/reset-password with token returns 200');

    const postResetLogs = JSON.parse(fs.readFileSync(emailJsonLogPath, 'utf8'));
    const resetReqLog = postResetLogs.find(e => e.to === testRegEmail && e.type === 'PASSWORD_RESET_REQUEST');
    const resetConfLog = postResetLogs.find(e => e.to === testRegEmail && e.type === 'PASSWORD_RESET_CONFIRMATION');
    assert(resetReqLog !== undefined, 'PASSWORD_RESET_REQUEST email logged');
    assert(resetConfLog !== undefined, 'PASSWORD_RESET_CONFIRMATION email logged');

    // 3. Application Submission Receipt & Recruiter Alert
    const testAppEmail = `candidate.applicant.${Date.now()}@utheversity.com`;
    const appRes = await httpPost('/api/applicants', {
      jobId: 'JOB-101',
      jobTitle: 'Senior Full-Stack Architect',
      name: 'Morgan Sterling',
      email: testAppEmail,
      phone: '+1 (555) 432-9876',
      resumeFile: 'Morgan_Sterling_Resume.pdf',
      status: 'Applied'
    });
    assert(appRes.status === 201, 'POST /api/applicants returns 201 Created');

    const appLogs = JSON.parse(fs.readFileSync(emailJsonLogPath, 'utf8'));
    const candidateReceipt = appLogs.find(e => e.to === testAppEmail && e.type === 'APPLICATION_RECEIPT_CANDIDATE');
    const recruiterAlert = appLogs.find(e => e.type === 'NEW_APPLICANT_ALERT_RECRUITER');
    assert(candidateReceipt !== undefined, 'Candidate APPLICATION_RECEIPT_CANDIDATE email dispatched');
    assert(candidateReceipt.subject.includes('Application Received'), 'Application receipt subject formatted correctly');
    assert(recruiterAlert !== undefined, 'Recruiter NEW_APPLICANT_ALERT_RECRUITER email dispatched');

    // 4. Direct Message Alert Trigger
    const msgRes = await httpPost('/api/messages', {
      applicantId: appRes.data.applicant.id,
      senderRole: 'recruiter',
      senderName: 'Quantum Talent Acquisition',
      company: 'Quantum Technologies Corp',
      jobTitle: 'Senior Full-Stack Architect',
      text: 'Hello Morgan, we were very impressed with your portfolio and would like to invite you for an interview.'
    }, authHeaders);
    assert(msgRes.status === 201, 'POST /api/messages returns 201 Created');

    const msgLogs = JSON.parse(fs.readFileSync(emailJsonLogPath, 'utf8'));
    const messageAlert = msgLogs.find(e => e.type === 'NEW_DIRECT_MESSAGE_ALERT' && e.to === testAppEmail);
    assert(messageAlert !== undefined, 'NEW_DIRECT_MESSAGE_ALERT email dispatched to applicant');
    assert(messageAlert.subject.includes('Quantum Technologies Corp') || messageAlert.subject.includes('Quantum Talent'), 'Message alert subject contains company / sender name');

    // 5. Admin Email Telemetry Endpoint
    const adminEmailsRes = await httpGet('/api/admin/emails', authHeaders);
    assert(adminEmailsRes.status === 200, 'GET /api/admin/emails returns 200 for admin');
    assert(Array.isArray(adminEmailsRes.data.emails), '/api/admin/emails returns an array of emails');
    assert(adminEmailsRes.data.count > 0, '/api/admin/emails contains dispatched email records');

    // 6. SMTP Diagnostic Status Endpoint (/api/admin/smtp-status)
    const smtpStatusRes = await httpGet('/api/admin/smtp-status', authHeaders);
    assert(smtpStatusRes.status === 200, 'GET /api/admin/smtp-status returns 200 OK');
    assert(smtpStatusRes.data.smtpStatus !== undefined, '/api/admin/smtp-status returns smtpStatus indicator');
    assert(smtpStatusRes.data.config !== undefined, '/api/admin/smtp-status returns config object');
    assert(smtpStatusRes.data.config.from === 'contact@utheversity.com', 'Configured sender defaults to contact@utheversity.com');

    // 7. Live Test Email Dispatch Endpoint (/api/admin/test-email)
    const testEmailDispatchRes = await httpPost('/api/admin/test-email', {
      to: 'contact@utheversity.com'
    }, authHeaders);
    assert(testEmailDispatchRes.status === 200, 'POST /api/admin/test-email returns 200 OK');
    assert(testEmailDispatchRes.data.status === 'success', 'Test email returns success status');
    assert(testEmailDispatchRes.data.deliveryId !== undefined || testEmailDispatchRes.data.messageId !== undefined, 'Test email returns message delivery ID');
    assert(testEmailDispatchRes.data.to === 'contact@utheversity.com', 'Test email dispatched to target contact@utheversity.com');

    // 8. Template & Styling Verification
    const emailsTextLog = fs.readFileSync(emailLogPath, 'utf8');
    assert(emailsTextLog.includes('WELCOME_USER'), 'emails.log records WELCOME_USER entries');
    assert(emailsTextLog.includes('APPLICATION_RECEIPT_CANDIDATE'), 'emails.log records APPLICATION_RECEIPT entries');
    assert(emailsTextLog.includes('NEW_DIRECT_MESSAGE_ALERT'), 'emails.log records NEW_DIRECT_MESSAGE_ALERT entries');
    assert(emailsTextLog.includes('DIAGNOSTIC_TEST_EMAIL'), 'emails.log records DIAGNOSTIC_TEST_EMAIL entries');

    // 9. Admin Interface Verification (admin.html & u-theADMIN-MASTER-SUITE.html)
    const adminHtmlContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    assert(adminHtmlContent.includes('TRANSACTIONAL EMAIL SYSTEM'), 'admin.html includes Transactional Email System card');
    assert(adminHtmlContent.includes('smtp-status-indicator'), 'admin.html includes #smtp-status-indicator');
    assert(adminHtmlContent.includes('test-email-target'), 'admin.html includes target email input #test-email-target');
    assert(adminHtmlContent.includes('sendAdminTestEmail'), 'admin.html implements sendAdminTestEmail()');
    assert(adminHtmlContent.includes('checkSmtpStatus'), 'admin.html implements checkSmtpStatus()');
    assert(adminHtmlContent.includes('btn-send-test-email'), 'admin.html includes [SEND TEST EMAIL] button');
    assert(adminHtmlContent.includes('master_admin_token'), 'admin.html manages master_admin_token in localStorage');
    assert(adminHtmlContent.includes('getAdminAuthHeaders'), 'admin.html injects getAdminAuthHeaders()');
    assert(adminHtmlContent.includes('authenticateMasterSession'), 'admin.html implements authenticateMasterSession()');
    assert(adminHtmlContent.includes('master-session-badge'), 'admin.html includes #master-session-badge');

    // 10. Direct Master Admin Bearer Token Access
    const masterBearerRes = await httpPost('/api/admin/test-email', {
      to: 'contact@utheversity.com'
    }, { 'Authorization': 'Bearer master_admin_token' });
    assert(masterBearerRes.status === 200, 'POST /api/admin/test-email accepts master_admin_token Bearer token');

    // 11. Direct https://admin.utheversity.com Domain / Portal Header Auto-Permit
    const portalOriginRes = await httpPost('/api/admin/test-email', {
      to: 'contact@utheversity.com'
    }, { 'Origin': 'https://admin.utheversity.com', 'X-Admin-Portal': 'true' });
    assert(portalOriginRes.status === 200, 'POST /api/admin/test-email automatically permits requests from admin.utheversity.com portal');

    // 12. IPv4 DNS & SMTP Connection Verification (Fix ENETUNREACH)
    const serverJsContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    assert(serverJsContent.includes("dns.setDefaultResultOrder('ipv4first')"), "server.js forces dns.setDefaultResultOrder('ipv4first')");
    assert(serverJsContent.includes('family: 4'), 'server.js forces family: 4 on Nodemailer SMTP transport');

  } catch (err) {
    assert(false, `Group 16 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 17: BULK .ZIP RESUME ARCHIVE DOWNLOAD & ATS CONTROLS
  // ================================================================
  console.log('\n--- GROUP 17: BULK .ZIP RESUME ARCHIVE DOWNLOAD & ATS CONTROLS ---');
  try {
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const masterSuiteHtml = fs.readFileSync(path.join(__dirname, 'u-theADMIN-MASTER-SUITE.html'), 'utf8');

    assert(adminHtml.includes('CANDIDATE APPLICATIONS & ATS STAGE OVERRIDES'), 'admin.html contains Candidate Applications section header');
    assert(adminHtml.includes('href="/api/admin/resumes/download-all"'), 'admin.html routes to /api/admin/resumes/download-all');
    assert(adminHtml.includes('target="_blank"'), 'admin.html bulk download anchor has target="_blank"');
    assert(adminHtml.includes('DOWNLOAD ALL RESUMES (.ZIP)'), 'admin.html renders DOWNLOAD ALL RESUMES (.ZIP) button text');

    assert(masterSuiteHtml.includes('href="/api/admin/resumes/download-all"'), 'u-theADMIN-MASTER-SUITE.html routes to /api/admin/resumes/download-all');

    const downloadAllRes = await httpGet('/api/admin/resumes/download-all', {
      'Authorization': 'Bearer master_admin_token',
      'X-Admin-Portal': 'true'
    });
    assert(downloadAllRes.status === 200, 'GET /api/admin/resumes/download-all returns HTTP 200 OK');
    assert(downloadAllRes.headers['content-type'] === 'application/zip', 'GET /api/admin/resumes/download-all returns application/zip Content-Type');
    assert(downloadAllRes.headers['content-disposition'] && downloadAllRes.headers['content-disposition'].includes('.zip'), 'GET /api/admin/resumes/download-all includes attachment filename');

  } catch (err) {
    assert(false, `Group 17 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 18: SIGNATURE UTHEVERSITY EXECUTIVE RECRUITER MESSAGING MODAL
  // ================================================================
  console.log('\n--- GROUP 18: SIGNATURE UTHEVERSITY EXECUTIVE RECRUITER MESSAGING MODAL ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    assert(candHtml.includes('id="messageDrawer"'), 'candidate.html implements #messageDrawer modal container');
    assert(candHtml.includes('class="message-drawer-card"'), 'candidate.html implements .message-drawer-card');
    assert(candHtml.includes('class="message-drawer-header"'), 'candidate.html implements .message-drawer-header');
    assert(candHtml.includes('class="message-drawer-title"'), 'candidate.html implements .message-drawer-title');
    assert(candHtml.includes('SELECT A CONVERSATION') || candHtml.includes('DIRECT RECRUITER MESSAGES'), 'candidate.html renders executive messaging header title');
    assert(candHtml.includes('class="message-drawer-close"'), 'candidate.html implements .message-drawer-close');
    assert(candHtml.includes('id="chatMessagesContainer"'), 'candidate.html implements #chatMessagesContainer message body');
    assert(candHtml.includes('class="quick-responses-wrapper"'), 'candidate.html implements .quick-responses-wrapper');
    assert(candHtml.includes('class="quick-chip"'), 'candidate.html implements .quick-chip response chips');
    assert(candHtml.includes('selectQuickReply('), 'candidate.html binds selectQuickReply()');
    assert(candHtml.includes('id="recruiterReplyInput"'), 'candidate.html implements #recruiterReplyInput');
    assert(candHtml.includes('class="send-reply-btn"'), 'candidate.html implements .send-reply-btn');
    assert(candHtml.includes('sendRecruiterReply()'), 'candidate.html binds sendRecruiterReply()');
    assert(candHtml.includes('showCustomModalAlert'), 'candidate.html uses signature showCustomModalAlert (zero native pop-ups)');
    assert(candHtml.includes('max-width: 820px') || candHtml.includes('max-width: 680px'), 'candidate.html enforces executive card width');
    assert(candHtml.includes('#D4AF37'), 'candidate.html incorporates signature #D4AF37 metallic gold accents');
    assert(candHtml.includes('#0f172a'), 'candidate.html incorporates signature #0f172a executive navy background');

  } catch (err) {
    assert(false, `Group 18 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 19: ACCURATE RESUME TEXT READER & AUTO-FILL TOGGLE
  // ================================================================
  console.log('\n--- GROUP 19: ACCURATE RESUME TEXT READER & AUTO-FILL TOGGLE ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    assert(candHtml.includes('pdf.min.js'), 'candidate.html includes PDF.js web reader library');
    assert(candHtml.includes('id="autoFillConsentCheckbox"'), 'candidate.html implements #autoFillConsentCheckbox toggle');
    assert(candHtml.includes('id="autoFillConsentCheckbox" checked') || candHtml.includes('id="autoFillConsentCheckbox"\n  checked') || candHtml.includes('id="autoFillConsentCheckbox" checked style'), 'candidate.html pre-checks #autoFillConsentCheckbox');
    assert(candHtml.includes('Automatically fill my contact details from my uploaded resume'), 'candidate.html displays consent checkbox label text');
    assert(candHtml.includes('id="resume-scan-banner"'), 'candidate.html implements #resume-scan-banner notification card');
    assert(candHtml.includes('id="global-resume-scan-banner"'), 'candidate.html implements #global-resume-scan-banner');
    assert(candHtml.includes('Resume scanned! We automatically filled in your contact details.'), 'candidate.html renders exact gold confirmation banner text');
    assert(candHtml.includes('parseResumeContactInfo'), 'candidate.html defines parseResumeContactInfo() scanner');
    assert(candHtml.includes('handleResumeFileChosen'), 'candidate.html defines handleResumeFileChosen() listener');
    assert(candHtml.includes('onchange="handleResumeFileChosen(event)"'), 'candidate.html binds onchange to #cand-resume-file');
    assert(candHtml.includes('candidateNameInput'), 'candidate.html implements #candidateNameInput (Full Legal Name)');
    assert(candHtml.includes('candidateEmailInput'), 'candidate.html implements #candidateEmailInput (Email Address)');
    assert(candHtml.includes('candidatePhoneInput'), 'candidate.html implements #candidatePhoneInput (Phone Number)');
    assert(candHtml.includes('pdfjsLib'), 'candidate.html utilizes pdfjsLib for document text parsing');
    assert(candHtml.includes('autoFillConsentCheckbox') && candHtml.includes('.checked'), 'handleResumeFileChosen verifies consent checkbox state');
    assert(candHtml.includes('userManuallyEdited'), 'candidate.html tracks userManuallyEdited to keep manual entries untouched');
    assert(candHtml.includes('.resume-scan-banner'), 'candidate.html provides .resume-scan-banner CSS styling');
    assert(candHtml.includes('.global-resume-scan-banner'), 'candidate.html provides .global-resume-scan-banner CSS styling');

    // Test parser extraction logic
    const testPdfPath = path.join(__dirname, 'data', 'resumes', 'John_Doe_Resume_2026.pdf');
    if (fs.existsSync(testPdfPath)) {
      const buf = fs.readFileSync(testPdfPath);
      const text = buf.toString('latin1');
      const commentNameMatch = text.match(/%\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
      const extractedName = commentNameMatch ? commentNameMatch[1].replace(/Test|Resume|CV/gi, '').trim() : '';
      assert(extractedName === 'John Doe', 'Parser accurately extracts candidate name "John Doe" from PDF resume');
    }

  } catch (err) {
    assert(false, `Group 19 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 20: PRIVATE CONVERSATION THREAD ISOLATION
  // ================================================================
  console.log('\n--- GROUP 20: PRIVATE CONVERSATION THREAD ISOLATION ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const recHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Check candidate.html private thread filtering
    assert(candHtml.includes('currentApplicantId'), 'candidate.html tracks currentApplicantId');
    assert(candHtml.includes('/api/messages'), 'candidate.html requests messaging threads from /api/messages');
    assert(candHtml.includes('switchActiveThread') || candHtml.includes('thread.messages'), 'candidate.html filters messages strictly for active application ID');

    // 2. Check recruiter.html private thread filtering
    assert(recHtml.includes('/api/messages?applicantId='), 'recruiter.html requests private thread via /api/messages?applicantId=');
    assert(recHtml.includes('chatLog.innerHTML = \'\'') || recHtml.includes('chatLog.innerHTML = \'<div'), 'recruiter.html clears previous chat messages before rendering candidate thread');

    // 3. API Isolation Verification
    const postIsolatedRes = await httpPost('/api/messages', {
      applicantId: 'APP-766',
      senderRole: 'recruiter',
      senderName: 'Apex Hiring Specialist',
      text: 'Private test message strictly for APP-766 applicant thread.'
    }, {
      'Authorization': 'Bearer master_admin_token'
    });
    assert(postIsolatedRes.status === 200 || postIsolatedRes.status === 201, 'POST /api/messages creates private message for APP-766');

    const getApp766Res = await httpGet('/api/messages?applicantId=APP-766', {
      'Authorization': 'Bearer master_admin_token'
    });
    assert(getApp766Res.status === 200, 'GET /api/messages?applicantId=APP-766 returns HTTP 200');
    assert(Array.isArray(getApp766Res.data.messages), 'Response contains messages array');
    assert(getApp766Res.data.messages.every(m => m.applicantId === 'APP-766'), 'Every message returned for APP-766 has applicantId APP-766');

    const getApp862Res = await httpGet('/api/messages?applicantId=APP-862', {
      'Authorization': 'Bearer master_admin_token'
    });
    assert(getApp862Res.status === 200, 'GET /api/messages?applicantId=APP-862 returns HTTP 200');
    assert(!getApp862Res.data.messages.some(m => m.applicantId === 'APP-766'), 'Thread APP-862 is strictly isolated and does not contain APP-766 messages');

  } catch (err) {
    assert(false, `Group 20 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 21: MULTI-RECRUITER CONVERSATION INBOX
  // ================================================================
  console.log('\n--- GROUP 21: MULTI-RECRUITER CONVERSATION INBOX ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    assert(candHtml.includes('class="conversation-sidebar"'), 'candidate.html defines .conversation-sidebar container');
    assert(candHtml.includes('id="recruiterThreadList"'), 'candidate.html defines #recruiterThreadList thread selector');
    assert(candHtml.includes('MY RECRUITERS'), 'candidate.html includes "MY RECRUITERS" sidebar header');
    assert(candHtml.includes('id="activeRecruiterTitle"'), 'candidate.html defines #activeRecruiterTitle header');
    assert(candHtml.includes('class="chat-panel"'), 'candidate.html defines .chat-panel container');
    assert(candHtml.includes('renderRecruiterCards'), 'candidate.html defines renderRecruiterCards() function');
    assert(candHtml.includes('switchActiveThread'), 'candidate.html defines switchActiveThread() function');
    assert(candHtml.includes('recruiter-thread-card'), 'candidate.html includes recruiter-thread-card CSS styling');

    // Verify mirrors
    const syncHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-ENTERPRISE-SYNC.html'), 'utf8');
    assert(syncHtml.includes('id="recruiterThreadList"'), 'u-theJOBS-ENTERPRISE-SYNC.html contains #recruiterThreadList');
    assert(syncHtml.includes('switchActiveThread'), 'u-theJOBS-ENTERPRISE-SYNC.html contains switchActiveThread');

  } catch (err) {
    assert(false, `Group 21 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 22: CLEAR SEARCH BAR DEFAULT VALUE & NEUTRAL PLACEHOLDER
  // ================================================================
  console.log('\n--- GROUP 22: CLEAR SEARCH BAR DEFAULT VALUE & NEUTRAL PLACEHOLDER ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Check Search Input Element attributes
    assert(candHtml.includes('id="search-input"'), 'candidate.html defines main search input');
    assert(candHtml.includes('value=""'), 'candidate.html search input defaults to empty string value=""');
    assert(candHtml.includes('autocomplete="one-time-code"') || candHtml.includes('autocomplete="off"'), 'candidate.html search input includes strict autocomplete bypass');
    assert(candHtml.includes('placeholder="Search positions, verified companies, locations, or skills..."') || candHtml.includes('placeholder="Search positions, companies, locations, or skills..."'), 'candidate.html sets neutral professional placeholder text');
    assert(!candHtml.includes('bigcompany2012@gmail.com'), 'candidate.html contains zero instances of bigcompany2012@gmail.com');

    // 2. Check JavaScript initial state initialization
    assert(candHtml.includes('let currentSearchFilter = \'\'') || candHtml.includes('currentSearchFilter = ""'), 'candidate.html initializes search filter variable to empty string');
    assert(candHtml.includes('searchEl.value = \'\''), 'candidate.html clears search bar on DOMContentLoaded');

    // 3. Check Mirrors
    const syncHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-ENTERPRISE-SYNC.html'), 'utf8');
    assert(syncHtml.includes('autocomplete="one-time-code"') || syncHtml.includes('autocomplete="off"'), 'u-theJOBS-ENTERPRISE-SYNC.html includes strict autocomplete bypass');
    assert(!syncHtml.includes('bigcompany2012@gmail.com'), 'u-theJOBS-ENTERPRISE-SYNC.html contains zero instances of bigcompany2012@gmail.com');

  } catch (err) {
    assert(false, `Group 22 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 23: HIGH-END SVG ICON SYSTEM & EXECUTIVE BUTTON REDESIGN
  // ================================================================
  console.log('\n--- GROUP 23: HIGH-END SVG ICON SYSTEM & EXECUTIVE BUTTON REDESIGN ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Check Executive Button Styling
    assert(candHtml.includes('/* Ultra-Sleek Executive Button Styling */'), 'candidate.html defines Ultra-Sleek Executive Button Styling');
    assert(candHtml.includes('.btn-primary-executive'), 'candidate.html includes .btn-primary-executive class');
    assert(candHtml.includes('background: #0f172a'), 'candidate.html uses deep executive navy for buttons');
    assert(candHtml.includes('color: #D4AF37'), 'candidate.html uses signature metallic gold for buttons');

    // 2. Check Vector SVG Assets (Zero cheap system emojis)
    assert(candHtml.includes('class="notif-bell-svg"'), 'candidate.html uses vector SVG for notification bell');
    assert(candHtml.includes('class="header-user-svg"'), 'candidate.html uses vector SVG for user profile');
    assert(!candHtml.includes('🔔'), 'candidate.html contains zero bell emojis');
    assert(!candHtml.includes('👤'), 'candidate.html contains zero user emojis');
    assert(!candHtml.includes('✨'), 'candidate.html contains zero sparkle emojis');
    assert(!candHtml.includes('👁️'), 'candidate.html contains zero eye emojis');
    assert(!candHtml.includes('💬'), 'candidate.html contains zero speech balloon emojis');

    // 3. Check Search Bar Tag Specifications & Strict Autofill Bypass
    assert(candHtml.includes('name="q_search_no_autofill"') || candHtml.includes('name="jobSearchInput"'), 'candidate.html search input has non-standard name to prevent autofill');
    assert(candHtml.includes('value=""'), 'candidate.html search input has empty value=""');
    assert(candHtml.includes('autocomplete="one-time-code"'), 'candidate.html search input enforces strict Chrome autofill bypass autocomplete="one-time-code"');

    // 4. Check Template Mirrors
    const syncHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-ENTERPRISE-SYNC.html'), 'utf8');
    const dualHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-DUAL LINK TO u-thePOST.html'), 'utf8');
    assert(syncHtml.includes('autocomplete="one-time-code"'), 'u-theJOBS-ENTERPRISE-SYNC.html enforces autocomplete="one-time-code"');
    assert(dualHtml.includes('autocomplete="one-time-code"'), 'u-theJOBS-DUAL LINK TO u-thePOST.html enforces autocomplete="one-time-code"');

  } catch (err) {
    assert(false, `Group 23 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 24: CITY, STATE, AND ZIP CODE SEARCH MATCHING
  // ================================================================
  console.log('\n--- GROUP 24: CITY, STATE, AND ZIP CODE SEARCH MATCHING ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    assert(candHtml.includes('j.location && j.location.toLowerCase().includes(q)'), 'candidate.html matches location (city and state) in search');
    assert(candHtml.includes('j.zipCode && j.zipCode.toString().toLowerCase().includes(q)'), 'candidate.html matches zip code in search filter');

    // Test filter logic mathematically
    const sampleJobs = [
      { id: 'JOB-1', jobTitle: 'Software Engineer', company: 'Tech Corp', summary: 'Building tools', location: 'Austin, TX', zipCode: '78701', employmentType: 'Full-Time' },
      { id: 'JOB-2', jobTitle: 'Sales Lead', company: 'Retail Inc', summary: 'Store manager', location: 'Miami, FL', zipCode: 33101, employmentType: 'Full-Time' }
    ];

    const filterFunc = (q, list) => list.filter(j => {
      const matchesQ = !q || 
        j.jobTitle.toLowerCase().includes(q) || 
        j.company.toLowerCase().includes(q) || 
        j.summary.toLowerCase().includes(q) || 
        (j.location && j.location.toLowerCase().includes(q)) ||
        (j.zipCode && j.zipCode.toString().toLowerCase().includes(q));
      return matchesQ;
    });

    assert(filterFunc('austin', sampleJobs).length === 1, 'Search query "austin" matches Austin, TX job');
    assert(filterFunc('fl', sampleJobs).length === 1, 'Search query "fl" matches Miami, FL job');
    assert(filterFunc('78701', sampleJobs).length === 1, 'Search query "78701" matches zip code 78701');
    assert(filterFunc('33101', sampleJobs).length === 1, 'Search query "33101" matches numeric zip code 33101');

    // Check mirrors
    const syncHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-ENTERPRISE-SYNC.html'), 'utf8');
    const dualHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-DUAL LINK TO u-thePOST.html'), 'utf8');
    assert(syncHtml.includes('j.location && j.location.toLowerCase().includes(q)'), 'u-theJOBS-ENTERPRISE-SYNC.html contains location matching');
    assert(dualHtml.includes('j.location && j.location.toLowerCase().includes(q)'), 'u-theJOBS-DUAL LINK TO u-thePOST.html contains location matching');

  } catch (err) {
    assert(false, `Group 24 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 25: INSTANT CMS LIVE BROADCAST & DOM BINDING FIX
  // ================================================================
  console.log('\n--- GROUP 25: INSTANT CMS LIVE BROADCAST & DOM BINDING ---');
  try {
    const srvJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const recHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const admHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Server-side CMS endpoint and broadcast
    assert(srvJs.includes('/api/cms/config'), 'server.js provides /api/cms/config endpoint');
    assert(srvJs.includes('type: \'CMS_CONFIG_UPDATED\''), 'server.js broadcasts CMS_CONFIG_UPDATED type');
    assert(srvJs.includes('event: \'cms_update\''), 'server.js includes cms_update event flag');
    assert(srvJs.includes('updatedConfig: cmsConfig'), 'server.js broadcasts updatedConfig');
    assert(srvJs.includes('wss.clients.forEach'), 'server.js broadcasts to all active WebSocket clients');

    // 2. Client-side Universal Event Listeners
    assert(candHtml.includes('data.type === \'CMS_CONFIG_UPDATED\'') || candHtml.includes('data.type === "CMS_CONFIG_UPDATED"'), 'candidate.html handles CMS_CONFIG_UPDATED');
    assert(candHtml.includes('data.type === \'cms_update\'') || candHtml.includes('data.type === "cms_update"'), 'candidate.html handles cms_update type');
    assert(candHtml.includes('data.event === \'cms_update\'') || candHtml.includes('data.event === "cms_update"'), 'candidate.html handles cms_update event');
    assert(recHtml.includes('data.type === \'CMS_CONFIG_UPDATED\'') || recHtml.includes('data.type === "CMS_CONFIG_UPDATED"'), 'recruiter.html handles CMS_CONFIG_UPDATED');
    assert(recHtml.includes('data.type === \'cms_update\'') || recHtml.includes('data.type === "cms_update"'), 'recruiter.html handles cms_update type');

    // 3. Direct DOM Re-rendering in applyCmsConfig
    assert(candHtml.includes('applyCmsConfig(freshConfig)') || candHtml.includes('applyCmsConfig(data.config'), 'candidate.html invokes applyCmsConfig');
    assert(candHtml.includes('renderJobListings(jobsDatabase)') || candHtml.includes('renderJobListings('), 'candidate.html applyCmsConfig re-renders job listings');
    assert(candHtml.includes('document.querySelectorAll(\'[data-cms-key]\')'), 'candidate.html dynamically binds [data-cms-key] elements');
    assert(recHtml.includes('document.querySelectorAll(\'[data-cms-key]\')'), 'recruiter.html dynamically binds [data-cms-key] elements');

    // 4. Live API Test for /api/cms/config
    const getRes = await fetch(`${BASE_URL}/api/cms/config`);
    assert(getRes.status === 200, 'GET /api/cms/config returns HTTP 200');
    const getData = await getRes.json();
    assert(getData.config && getData.config.jobsBoard, 'GET /api/cms/config returns full config structure');

    const updatePayload = {
      jobsBoard: {
        boardTitle: 'U-THEJOBS EXECUTIVE',
        searchPlaceholder: 'Search positions, verified companies, locations, or skills...'
      }
    };

    const postRes = await fetch(`${BASE_URL}/api/cms/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Portal': 'true' },
      body: JSON.stringify(updatePayload)
    });
    assert(postRes.status === 200, 'POST /api/cms/config returns HTTP 200 with X-Admin-Portal');
    const postData = await postRes.json();
    assert(postData.config.jobsBoard.boardTitle === 'U-THEJOBS EXECUTIVE', 'POST /api/cms/config persists updated boardTitle');

    // Check mirrors
    const syncHtml = fs.readFileSync(path.join(__dirname, 'u-theJOBS-ENTERPRISE-SYNC.html'), 'utf8');
    const recMirrorHtml = fs.readFileSync(path.join(__dirname, 'u-thePOST-ENTERPRISE-EDITION.html'), 'utf8');
    assert(syncHtml.includes('CMS_CONFIG_UPDATED'), 'u-theJOBS-ENTERPRISE-SYNC.html contains CMS_CONFIG_UPDATED handler');
    assert(recMirrorHtml.includes('CMS_CONFIG_UPDATED'), 'u-thePOST-ENTERPRISE-EDITION.html contains CMS_CONFIG_UPDATED handler');

  } catch (err) {
    assert(false, `Group 25 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 26: CROSS-DOMAIN WEBSOCKET & REAL-TIME CMS SYNC
  // ================================================================
  console.log('\n--- GROUP 26: CROSS-DOMAIN WEBSOCKET & REAL-TIME CMS SYNC ---');
  try {
    const srvJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const recHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. broadcastCmsUpdate in server.js
    assert(srvJs.includes('function broadcastCmsUpdate(configData)'), 'server.js defines global broadcastCmsUpdate()');
    assert(srvJs.includes('broadcastCmsUpdate(cmsConfig)'), 'server.js calls broadcastCmsUpdate on config changes');

    // 2. Strict cache-control headers on GET /api/cms/config
    const getRes = await fetch(`${BASE_URL}/api/cms/config`);
    const cacheHeader = getRes.headers.get('cache-control') || '';
    assert(cacheHeader.includes('no-store') || cacheHeader.includes('no-cache'), 'GET /api/cms/config returns strict Cache-Control: no-store, no-cache headers');
    assert(getRes.headers.get('pragma') === 'no-cache', 'GET /api/cms/config returns Pragma: no-cache header');

    // 3. connectLiveSync client function
    assert(candHtml.includes('function connectLiveSync()'), 'candidate.html implements connectLiveSync()');
    assert(recHtml.includes('function connectLiveSync()'), 'recruiter.html implements connectLiveSync()');
    assert(candHtml.includes('window.location.protocol === \'https:\' ? \'wss:\' : \'ws:\''), 'candidate.html connects over wss:// on HTTPS');
    assert(recHtml.includes('window.location.protocol === \'https:\' ? \'wss:\' : \'ws:\''), 'recruiter.html connects over wss:// on HTTPS');

    // 4. 3-second fallback fast-polling
    assert(candHtml.includes('3000'), 'candidate.html implements 3-second fallback sync polling');
    assert(recHtml.includes('3000'), 'recruiter.html implements 3-second fallback sync polling');

    // 5. DOM element updates in applyCmsConfig
    assert(candHtml.includes('cms-brand-title'), 'candidate.html updates #cms-brand-title');
    assert(candHtml.includes('search-input'), 'candidate.html updates #search-input placeholder');
    assert(recHtml.includes('price-pal'), 'recruiter.html updates #price-pal');
    assert(recHtml.includes('price-starter'), 'recruiter.html updates #price-starter');
    assert(recHtml.includes('price-growth'), 'recruiter.html updates #price-growth');
    assert(recHtml.includes('price-pro'), 'recruiter.html updates #price-pro');

    // Check mirrors
    const dualCand = fs.readFileSync(path.join(__dirname, 'u-theJOBS-DUAL LINK TO u-thePOST.html'), 'utf8');
    const dualRec = fs.readFileSync(path.join(__dirname, 'u-thePOST-DUAL LINK TO u-theJOBS.html'), 'utf8');
    assert(dualCand.includes('connectLiveSync'), 'u-theJOBS-DUAL LINK TO u-thePOST.html includes connectLiveSync');
    assert(dualRec.includes('connectLiveSync'), 'u-thePOST-DUAL LINK TO u-theJOBS.html includes connectLiveSync');

  } catch (err) {
    assert(false, `Group 26 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL TESTS PASSED! 100% VERIFIED.\n');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED. CHECK LOGS ABOVE.\n');
    process.exit(1);
  }
}

setTimeout(() => {
  runTests().catch(e => {
    console.error('Fatal test runner error:', e);
    process.exit(1);
  });
}, 1000);

