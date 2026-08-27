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
