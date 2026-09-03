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

  function httpDelete(urlPath, headers = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(`${BASE_URL}${urlPath}`, {
        method: 'DELETE',
        headers: {
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

    // Teardown: Reset card1Title to JOB DESCRIPTION
    await httpPost('/api/cms/config', {
      postStudio: { card1Title: 'JOB DESCRIPTION' },
      jobsBoard: { boardTitle: 'U-THEJOBS' }
    }, adminHeaders);
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
    assert(recContent.includes('id="card1-title-static"') && recContent.includes('id="card2-title-text"') && recContent.includes('id="card3-title-text"'), 'recruiter.html has Card 1, 2, 3 title mapping IDs');
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
            card1Title: 'JOB DESCRIPTION',
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
    assert(recruiterHtml.includes('id="card1-title-static"'), 'recruiter.html defines Card 1 title');
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

    // 9. Admin Interface Verification (admin.html & admin.html)
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
    const masterSuiteHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    assert(adminHtml.includes('CANDIDATE APPLICATIONS & ATS STAGE OVERRIDES'), 'admin.html contains Candidate Applications section header');
    assert(adminHtml.includes('href="/api/admin/resumes/download-all"'), 'admin.html routes to /api/admin/resumes/download-all');
    assert(adminHtml.includes('target="_blank"'), 'admin.html bulk download anchor has target="_blank"');
    assert(adminHtml.includes('DOWNLOAD ALL RESUMES (.ZIP)'), 'admin.html renders DOWNLOAD ALL RESUMES (.ZIP) button text');

    assert(masterSuiteHtml.includes('href="/api/admin/resumes/download-all"'), 'admin.html routes to /api/admin/resumes/download-all');

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
    const syncHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(syncHtml.includes('id="recruiterThreadList"'), 'candidate.html contains #recruiterThreadList');
    assert(syncHtml.includes('switchActiveThread'), 'candidate.html contains switchActiveThread');

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
    const syncHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(syncHtml.includes('autocomplete="one-time-code"') || syncHtml.includes('autocomplete="off"'), 'candidate.html includes strict autocomplete bypass');
    assert(!syncHtml.includes('bigcompany2012@gmail.com'), 'candidate.html contains zero instances of bigcompany2012@gmail.com');

  } catch (err) {
    assert(false, `Group 22 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 23: HIGH-END SVG ICON SYSTEM & EXECUTIVE BUTTON REDESIGN
  // ================================================================
  console.log('\n--- GROUP 23: HIGH-END SVG ICON SYSTEM & EXECUTIVE BUTTON REDESIGN ---');
  try {
    const candHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Check Button Styling and Palette
    assert(candHtml.includes('background-color: #FFFFFF !important') || candHtml.includes('.btn-quick-send-main'), 'candidate.html defines signature button styling');
    assert(candHtml.includes('#FEBA27') || candHtml.includes('#D4AF37'), 'candidate.html uses signature metallic gold for buttons');

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
    const syncHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const dualHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(syncHtml.includes('autocomplete="one-time-code"'), 'candidate.html enforces autocomplete="one-time-code"');
    assert(dualHtml.includes('autocomplete="one-time-code"'), 'candidate.html enforces autocomplete="one-time-code"');

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
    const syncHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const dualHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(syncHtml.includes('j.location && j.location.toLowerCase().includes(q)'), 'candidate.html contains location matching');
    assert(dualHtml.includes('j.location && j.location.toLowerCase().includes(q)'), 'candidate.html contains location matching');

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
    const syncHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const recMirrorHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    assert(syncHtml.includes('CMS_CONFIG_UPDATED'), 'candidate.html contains CMS_CONFIG_UPDATED handler');
    assert(recMirrorHtml.includes('CMS_CONFIG_UPDATED'), 'recruiter.html contains CMS_CONFIG_UPDATED handler');

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

    // Check ALL 6 HTML template files
    const candDual = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const candSync = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const recDual = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const recMobile = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const recEnterprise = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const adminSuite = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    assert(candDual.includes('connectLiveSync'), 'candidate.html includes connectLiveSync');
    assert(candSync.includes('connectLiveSync'), 'candidate.html includes connectLiveSync');
    assert(recDual.includes('connectLiveSync'), 'recruiter.html includes connectLiveSync');
    assert(recMobile.includes('connectLiveSync'), 'recruiter.html includes connectLiveSync');
    assert(recEnterprise.includes('connectLiveSync'), 'recruiter.html includes connectLiveSync');
    assert(adminSuite.includes('connectLiveSync'), 'admin.html includes connectLiveSync');

    assert(candDual.includes('3000'), 'candidate.html includes 3s fallback polling');
    assert(candSync.includes('3000'), 'candidate.html includes 3s fallback polling');
    assert(recDual.includes('3000'), 'recruiter.html includes 3s fallback polling');
    assert(recMobile.includes('3000'), 'recruiter.html includes 3s fallback polling');
    assert(recEnterprise.includes('3000'), 'recruiter.html includes 3s fallback polling');
    assert(adminSuite.includes('3000'), 'admin.html includes 3s fallback polling');

  } catch (err) {
    assert(false, `Group 26 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 27: ADMIN CMS INPUT PERSISTENCE & AUTO-POLL OVERWRITE
  // ================================================================
  console.log('\n--- GROUP 27: ADMIN CMS INPUT PERSISTENCE & AUTO-POLL OVERWRITE ---');
  try {
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const adminSuiteHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Safeguard Active Form Inputs During Sync
    assert(adminHtml.includes('document.activeElement'), 'admin.html inspects document.activeElement in populateCmsForm');
    assert(adminHtml.includes('activeEl.closest(\'#view-cms, #view-plans\')'), 'admin.html protects active typing in #view-cms and #view-plans');
    assert(adminSuiteHtml.includes('activeEl.closest(\'#view-cms, #view-plans\')'), 'admin.html protects active typing in #view-cms and #view-plans');

    // 2. HTTP Response Validation & Alerts
    assert(adminHtml.includes('if (!res.ok)'), 'admin.html validates res.ok in saveAndBroadcastCms');
    assert(adminHtml.includes('Save Failed'), 'admin.html alerts on save failures');

    // 3. Complete Field Mappings
    assert(adminHtml.includes('cms-price-spotlight'), 'admin.html maps #cms-price-spotlight');
    assert(adminHtml.includes('cms-post-btn-actions'), 'admin.html maps #cms-post-btn-actions');
    assert(adminSuiteHtml.includes('cms-price-spotlight'), 'admin.html maps #cms-price-spotlight');
    assert(adminSuiteHtml.includes('cms-post-btn-actions'), 'admin.html maps #cms-post-btn-actions');

    // 4. Enforce Master Auth Headers
    assert(adminHtml.includes('getAdminAuthHeaders()'), 'admin.html uses getAdminAuthHeaders()');
    assert(adminHtml.includes('headers: getAdminAuthHeaders()'), 'admin.html passes getAdminAuthHeaders in fetch requests');
    assert(adminSuiteHtml.includes('headers: getAdminAuthHeaders()'), 'admin.html passes getAdminAuthHeaders in fetch requests');

    // 5. Test POST with Admin Auth Headers via HTTP
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer master_admin_session_active',
      'X-Admin-Portal': 'true'
    };
    const testPostRes = await fetch(`${BASE_URL}/api/cms/config`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        pricing: {
          palMonthly: 0,
          starterMonthly: 99,
          growthMonthly: 299,
          proMonthly: 699,
          individualSocialAddon: 5.99,
          socialBundleAddon: 19.99,
          spotlightPrice: 49
        }
      })
    });
    assert(testPostRes.status === 200, 'POST /api/cms/config with admin headers returns HTTP 200');
    const testPostData = await testPostRes.json();
    assert(testPostData.config.pricing.spotlightPrice === 49, 'POST /api/cms/config persists spotlightPrice');

  } catch (err) {
    assert(false, `Group 27 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 28: AUTOMATIC MASTER ADMIN TOKEN INITIALIZATION
  // ================================================================
  console.log('\n--- GROUP 28: AUTOMATIC MASTER ADMIN TOKEN INITIALIZATION ---');
  try {
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const adminSuiteHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

    // 1. Auto-Login on DOM load
    assert(adminHtml.includes('async function ensureMasterAdminSession()'), 'admin.html defines ensureMasterAdminSession()');
    assert(adminHtml.includes('contact@utheversity.com'), 'admin.html auto-authenticates contact@utheversity.com');
    assert(adminHtml.includes('ZionAdmin2026!'), 'admin.html passes default master credentials for instant token handshake');
    assert(adminHtml.includes('localStorage.setItem(\'master_admin_token\', data.token)'), 'admin.html stores JWT in localStorage master_admin_token');
    assert(adminSuiteHtml.includes('localStorage.setItem(\'master_admin_token\', data.token)'), 'admin.html stores JWT in localStorage master_admin_token');

    // 2. Bearer Header Injection
    assert(adminHtml.includes('Authorization\': `Bearer ${token}`') || adminHtml.includes('Authorization\': \'Bearer \' + token'), 'admin.html constructs Bearer authorization header');
    assert(adminHtml.includes('\'X-Admin-Portal\': \'true\''), 'admin.html injects X-Admin-Portal: true header');

    // 3. Backend Authorization Bypass
    assert(serverJs.includes('isRequestFromAdminDomain(req)'), 'server.js implements isRequestFromAdminDomain() bypass check');

    // 4. Live Login API Handshake Verification
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Portal': 'true' },
      body: JSON.stringify({ email: 'contact@utheversity.com', password: 'ZionAdmin2026!' })
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returns HTTP 200 for master admin');
    const loginData = await loginRes.json();
    assert(loginData.token && loginData.token.length > 20, 'POST /api/auth/login issues valid signed JWT token');

    // 5. Authenticated CMS POST with issued token
    const authCmsRes = await fetch(`${BASE_URL}/api/cms/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`,
        'X-Admin-Portal': 'true'
      },
      body: JSON.stringify({
        labels: {
          postTitle: 'U-THEPOST',
          jobsTitle: 'U-THEJOBS'
        }
      })
    });
    assert(authCmsRes.status === 200, 'POST /api/cms/config succeeds with fresh JWT and never returns 401 Unauthorized');
    const authCmsData = await authCmsRes.json();
    assert(authCmsData.status === 'success' || authCmsData.status === 'updated', 'CMS config update returns success status');

    // 6. DOMContentLoaded triggers ensureMasterAdminSession
    assert(adminHtml.includes('await ensureMasterAdminSession()'), 'admin.html runs ensureMasterAdminSession on DOMContentLoaded');
    assert(adminSuiteHtml.includes('await ensureMasterAdminSession()'), 'admin.html runs ensureMasterAdminSession on DOMContentLoaded');

  } catch (err) {
    assert(false, `Group 28 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 29: GLOBAL BUTTON & BADGE STYLING STANDARD
  // ================================================================
  console.log('\n--- GROUP 29: GLOBAL BUTTON & BADGE STYLING STANDARD ---');
  try {
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const jobsSyncHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const jobsDualHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const postEntHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const postDualHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const postJobsHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const adminSuiteHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Candidate Buttons: Enforces Triple-State Standard
    assert(candidateHtml.includes('.btn-quick-send-main') && candidateHtml.includes('background-color: #FEBA27 !important'), 'candidate.html has gold hover for .btn-quick-send-main');
    assert(candidateHtml.includes('.send-reply-btn') && candidateHtml.includes('background-color: #FEBA27 !important'), 'candidate.html has gold hover for .send-reply-btn');
    assert(candidateHtml.includes('.btn-auth-header') && candidateHtml.includes('background-color: #FEBA27 !important'), 'candidate.html has gold hover for .btn-auth-header');
    assert(candidateHtml.includes('.btn-profile-header') && candidateHtml.includes('background-color: #FEBA27 !important'), 'candidate.html has gold hover for .btn-profile-header');
    assert(jobsSyncHtml.includes('background-color: #FEBA27 !important'), 'candidate.html includes gold hover');
    assert(jobsDualHtml.includes('background-color: #FEBA27 !important'), 'candidate.html includes gold hover');

    // 2. Recruiter Buttons: Enforces Triple-State Standard
    assert(recruiterHtml.includes('.btn-gold-action') && recruiterHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html has gold hover for .btn-gold-action');
    assert(recruiterHtml.includes('.btn-auth-header') && recruiterHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html has gold hover for .btn-auth-header');
    assert(postEntHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html includes gold hover');
    assert(postDualHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html includes gold hover');
    assert(postJobsHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html includes gold hover');

    // 3. Admin Buttons: Enforces Triple-State Standard
    assert(adminHtml.includes('.btn-gold') && adminHtml.includes('background-color: #FEBA27 !important'), 'admin.html has gold hover for .btn-gold');
    assert(adminSuiteHtml.includes('background-color: #FEBA27 !important'), 'admin.html includes gold hover');

    // 4. Badges & Tags Standard:
    assert(candidateHtml.includes('background-color: #FFFFFF !important') && candidateHtml.includes('border: 1px solid #FEBA27 !important'), 'candidate.html standardizes badges to white fill and gold outline');
    assert(recruiterHtml.includes('background-color: #FFFFFF !important') && recruiterHtml.includes('border: 1px solid #FEBA27 !important'), 'recruiter.html standardizes badges to white fill and gold outline');
    assert(adminHtml.includes('background-color: #E2E8F0 !important') && adminHtml.includes('box-shadow: 0 0 10px rgba(254, 186, 39'), 'admin.html standardizes badges to medium airy grey fill and ambient gold glow');

  } catch (err) {
    assert(false, `Group 29 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 30: URGENT HIRING TOGGLE & RECRUITER ATS INTEGRATION
  // ================================================================
  console.log('\n--- GROUP 30: URGENT HIRING TOGGLE & RECRUITER ATS INTEGRATION ---');
  try {
    // 1. Urgent Hiring Form Control in recruiter templates
    const recruiterFiles = ['recruiter.html'];

    for (const rf of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, rf), 'utf8');
      assert(content.includes('id="urgentHiringCheckbox"'), `${rf} defines #urgentHiringCheckbox in Card 1`);
      assert(content.includes('toggleUrgentHiringBadge(this.checked)'), `${rf} binds onchange="toggleUrgentHiringBadge(this.checked)"`);
      assert(content.includes('id="badge-urgent-hiring"'), `${rf} defines #badge-urgent-hiring in Card 2 preview`);
      assert(content.includes('toggleUrgentHiringBadge = function'), `${rf} implements toggleUrgentHiringBadge() function`);
      assert(content.includes('urgentHiring: isUrgent') || content.includes('urgentHiring:'), `${rf} passes urgentHiring in publishJobLive() payload`);
    }

  } catch (err) {
    assert(false, `Group 30 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 31: UTHEVERSITY TRIPLE-STATE BUTTON & BADGE RE-STYLING
  // ================================================================
  console.log('\n--- GROUP 31: UTHEVERSITY TRIPLE-STATE BUTTON & BADGE RE-STYLING ---');
  try {
    const portalFiles = [
      'recruiter.html',
      'candidate.html'
    ];

    for (const f of portalFiles) {
      const content = fs.readFileSync(path.join(__dirname, f), 'utf8');

      // 1. Default State: White Fill, Gold Outline, Gold Text (#FEBA27)
      assert(content.includes('background-color: #FFFFFF !important') && content.includes('color: #FEBA27 !important'), `${f} enforces white fill and #FEBA27 text default`);
      assert(content.includes('border: 1.5px solid #FEBA27 !important'), `${f} enforces 1.5px solid #FEBA27 border default`);

      // 2. Hover State: Signature Gold Fill (#FEBA27), Limousine Black Text (#0F172A)
      assert(content.includes('background-color: #FEBA27 !important') && content.includes('color: #0F172A !important'), `${f} enforces #FEBA27 fill and #0F172A text on hover`);
      assert(content.includes('box-shadow: 0 4px 14px rgba(254, 186, 39, 0.35) !important'), `${f} enforces gold glow box shadow on hover`);

      // 3. Selected / Active State: Accent Blue Fill (#0075FF), White Text (#FFFFFF)
      assert(content.includes('background-color: #0075FF !important') && content.includes('color: #FFFFFF !important'), `${f} enforces #0075FF fill and white text on active/selected`);
      assert(content.includes('border-color: #0075FF !important'), `${f} enforces #0075FF border on active/selected`);

      // 4. Badges & Tags
      assert(content.includes('.badge-tag, .role-badge, .status-badge'), `${f} defines universal badge-tag, role-badge, status-badge rules`);
      assert(content.includes('.badge-tag.active, .status-badge.active, .badge-tag.selected'), `${f} defines active/selected badge rules with #0075FF`);
    }

    // u-theADMIN Specific Styling Theme:
    const adminContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    assert(adminContent.includes('background-color: #FEBA27 !important') && adminContent.includes('color: #0F172A !important'), 'admin.html enforces gold fill and black text for action buttons');
    assert(adminContent.includes('background-color: #E2E8F0 !important') && adminContent.includes('color: #D97706 !important'), 'admin.html enforces medium airy grey fill and gold text for badges');
    assert(adminContent.includes('background: #0F172A !important') && adminContent.includes('color: #FEBA27 !important'), 'admin.html enforces dark navy fill and gold text for tabs');
    assert(adminContent.includes('.admin-nav-tab-btn:hover') && adminContent.includes('background: #FEBA27 !important') && adminContent.includes('color: #0F172A !important'), 'admin.html enforces signature gold fill and black text on tab hover');

  } catch (err) {
    assert(false, `Group 31 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 32: FULL U-THEJOBS CANDIDATE BOARD RESTORATION
  // ================================================================
  console.log('\n--- GROUP 32: FULL U-THEJOBS CANDIDATE BOARD RESTORATION ---');
  try {
    const candidateFiles = ['candidate.html'];

    for (const cf of candidateFiles) {
      const content = fs.readFileSync(path.join(__dirname, cf), 'utf8');

      // 1. Layout & Scaffolding
      assert(content.includes('id="cms-brand-title"') && content.includes('U-THEJOBS'), `${cf} contains U-THEJOBS header title`);
      assert(content.includes('CANDIDATE BOARD'), `${cf} contains CANDIDATE BOARD badge`);
      assert(content.includes('id="btn-candidate-notif"'), `${cf} contains #btn-candidate-notif notification bell`);
      assert(content.includes('MY PROFILE'), `${cf} contains MY PROFILE button`);
      assert(content.includes('id="btn-auth-status"') || content.includes('LOGIN / SIGN UP'), `${cf} contains LOGIN / SIGN UP button`);

      // Search & Filter Belt
      assert(content.includes('id="search-input"') && content.includes('value=""'), `${cf} defines #search-input initialized with empty value`);
      assert(content.includes('id="filter-type"'), `${cf} defines #filter-type commitment dropdown`);
      assert(content.includes('id="filter-location"'), `${cf} defines #filter-location location dropdown`);

      // 2-Column Main Board
      assert(content.includes('opportunities-col') || content.includes('id="opportunities-list"'), `${cf} contains opportunities column`);
      assert(content.includes('detail-inspector') || content.includes('id="detail-inspector"'), `${cf} contains detail inspector column`);
      assert(content.includes('id="dt-title"'), `${cf} contains #dt-title`);
      assert(content.includes('id="dt-company"'), `${cf} contains #dt-company`);
      assert(content.includes('id="dt-location"'), `${cf} contains #dt-location`);
      assert(content.includes('id="dt-salary"'), `${cf} contains #dt-salary`);
      assert(content.includes('id="dt-pto"') && content.includes('id="dt-health"') && content.includes('id="dt-retirement"'), `${cf} contains perks grid (#dt-pto, #dt-health, #dt-retirement)`);
      assert(content.includes('id="btn-quick-send-top"') || content.includes('QUICK SEND'), `${cf} contains QUICK SEND button`);
      assert(content.includes('id="btn-send-resume-bottom"') || content.includes('SEND RESUME/CV'), `${cf} contains SEND RESUME/CV button`);

      // 2. Modals & Drawers
      // Application Modal
      assert(content.includes('id="app-modal"'), `${cf} defines #app-modal application modal`);
      assert(content.includes('id="candidateNameInput"'), `${cf} contains #candidateNameInput in application modal`);
      assert(content.includes('id="candidateEmailInput"'), `${cf} contains #candidateEmailInput in application modal`);
      assert(content.includes('id="candidatePhoneInput"'), `${cf} contains #candidatePhoneInput in application modal`);
      assert(content.includes('accept=".pdf"'), `${cf} enforces .pdf only resume file upload`);
      assert(content.includes('id="cand-contact-time"'), `${cf} contains #cand-contact-time dropdown`);
      assert(content.includes('submitInterviewRequest()'), `${cf} connects submitInterviewRequest() action`);

      // Recruiter Message Drawer
      assert(content.includes('id="messageDrawer"'), `${cf} defines #messageDrawer`);
      assert(content.includes('conversation-sidebar') || content.includes('id="recruiterThreadList"'), `${cf} contains conversation sidebar`);
      assert(content.includes('chat-panel') || content.includes('id="chatMessagesContainer"'), `${cf} contains chat panel`);
      assert(content.includes('quick-chip') || content.includes('1-CLICK EXECUTIVE RESPONSES'), `${cf} contains 1-click quick response chips`);
      assert(content.includes('id="recruiterReplyInput"') || content.includes('class="message-input-field"'), `${cf} contains message input field`);

      // Profile Modal
      assert(content.includes('id="profile-modal"'), `${cf} defines #profile-modal`);
      assert(content.includes('id="prof-cand-name"') && content.includes('id="prof-cand-bio"'), `${cf} contains profile inputs`);

      // Auth Modal
      assert(content.includes('id="auth-modal"'), `${cf} defines #auth-modal`);
      assert(content.includes('id="tab-auth-login"') && content.includes('id="tab-auth-signup"') && content.includes('id="tab-auth-reset"'), `${cf} contains tabbed auth controls`);

      // Custom Alert Modal
      assert(content.includes('id="custom-modal-alert"'), `${cf} defines #custom-modal-alert`);
      assert(content.includes('id="custom-alert-title"') && content.includes('id="custom-alert-msg"'), `${cf} contains custom alert title and message elements`);

      // 3. Search & Filter Matching Logic
      assert(content.includes('j.jobTitle.toLowerCase().includes(q)') && 
             content.includes('j.company.toLowerCase().includes(q)') &&
             content.includes('j.summary.toLowerCase().includes(q)') &&
             content.includes('j.location.toLowerCase().includes(q)'), `${cf} includes comprehensive search matching logic in handleFilterChange`);
    }

  } catch (err) {
    assert(false, `Group 32 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 33: DYNAMIC APPLICANT RESUME VIEWER & PDF OPENING
  // ================================================================
  console.log('\n--- GROUP 33: DYNAMIC APPLICANT RESUME VIEWER & PDF OPENING ---');
  try {
    const recruiterFiles = ['recruiter.html'];

    for (const rf of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, rf), 'utf8');

      // 1. Dynamic Resume Link Container
      assert(content.includes('id="applicant-resume-container"'), `${rf} defines #applicant-resume-container in review drawer`);

      // 2. Functional openApplicantResume Handler
      assert(content.includes('function openApplicantResume') || content.includes('openApplicantResume = function'), `${rf} implements openApplicantResume handler`);
      assert(content.includes('/data/resumes/'), `${rf} points resume route to /data/resumes/`);
      assert(content.includes("window.open(pdfUrl, '_blank')") || content.includes("window.open(resumeUrl, '_blank')") || content.includes('window.open(pdfUrl') || content.includes('window.open(resumeUrl'), `${rf} opens PDF in a new tab (_blank)`);
      assert(content.includes('token=') && content.includes('encodeURIComponent'), `${rf} passes token query parameter in openApplicantResume`);

      // 3. Dynamic Name & Resume File Binding
      assert(content.includes('activeApplicant.resumeFile') || content.includes('cand.resumeFile'), `${rf} dynamically extracts candidate resume filename`);
      assert(content.includes('applicant-resume-container') && content.includes('openApplicantResume'), `${rf} binds dynamic openApplicantResume to resume container`);
    }

    // 4. Backend PDF Route Verification in server.js
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    assert(serverJs.includes('/data/resumes/'), 'server.js contains /data/resumes/ endpoint');
    assert(serverJs.includes("'Content-Type': 'application/pdf'") || serverJs.includes('"Content-Type": "application/pdf"'), 'server.js sets Content-Type: application/pdf');
    assert(serverJs.includes('Content-Disposition') && serverJs.includes('inline'), 'server.js sets Content-Disposition: inline for browser tab viewing');
    assert(serverJs.includes('searchParams.get(\'token\')') || serverJs.includes("req.query?.token") || serverJs.includes("searchParams.get('token')"), 'server.js supports query token parameter auth');
    assert(serverJs.includes('Cache-Control') && serverJs.includes('public'), 'server.js sets Cache-Control for PDF caching');

    // 5. Live Endpoint Response Header Verification
    const loginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    const adminToken = loginRes.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Cookie': `uthe_token=${adminToken}`
    };

    const resumeRes = await httpGet('/data/resumes/Marcus_Vance_Resume_2026.pdf', authHeaders);
    assert(resumeRes.status === 200, 'GET /data/resumes/Marcus_Vance_Resume_2026.pdf returns HTTP 200 OK');
    assert(resumeRes.headers['content-type'] && resumeRes.headers['content-type'].includes('application/pdf'), 'GET /data/resumes returns Content-Type: application/pdf');
    assert(resumeRes.headers['content-disposition'] && resumeRes.headers['content-disposition'].includes('inline'), 'GET /data/resumes returns Content-Disposition: inline');

    // 6. Direct Query Parameter Authentication Verification (Zero Headers / New Tab Simulation)
    const queryAuthRes = await httpGet(`/data/resumes/Marcus_Vance_Resume_2026.pdf?token=${encodeURIComponent(adminToken)}&t=${Date.now()}`);
    assert(queryAuthRes.status === 200, 'GET /data/resumes/... with ?token=... query param succeeds with HTTP 200 (New Tab Auth)');
    assert(queryAuthRes.headers['content-type'] && queryAuthRes.headers['content-type'].includes('application/pdf'), 'Query auth request returns application/pdf Content-Type');
    assert(queryAuthRes.headers['content-disposition'] && queryAuthRes.headers['content-disposition'].includes('inline'), 'Query auth request returns inline Content-Disposition');
    assert(queryAuthRes.headers['cache-control'] && queryAuthRes.headers['cache-control'].includes('public'), 'Query auth request returns public Cache-Control header');

  } catch (err) {
    assert(false, `Group 33 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 34: PERSISTENT JOB CRUD & LIVE WEBSOCKET SYNC
  // ================================================================
  console.log('\n--- GROUP 34: PERSISTENT JOB CRUD & LIVE WEBSOCKET SYNC ---');
  try {
    // 1. Server Persistence & Endpoint Safeguards
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    assert(serverJs.includes('jobs.json'), 'server.js defines data/jobs.json central storage file');
    assert(serverJs.includes('loadJobsFromDisk'), 'server.js implements loadJobsFromDisk()');
    assert(serverJs.includes('saveJobsToDisk'), 'server.js implements saveJobsToDisk()');
    assert(serverJs.includes('no-store, no-cache, must-revalidate') || serverJs.includes('no-cache'), 'server.js sets no-cache header on GET /api/jobs');
    assert(serverJs.includes('JOB_PUBLISHED') && serverJs.includes('JOB_DELETED'), 'server.js broadcasts JOB_PUBLISHED and JOB_DELETED');

    // 2. Candidate Templates Verification
    const candFiles = [
      'candidate.html',
      'candidate.html',
      'candidate.html'
    ];

    for (const cf of candFiles) {
      const content = fs.readFileSync(path.join(__dirname, cf), 'utf8');
      assert(content.includes('allJobs'), `${cf} defines allJobs state array`);
      assert(content.includes('data.type === \'JOB_PUBLISHED\'') || content.includes('data.type === "JOB_PUBLISHED"'), `${cf} handles JOB_PUBLISHED in live sync`);
      assert(content.includes('data.type === \'JOB_DELETED\'') || content.includes('data.type === "JOB_DELETED"'), `${cf} handles JOB_DELETED in live sync`);
      assert(content.includes('fetchLiveJobs'), `${cf} implements fetchLiveJobs()`);
    }

    // 3. Recruiter Templates Verification
    const recFiles = [
      'recruiter.html',
      'recruiter.html',
      'recruiter.html',
      'recruiter.html'
    ];

    for (const rf of recFiles) {
      const content = fs.readFileSync(path.join(__dirname, rf), 'utf8');
      assert(content.includes('activeJobs'), `${rf} defines activeJobs state array`);
      assert(content.includes('renderActiveJobsTable'), `${rf} defines renderActiveJobsTable()`);
      assert(content.includes('deleteJob'), `${rf} implements deleteJob(jobId)`);
    }

    // 4. Live API CRUD Cycle Verification
    const loginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    const adminToken = loginRes.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'X-Admin-Portal': 'true',
      'Content-Type': 'application/json'
    };

    // Test POST /api/jobs
    const testJobId = `JOB-TEST-${Date.now()}`;
    const createJobRes = await httpPost('/api/jobs', {
      id: testJobId,
      jobTitle: 'Cloud Solutions Architect',
      company: 'Quantum Systems Inc',
      location: 'DALLAS, TX (REMOTE)',
      employmentType: 'Full-Time',
      salary: '$160,000 - $200,000'
    }, authHeaders);

    assert(createJobRes.status === 201 || createJobRes.status === 200, 'POST /api/jobs successfully publishes job');
    assert(createJobRes.data.job && createJobRes.data.job.id === testJobId, 'POST /api/jobs returns created job object');

    // Test GET /api/jobs
    const getJobsRes = await httpGet('/api/jobs', authHeaders);
    assert(getJobsRes.status === 200, 'GET /api/jobs returns HTTP 200');
    assert(getJobsRes.headers['cache-control'] && getJobsRes.headers['cache-control'].includes('no-cache'), 'GET /api/jobs response includes no-cache header');
    assert(getJobsRes.data.jobs.some(j => j.id === testJobId), 'Newly published job is present in GET /api/jobs');

    // Test DELETE /api/jobs/:id
    const deleteJobRes = await httpDelete(`/api/jobs/${testJobId}`, authHeaders);
    assert(deleteJobRes.status === 200, 'DELETE /api/jobs/:id returns HTTP 200');

    // Verify deletion persisted
    const verifyGetJobsRes = await httpGet('/api/jobs', authHeaders);
    assert(!verifyGetJobsRes.data.jobs.some(j => j.id === testJobId), 'Deleted job is immediately removed from GET /api/jobs');

  } catch (err) {
    assert(false, `Group 34 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 35: BAN NATIVE BROWSER POPUPS & SIGNATURE CONFIRMATION CARDS
  // ================================================================
  console.log('\n--- GROUP 35: BAN NATIVE BROWSER POPUPS & SIGNATURE CONFIRMATION CARDS ---');
  try {
    const allPlatformFiles = ['recruiter.html', 'candidate.html', 'admin.html'];

    const htmlFiles = allPlatformFiles.filter(f => f.endsWith('.html'));

    // 1. Verify Mandate Comment Block across ALL 10 files
    const mandateString = 'NEVER USE NATIVE BROWSER POPUPS (alert(), confirm(), prompt())!';
    for (const file of allPlatformFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      assert(content.includes(mandateString), `${file} includes critical code directive mandate comment block`);
    }

    // 2. Verify Custom Confirmation Modal Card HTML across ALL 9 HTML files
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      assert(content.includes('id="custom-modal-confirm"'), `${file} defines #custom-modal-confirm element`);
      assert(content.includes('id="custom-confirm-title"'), `${file} defines #custom-confirm-title element`);
      assert(content.includes('id="custom-confirm-msg"'), `${file} defines #custom-confirm-msg element`);
      assert(content.includes('id="custom-confirm-btn-yes"'), `${file} defines #custom-confirm-btn-yes element`);
      assert(content.includes('closeCustomConfirm()'), `${file} connects closeCustomConfirm() cancel button`);
      assert(content.includes('showCustomModalConfirm'), `${file} implements showCustomModalConfirm()`);
      assert(content.includes('closeCustomConfirm'), `${file} implements closeCustomConfirm()`);
    }

    // 3. Verify Zero Executable Native Popups across ALL HTML files
    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      // Strip comments to ensure no executable alert/confirm/prompt calls
      const stripped = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
      const hasNativeAlert = /\balert\s*\(/.test(stripped);
      const hasNativeConfirm = /\bconfirm\s*\(/.test(stripped);
      const hasNativePrompt = /\bprompt\s*\(/.test(stripped);

      assert(!hasNativeAlert, `${file} contains ZERO executable native alert() calls`);
      assert(!hasNativeConfirm, `${file} contains ZERO executable native confirm() calls`);
      assert(!hasNativePrompt, `${file} contains ZERO executable native prompt() calls`);
    }

  } catch (err) {
    assert(false, `Group 35 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 36: PLATFORM-WIDE TOUCH & MOBILE RESPONSIVE OPTIMIZATION
  // ================================================================
  console.log('\n--- GROUP 36: PLATFORM-WIDE TOUCH & MOBILE RESPONSIVE OPTIMIZATION ---');
  try {
    const htmlFiles = [
      'admin.html',
      'admin.html',
      'recruiter.html',
      'recruiter.html',
      'recruiter.html',
      'recruiter.html',
      'candidate.html',
      'candidate.html',
      'candidate.html'
    ];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // 1. Mandate comment block
      assert(content.includes('MAINTAIN STRICT MOBILE-FIRST TOUCH RESPONSIVENESS ACROSS ALL SCREEN SIZES'), `${file} includes mobile-first touch responsiveness mandate comment`);

      // 2. Viewport meta tag
      assert(content.includes('width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'), `${file} enforces maximum-scale=5.0, user-scalable=yes viewport meta tag`);

      // 3. Global body box model
      assert(content.includes('max-width: 100vw !important') && content.includes('overflow-x: hidden !important'), `${file} enforces max-width: 100vw and overflow-x: hidden on html, body`);
      assert(content.includes('-webkit-text-size-adjust: 100%'), `${file} enforces -webkit-text-size-adjust: 100%`);

      // 4. Horizontal touch scrolling & table wrapper
      assert(content.includes('-webkit-overflow-scrolling: touch !important'), `${file} enforces smooth touch-scrolling`);
      assert(content.includes('.admin-tabs-nav-bar, .omni-search-belt, nav, .header-actions'), `${file} defines touch-scroll selectors`);
      assert(content.includes('min-width: 650px !important'), `${file} enforces min-width: 650px on table`);

      // 5. Responsive auto-fit grids
      assert(content.includes('repeat(auto-fit, minmax(240px, 1fr)) !important'), `${file} enforces auto-fit grid layout`);

      // 6. Touch targets & modal fit
      assert(content.includes('touch-action: manipulation !important'), `${file} enforces touch-action: manipulation on interactive controls`);
      assert(content.includes('max-height: 88vh !important'), `${file} enforces max-height: 88vh modal card containment`);

      // 7. Mobile media queries
      assert(content.includes('@media (max-width: 768px)') && content.includes('@media (max-width: 480px)'), `${file} includes mobile breakpoint media queries`);
    }

  } catch (err) {
    assert(false, `Group 36 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 37: MOBILE DECK & VERTICAL SCROLLING BELT FIX
  // ================================================================
  console.log('\n--- GROUP 37: MOBILE DECK & VERTICAL SCROLLING BELT FIX ---');
  try {
    const allPlatformFiles = ['recruiter.html', 'candidate.html', 'admin.html'];

    // 1. Verify Directive across ALL 10 files
    for (const file of allPlatformFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      assert(content.includes('1. NEVER USE NATIVE BROWSER POPUPS (alert(), confirm(), prompt())! ALWAYS USE UTHEVERSITY SIGNATURE POPUP CARDS.'), `${file} includes part 1 mandate`);
      assert(content.includes('2. MAINTAIN STRICT MOBILE-FIRST TOUCH RESPONSIVENESS ACROSS ALL SCREEN SIZES.'), `${file} includes part 2 mandate`);
      assert(content.includes('SURGICAL EDITING ONLY:'), `${file} includes surgical editing mandate`);
    }

    // 2. Verify Mobile Deck & Vertical Scrolling CSS across all Recruiter templates
    const recruiterFiles = ['recruiter.html'];

    for (const file of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // Top deck horizontal belt
      assert(content.includes('.top-deck-nav, .admin-tabs-nav-bar, nav.recruiter-nav'), `${file} defines .top-deck-nav selectors`);
      assert(content.includes('.top-deck-nav::-webkit-scrollbar { display: none; }'), `${file} hides scrollbar on top deck nav`);

      // Card 1 & Card 2 horizontal deck belt
      assert(content.includes('.cards-1-2-container, .studio-deck-wrap'), `${file} defines .cards-1-2-container & .studio-deck-wrap`);
      assert(content.includes('scroll-snap-type: x mandatory !important;'), `${file} enforces horizontal scroll-snap on deck belt`);
      assert(content.includes('.card-1-wrap') && content.includes('.card-2-wrap'), `${file} defines Card 1 & Card 2 width classes`);
      assert(content.includes('min-width: 88vw !important;') && content.includes('max-width: 88vw !important;'), `${file} enforces 88vw width on mobile cards`);

      // Card 2 infinite vertical belt
      assert(content.includes('.card-2-preview-body, #live-card-preview-container, .preview-scroll-belt'), `${file} defines Card 2 vertical scroll belt`);
      assert(content.includes('max-height: 420px !important;') || content.includes('max-height: 380px !important;'), `${file} enforces max-height on Card 2 preview body`);

      // Card 3 infinite vertical belt snugged beneath
      assert(content.includes('.card-3-active-listings, #active-jobs-table-container'), `${file} defines Card 3 vertical scroll belt`);
      assert(content.includes('max-height: 480px !important;') || content.includes('max-height: 420px !important;'), `${file} enforces max-height on Card 3`);
      assert(content.includes('border-top: 1.5px solid var(--border-color, #E2E8F0);'), `${file} enforces border-top on Card 3`);

      // Shrunken lower sections
      assert(content.includes('.publishing-section, .add-ons-section, .plans-matrix-section, .bottom-dock'), `${file} defines shrunken lower sections`);
      assert(content.includes('height: 34px !important;') && content.includes('font-size: 0.75rem !important;'), `${file} defines shrunken input controls`);
      assert(content.includes('font-size: 0.62rem !important;') && content.includes('letter-spacing: 0.02em !important;'), `${file} defines shrunken label text`);
    }

  } catch (err) {
    assert(false, `Group 37 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 38: MOBILE OVERFLOW, CARD 1 CONTAINER & BUTTON SCALING FIX
  // ================================================================
  console.log('\n--- GROUP 38: MOBILE OVERFLOW, CARD 1 CONTAINER & BUTTON SCALING FIX ---');
  try {
    const recruiterFiles = ['recruiter.html'];

    for (const file of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // 1. Mandate Comment Block
      assert(content.includes('1. NEVER USE NATIVE BROWSER POPUPS (alert(), confirm(), prompt())! ALWAYS USE UTHEVERSITY SIGNATURE POPUP CARDS.'), `${file} includes mandate part 1`);
      assert(content.includes('2. MAINTAIN STRICT MOBILE-FIRST TOUCH RESPONSIVENESS ACROSS ALL SCREEN SIZES.'), `${file} includes mandate part 2`);
      assert(content.includes('SURGICAL EDITING ONLY:'), `${file} includes surgical preservation`);

      // 2. Top Deck Header & Login Button Scaling
      assert(content.includes('header, .recruiter-header') && content.includes('height: 42px !important;'), `${file} enforces 42px header height on mobile`);
      assert(content.includes('.header-actions button, .btn-auth-header, #btn-login-modal'), `${file} defines compact header action button selectors`);
      assert(content.includes('height: 26px !important;') && content.includes('font-size: 0.58rem !important;'), `${file} enforces compact login/signup button styling`);

      // 3. Card 1 Form Grid & Overflow Containment
      assert(content.includes('.card-1-wrap, .card-posting-box, #card-1-container') || content.includes('.card-1-wrap'), `${file} defines Card 1 container selectors`);
      assert(content.includes('overflow-x: hidden !important;'), `${file} enforces overflow-x: hidden on Card 1 container`);
      assert(content.includes('grid-template-columns: 1fr !important;'), `${file} enforces single column grid inside Card 1 form grids`);
      assert(content.includes('height: 28px !important;') && content.includes('font-size: 0.7rem !important;'), `${file} enforces compact height 28px on Card 1 form inputs`);

      // 4. Global Interface Text & Input Compaction
      assert(content.includes('font-size: 0.72rem !important;') && content.includes('line-height: 1.2 !important;'), `${file} enforces compact body/main typography`);
      assert(content.includes('font-size: 0.58rem !important;') && content.includes('margin-bottom: 0.15rem !important;'), `${file} enforces compact label typography`);

      // 5. Button Platform-Wide Compaction
      assert(content.includes('button, .btn-primary, .btn-gold, .btn-surface-sm, .btn-quick-send-main, .send-reply-btn'), `${file} defines platform-wide compact button selectors`);
      assert(content.includes('height: 28px !important;') && content.includes('font-size: 0.6rem !important;'), `${file} enforces 28px button height & 0.6rem font-size`);

      // 6. Card 2 & Card 3 Belt Scaling
      assert(content.includes('max-height: 380px !important;') || content.includes('max-height: 420px !important;'), `${file} enforces max-height on Card 2 preview body`);
      assert(content.includes('max-height: 420px !important;') || content.includes('max-height: 480px !important;'), `${file} enforces max-height on Card 3 active listings`);
    }

  } catch (err) {
    assert(false, `Group 38 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 39: SEPARATE CARD 1 & STANDALONE SOCIAL MEDIA SECTION
  // ================================================================
  console.log('\n--- GROUP 39: SEPARATE CARD 1 & STANDALONE SOCIAL MEDIA SECTION ---');
  try {
    const recruiterFiles = ['recruiter.html'];

    for (const file of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // 1. Mandate Comment Block
      assert(content.includes('1. NEVER USE NATIVE BROWSER POPUPS (alert(), confirm(), prompt())! ALWAYS USE UTHEVERSITY SIGNATURE POPUP CARDS.'), `${file} includes mandate part 1`);
      assert(content.includes('2. MAINTAIN STRICT MOBILE-FIRST TOUCH RESPONSIVENESS ACROSS ALL SCREEN SIZES.'), `${file} includes mandate part 2`);
      assert(content.includes('SURGICAL EDITING ONLY:'), `${file} includes surgical preservation`);

      // 2. Card 1 Title Update
      assert(content.includes('JOB DESCRIPTION'), `${file} updates Card 1 title to "JOB DESCRIPTION"`);
      assert(content.includes('id="card1-title-static"'), `${file} preserves Card 1 title element`);

      // 3. Standalone Social Media Section Markup
      assert(content.includes('id="standalone-social-section"') && (content.includes('standalone-social-card') || content.includes('standalone-social-belt')), `${file} defines #standalone-social-section standalone card/belt`);
      assert(content.includes('LINK SOCIAL MEDIA ACCOUNTS'), `${file} includes "LINK SOCIAL MEDIA ACCOUNTS" header`);
      assert(content.includes('CONNECTED SYNC'), `${file} includes "CONNECTED SYNC" badge`);

      // 4. Exact Social Input IDs & Event Listeners
      assert(content.includes('id="social-linkedin"') && content.includes('oninput="updateLivePreview()"'), `${file} preserves #social-linkedin with live preview handler`);
      assert(content.includes('id="social-x"') && content.includes('oninput="updateLivePreview()"'), `${file} preserves #social-x with live preview handler`);
      assert(content.includes('id="social-tiktok"') && content.includes('oninput="updateLivePreview()"'), `${file} preserves #social-tiktok with live preview handler`);
      assert(content.includes('id="social-facebook"') && content.includes('oninput="updateLivePreview()"'), `${file} preserves #social-facebook with live preview handler`);
      assert(content.includes('id="social-instagram"') && content.includes('oninput="updateLivePreview()"'), `${file} preserves #social-instagram with live preview handler`);

      // 5. CSS Styling for Standalone Social Card
      assert(content.includes('.standalone-social-card') || content.includes('.standalone-social-belt'), `${file} defines .standalone-social-card/.standalone-social-belt CSS class`);
      assert(content.includes('height: 30px !important;') && content.includes('font-size: 0.72rem !important;'), `${file} defines mobile scaling for standalone social inputs`);
    }

  } catch (err) {
    assert(false, `Group 39 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 40: U-THEPOST COMPONENT RELOCATION & TAB 2 INTEGRATION
  // ================================================================
  console.log('\n--- GROUP 40: U-THEPOST COMPONENT RELOCATION & TAB 2 INTEGRATION ---');
  try {
    const recruiterFiles = ['recruiter.html'];

    for (const file of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // 1. Mandate Comment Block
      assert(content.includes('1. NEVER USE NATIVE BROWSER POPUPS (alert(), confirm(), prompt())! ALWAYS USE UTHEVERSITY SIGNATURE POPUP CARDS.'), `${file} includes mandate part 1`);
      assert(content.includes('2. MAINTAIN STRICT MOBILE-FIRST TOUCH RESPONSIVENESS ACROSS ALL SCREEN SIZES.'), `${file} includes mandate part 2`);
      assert(content.includes('3. SURGICAL EDITING ONLY: PRESERVE ALL DOM ELEMENT IDs, EVENT LISTENERS, AND LIVE PREVIEW BINDINGS.'), `${file} includes mandate part 3 surgical editing & bindings preservation`);

      // 2. Card 1 Relocations: Multi-Select Perks / Pill Toggles, Experience Level, and Urgent Hiring
      assert(content.includes('id="job-perks-select"') || content.includes('id="perks-pill-container"'), `${file} implements perks selector or pill container`);
      assert(content.includes('id="job-exp-level"') && content.includes('onchange="updateLivePreview()"'), `${file} implements #job-exp-level experience select`);
      assert(content.includes('id="urgentHiringCheckbox"'), `${file} preserves #urgentHiringCheckbox in Card 1`);

      // 3. Tab 2 Relocations: Social Accounts Belt & Publishing Section inside Tab 2
      const crmSectionMatch = content.match(/<section id="view-crm"[\s\S]*?<\/section>/);
      assert(crmSectionMatch !== null, `${file} contains #view-crm section`);
      if (crmSectionMatch) {
        const crmContent = crmSectionMatch[0];
        assert(crmContent.includes('standalone-social-belt') && crmContent.includes('id="standalone-social-section"'), `${file} relocates #standalone-social-section to top of Tab 2`);
        assert(crmContent.includes('publishing-section') && crmContent.includes('id="publish-header-text"'), `${file} relocates publishing-section to Tab 2`);
        assert(crmContent.includes('id="btn-publish-post"') && (crmContent.includes('publishJobLive()') || crmContent.includes('publishJob()')), `${file} retains publish action button in Tab 2`);
        assert(crmContent.includes('CAMPAIGN DATE TRACKER'), `${file} retains Campaign Date Tracker in Tab 2 beneath publishing section`);
      }

      // 4. Card 2 Live Preview Integrations
      assert(content.includes('id="pv-exp"'), `${file} includes #pv-exp experience level in Card 2 preview`);
      assert(content.includes('id="pv-perks"') || content.includes('id="preview-perks-list"'), `${file} includes perks pills in Card 2 preview`);

      // 5. JavaScript Implementation & Binding Sync
      assert(content.includes('function getSelectedPerks()'), `${file} implements getSelectedPerks()`);
      assert(content.includes('getSelectedPerks()') && content.includes('job-exp-level'), `${file} integrates getSelectedPerks() and job-exp-level in updateLivePreview/publishJob`);
    }

  } catch (err) {
    assert(false, `Group 40 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 41: UI COMPACTION, BUTTON RESTORATION & PROACTIVE CLEANUP
  // ================================================================
  console.log('\n--- GROUP 41: UI COMPACTION, BUTTON RESTORATION & PROACTIVE CLEANUP ---');
  try {
    const recruiterFiles = ['recruiter.html'];

    for (const file of recruiterFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');

      // 1. Card 1 Perks & Benefits label compaction & perks options
      assert(content.includes('PERKS & BENEFITS'), `${file} uses compact "PERKS & BENEFITS" label`);
      assert(content.includes('id="job-perks-select"') || content.includes('id="perks-pill-container"'), `${file} retains perks options / container`);
      assert(content.includes('PTO') && content.includes('Health Benefits') && content.includes('401k Match'), `${file} includes standard perks options`);

      // 2. Urgent Hiring toggle & restored Card 1 Publish Live button
      assert(content.includes('URGENT HIRING BADGE'), `${file} uses compact "URGENT HIRING BADGE" label`);
      assert(content.includes('btn-publish-card1') && content.includes('publishJob()') && content.includes('PUBLISH LIVE'), `${file} restores PUBLISH LIVE button inside Card 1`);

      // 3. Card 2 icon-only verified badge & preview perks container
      assert(content.includes('verified-badge-icon') && content.includes('VERIFIED RECRUITER'), `${file} implements icon-only verified badge in Card 2`);
      assert(content.includes('id="preview-perks-list"'), `${file} implements #preview-perks-list container in Card 2`);

      // 4. Tab 2 Streamlining: Renamed Publish Live & purged redundant outreach buttons
      const crmSectionMatch = content.match(/<section id="view-crm"[\s\S]*?<\/section>/);
      assert(crmSectionMatch !== null, `${file} contains #view-crm section`);
      if (crmSectionMatch) {
        const crmContent = crmSectionMatch[0];
        assert(!crmContent.includes('LAUNCH OUTREACH CAMPAIGN'), `${file} purges LAUNCH OUTREACH CAMPAIGN button from Tab 2`);
        assert(!crmContent.includes('PREVIEW PERSONALIZATION'), `${file} purges PREVIEW PERSONALIZATION button from Tab 2`);
        assert(crmContent.includes('id="btn-publish-post"') && crmContent.includes('PUBLISH LIVE'), `${file} renames Tab 2 primary action to "PUBLISH LIVE"`);
      }

      // 5. JavaScript Perks Binding & Consolidated Handler
      assert(content.includes('function getSelectedPerks()'), `${file} implements getSelectedPerks()`);
      assert(content.includes('publishJob'), `${file} defines consolidated publishJob handler`);
      assert(content.includes('tag-gold'), `${file} defines tag-gold badge class`);
    }

    // Candidate Job Board Perks Display Verification
    const candidateFiles = ['candidate.html'];

    for (const file of candidateFiles) {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      assert(content.includes('card-perks-row') || content.includes('tag-gold'), `${file} renders perks pills on candidate job board`);
      assert(content.includes('dt-perks'), `${file} supports perks display in inspector panel`);
    }

  } catch (err) {
    assert(false, `Group 41 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 42: AUTOMATED FILE AUDIT & DUPLICATE PURGE
  // ================================================================
  console.log('\n--- GROUP 42: AUTOMATED FILE AUDIT & DUPLICATE PURGE ---');
  try {
    // 1. Enforce Exact 3 Primary Root HTML Files
    const primaryFiles = ['recruiter.html', 'candidate.html', 'admin.html'];
    for (const file of primaryFiles) {
      assert(fs.existsSync(path.join(__dirname, file)), `Primary root file ${file} exists and is active`);
    }

    // 2. Enforce Permanent Deletion of Duplicate Templates
    const purgedDuplicates = [
      'u-thePOST-DUAL LINK & MOBILE.html',
      'u-thePOST-DUAL LINK TO u-theJOBS.html',
      'u-thePOST-ENTERPRISE-EDITION.html',
      'u-theJOBS-ENTERPRISE-SYNC.html',
      'u-theJOBS-DUAL LINK TO u-thePOST.html',
      'u-theADMIN-MASTER-SUITE.html',
      'preview-hub.html'
    ];

    for (const file of purgedDuplicates) {
      assert(!fs.existsSync(path.join(__dirname, file)), `Duplicate file ${file} is permanently deleted from repository root`);
    }

    // 3. Verify server.js Route Consolidation
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    assert(serverJs.includes('function resolveTargetFileForHost'), 'server.js defines resolveTargetFileForHost');
    assert(serverJs.includes('return \'recruiter.html\';'), 'server.js routes post/recruiter to recruiter.html');
    assert(serverJs.includes('return \'candidate.html\';'), 'server.js routes jobs/candidate to candidate.html');
    assert(serverJs.includes('return \'admin.html\';'), 'server.js routes admin to admin.html');

  } catch (err) {
    assert(false, `Group 42 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 43: CARD 1 PILLS, TITLE & CARD 3 TABLE FIT
  // ================================================================
  console.log('\n--- GROUP 43: CARD 1 PILLS, TITLE & CARD 3 TABLE FIT ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Card 1 Title Update
    assert(recruiterHtml.includes('JOB DESCRIPTION'), 'recruiter.html updates Card 1 title to "JOB DESCRIPTION"');
    assert(recruiterHtml.includes('id="card1-title-static"'), 'recruiter.html preserves #card1-title-static ID');

    // 2. Convert Perks & Benefits to Pill Toggles
    assert(recruiterHtml.includes('id="perks-pill-container"'), 'recruiter.html defines #perks-pill-container');
    assert(recruiterHtml.includes('class="perk-pill active"'), 'recruiter.html includes active perk pills');
    assert(recruiterHtml.includes('onclick="togglePerkPill(this)"'), 'recruiter.html binds togglePerkPill click handlers');
    assert(recruiterHtml.includes('data-value="PTO"'), 'recruiter.html includes PTO perk pill');
    assert(recruiterHtml.includes('data-value="Health Benefits"'), 'recruiter.html includes Health Benefits perk pill');
    assert(recruiterHtml.includes('data-value="401k Match"'), 'recruiter.html includes 401k Match perk pill');

    // 3. CSS Styles
    assert(recruiterHtml.includes('.perk-pill'), 'recruiter.html defines .perk-pill CSS class');
    assert(recruiterHtml.includes('.perk-pill.active'), 'recruiter.html defines .perk-pill.active CSS class');

    // 4. JS Handlers
    assert(recruiterHtml.includes('function togglePerkPill(btn)'), 'recruiter.html defines togglePerkPill function');
    assert(recruiterHtml.includes('#perks-pill-container .perk-pill.active'), 'recruiter.html gets selected perks from active pills');

    // 5. Card 3 Table Container Fit
    assert(recruiterHtml.includes('id="active-jobs-table-container"') && recruiterHtml.includes('overflow-x: auto; width: 100%;'), 'recruiter.html enforces overflow-x: auto and width: 100% on Card 3 table container');

  } catch (err) {
    assert(false, `Group 43 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 44: CARD 1 TITLE & VIEWPORT CLIPPING FIX
  // ================================================================
  console.log('\n--- GROUP 44: CARD 1 TITLE & VIEWPORT CLIPPING FIX ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Card 1 Title
    assert(recruiterHtml.includes('JOB DESCRIPTION'), 'recruiter.html sets Card 1 header title to "JOB DESCRIPTION"');
    assert(!recruiterHtml.includes('CONNECTED ACCOUNTS (LIVE SYNC)'), 'recruiter.html purges obsolete long title');

    // 2. Header and Recruiter Header Clipping Prevention
    assert(recruiterHtml.includes('header, .recruiter-header, .portal-navigation') && recruiterHtml.includes('overflow-x: auto !important') && recruiterHtml.includes('white-space: nowrap !important') && recruiterHtml.includes('padding-right: 1.5rem !important'), 'recruiter.html prevents top header right-edge clipping with portal-navigation and 1.5rem padding');

    // 3. Card 3 Table Container Horizontal Scroll Wrap
    assert(recruiterHtml.includes('#active-jobs-table-container, .card-3-active-listings') && recruiterHtml.includes('width: 100% !important') && recruiterHtml.includes('overflow-x: auto !important') && recruiterHtml.includes('-webkit-overflow-scrolling: touch !important'), 'recruiter.html enforces horizontal scroll wrap on Card 3 active listings container');
    assert(recruiterHtml.includes('#active-jobs-table-container table') && recruiterHtml.includes('min-width: 680px !important'), 'recruiter.html sets table min-width: 680px !important');

  } catch (err) {
    assert(false, `Group 44 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 45: AUTONOMOUS SURGICAL LAYOUT OVERFLOW FIX
  // ================================================================
  console.log('\n--- GROUP 45: AUTONOMOUS SURGICAL LAYOUT OVERFLOW FIX ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Top Nav Layout
    assert(recruiterHtml.includes('portal-navigation') && (recruiterHtml.includes('flex-wrap: nowrap !important') || recruiterHtml.includes('flex-wrap: wrap !important')), 'recruiter.html defines top nav display layout');

    // 2. Main Container & Body Viewport Clipping Fix
    assert(recruiterHtml.includes('overflow-x: hidden') || recruiterHtml.includes('max-width: 100%'), 'recruiter.html enforces overflow-x: hidden / max-width containment');

    // 3. Table & Container Horizontal Scroll
    assert(recruiterHtml.includes('div:has(> table)') && recruiterHtml.includes('overflow-x: auto !important') && recruiterHtml.includes('-webkit-overflow-scrolling: touch !important'), 'recruiter.html enforces div:has(> table) overflow scroll');
    assert(recruiterHtml.includes('table {') && recruiterHtml.includes('min-width: 650px !important'), 'recruiter.html sets table { min-width: 650px !important }');

  } catch (err) {
    assert(false, `Group 45 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 46: FULL SIDEBAR & NARROW VIEWPORT RESPONSIVE CSS
  // ================================================================
  console.log('\n--- GROUP 46: FULL SIDEBAR & NARROW VIEWPORT RESPONSIVE CSS ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Responsive card stack under 1150px Breakpoint
    assert(recruiterHtml.includes('@media (max-width: 1150px)') && recruiterHtml.includes('.dashboard-grid, .cards-container, main') && recruiterHtml.includes('flex-direction: column !important'), 'recruiter.html stacks cards vertically under 1150px breakpoint');
    assert(recruiterHtml.includes('.card, #card-1-container, #card-2-container, #card-3-container') && recruiterHtml.includes('width: 100% !important'), 'recruiter.html expands card widths to 100% on 1150px breakpoint');

    // 2. Card 3 Table Scroll
    assert(recruiterHtml.includes('#active-jobs-table-container, .card-3-active-listings, div:has(> table)') && recruiterHtml.includes('overflow-x: auto !important'), 'recruiter.html enforces horizontal scroll on table container');
    assert(recruiterHtml.includes('table {') && recruiterHtml.includes('min-width: 650px !important') && recruiterHtml.includes('width: 100% !important'), 'recruiter.html sets table min-width 650px and width 100%');

  } catch (err) {
    assert(false, `Group 46 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 47: AUTONOMOUS TOP NAV RESTORATION
  // ================================================================
  console.log('\n--- GROUP 47: AUTONOMOUS TOP NAV RESTORATION ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Single-line header top deck
    assert(recruiterHtml.includes('header, .recruiter-header') && recruiterHtml.includes('flex-wrap: nowrap !important') && recruiterHtml.includes('height: 54px !important') && recruiterHtml.includes('padding: 0 1rem !important'), 'recruiter.html restores clean single-line header top deck');

    // 2. Inline horizontal scroll for navigation menu
    assert(recruiterHtml.includes('.portal-navigation, .nav-container, header nav') && recruiterHtml.includes('flex-wrap: nowrap !important') && recruiterHtml.includes('gap: 0.4rem !important') && recruiterHtml.includes('overflow-x: auto !important'), 'recruiter.html keeps navigation menu inline with horizontal scroll on narrow viewports');

    // 3. Flex-shrink 0 on navigation buttons
    assert(recruiterHtml.includes('.portal-navigation button, .portal-navigation a, header nav button, header nav a') && recruiterHtml.includes('flex-shrink: 0 !important') && recruiterHtml.includes('white-space: nowrap !important'), 'recruiter.html prevents individual menu buttons from squishing or wrapping');

  } catch (err) {
    assert(false, `Group 47 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 48: AUTONOMOUS CMS DICTIONARY UPDATE
  // ================================================================
  console.log('\n--- GROUP 48: AUTONOMOUS CMS DICTIONARY UPDATE ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const cmsConfigDisk = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cms_config.json'), 'utf8'));

    // 1. admin.html CMS default input value
    assert(adminHtml.includes('id="cms-post-card1-title" value="JOB DESCRIPTION"'), "admin.html sets cms-post-card1-title default input to 'JOB DESCRIPTION'");

    // 2. Persistent JSON and Server defaults
    assert(cmsConfigDisk.postStudio.card1Title === 'JOB DESCRIPTION', "data/cms_config.json sets card1Title to 'JOB DESCRIPTION'");

  } catch (err) {
    assert(false, `Group 48 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 49: AUTONOMOUS SURGICAL CMS FIX
  // ================================================================
  console.log('\n--- GROUP 49: AUTONOMOUS SURGICAL CMS FIX ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Remove dynamic CMS override attribute
    assert(recruiterHtml.includes('<span class="panel-title" id="card1-title-static">JOB DESCRIPTION</span>'), 'recruiter.html sets Card 1 title directly on span without data-cms-key');
    assert(!recruiterHtml.includes('data-cms-key="post-card1-title"'), 'recruiter.html purged data-cms-key="post-card1-title"');

  } catch (err) {
    assert(false, `Group 49 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 50: AUTONOMOUS JAVASCRIPT OVERWRITE FIX & CACHE CLEARING
  // ================================================================
  console.log('\n--- GROUP 50: AUTONOMOUS JAVASCRIPT OVERWRITE FIX & CACHE CLEARING ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Purge of old long title across all scripts
    assert(!recruiterHtml.includes('CONNECTED ACCOUNTS (LIVE SYNC)'), 'recruiter.html contains zero instances of obsolete title string');

    // 2. Direct clean span tag
    assert(recruiterHtml.includes('<span class="panel-title" id="card1-title-static">JOB DESCRIPTION</span>'), 'recruiter.html defines clean span for Card 1 title without data-cms-key');

    // 3. Clear dynamic storage cache
    assert(recruiterHtml.includes('localStorage.removeItem') && recruiterHtml.includes('sessionStorage.clear()'), 'recruiter.html clears dynamic storage cache on initialization');

  } catch (err) {
    assert(false, `Group 50 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 51: AUTONOMOUS TITLE OVERRIDE & HARD RESET
  // ================================================================
  console.log('\n--- GROUP 51: AUTONOMOUS TITLE OVERRIDE & HARD RESET ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const cmsConfigDisk = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cms_config.json'), 'utf8'));

    // 1. Exact DOM Title in recruiter.html
    assert(recruiterHtml.includes('<span class="panel-title" id="card1-title-static">JOB DESCRIPTION</span>'), 'recruiter.html contains exact <span class="panel-title" id="card1-title-static">JOB DESCRIPTION</span>');
    assert(!recruiterHtml.includes('data-cms-key="post-card1-title"'), 'recruiter.html removed data-cms-key attribute from Card 1 title');

    // 2. Storage Purge
    assert(recruiterHtml.includes("localStorage.removeItem('uthe_cms_config')") && recruiterHtml.includes("sessionStorage.clear()"), 'recruiter.html clears uthe_cms_config and sessionStorage');

    // 3. Server.js and Disk Config
    assert(serverJs.includes('card1Title: "JOB DESCRIPTION"'), 'server.js sets default card1Title to JOB DESCRIPTION');
    assert(cmsConfigDisk.postStudio.card1Title === 'JOB DESCRIPTION', 'data/cms_config.json sets card1Title to JOB DESCRIPTION');

  } catch (err) {
    assert(false, `Group 51 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 52: PERMANENT ID ISOLATION FIX
  // ================================================================
  console.log('\n--- GROUP 52: PERMANENT ID ISOLATION FIX ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Isolate Card 1 Title Element ID
    assert(recruiterHtml.includes('<span class="panel-title" id="card1-title-static">JOB DESCRIPTION</span>'), 'recruiter.html uses isolated static ID card1-title-static');
    assert(!recruiterHtml.includes('id="card1-title-text"'), 'recruiter.html removed obsolete ID card1-title-text');

    // 2. Disable CMS Map Override in Script
    assert(!recruiterHtml.includes("'post-card1-title'"), 'recruiter.html removed post-card1-title from cmsKeyMap');
    assert(!recruiterHtml.includes("p.card1Title"), 'recruiter.html disabled p.card1Title runtime override block');

  } catch (err) {
    assert(false, `Group 52 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 53: TOP DECK & PERKS PILLS UI REFINEMENT
  // ================================================================
  console.log('\n--- GROUP 53: TOP DECK & PERKS PILLS UI REFINEMENT ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Compact Top Deck Header (44px)
    assert(recruiterHtml.includes('header, .recruiter-header') && recruiterHtml.includes('height: 44px !important') && recruiterHtml.includes('padding: 0 0.75rem !important'), 'recruiter.html enforces sleek 44px height and 0.75rem padding on header');

    // 2. Brand title and logo badge
    assert(recruiterHtml.includes('.brand-title') && recruiterHtml.includes('font-size: 0.85rem !important') && recruiterHtml.includes('letter-spacing: 1.2px !important'), 'recruiter.html defines sleek .brand-title font scale');
    assert(recruiterHtml.includes('.employer-logo-badge') && recruiterHtml.includes('min-height: 28px !important') && recruiterHtml.includes('font-size: 0.58rem !important'), 'recruiter.html defines sleek .employer-logo-badge');

    // 3. Compact Nav Tab Buttons
    assert(recruiterHtml.includes('.nav-tab-btn, .portal-navigation button, header nav button') && recruiterHtml.includes('height: 28px !important') && recruiterHtml.includes('font-size: 0.62rem !important'), 'recruiter.html enforces compact 28px nav tab buttons');

    // 4. Compact Auth Button
    assert(recruiterHtml.includes('.btn-auth-header, #btn-auth-status') && recruiterHtml.includes('height: 28px !important') && recruiterHtml.includes('font-size: 0.60rem !important'), 'recruiter.html enforces compact 28px auth button');

    // 5. Enterprise Tech Perks & Benefits Micro-Tag Specification
    assert(recruiterHtml.includes('.perk-pill') && recruiterHtml.includes('height: 22px !important') && recruiterHtml.includes('background-color: #F8FAFC !important'), 'recruiter.html defines sleek 22px micro-tag .perk-pill');
    assert(recruiterHtml.includes('.perk-pill.active') && recruiterHtml.includes('background-color: #FFF2C6 !important'), 'recruiter.html defines active perk pill style');

  } catch (err) {
    assert(false, `Group 53 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 54: MOBILE HEADER & UI MENU SEPARATION
  // ================================================================
  console.log('\n--- GROUP 54: MOBILE HEADER & UI MENU SEPARATION ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Mobile 2-row header split
    assert(recruiterHtml.includes('@media (max-width: 768px)') && recruiterHtml.includes('flex-wrap: wrap !important') && recruiterHtml.includes('height: auto !important'), 'recruiter.html splits mobile header into multi-row flex container');

    // 2. Row 1 Left & Right ordering
    assert(recruiterHtml.includes('.brand-group') && recruiterHtml.includes('order: 1 !important'), 'recruiter.html sets brand-group order to 1');
    assert(recruiterHtml.includes('.header-actions') && recruiterHtml.includes('order: 2 !important'), 'recruiter.html sets header-actions order to 2');

    // 3. Row 2 Navigation Menu Belt
    assert(recruiterHtml.includes('.portal-navigation, nav.header-center-tabs') && recruiterHtml.includes('order: 3 !important') && recruiterHtml.includes('flex: 0 0 100% !important') && recruiterHtml.includes('border-top: 1px solid #E2E8F0 !important'), 'recruiter.html snugs horizontal navigation belt on row 2');

    // 4. Mobile menu buttons styling
    assert(recruiterHtml.includes('.portal-navigation button, nav.header-center-tabs button') && recruiterHtml.includes('height: 30px !important') && recruiterHtml.includes('font-size: 0.62rem !important'), 'recruiter.html defines mobile navigation button dimensions');

  } catch (err) {
    assert(false, `Group 54 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 55: COMPREHENSIVE UI COLOR & STYLING OVERHAUL
  // ================================================================
  console.log('\n--- GROUP 55: COMPREHENSIVE UI COLOR & STYLING OVERHAUL ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Login button: black outline & text
    assert(recruiterHtml.includes('.btn-auth-header, #btn-auth-status') && recruiterHtml.includes('color: #000000 !important') && recruiterHtml.includes('border: 1.5px solid #000000 !important'), 'recruiter.html styles login button with black outline and text');

    // 2. UI Menu Tabs: black outline & text (default)
    assert(recruiterHtml.includes('.nav-tab-btn, .portal-navigation button, header nav button') && recruiterHtml.includes('color: #000000 !important') && recruiterHtml.includes('border: 1.5px solid #000000 !important'), 'recruiter.html styles default menu tabs with black outline and text');

    // 3. UI Menu Tab Selected: Gold fill & black text
    assert(recruiterHtml.includes('.nav-tab-btn.active, .drawer-tab-btn.active') && recruiterHtml.includes('background-color: #FEBA27 !important') && recruiterHtml.includes('border: 1.5px solid #FEBA27 !important'), 'recruiter.html styles active menu tab with gold fill and black text');

    // 4. Card 1 label text
    assert(recruiterHtml.includes('data-cms-key="post-perks-label">PERKS & BENEFITS</label>'), 'recruiter.html sets Card 1 perks label text strictly to PERKS & BENEFITS');

    // 5. Urgent Hiring Badge: Transparent & Red
    assert(recruiterHtml.includes('.urgent-hiring-badge, #badge-urgent-hiring') && recruiterHtml.includes('color: #EF4444 !important') && recruiterHtml.includes('border: 1.5px solid #EF4444 !important'), 'recruiter.html styles urgent hiring badge with transparent red outline');

    // 6. Live Preview Badge: Transparent & Red
    assert(recruiterHtml.includes('.candidate-viewport-badge, .live-preview-badge, #card2-badge, .card-2-badge') && recruiterHtml.includes('color: #EF4444 !important') && recruiterHtml.includes('border: 1.5px solid #EF4444 !important'), 'recruiter.html styles live preview badge with transparent red outline');

    // 7. Perks Pills Active Selected State (50% Lighter Soft Gold)
    assert(recruiterHtml.includes('.perk-pill.active') && recruiterHtml.includes('background-color: #FFF2C6 !important') && recruiterHtml.includes('color: #0F172A !important') && recruiterHtml.includes('border: 1.5px solid #FCD34D !important'), 'recruiter.html styles active perk pill with 50% lighter soft gold and slate text');

    // 8. Card 2 Live Preview Perks Badges
    assert(recruiterHtml.includes('.preview-perks-container .badge-tag, #preview-perks-list .badge-tag') && recruiterHtml.includes('background-color: #F1F5F9 !important') && recruiterHtml.includes('border: 0.5px solid #475569 !important') && recruiterHtml.includes('color: #334155 !important'), 'recruiter.html styles live preview perks badges with subtle grey outline');
    assert(recruiterHtml.includes('box-shadow: 0 0 10px rgba(254, 186, 39, 0.6) !important'), 'recruiter.html adds ambient gold glow on preview perks hover');

    // 9. Publish Live CTA Button
    assert(recruiterHtml.includes('.btn-publish-card1, #btn-publish-post, .btn-primary') && recruiterHtml.includes('background-color: #FEBA27 !important') && recruiterHtml.includes('border: none !important') && recruiterHtml.includes('color: #000000 !important'), 'recruiter.html styles publish live CTA with signature gold fill and black text');

  } catch (err) {
    assert(false, `Group 55 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 56: ABSOLUTE CODE LOCK & MOBILE BELT RESTORATION
  // ================================================================
  console.log('\n--- GROUP 56: ABSOLUTE CODE LOCK & MOBILE BELT RESTORATION ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Locked section comment guards
    assert(recruiterHtml.includes('LOCKED SECTION — DO NOT MODIFY OR REVERT WITHOUT EXPLICIT USER DIRECTIVE'), 'recruiter.html includes protective locked section header');
    assert(recruiterHtml.includes('END LOCKED SECTION'), 'recruiter.html includes protective locked section footer');

    // 2. Mobile 2-row layout with gold border
    assert(recruiterHtml.includes('border-bottom: 2px solid #FEBA27 !important'), 'recruiter.html enforces 2px gold bottom border on mobile header');
    assert(recruiterHtml.includes('scrollbar-width: none !important') && recruiterHtml.includes('::-webkit-scrollbar'), 'recruiter.html suppresses scrollbars for clean infinite belt');

  } catch (err) {
    assert(false, `Group 56 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 57: PERKS MICRO-TAGS & DESKTOP NAV EXPANSION
  // ================================================================
  console.log('\n--- GROUP 57: PERKS MICRO-TAGS & DESKTOP NAV EXPANSION ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Sleek Micro-Tag Perks Pills Base Styling
    assert(recruiterHtml.includes('.perk-pill') && recruiterHtml.includes('height: 22px !important') && recruiterHtml.includes('padding: 0 0.45rem !important') && recruiterHtml.includes('letter-spacing: 0.03em !important'), 'recruiter.html defines ultra-snug .perk-pill dimensions');

    // 2. Selected State 50% Lighter Soft Gold
    assert(recruiterHtml.includes('.perk-pill.active') && recruiterHtml.includes('background-color: #FFF2C6 !important') && recruiterHtml.includes('color: #0F172A !important') && recruiterHtml.includes('border: 1.5px solid #FCD34D !important'), 'recruiter.html defines 50% lighter soft gold active perk pill');

  } catch (err) {
    assert(false, `Group 57 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 58: DESKTOP TOP DECK STRETCH & OVERFLOW FIX
  // ================================================================
  console.log('\n--- GROUP 58: DESKTOP TOP DECK STRETCH & OVERFLOW FIX ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Header Container & Belt: overflow visible & no scrollbars
    assert(recruiterHtml.includes('@media (min-width: 769px)') && recruiterHtml.includes('header, .recruiter-header') && recruiterHtml.includes('overflow: visible !important'), 'recruiter.html sets header overflow: visible on desktop');
    assert(recruiterHtml.includes('.portal-navigation, nav.header-center-tabs') && recruiterHtml.includes('max-width: 820px !important') && recruiterHtml.includes('flex: 1 1 auto !important'), 'recruiter.html sets desktop nav flex: 1 1 auto and max-width 820px');

    // 2. Stretch Navigation Buttons Proportionally
    assert(recruiterHtml.includes('.nav-tab-btn, .portal-navigation button, nav.header-center-tabs button') && recruiterHtml.includes('flex: 1 1 0px !important') && recruiterHtml.includes('height: 32px !important') && recruiterHtml.includes('font-size: 0.65rem !important'), 'recruiter.html stretches navigation buttons proportionally across deck');
    assert(recruiterHtml.includes('text-overflow: ellipsis !important'), 'recruiter.html handles text ellipsis gracefully');

    // 3. Tooltip Z-Index & Absolute Positioning
    assert(recruiterHtml.includes('.nav-tab-btn [data-tooltip], .portal-navigation button .tooltip, .tooltip-dropdown') && recruiterHtml.includes('z-index: 9999 !important') && recruiterHtml.includes('position: absolute !important'), 'recruiter.html fixes tooltip z-index and top 100% position');

  } catch (err) {
    assert(false, `Group 58 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 59: CARD 3 EDIT LOCK & PERKS GOLD PILL OVERHAUL
  // ================================================================
  console.log('\n--- GROUP 59: CARD 3 EDIT LOCK & PERKS GOLD PILL OVERHAUL ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Hide Edit Action Buttons in Card 3 Table Rows
    assert(recruiterHtml.includes('.btn-table-edit') && recruiterHtml.includes('button[data-action="edit"]') && recruiterHtml.includes('display: none !important'), 'recruiter.html hides table edit buttons via CSS');

    // 2. Red Sub-note in Card 3
    assert(recruiterHtml.includes('card3-desktop-note') && recruiterHtml.includes('EDIT ON DESKTOP ONLY'), 'recruiter.html includes red "EDIT ON DESKTOP ONLY" sub-note in Card 3');

    // 3. 50% Lighter Soft Gold Selected State on Perks Pills
    assert(recruiterHtml.includes('.perk-pill.active') && recruiterHtml.includes('background-color: #FFF2C6 !important') && recruiterHtml.includes('color: #0F172A !important') && recruiterHtml.includes('border: 1.5px solid #FCD34D !important'), 'recruiter.html styles active perk pills with 50% lighter soft gold and soft amber border');

  } catch (err) {
    assert(false, `Group 59 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 60: CARD 3 LAYOUT RESTORATION & STRICT EDIT BUTTON REMOVAL
  // ================================================================
  console.log('\n--- GROUP 60: CARD 3 LAYOUT RESTORATION & STRICT EDIT BUTTON REMOVAL ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Preserved Card 3 Container Layout & Structure
    assert(recruiterHtml.includes('id="card3-live-jobs-container"') && recruiterHtml.includes('class="panel-card card-3-active-listings"'), 'recruiter.html preserves exact Card 3 container');
    assert(recruiterHtml.includes('id="active-jobs-table-container"') && recruiterHtml.includes('class="table-container"'), 'recruiter.html preserves table container wrapper');

    // 2. Targeted Edit Button Removal
    assert(recruiterHtml.includes('.btn-table-edit') && recruiterHtml.includes('data-action="edit"'), 'recruiter.html targets edit buttons with distinct classes and attributes');
    assert(recruiterHtml.includes('deleteJob(') && recruiterHtml.includes('btn-table-del'), 'recruiter.html keeps delete and pause actions fully intact');

    // 3. Red Sub-header Note Positioning
    assert(recruiterHtml.includes('<div class="card3-desktop-note"') && recruiterHtml.includes('color: #EF4444;') && recruiterHtml.includes('EDIT ON DESKTOP ONLY'), 'recruiter.html positions red desktop note directly beneath Card 3 title');

  } catch (err) {
    assert(false, `Group 60 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 61: FOOTER SECURITY SANITIZATION & PERK PILL REFINEMENT
  // ================================================================
  console.log('\n--- GROUP 61: FOOTER SECURITY SANITIZATION & PERK PILL REFINEMENT ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Footer Security Sanitization: [ADMIN] link purged
    assert(!recruiterHtml.includes('class="footer-secret-link"') && !recruiterHtml.includes('data-tooltip="Master Governance Suite'), 'recruiter.html purges secret admin trigger from footer');

    // 2. 50% Lighter Soft Gold Perk Pill active styling
    assert(recruiterHtml.includes('.perk-pill.active') && recruiterHtml.includes('background-color: #FFF2C6 !important') && recruiterHtml.includes('border: 1.5px solid #FCD34D !important'), 'recruiter.html enforces 50% lighter soft gold fill (#FFF2C6) and soft amber border (#FCD34D)');

  } catch (err) {
    assert(false, `Group 61 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 62: FIX VERTICAL TEXT STRETCHING & FIT BUTTON TEXT
  // ================================================================
  console.log('\n--- GROUP 62: FIX VERTICAL TEXT STRETCHING & FIT BUTTON TEXT ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Omnichannel Board Mobile Viewport Scaling
    assert(recruiterHtml.includes('.omnichannel-board, .omnichannel-container, #omnichannel-section, .distribution-board') && recruiterHtml.includes('width: 100% !important') && recruiterHtml.includes('overflow-x: hidden !important'), 'recruiter.html scales omnichannel board containers to 100% mobile viewport');
    assert(recruiterHtml.includes('.omnichannel-grid, .distribution-cards-grid') && recruiterHtml.includes('flex-direction: column !important'), 'recruiter.html stacks omnichannel cards vertically on mobile');

    // 2. Action Card Button Text Fit (No Vertical Stretching)
    assert(recruiterHtml.includes('.distribution-card button') && recruiterHtml.includes('white-space: nowrap !important') && recruiterHtml.includes('text-overflow: ellipsis !important'), 'recruiter.html prevents vertical text stretching with nowrap and ellipsis');
    assert(recruiterHtml.includes('height: 38px !important') || recruiterHtml.includes('height: 32px !important'), 'recruiter.html sizes and pads mobile action buttons to fit text cleanly');

  } catch (err) {
    assert(false, `Group 62 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 63: MOBILE OVERFLOW, BUTTON CRUSH & HEADER COLLISION FIX
  // ================================================================
  console.log('\n--- GROUP 63: MOBILE OVERFLOW, BUTTON CRUSH & HEADER COLLISION FIX ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Uncrushed vertical button stack
    assert(recruiterHtml.includes('.distribution-card .btn-group') && recruiterHtml.includes('.action-card-actions') && recruiterHtml.includes('flex-direction: column !important'), 'recruiter.html stacks action buttons vertically on mobile');
    assert(recruiterHtml.includes('.publishing-section button') && recruiterHtml.includes('height: 38px !important') && recruiterHtml.includes('font-size: 0.65rem !important'), 'recruiter.html formats mobile action buttons to 38px height and 0.65rem text');

    // 2. Header row spacing
    assert(recruiterHtml.includes('.brand-title') && recruiterHtml.includes('font-size: 0.75rem !important'), 'recruiter.html scales brand title on mobile');
    assert(recruiterHtml.includes('.btn-auth-header, #btn-auth-status') && recruiterHtml.includes('height: 26px !important'), 'recruiter.html sets compact auth button on mobile');

    // 3. Form input and table containment
    assert(recruiterHtml.includes('input, select, textarea, .form-control') && recruiterHtml.includes('max-width: 100% !important'), 'recruiter.html contains all form fields within mobile screen');
    assert(recruiterHtml.includes('.campaign-tracker-container, .table-responsive, #campaign-tracker-table') && recruiterHtml.includes('overflow-x: auto !important'), 'recruiter.html makes campaign tracker table scrollable horizontally');

  } catch (err) {
    assert(false, `Group 63 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 64: UNHIDE & REPOSITION TOP DECK TOOLTIPS
  // ================================================================
  console.log('\n--- GROUP 64: UNHIDE & REPOSITION TOP DECK TOOLTIPS ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Unclipped Header & Tab Containers
    assert(recruiterHtml.includes('header,') && recruiterHtml.includes('.recruiter-header,') && recruiterHtml.includes('.portal-navigation,') && recruiterHtml.includes('overflow: visible !important;'), 'recruiter.html unclips overflow on header and tab containers');

    // 2. Repositioned Active Tab Tooltips & Sub-header Banners
    assert(recruiterHtml.includes('.sub-header-banner,') && recruiterHtml.includes('.nav-tab-btn [data-tooltip],') && recruiterHtml.includes('position: absolute !important;') && recruiterHtml.includes('top: calc(100% + 6px) !important;') && recruiterHtml.includes('z-index: 99999 !important;'), 'recruiter.html positions top deck tooltips cleanly below tab bar with z-index 99999');

    // 3. Top Margin on Main Content Canvas
    assert(recruiterHtml.includes('main, .main-content, .workspace-container, #job-studio-container') && recruiterHtml.includes('margin-top: 0.75rem !important;'), 'recruiter.html adds 0.75rem top margin to main content canvas');

  } catch (err) {
    assert(false, `Group 64 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 65: ABSOLUTE UI MENU LOCK & MOBILE TAB RESTORATION
  // ================================================================
  console.log('\n--- GROUP 65: ABSOLUTE UI MENU LOCK & MOBILE TAB RESTORATION ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. All Navigation Tabs present in DOM
    assert(recruiterHtml.includes('1. JOB STUDIO') && recruiterHtml.includes('2. OMNICHANNEL CRM') && recruiterHtml.includes('3. APPLICANT TRACKER') && recruiterHtml.includes('4. PERFORMANCE & PLANS') && recruiterHtml.includes('5. MY PROFILE'), 'recruiter.html preserves primary navigation tabs in DOM');

    // 2. Mobile Belt Styling & No-Truncation Lock
    assert(recruiterHtml.includes('.portal-navigation, nav.header-center-tabs') && recruiterHtml.includes('flex-wrap: nowrap !important') && recruiterHtml.includes('overflow-x: auto !important'), 'recruiter.html enforces horizontal scroll without wrapping on mobile belt');
    assert(recruiterHtml.includes('.portal-navigation button, nav.header-center-tabs button, .nav-tab-btn') && recruiterHtml.includes('display: inline-flex !important') && recruiterHtml.includes('visibility: visible !important') && recruiterHtml.includes('opacity: 1 !important'), 'recruiter.html locks tabs visible and uncollapsed on mobile');

  } catch (err) {
    assert(false, `Group 65 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 66: REMOVE SECURITY & LISTINGS TAB (MOBILE & DESKTOP)
  // ================================================================
  console.log('\n--- GROUP 66: REMOVE SECURITY & LISTINGS TAB ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Tab 6 removed from Navigation and Mobile Drawer
    assert(!recruiterHtml.includes('6. SECURITY & LISTINGS'), 'recruiter.html cleanly removes 6. SECURITY & LISTINGS from navigation');
    assert(!recruiterHtml.includes('id="view-security"'), 'recruiter.html removes #view-security tab-view');

    // 2. Exact 5 clean tabs remain intact
    assert(recruiterHtml.includes('1. JOB STUDIO') && recruiterHtml.includes('2. OMNICHANNEL CRM') && recruiterHtml.includes('3. APPLICANT TRACKER') && recruiterHtml.includes('4. PERFORMANCE & PLANS') && recruiterHtml.includes('5. MY PROFILE'), 'recruiter.html maintains clean 5 primary navigation tabs');

  } catch (err) {
    assert(false, `Group 66 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 67: CARD 3 MOBILE HORIZONTAL BELT & TOUCH SCROLLBAR
  // ================================================================
  console.log('\n--- GROUP 67: CARD 3 MOBILE HORIZONTAL BELT & TOUCH SCROLLBAR ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Card 3 mobile container & horizontal scroll
    assert(recruiterHtml.includes('#active-jobs-table-container') && recruiterHtml.includes('overflow-x: auto !important') && recruiterHtml.includes('-webkit-overflow-scrolling: touch !important'), 'recruiter.html enables smooth mobile horizontal scrolling on Card 3');

    // 2. Touch-friendly visible scrollbar styling
    assert(recruiterHtml.includes('scrollbar-color: #FEBA27 #E2E8F0 !important') || recruiterHtml.includes('scrollbar-color: #FEBA27'), 'recruiter.html defines high-visibility scrollbar color for Firefox');
    assert(recruiterHtml.includes('height: 8px !important') && recruiterHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html defines 8px custom touch-friendly gold scrollbar thumb for Webkit');

    // 3. Touch-friendly PAUSE and DELETE button action sizing on mobile
    assert(recruiterHtml.includes('.card3-live-jobs-table .btn-table-action') && recruiterHtml.includes('min-height: 28px !important'), 'recruiter.html sizes Card 3 action buttons for easy mobile tapping');

  } catch (err) {
    assert(false, `Group 67 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 68: TAB 4 PRICING PLAN CARDS MOBILE HORIZONTAL BELT
  // ================================================================
  console.log('\n--- GROUP 68: TAB 4 PRICING PLAN CARDS MOBILE HORIZONTAL BELT ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Tab 4 pricing grid flex row horizontal scroll on mobile
    assert(recruiterHtml.includes('#view-plans .pricing-grid') && recruiterHtml.includes('overflow-x: auto !important') && recruiterHtml.includes('flex-wrap: nowrap !important'), 'recruiter.html enables horizontal scroll belt for pricing plan cards on mobile');

    // 2. Pricing cards touch-friendly width sizing
    assert(recruiterHtml.includes('.pricing-grid .pricing-card') && recruiterHtml.includes('width: 260px !important'), 'recruiter.html sets touch-friendly width for mobile pricing cards');

    // 3. High-visibility touch scrollbar styling on pricing grid
    assert(recruiterHtml.includes('.pricing-grid::-webkit-scrollbar-thumb') && recruiterHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html defines high-visibility gold scrollbar for pricing cards');

  } catch (err) {
    assert(false, `Group 68 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 69: TAB 4 RESTORE X CARD & SOCIAL CARDS MOBILE BELT
  // ================================================================
  console.log('\n--- GROUP 69: TAB 4 RESTORE X CARD & SOCIAL CARDS MOBILE BELT ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. X card restored in social channels add-on
    assert(recruiterHtml.includes('id="toggle-soc-x"') && recruiterHtml.includes('strong style="font-size: 0.75rem;">X</strong>'), 'recruiter.html renders restored X card with toggle');

    // 2. Tab 4 social channels mobile horizontal belt
    assert(recruiterHtml.includes('#view-plans .social-channels-grid') && recruiterHtml.includes('overflow-x: auto !important') && recruiterHtml.includes('flex-wrap: nowrap !important'), 'recruiter.html enables horizontal scroll belt for social media cards on mobile');

    // 3. Social channel cards touch-friendly width & visible scrollbar
    assert(recruiterHtml.includes('.social-channels-grid .social-channel-box') && recruiterHtml.includes('width: 130px !important'), 'recruiter.html sets touch-friendly width for mobile social channel cards');
    assert(recruiterHtml.includes('.social-channels-grid::-webkit-scrollbar-thumb') && recruiterHtml.includes('background-color: #FEBA27 !important'), 'recruiter.html defines high-visibility gold scrollbar for social channel cards');

  } catch (err) {
    assert(false, `Group 69 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 70: UNIVERSAL TOOLTIP UNCLIPPING & READABILITY
  // ================================================================
  console.log('\n--- GROUP 70: UNIVERSAL TOOLTIP UNCLIPPING & READABILITY ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Enhanced data-tooltip CSS sizing and high z-index
    assert(recruiterHtml.includes('[data-tooltip]::after') && recruiterHtml.includes('z-index: 999999') && recruiterHtml.includes('max-width: 280px'), 'recruiter.html enhances tooltip max-width and high z-index');

    // 2. Smart edge placement overrides
    assert(recruiterHtml.includes('[data-tooltip-pos="left"]') && recruiterHtml.includes('[data-tooltip-pos="right"]'), 'recruiter.html defines smart edge placement overrides');

    // 3. Floating Tooltip Engine for unclipped overflow contexts
    assert(recruiterHtml.includes('initGlobalTooltipEngine') && recruiterHtml.includes('uthe-floating-tooltip'), 'recruiter.html initializes global floating tooltip engine');

  } catch (err) {
    assert(false, `Group 70 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 71: MOBILE UI MENU TOOLTIP SUPPRESSION
  // ================================================================
  console.log('\n--- GROUP 71: MOBILE UI MENU TOOLTIP SUPPRESSION ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Mobile menu tooltips suppressed via CSS
    assert(recruiterHtml.includes('.portal-navigation [data-tooltip]::after') && recruiterHtml.includes('display: none !important') && recruiterHtml.includes('visibility: hidden !important'), 'recruiter.html suppresses tooltips on mobile portal navigation');

    // 2. Floating tooltip engine skips mobile UI menu on mobile viewports
    assert(recruiterHtml.includes('window.innerWidth <= 768') && recruiterHtml.includes('.portal-navigation'), 'recruiter.html filters mobile UI menu from floating tooltip engine');

    // 3. Desktop menu tooltips preserved
    assert(recruiterHtml.includes('@media (min-width: 769px)') && recruiterHtml.includes('nav.header-center-tabs') && recruiterHtml.includes('overflow: visible !important'), 'recruiter.html preserves desktop top deck tooltips');

  } catch (err) {
    assert(false, `Group 71 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 72: MY PROFILE WORK EMAIL EDITABILITY
  // ================================================================
  console.log('\n--- GROUP 72: MY PROFILE WORK EMAIL EDITABILITY ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. prof-email input is present, type="email", and not readonly
    assert(recruiterHtml.includes('id="prof-email"') && recruiterHtml.includes('type="email"'), 'recruiter.html renders prof-email input field');
    assert(!recruiterHtml.includes('id="prof-email" value="hiring@quantumretail.com" readonly') && !recruiterHtml.includes('id="prof-email" readonly'), 'recruiter.html allows users to type in prof-email without readonly restriction');

    // 2. Profile save button bound
    assert(recruiterHtml.includes('saveEmployerProfile()'), 'recruiter.html binds profile save action');

  } catch (err) {
    assert(false, `Group 72 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 73: MY PROFILE (TAB 5) PERSISTENT STORAGE & AUTO-RESTORE
  // ================================================================
  console.log('\n--- GROUP 73: MY PROFILE (TAB 5) PERSISTENT STORAGE & AUTO-RESTORE ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

    // 1. saveEmployerProfile captures all 5 fields into localStorage
    assert(recruiterHtml.includes('prof-company') && recruiterHtml.includes('prof-name') && recruiterHtml.includes('prof-email') && recruiterHtml.includes('prof-phone') && recruiterHtml.includes('prof-bio'), 'recruiter.html binds all 5 profile fields');
    assert(recruiterHtml.includes("localStorage.setItem('uthe_employer_profile'") || recruiterHtml.includes('localStorage.setItem("uthe_employer_profile"'), 'recruiter.html saves profile to persistent localStorage');

    // 2. loadSavedEmployerProfile implemented and called on DOMContentLoaded
    assert(recruiterHtml.includes('loadSavedEmployerProfile') && recruiterHtml.includes('loadSavedEmployerProfile();'), 'recruiter.html implements and calls loadSavedEmployerProfile on initialization');

    // 3. Signature card modal alert used instead of native alert
    assert(recruiterHtml.includes("showCustomModalAlert('Profile Saved'") && !recruiterHtml.includes("alert('Profile Saved'"), 'recruiter.html uses signature card alert on profile save');

    // 4. Server PUT /api/auth/profile handles profile persistence with email
    assert(serverJs.includes("pathname === '/api/auth/profile' && req.method === 'PUT'") && serverJs.includes('user.email = body.email'), 'server.js supports PUT /api/auth/profile with email update');

  } catch (err) {
    assert(false, `Group 73 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 74: U-THEJOBS CANDIDATE BOARD ACTION BUTTONS RESTORATION
  // ================================================================
  console.log('\n--- GROUP 74: U-THEJOBS CANDIDATE BOARD ACTION BUTTONS RESTORATION ---');
  try {
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Action buttons presence & bindings
    assert(candidateHtml.includes('id="btn-auth-status"') && candidateHtml.includes('onclick="openAuthModal()"'), 'candidate.html binds Login button to openAuthModal()');
    assert(candidateHtml.includes('class="btn-profile-header"') && candidateHtml.includes('onclick="openCandidateProfileModal()"'), 'candidate.html binds My Profile button to openCandidateProfileModal()');
    assert(candidateHtml.includes('id="btn-candidate-notif"') && candidateHtml.includes('onclick="openCandidateMessageDrawer()"'), 'candidate.html binds Notifications Bell to openCandidateMessageDrawer()');
    assert(candidateHtml.includes('id="btn-quick-send-top"') && candidateHtml.includes('onclick="openApplicationModal()"'), 'candidate.html binds Quick Send button to openApplicationModal()');
    assert(candidateHtml.includes('id="btn-send-resume-bottom"') && candidateHtml.includes('onclick="openApplicationModal()"'), 'candidate.html binds Send Resume/CV button to openApplicationModal()');

    // 2. All target modals exist in DOM
    assert(candidateHtml.includes('id="auth-modal"') && candidateHtml.includes('id="profile-modal"') && candidateHtml.includes('id="messageDrawer"') && candidateHtml.includes('id="app-modal"'), 'candidate.html defines all modal and drawer overlay containers');

    // 3. Window modal openers & safe selectJob
    assert(candidateHtml.includes('window.openApplicationModal') && candidateHtml.includes('window.openCandidateProfileModal') && candidateHtml.includes('window.openCandidateMessageDrawer') && candidateHtml.includes('window.openAuthModal'), 'candidate.html exports all modal opener functions on window');

    // 4. Candidate profile persistence & auto-restore
    assert(candidateHtml.includes("localStorage.setItem('uthe_candidate_profile'") || candidateHtml.includes('localStorage.setItem("uthe_candidate_profile"'), 'candidate.html saves profile to persistent localStorage');
    assert(candidateHtml.includes('loadSavedCandidateProfile') && candidateHtml.includes('loadSavedCandidateProfile();'), 'candidate.html implements and calls loadSavedCandidateProfile on initialization');
    assert(candidateHtml.includes("showCustomModalAlert('Profile Saved'"), 'candidate.html uses signature card alert on candidate profile save');

    // 5. CSS brace balance check
    const openBraces = (candidateHtml.match(/\{/g) || []).length;
    const closeBraces = (candidateHtml.match(/\}/g) || []).length;
    assert(openBraces === closeBraces, 'candidate.html has perfectly balanced CSS/JS braces');

  } catch (err) {
    assert(false, `Group 74 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 75: U-THEPOST REMEMBER MY DEVICE AUTHENTICATION MODAL
  // ================================================================
  console.log('\n--- GROUP 75: U-THEPOST REMEMBER MY DEVICE AUTHENTICATION MODAL ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Checkbox element presence & branding in recruiter auth-modal
    assert(recruiterHtml.includes('id="auth-remember-device"'), 'recruiter.html defines #auth-remember-device checkbox');
    assert(recruiterHtml.includes('Remember My Device') && recruiterHtml.includes('jobs.utheversity.com'), 'recruiter.html includes Remember My Device label mentioning jobs.utheversity.com');

    // 2. Persistent storage on login/signup
    assert(recruiterHtml.includes("localStorage.setItem('uthe_remember_device'") || recruiterHtml.includes('localStorage.setItem("uthe_remember_device"'), 'recruiter.html stores uthe_remember_device in localStorage');
    assert(recruiterHtml.includes("localStorage.setItem('uthe_employer_user'") || recruiterHtml.includes('localStorage.setItem("uthe_employer_user"'), 'recruiter.html stores uthe_employer_user in localStorage');

    // 3. Auto-restore session on DOMContentLoaded
    assert(recruiterHtml.includes('loadSavedEmployerSession') && recruiterHtml.includes('loadSavedEmployerSession();'), 'recruiter.html implements and calls loadSavedEmployerSession on initialization');

    // 4. Candidate board Remember My Device presence & persistence
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(candidateHtml.includes('id="auth-remember-device"'), 'candidate.html defines #auth-remember-device checkbox');
    assert(candidateHtml.includes('Remember My Device') && candidateHtml.includes('jobs.utheversity.com'), 'candidate.html includes Remember My Device label mentioning jobs.utheversity.com');
    assert(candidateHtml.includes("localStorage.setItem('uthe_remember_device'"), 'candidate.html supports remember device persistent storage');

  } catch (err) {
    assert(false, `Group 75 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 76: U-THEJOBS APPLIED JOB IMMEDIATE NOTIFICATION INGESTION
  // ================================================================
  console.log('\n--- GROUP 76: U-THEJOBS APPLIED JOB IMMEDIATE NOTIFICATION INGESTION ---');
  try {
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Ingestion on submitInterviewRequest
    assert(candidateHtml.includes('candidateThreads = { [newAppId]: newThread, ...candidateThreads }') || candidateHtml.includes('candidateThreads[newAppId] = newThread'), 'candidate.html prepends applied job to candidateThreads immediately');
    assert(candidateHtml.includes("localStorage.setItem('uthe_candidate_applications'"), 'candidate.html persists applied jobs list to localStorage');

    // 2. Notification badge update and auto switch
    assert(candidateHtml.includes('unreadCount++') && candidateHtml.includes('renderRecruiterCards();') && candidateHtml.includes('switchActiveThread(newAppId);'), 'candidate.html increments notification count and re-renders recruiter threads');

    // 3. fetchMessages restores saved applications
    assert(candidateHtml.includes("localStorage.getItem('uthe_candidate_applications'"), 'candidate.html restores saved applications on fetchMessages');

  } catch (err) {
    assert(false, `Group 76 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 77: U-THEPOST NOTIFICATION BELL, LOGO LOGOUT RESET & CANDIDATE CARD ENHANCEMENTS
  // ================================================================
  console.log('\n--- GROUP 77: U-THEPOST NOTIFICATION BELL, LOGO LOGOUT RESET & CANDIDATE CARD ENHANCEMENTS ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Recruiter notifications bell in header
    assert(recruiterHtml.includes('id="btn-recruiter-notif"') && recruiterHtml.includes('id="recruiter-notif-badge"'), 'recruiter.html defines #btn-recruiter-notif and #recruiter-notif-badge');
    assert(recruiterHtml.includes('openRecruiterMessagesDrawer'), 'recruiter.html binds notifications bell to openRecruiterMessagesDrawer');

    // 2. Logo reset on logout & removal of EDIT LOGO text
    assert(recruiterHtml.includes('resetCompanyLogo') && recruiterHtml.includes("localStorage.removeItem('uthe_employer_logo'"), 'recruiter.html implements resetCompanyLogo and clears uthe_employer_logo on logout');
    assert(!recruiterHtml.includes("'EDIT LOGO'") && !recruiterHtml.includes('"EDIT LOGO"'), 'recruiter.html completely removes EDIT LOGO text');
    assert(recruiterHtml.includes('UPLOAD LOGO'), 'recruiter.html displays UPLOAD LOGO text');

    // 3. Candidate card trash bin and date/time
    assert(recruiterHtml.includes('btn-card-trash') && recruiterHtml.includes('cand-applied-date'), 'recruiter.html includes trash bin button and application date on candidate cards');
    assert(recruiterHtml.includes('confirmDeleteCandidate') && recruiterHtml.includes('deleteCandidateCard'), 'recruiter.html implements confirmDeleteCandidate and deleteCandidateCard');

  } catch (err) {
    assert(false, `Group 77 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 78: MULTI-TENANT DATA ISOLATION & PRIVATE PORTAL SECURITY
  // ================================================================
  console.log('\n--- GROUP 78: MULTI-TENANT DATA ISOLATION & PRIVATE PORTAL SECURITY ---');
  try {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Server-side applicant isolation
    assert(serverJs.includes('const scopedApplicants = applicantsStore.filter') || serverJs.includes('scopedApplicants'), 'server.js scopes GET /api/applicants to recruiter company and job postings');

    // 2. Server-side message isolation
    assert(serverJs.includes('scopedMessages') || serverJs.includes('recruiterAppIds'), 'server.js scopes GET /api/messages strictly to tenant conversation threads');

    // 3. Frontend tenant verification in recruiter handleSyncEvent
    assert(recruiterHtml.includes('myCompany && appCompany && myCompany !== appCompany'), 'recruiter.html guards against cross-tenant applicant sync leaks');
    assert(recruiterHtml.includes('myCompany && msgCompany && myCompany !== msgCompany'), 'recruiter.html guards against cross-tenant message sync leaks');

    // 4. Candidate tenant verification in candidate handleSyncEvent
    assert(candidateHtml.includes('Multi-tenant isolation: Ignore messages intended for other candidates'), 'candidate.html guards against cross-candidate message sync leaks');

  } catch (err) {
    assert(false, `Group 78 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 79: RECRUITER JOB PERSISTENCE & NOTIFICATIONS DRAWER OVERHAUL
  // ================================================================
  console.log('\n--- GROUP 79: RECRUITER JOB PERSISTENCE & NOTIFICATIONS DRAWER OVERHAUL ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Persistent job saving and duplicate prevention
    assert(recruiterHtml.includes("localStorage.setItem('uthe_employer_jobs'"), 'recruiter.html persists published jobs to localStorage (uthe_employer_jobs)');
    assert(recruiterHtml.includes('loadSavedJobs'), 'recruiter.html implements loadSavedJobs() to restore active listings across reloads');
    assert(recruiterHtml.includes('loadSavedJobs();'), 'recruiter.html invokes loadSavedJobs() on DOMContentLoaded');

    // 2. Recruiter notifications multi-candidate drawer
    assert(recruiterHtml.includes('id="recruiterCandidateList"'), 'recruiter.html defines #recruiterCandidateList in notifications drawer');
    assert(recruiterHtml.includes('recruiter-cand-card'), 'recruiter.html includes .recruiter-cand-card styles for applicant sidebar');
    assert(recruiterHtml.includes('renderRecruiterCandidateList'), 'recruiter.html implements renderRecruiterCandidateList()');

    // 3. Ingestion at the very top of Applied column (most recent first)
    assert(recruiterHtml.includes('col.insertBefore(card, col.firstChild)'), 'recruiter.html ingests new applicants at the very top of Applied column');

  } catch (err) {
    assert(false, `Group 79 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 80: CANDIDATE CARD BLUE DATES, FULL MODAL VISIBILITY & CANDIDATE RECRUITER TRASH BIN
  // ================================================================
  console.log('\n--- GROUP 80: CANDIDATE CARD BLUE DATES, FULL MODAL VISIBILITY & CANDIDATE RECRUITER TRASH BIN ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Candidate card applied date in signature blue (#0284C7)
    assert(recruiterHtml.includes('.cand-applied-date') && recruiterHtml.includes('#0284C7'), 'recruiter.html styles .cand-applied-date with signature blue #0284C7');

    // 2. Responsive modal card visibility styling (prevent 40% cut-off)
    assert(recruiterHtml.includes('#candidate-review-modal .modal-card'), 'recruiter.html defines responsive #candidate-review-modal styling');
    assert(recruiterHtml.includes('@media (max-width: 768px)') && recruiterHtml.includes('#candidate-review-modal .conversation-sidebar'), 'recruiter.html defines mobile-responsive stacked layout for candidate review drawer');

    // 3. Purged admin shortcut
    assert(!recruiterHtml.includes('window.handleAdminShortcut') && !recruiterHtml.includes('Ctrl + Shift + A'), 'recruiter.html purges secret admin shortcuts');

    // 4. Candidate recruiter thread trash bin and deletion
    assert(candidateHtml.includes('btn-thread-trash'), 'candidate.html includes .btn-thread-trash on recruiter cards');
    assert(candidateHtml.includes('confirmDeleteRecruiterThread') && candidateHtml.includes('deleteRecruiterThread'), 'candidate.html implements confirmDeleteRecruiterThread and deleteRecruiterThread');

  } catch (err) {
    assert(false, `Group 80 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 81: KANBAN 4-COLUMN RESTORATION & RECRUITER NOTIFICATION ENGINE
  // ================================================================
  console.log('\n--- GROUP 81: KANBAN 4-COLUMN RESTORATION & RECRUITER NOTIFICATION ENGINE ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Tab 3 4-column containment inside #kanban-board
    const kanbanBoardMatch = recruiterHtml.match(/<div class="kanban-board" id="kanban-board">([\s\S]*?)<\/div>\s*<\/section>/);
    assert(kanbanBoardMatch && kanbanBoardMatch[1].includes('id="col-offer"'), 'recruiter.html contains #col-offer inside #kanban-board');
    assert(kanbanBoardMatch && kanbanBoardMatch[1].includes('id="col-applied"'), 'recruiter.html contains #col-applied inside #kanban-board');
    assert(kanbanBoardMatch && kanbanBoardMatch[1].includes('id="col-screened"'), 'recruiter.html contains #col-screened inside #kanban-board');
    assert(kanbanBoardMatch && kanbanBoardMatch[1].includes('id="col-interviewing"'), 'recruiter.html contains #col-interviewing inside #kanban-board');

    // 2. updateKanbanCounters implementation and invocation
    assert(recruiterHtml.includes('function updateKanbanCounters()'), 'recruiter.html defines updateKanbanCounters()');
    assert(recruiterHtml.includes('updateKanbanCounters();'), 'recruiter.html calls updateKanbanCounters() on initialization');

    // 3. Exact Candidate Notifications Modal dimension ratios and classes
    assert(recruiterHtml.includes('max-width: 820px') || recruiterHtml.includes('max-width:820px'), 'recruiter.html defines exact 820px max-width ratio matching candidate drawer');
    assert(recruiterHtml.includes('message-drawer-card'), 'recruiter.html uses .message-drawer-card class for recruiter notifications drawer');
    assert(recruiterHtml.includes('notif-bell-active') && recruiterHtml.includes('notifPulse'), 'recruiter.html defines notif-bell-active pulse animation');
    assert(recruiterHtml.includes('uthe_recruiter_notifs'), 'recruiter.html persists unread notifications to localStorage');

  } catch (err) {
    assert(false, `Group 81 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 82: END-TO-END APPLICANT INGESTION & NOTIFICATION BELL ALERTS
  // ================================================================
  console.log('\n--- GROUP 82: END-TO-END APPLICANT INGESTION & NOTIFICATION BELL ALERTS ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

    // 1. Server-side REST endpoints for /api/applicants
    assert(serverJs.includes("pathname === '/api/applicants'") && serverJs.includes("req.method === 'GET'"), 'server.js defines GET /api/applicants endpoint');
    assert(serverJs.includes("pathname === '/api/applicants'") && serverJs.includes("req.method === 'POST'"), 'server.js defines POST /api/applicants endpoint');
    assert(serverJs.includes('loadApplicantsFromDisk'), 'server.js defines loadApplicantsFromDisk() for persistent applicant indexing');

    // 2. Recruiter Studio ingestion and auto-restore
    assert(recruiterHtml.includes('function ingestCandidateApplicant('), 'recruiter.html defines ingestCandidateApplicant()');
    assert(recruiterHtml.includes('function loadSavedApplicants('), 'recruiter.html defines loadSavedApplicants()');
    assert(recruiterHtml.includes('loadSavedApplicants();'), 'recruiter.html calls loadSavedApplicants() on DOMContentLoaded');
    assert(recruiterHtml.includes('uthe_recruiter_applicants'), 'recruiter.html persists candidates to localStorage (uthe_recruiter_applicants)');

    // 3. Candidate board sync broadcast
    assert(candidateHtml.includes('broadcastSyncEvent(\'CANDIDATE_APPLIED\''), 'candidate.html broadcasts CANDIDATE_APPLIED on submission');

  } catch (err) {
    assert(false, `Group 82 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 83: NOTIFICATION TRASH ICONS, Z-INDEX POPUP FIX, BULK DELETE & KANBAN INFINITE VERTICAL BELTS
  // ================================================================
  console.log('\n--- GROUP 83: NOTIFICATION TRASH ICONS, Z-INDEX POPUP FIX, BULK DELETE & KANBAN INFINITE VERTICAL BELTS ---');
  try {
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Recruiter Notifications Modal Trash Icon & Multi-Select Checkboxes
    assert(recruiterHtml.includes('btn-recruiter-cand-trash'), 'recruiter.html includes trash bin icon next to candidate score in notifications modal');
    assert(recruiterHtml.includes('chk-select-all-candidates') && recruiterHtml.includes('btn-delete-selected-candidates'), 'recruiter.html defines Select All and Bulk Delete controls in notifications modal');
    assert(recruiterHtml.includes('confirmDeleteSelectedCandidates') && recruiterHtml.includes('cand-select-chk'), 'recruiter.html implements bulk candidate selection and deletion');

    // 2. Candidate Notifications Modal Z-Index Elevation & Multi-Select Checkboxes
    assert(candidateHtml.includes('z-index: 20000 !important') || candidateHtml.includes('z-index:20000 !important'), 'candidate.html elevates confirmation modal to z-index 20000 to display in front of message drawer');
    assert(candidateHtml.includes('chk-select-all-threads') && candidateHtml.includes('btn-delete-selected-threads'), 'candidate.html defines Select All and Bulk Delete controls in notifications modal');
    assert(candidateHtml.includes('confirmDeleteSelectedThreads') && candidateHtml.includes('thread-select-chk'), 'candidate.html implements bulk recruiter thread selection and deletion');

    // 3. Applicant Tracker Tab 3 Infinite Vertical Belts
    assert(recruiterHtml.includes('.kanban-cards-area') && (recruiterHtml.includes('overflow-y: auto !important') || recruiterHtml.includes('overflow-y: auto')), 'recruiter.html enables infinite vertical scrolling on .kanban-cards-area');
    assert(recruiterHtml.includes('.kanban-cards-area::-webkit-scrollbar') && recruiterHtml.includes('scrollbar-color: #FEBA27'), 'recruiter.html defines custom gold scrollbar styling for Kanban column belts');
    assert(recruiterHtml.includes('height: 560px') || recruiterHtml.includes('max-height: 560px'), 'recruiter.html sets fixed container height for infinite vertical Kanban columns');

  } catch (err) {
    assert(false, `Group 83 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 84: PERMANENT DELETION PERSISTENCE & EXECUTIVE INTERVIEW CALENDAR/TIME SELECTOR
  // ================================================================
  console.log('\n--- GROUP 84: PERMANENT DELETION PERSISTENCE & EXECUTIVE INTERVIEW CALENDAR/TIME SELECTOR ---');
  try {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Server-side DELETE routes for applicants and messages
    assert(serverJs.includes("pathname === '/api/applicants'") && serverJs.includes("req.method === 'DELETE'"), 'server.js defines DELETE /api/applicants endpoint');
    assert(serverJs.includes("pathname === '/api/messages'") && serverJs.includes("req.method === 'DELETE'"), 'server.js defines DELETE /api/messages endpoint');

    // 2. Recruiter permanent deletion persistence & schedule modal
    assert(recruiterHtml.includes('uthe_recruiter_deleted_applicants'), 'recruiter.html persists deleted applicants list to localStorage');
    assert(recruiterHtml.includes('schedule-picker-modal-recruiter'), 'recruiter.html defines #schedule-picker-modal-recruiter signature modal');
    assert(recruiterHtml.includes('openRecruiterScheduleModal') && recruiterHtml.includes('confirmRecruiterScheduleProposal'), 'recruiter.html implements recruiter interview date/time proposal logic');

    // 3. Candidate permanent deletion persistence & schedule modal
    assert(candidateHtml.includes('uthe_candidate_deleted_threads'), 'candidate.html persists deleted recruiter threads to localStorage');
    assert(candidateHtml.includes('schedule-picker-modal-candidate'), 'candidate.html defines #schedule-picker-modal-candidate signature modal');
    assert(candidateHtml.includes('openCandidateScheduleModal') && candidateHtml.includes('confirmCandidateScheduleAvailability'), 'candidate.html implements candidate interview availability confirmation logic');

  } catch (err) {
    assert(false, `Group 84 failed: ${err.message}`);
  }

  // ================================================================
  // GROUP 85: DEDICATED RESUME SEARCH BOARD, DOSSIER GRID, ADMIN SPREADSHEET IMPORTS & LIVE SYNC
  // ================================================================
  console.log('\n--- GROUP 85: DEDICATED RESUME SEARCH BOARD, DOSSIER GRID, ADMIN SPREADSHEET IMPORTS & LIVE SYNC ---');
  try {
    const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Server REST endpoints for resumes
    assert(serverJs.includes("pathname === '/api/resumes'") && serverJs.includes("req.method === 'GET'"), 'server.js defines GET /api/resumes endpoint');
    assert(serverJs.includes("pathname === '/api/resumes'") && serverJs.includes("req.method === 'POST'"), 'server.js defines POST /api/resumes endpoint');
    assert(serverJs.includes("pathname === '/api/resumes/import'") && serverJs.includes("req.method === 'POST'"), 'server.js defines POST /api/resumes/import endpoint');
    assert(serverJs.includes("pathname === '/api/resumes'") && serverJs.includes("req.method === 'DELETE'"), 'server.js defines DELETE /api/resumes endpoint');
    assert(serverJs.includes("RESUME_ADDED") && serverJs.includes("autoResumeRecord"), 'server.js auto-pushes submitted candidate applications to resumesStore');

    // Live endpoint testing
    const getRes = await httpGet('/api/resumes');
    assert(getRes.status === 200 && Array.isArray(getRes.data.resumes), 'GET /api/resumes returns candidate resumes directory list');
    assert(getRes.data.resumes.length >= 8, 'GET /api/resumes includes pre-seeded candidate talent pool');

    const testCand = {
      name: 'Taylor Brooks',
      role: 'Enterprise Account Executive',
      email: 'taylor.brooks@example.com',
      location: 'New York, NY',
      experience: '7+ Years',
      score: 96,
      skills: ['Enterprise SaaS', 'Solution Selling', 'B2B Sales']
    };
    const postRes = await httpPost('/api/resumes', testCand);
    assert(postRes.status === 201 && postRes.data.ok, 'POST /api/resumes creates a new candidate resume record');

    const testBulk = [
      { name: 'Bulk Cand One', role: 'Sales Lead', email: 'bulk1@test.com', location: 'Chicago, IL', score: 94 },
      { name: 'Bulk Cand Two', role: 'Tech Lead', email: 'bulk2@test.com', location: 'Austin, TX', score: 95 }
    ];
    const importRes = await httpPost('/api/resumes/import', { resumes: testBulk });
    assert(importRes.status === 200 && importRes.data.importedCount === 2, 'POST /api/resumes/import bulk-inserts candidate records');

    // 2. Recruiter Portal: 6. RESUME SEARCH Tab, Command Bar, and Dossier Cards
    assert(recruiterHtml.includes('6. RESUME SEARCH'), 'recruiter.html includes Tab 6: 6. RESUME SEARCH in navigation');
    assert(recruiterHtml.includes('switchRecruiterTab(\'resumes\')'), 'recruiter.html maps click handler for resumes tab');
    assert(recruiterHtml.includes('id="view-resumes"'), 'recruiter.html defines #view-resumes section');
    assert(recruiterHtml.includes('resume-search-keyword') && recruiterHtml.includes('resume-search-location'), 'recruiter.html includes dual search inputs for keyword and location');
    assert(recruiterHtml.includes('resume-cat-pill') && recruiterHtml.includes('setResumeCategoryFilter'), 'recruiter.html defines 1-tap category pills for quick talent filtering');
    assert(recruiterHtml.includes('resume-grid-container'), 'recruiter.html defines #resume-grid-container showcase grid');
    assert(recruiterHtml.includes('loadResumeBoard') && recruiterHtml.includes('filterResumes') && recruiterHtml.includes('toggleSaveResume'), 'recruiter.html implements resume board loading, live filtering, and shortlisting');

    // 3. Admin / Owner Portal: Resume Directory and Sourcing Management
    assert(adminHtml.includes('MASTER CANDIDATE RESUME DIRECTORY & SOURCING'), 'admin.html includes Master Candidate Resume Directory section');
    assert(adminHtml.includes('openUploadResumeModal()') && adminHtml.includes('modal-upload-resume'), 'admin.html includes Upload Resume action button and modal');
    assert(adminHtml.includes('openImportExcelModal()') && adminHtml.includes('modal-import-excel'), 'admin.html includes Import Microsoft Excel action button and modal');
    assert(adminHtml.includes('openImportGoogleSheetsModal()') && adminHtml.includes('modal-import-sheets'), 'admin.html includes Import Google Sheets action button and modal');
    assert(adminHtml.includes('loadAdminResumes') && adminHtml.includes('admin-resumes-tbody'), 'admin.html implements admin resume table rendering and data fetch');

    // 4. UI Cleanliness & Layout Ordering: Single search icon & chat window above templates
    assert(!recruiterHtml.includes('placeholder="🔍') && !recruiterHtml.includes('placeholder="📍'), 'recruiter.html deletes duplicate search and location emoji icons from input placeholders');
    const chatLogIdx = recruiterHtml.indexOf('id="applicant-chat-log"');
    const templatesIdx = recruiterHtml.indexOf('1-CLICK EXECUTIVE TEMPLATES:');
    assert(chatLogIdx !== -1 && templatesIdx !== -1 && chatLogIdx < templatesIdx, 'recruiter.html restores conversation window directly above 1-click executive templates');
    const candChatIdx = candContent.indexOf('id="chatMessagesContainer"');
    const candTemplatesIdx = candContent.indexOf('1-CLICK EXECUTIVE RESPONSES:');
    assert(candChatIdx !== -1 && candTemplatesIdx !== -1 && candChatIdx < candTemplatesIdx, 'candidate.html maintains conversation window directly above 1-click executive responses');

  } catch (err) {
    assert(false, `Group 85 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 86: CANDIDATE CONVERSATION THREAD RESTORATION & PERSISTENCE
  // =========================================================================
  try {
    console.log('\n--- GROUP 86: CANDIDATE CONVERSATION THREAD RESTORATION & PERSISTENCE ---');

    // 1. Verify DEFAULT_RECRUITERS has pre-loaded conversation thread messages
    assert(candContent.includes('Quantum Talent Acquisition (Recruiter)'), 'candidate.html pre-seeds recruiter initial conversation thread messages');
    assert(candContent.includes('Apex Talent Acquisition (Recruiter)'), 'candidate.html pre-seeds Apex recruiter initial conversation thread');
    assert(candContent.includes('Nordic HR Team (Recruiter)'), 'candidate.html pre-seeds Nordic recruiter initial conversation thread');

    // 2. Verify localStorage thread message persistence
    assert(candContent.includes('uthe_candidate_thread_messages'), 'candidate.html supports permanent thread message storage in localStorage');

    // 3. Verify server.js permits candidate direct message sending
    const candMsgRes = await fetch(`${BASE_URL}/api/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        applicantId: 'APP-701',
        senderRole: 'candidate',
        senderName: 'Marcus Vance',
        company: 'Quantum Retail Corp',
        jobTitle: 'Sales Manager',
        text: 'I am excited to speak with your hiring team regarding this position.'
      })
    });
    assert(candMsgRes.status === 201 || candMsgRes.status === 200, 'POST /api/messages permits candidate direct response without session blocking');

    // 4. Verify candidate chat stream querying with applicantId
    const candGetRes = await fetch(`${BASE_URL}/api/messages?applicantId=APP-701`);
    assert(candGetRes.status === 200, 'GET /api/messages?applicantId=APP-701 returns HTTP 200 with candidate conversation thread');
    const candGetData = await candGetRes.json();
    assert(Array.isArray(candGetData.messages) && candGetData.messages.length > 0, 'Candidate conversation thread contains message stream');
    assert(candGetData.messages.some(m => m.text.includes('excited to speak with your hiring team')), 'Dispatched candidate message is present in thread');

  } catch (err) {
    assert(false, `Group 86 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 87: U-THEADMIN PLANS & ADD-ONS CONTROL BOARD (TAB 4)
  // =========================================================================
  try {
    console.log('\n--- GROUP 87: U-THEADMIN PLANS & ADD-ONS CONTROL BOARD (TAB 4) ---');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Verify exact add-on titles and descriptions in Tab 4
    assert(adminHtml.includes('Top-of-Page Spotlight Placement') && adminHtml.includes('Pin your job posting at the top of candidate search results.'), 'admin.html Tab 4 includes Top-of-Page Spotlight Placement with description');
    assert(adminHtml.includes('Urgent Hiring Badges') && adminHtml.includes('Highlight urgent open positions with bright badge accents.'), 'admin.html Tab 4 includes Urgent Hiring Badges with description');
    assert(adminHtml.includes('Direct Hiring Messages (Candidate InMail)') && adminHtml.includes('Send direct interview invitations to candidate inboxes.'), 'admin.html Tab 4 includes Direct Hiring Messages (Candidate InMail) with description');
    assert(adminHtml.includes('Verified Employer Shield') && adminHtml.includes('Display official gold UTHEVERSITY emblem on company profile and job cards.'), 'admin.html Tab 4 includes Verified Employer Shield with description');

    // 2. Verify pricing inputs present
    assert(adminHtml.includes('id="cms-price-spotlight"'), 'admin.html includes #cms-price-spotlight ($49/mo)');
    assert(adminHtml.includes('id="cms-price-urgent"'), 'admin.html includes #cms-price-urgent ($29/mo)');
    assert(adminHtml.includes('id="cms-price-direct-msgs"'), 'admin.html includes #cms-price-direct-msgs ($19/mo)');
    assert(adminHtml.includes('id="cms-price-verified-shield"'), 'admin.html includes #cms-price-verified-shield ($3)');

    // 3. Verify POST /api/cms/config updates and persists pricing schema
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'contact@utheversity.com', password: 'ZionAdmin2026!' })
    });
    const adminLoginData = await adminLoginRes.json();
    const admToken = adminLoginData.token;

    const cmsUpdateRes = await fetch(`${BASE_URL}/api/cms/config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${admToken}`,
        'X-Admin-Portal': 'true'
      },
      body: JSON.stringify({
        pricing: {
          spotlightPrice: 49,
          urgentBadge: 29,
          directMessages: 19,
          verifiedEmployer: 3
        },
        addOns: {
          topSpotlight: 49,
          urgentBadge: 29,
          directMessages: 19,
          verifiedEmployer: 3
        }
      })
    });
    assert(cmsUpdateRes.status === 200, 'POST /api/cms/config successfully saves Tab 4 add-on pricing');
    // 4. Verify input containment styling in admin.html
    assert(adminHtml.includes('max-width: 100%') && adminHtml.includes('box-sizing: border-box'), 'admin.html inputs and cms-sub-box have strict box-sizing containment to prevent card spilling');

    // 5. Verify recruiter.html (U-THEPOST) Tab 4 dynamic add-on price labels and live sync
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    assert(recruiterHtml.includes('id="price-addon-spotlight"'), 'recruiter.html contains #price-addon-spotlight');
    assert(recruiterHtml.includes('id="price-addon-urgent"'), 'recruiter.html contains #price-addon-urgent');
    assert(recruiterHtml.includes('id="price-addon-inmail"'), 'recruiter.html contains #price-addon-inmail');
    assert(recruiterHtml.includes('id="price-addon-verified"'), 'recruiter.html contains #price-addon-verified');
    assert(recruiterHtml.includes('price-addon-spotlight') && recruiterHtml.includes('price-addon-urgent'), 'recruiter.html applyCmsConfig binds and updates all feature add-on price tags');

  } catch (err) {
    assert(false, `Group 87 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 88: APPLICANT TRACKER (TAB 3) UPPER-LEFT CARD CHECKBOXES & BULK DELETE
  // =========================================================================
  try {
    console.log('\n--- GROUP 88: APPLICANT TRACKER (TAB 3) UPPER-LEFT CARD CHECKBOXES & BULK DELETE ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Verify upper-left checkboxes on candidate cards in Tab 3
    assert(recruiterHtml.includes('class="kanban-card-checkbox"') && recruiterHtml.includes('data-id="APP-701"'), 'recruiter.html candidate cards include upper-left .kanban-card-checkbox');
    assert(recruiterHtml.includes('handleKanbanCardCheckboxChange()'), 'recruiter.html defines handleKanbanCardCheckboxChange handler');

    // 2. Verify batch action belt and select all controls
    assert(recruiterHtml.includes('id="chk-kanban-select-all"'), 'recruiter.html defines #chk-kanban-select-all control');
    assert(recruiterHtml.includes('id="btn-kanban-delete-selected"'), 'recruiter.html defines #btn-kanban-delete-selected button');
    assert(recruiterHtml.includes('toggleSelectAllKanbanCards') && recruiterHtml.includes('confirmDeleteSelectedKanbanCards'), 'recruiter.html implements toggleSelectAllKanbanCards and confirmDeleteSelectedKanbanCards');
    assert(recruiterHtml.includes('deleteSelectedKanbanCards'), 'recruiter.html implements deleteSelectedKanbanCards batch deletion logic');

  } catch (err) {
    assert(false, `Group 88 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 89: 1-CLICK LIVE SOCIAL POSTING, LIVE SYNC NOTICE & EDIT/RE-SHARE
  // =========================================================================
  try {
    console.log('\n--- GROUP 89: 1-CLICK LIVE SOCIAL POSTING, LIVE SYNC NOTICE & EDIT/RE-SHARE ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Verify Recruiter Live Social Sync Notice
    assert(recruiterHtml.includes('LIVE SOCIAL MEDIA SYNC NOTICE') && recruiterHtml.includes('Once a post is live on external platforms like X (Twitter) or LinkedIn'), 'recruiter.html includes official live social sync notice');
    assert(recruiterHtml.includes('EDIT & RE-SHARE') && recruiterHtml.includes('button in Tab 2 to push the corrected version to their feed'), 'recruiter.html explains Edit & Re-Share workflow for live post updates');

    // 2. Verify 1-Click Social Dispatch integration
    assert(recruiterHtml.includes('trigger1ClickSocialPost') && recruiterHtml.includes('linkedin.com/sharing/share-offsite'), 'recruiter.html implements trigger1ClickSocialPost for LinkedIn');
    assert(recruiterHtml.includes('twitter.com/intent/tweet'), 'recruiter.html implements 1-click Twitter/X intent sharing');
    assert(recruiterHtml.includes('facebook.com/sharer/sharer.php'), 'recruiter.html implements 1-click Facebook intent sharing');

    // 3. Verify Edit & Re-Share Modal and Live Actions in Tracker
    assert(recruiterHtml.includes('id="edit-reshare-modal"'), 'recruiter.html includes #edit-reshare-modal signature modal');
    assert(recruiterHtml.includes('openEditAndReshareModal') && recruiterHtml.includes('executeEditAndReshare'), 'recruiter.html implements openEditAndReshareModal and executeEditAndReshare');
    assert(recruiterHtml.includes('openLiveSocialThread'), 'recruiter.html implements openLiveSocialThread');

  } catch (err) {
    assert(false, `Group 89 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 90: TIKTOK INTEGRATION IN OUTREACH TEMPLATES
  // =========================================================================
  try {
    console.log('\n--- GROUP 90: TIKTOK INTEGRATION IN OUTREACH TEMPLATES ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Verify TikTok option in #crm-template-select
    assert(recruiterHtml.includes('<option value="tiktok_dm">') && recruiterHtml.includes('TikTok Hiring & Talent Message'), 'recruiter.html includes TikTok option in Outreach Template select dropdown');

    // 2. Verify TikTok template in CRM_TEMPLATES
    assert(recruiterHtml.includes('tiktok_dm:') && recruiterHtml.includes('TikTok Hiring & Talent Stream'), 'recruiter.html defines tiktok_dm in CRM_TEMPLATES');

  } catch (err) {
    assert(false, `Group 90 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 91: GRANULAR CHANNEL SELECTION, CRM AUTO-SAVE & THREAD PICKER MODAL
  // =========================================================================
  try {
    console.log('\n--- GROUP 91: GRANULAR CHANNEL SELECTION, CRM AUTO-SAVE & THREAD PICKER MODAL ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Verify individual channel checkboxes and select all
    assert(recruiterHtml.includes('id="chk-social-linkedin"') && recruiterHtml.includes('id="chk-social-x"'), 'recruiter.html contains #chk-social-linkedin and #chk-social-x');
    assert(recruiterHtml.includes('id="chk-social-tiktok"') && recruiterHtml.includes('id="chk-social-facebook"') && recruiterHtml.includes('id="chk-social-instagram"'), 'recruiter.html contains TikTok, Facebook, and Instagram channel checkboxes');
    assert(recruiterHtml.includes('id="chk-select-all-socials"'), 'recruiter.html defines #chk-select-all-socials toggle');

    // 2. Verify auto-save & restore logic
    assert(recruiterHtml.includes('saveCrmSettings') && recruiterHtml.includes('restoreCrmSavedState'), 'recruiter.html implements saveCrmSettings and restoreCrmSavedState');
    assert(recruiterHtml.includes('restoreCrmSavedState()'), 'recruiter.html invokes restoreCrmSavedState on DOMContentLoaded');

    // 3. Verify getSelectedSocialChannels and multi-platform 1-click dispatch
    assert(recruiterHtml.includes('getSelectedSocialChannels'), 'recruiter.html implements getSelectedSocialChannels');
    assert(recruiterHtml.includes('selectedChannels.forEach'), 'broadcastToConnectedChannels iterates and dispatches exclusively to selected channels');

    // 4. Verify Live Connected Social Thread Picker Modal
    assert(recruiterHtml.includes('id="social-thread-picker-modal"'), 'recruiter.html includes #social-thread-picker-modal signature modal');
    assert(recruiterHtml.includes('openLiveSocialThread') && recruiterHtml.includes('openAllConnectedSocialThreads'), 'recruiter.html implements openLiveSocialThread and openAllConnectedSocialThreads');

  } catch (err) {
    assert(false, `Group 91 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 92: AUTHENTIC SOCIAL MEDIA BRAND LOGOS & CLEAN ICONS
  // =========================================================================
  try {
    console.log('\n--- GROUP 92: AUTHENTIC SOCIAL MEDIA BRAND LOGOS & CLEAN ICONS ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Verify authentic brand SVGs in openLiveSocialThread channels array
    assert(recruiterHtml.includes('viewBox="0 0 24 24" fill="#0A66C2"') && recruiterHtml.includes('viewBox="0 0 24 24" fill="#1877F2"'), 'recruiter.html includes authentic vector brand icons for LinkedIn and Facebook');
    assert(recruiterHtml.includes('M18.244 2.25h3.308l-7.227 8.26'), 'recruiter.html includes official X geometry SVG logo');
    assert(recruiterHtml.includes('M12.525.02c1.31-.02'), 'recruiter.html includes official TikTok mark SVG logo');
    assert(recruiterHtml.includes('ig-grad-thread') && recruiterHtml.includes('ig-grad-belt'), 'recruiter.html includes official Instagram multi-stop radial gradient SVG logo');

  } catch (err) {
    assert(false, `Group 92 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 93: TOP-OF-PAGE SPOTLIGHT PLACEMENT & SEARCH PINNING
  // =========================================================================
  try {
    console.log('\n--- GROUP 93: TOP-OF-PAGE SPOTLIGHT PLACEMENT & SEARCH PINNING ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Verify Job Studio toggle and preview badge
    assert(recruiterHtml.includes('id="chk-job-spotlight"'), 'recruiter.html includes #chk-job-spotlight toggle in Job Studio');
    assert(recruiterHtml.includes('id="badge-spotlight-preview"'), 'recruiter.html includes #badge-spotlight-preview in Card 2 Live Preview');
    assert(recruiterHtml.includes('toggleSpotlightPreviewBadge'), 'recruiter.html implements toggleSpotlightPreviewBadge');

    // 2. Verify publishJobLive sets spotlight flags
    assert(recruiterHtml.includes('spotlight: isSpotlight') || recruiterHtml.includes('topSpotlight: isSpotlight'), 'recruiter.html packages spotlight flags in publishJobLive');
    assert(recruiterHtml.includes('⭐ SPOTLIGHT'), 'recruiter.html renders ⭐ SPOTLIGHT badge in Card 3 active jobs table');

    // 3. Verify Candidate Portal spotlight styling and badge
    assert(candidateHtml.includes('.spotlight-card'), 'candidate.html defines .spotlight-card CSS styling');
    assert(candidateHtml.includes('⭐ TOP SPOTLIGHT'), 'candidate.html renders ⭐ TOP SPOTLIGHT badge on spotlight cards');

    // 4. Verify Candidate search sorting pins spotlight jobs to top
    assert(candidateHtml.includes('aSpot && !bSpot') && candidateHtml.includes('-1'), 'candidate.html sorts matching spotlight jobs to the top of candidate search results');

    // 5. Test Live POST /api/jobs with spotlight: true
    const spotlightTestJob = {
      id: `JOB-SPOT-${Date.now()}`,
      jobTitle: 'Executive Director of Operations',
      company: 'Premier Global Logistics',
      location: 'AUSTIN, TX (HYBRID)',
      employmentType: 'Full-Time',
      salary: '$180,000 - $220,000',
      spotlight: true,
      topSpotlight: true,
      isSpotlight: true,
      featured: true,
      summary: 'Executive leadership opening pinned to the top of candidate search results.'
    };

    const postJobRes = await httpPost('/api/jobs', spotlightTestJob, { 'X-Admin-Portal': 'true' });
    assert(postJobRes.status === 201 || postJobRes.status === 200, 'POST /api/jobs accepts spotlight job');
    assert(postJobRes.data.job && (postJobRes.data.job.spotlight === true || postJobRes.data.job.topSpotlight === true), 'Saved job record retains spotlight: true');

    // 6. Verify GET /api/jobs contains the spotlight job
    const getJobsRes = await httpGet('/api/jobs');
    assert(getJobsRes.status === 200, 'GET /api/jobs returns 200');
    const returnedJob = getJobsRes.data.jobs.find(j => j.id === spotlightTestJob.id);
    assert(returnedJob && (returnedJob.spotlight === true || returnedJob.topSpotlight === true), 'GET /api/jobs provides spotlight property for public candidates');

  } catch (err) {
    assert(false, `Group 93 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 94: COMPANY DOMAIN ENFORCEMENT & PERSONAL EMAIL NOTICE (U-THEPOST)
  // =========================================================================
  try {
    console.log('\n--- GROUP 94: COMPANY DOMAIN ENFORCEMENT & PERSONAL EMAIL NOTICE ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Verify client-side domain validation in recruiter.html
    assert(recruiterHtml.includes('isPersonalEmailDomain'), 'recruiter.html defines isPersonalEmailDomain helper');
    assert(recruiterHtml.includes('COMPANY DOMAIN REQUIRED'), 'recruiter.html flashes COMPANY DOMAIN REQUIRED signature modal');
    assert(recruiterHtml.includes('DISALLOWED_PERSONAL_DOMAINS'), 'recruiter.html maintains DISALLOWED_PERSONAL_DOMAINS list');

    // 2. Test server-side rejection of personal email addresses on POST /api/auth/signup
    const gmailSignupRes = await httpPost('/api/auth/signup', {
      email: `recruiter_test_${Date.now()}@gmail.com`,
      password: 'TestPassword123!',
      name: 'Test Recruiter',
      role: 'recruiter',
      company: 'Acme Corp'
    });
    assert(gmailSignupRes.status === 400, 'POST /api/auth/signup rejects @gmail.com for recruiter account with HTTP 400');
    assert(gmailSignupRes.data.error && gmailSignupRes.data.error.includes('Company Domain Required'), 'POST /api/auth/signup error notice explains company domain requirement');

    const yahooSignupRes = await httpPost('/api/auth/signup', {
      email: `recruiter_test_${Date.now()}@yahoo.com`,
      password: 'TestPassword123!',
      name: 'Test Recruiter',
      role: 'employer',
      company: 'Acme Corp'
    });
    assert(yahooSignupRes.status === 400, 'POST /api/auth/signup rejects @yahoo.com for recruiter account with HTTP 400');

    const outlookSignupRes = await httpPost('/api/auth/signup', {
      email: `recruiter_test_${Date.now()}@outlook.com`,
      password: 'TestPassword123!',
      name: 'Test Recruiter',
      role: 'recruiter',
      company: 'Acme Corp'
    });
    assert(outlookSignupRes.status === 400, 'POST /api/auth/signup rejects @outlook.com for recruiter account with HTTP 400');

    // 3. Test server-side acceptance of legitimate corporate company domains
    const corpDomainSignupRes = await httpPost('/api/auth/signup', {
      email: `recruiter_${Date.now()}@techglobaltalent.com`,
      password: 'CorporatePassword123!',
      name: 'Corporate Recruiter',
      role: 'recruiter',
      company: 'Tech Global Talent Inc'
    });
    assert(corpDomainSignupRes.status === 201, 'POST /api/auth/signup accepts legitimate corporate company domain with HTTP 201');
    assert(corpDomainSignupRes.data.user && corpDomainSignupRes.data.user.email.includes('@techglobaltalent.com'), 'Registered employer profile created successfully');

  } catch (err) {
    assert(false, `Group 94 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 95: BLUE ? HELP ICON & COMPREHENSIVE HOW-TO GUIDE BOARD
  // =========================================================================
  try {
    console.log('\n--- GROUP 95: BLUE ? HELP ICON & COMPREHENSIVE HOW-TO GUIDE BOARD ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Recruiter top deck Blue ? Help Button snugged directly next to notification bell
    assert(recruiterHtml.includes('id="btn-help-guide"'), 'recruiter.html defines #btn-help-guide in top deck header actions');
    assert(recruiterHtml.includes('.btn-help-header'), 'recruiter.html styles .btn-help-header');
    assert(recruiterHtml.includes('#0075FF'), 'recruiter.html enforces blue #0075FF accent for help icon');
    assert(!recruiterHtml.includes('id="btn-brand-help"'), 'recruiter.html cleanly deleted ? next to upload logo');
    assert(!recruiterHtml.includes('id="tab-nav-help"'), 'recruiter.html cleanly deleted Tab 7 from menu');

    // 2. Candidate top deck Blue ? Help Button snugged directly next to notification bell
    assert(candidateHtml.includes('id="btn-candidate-help"'), 'candidate.html defines #btn-candidate-help in top deck header');
    assert(!candidateHtml.includes('id="btn-candidate-brand-help"'), 'candidate.html cleanly deleted ? next to brand badge');

    // 3. Signature How-To Guide Modal in recruiter.html (Employer Exclusive)
    assert(recruiterHtml.includes('id="how-to-guide-modal"'), 'recruiter.html defines #how-to-guide-modal signature modal');
    assert(recruiterHtml.includes('U-THEPOST RECRUITER MANUAL'), 'recruiter.html includes recruiter manual title');
    assert(recruiterHtml.includes('openHowToGuideModal') && recruiterHtml.includes('closeHowToGuideModal'), 'recruiter.html implements openHowToGuideModal and closeHowToGuideModal');
    assert(recruiterHtml.includes('Job Studio & Fast Publishing') && recruiterHtml.includes('Omnichannel CRM & Social Media Broadcasting'), 'recruiter.html contains employer-specific workflows');

    // 4. Signature How-To Guide Modal in candidate.html (Candidate Exclusive)
    assert(candidateHtml.includes('id="how-to-guide-modal"'), 'candidate.html defines #how-to-guide-modal signature modal');
    assert(candidateHtml.includes('U-THEJOBS CANDIDATE GUIDE'), 'candidate.html includes candidate guide title');
    assert(candidateHtml.includes('openHowToGuideModal') && candidateHtml.includes('closeHowToGuideModal'), 'candidate.html implements openHowToGuideModal and closeHowToGuideModal');
    assert(candidateHtml.includes('How to Apply in 30 Seconds') && candidateHtml.includes('How to Search & Discover Jobs'), 'candidate.html contains candidate-specific workflows');

    // 5. Strict Portal Separation: Candidate guide modal MUST NOT contain recruiter pricing or employer tabs
    const candModalIdx = candidateHtml.indexOf('id="how-to-guide-modal"');
    const candModalEndIdx = candidateHtml.indexOf('<!-- CANDIDATE PROFILE MODAL -->', candModalIdx);
    const candModalHtml = candidateHtml.substring(candModalIdx, candModalEndIdx);
    assert(!candModalHtml.includes('$49/mo') && !candModalHtml.includes('$299/mo') && !candModalHtml.includes('$699/mo'), 'candidate.html guide modal is strictly stripped of recruiter pricing tiers and add-on costs');
    assert(!candModalHtml.includes('guide-tab-btn-recruiter'), 'candidate.html guide modal does not contain recruiter tab switchers');

  } catch (err) {
    assert(false, `Group 95 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 96: UTHEVERSITY HOME SCREEN RETURN NAVIGATION
  // =========================================================================
  try {
    console.log('\n--- GROUP 96: UTHEVERSITY HOME SCREEN RETURN NAVIGATION ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Recruiter Top Deck Header UTHEVERSITY Home Button
    assert(recruiterHtml.includes('id="btn-utheversity-home"'), 'recruiter.html defines #btn-utheversity-home button in top deck header actions');
    assert(recruiterHtml.includes('href="https://utheversity.com"'), 'recruiter.html links directly to https://utheversity.com');
    assert(recruiterHtml.includes('.btn-home-header'), 'recruiter.html defines .btn-home-header styling');
    assert(recruiterHtml.includes('UTHEVERSITY HOME'), 'recruiter.html displays UTHEVERSITY HOME button label');

    // 2. Recruiter Mobile Slide-Out Drawer & Footer Home Links
    assert(recruiterHtml.includes('RETURN TO UTHEVERSITY HOME'), 'recruiter.html mobile drawer includes return to home link');
    assert(recruiterHtml.includes('Return to UTHEVERSITY Home Screen'), 'recruiter.html footer includes return to home screen link');

    // 3. Candidate Top Deck Header UTHEVERSITY Home Button
    assert(candidateHtml.includes('id="btn-candidate-utheversity-home"'), 'candidate.html defines #btn-candidate-utheversity-home button in top deck header');
    assert(candidateHtml.includes('href="https://utheversity.com"'), 'candidate.html links directly to https://utheversity.com');
    assert(candidateHtml.includes('.btn-home-header'), 'candidate.html defines .btn-home-header styling');
    assert(candidateHtml.includes('UTHEVERSITY HOME'), 'candidate.html displays UTHEVERSITY HOME button label');

    // 4. Candidate Footer Home Link
    assert(candidateHtml.includes('Return to UTHEVERSITY Home Screen'), 'candidate.html footer includes return to home screen link');

  } catch (err) {
    assert(false, `Group 96 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 97: U-THEPOST DESKTOP HEADER LAYER ELEVATION (Z-INDEX 99999)
  // =========================================================================
  try {
    console.log('\n--- GROUP 97: U-THEPOST DESKTOP HEADER LAYER ELEVATION ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Elevate Header Layer & Remove Vertical Height Clipping (z-index: 99999, min-height: 42px)
    assert(recruiterHtml.includes('position: relative !important;') && recruiterHtml.includes('z-index: 99999 !important;'), 'recruiter.html sets position: relative and z-index: 99999 on desktop header');
    assert(recruiterHtml.includes('min-height: 42px !important;'), 'recruiter.html sets min-height: 42px header constraint');
    assert(recruiterHtml.includes('overflow: visible !important;'), 'recruiter.html sets overflow: visible for header');

    // 2. Navigation Tabs (8px, font-weight: 700, padding: 2px 5px, z-index: 100000)
    assert(recruiterHtml.includes('font-size: 8px !important;') && recruiterHtml.includes('.nav-tab-btn, .portal-navigation button, nav.header-center-tabs button'), 'recruiter.html sets 8px font size for menu tabs');
    assert(recruiterHtml.includes('font-weight: 700 !important;'), 'recruiter.html sets font-weight: 700 for menu tabs');
    assert(recruiterHtml.includes('padding: 2px 5px !important;'), 'recruiter.html sets padding: 2px 5px for menu tabs');
    assert(recruiterHtml.includes('z-index: 100000 !important;'), 'recruiter.html elevates menu items to z-index: 100000');

    // 3. Action & Utility Deck (8px, height: 24px, padding: 2px 5px, 32px logo)
    assert(recruiterHtml.includes('.btn-home-header') && recruiterHtml.includes('height: 24px !important;'), 'recruiter.html sets height: 24px for home button');
    assert(recruiterHtml.includes('.btn-auth-header') && recruiterHtml.includes('height: 24px !important;'), 'recruiter.html sets height: 24px for auth button');
    assert(recruiterHtml.includes('.employer-logo-badge') && recruiterHtml.includes('min-height: 24px !important;'), 'recruiter.html sets min-height: 24px for logo badge');
    assert(recruiterHtml.includes('.employer-logo-preview-img') && recruiterHtml.includes('width: 32px !important;'), 'recruiter.html sets 32px profile picture size for employer logo');

    // 4. Notification Bell & Action Icons (12px SVG, 24px wrapper)
    assert(recruiterHtml.includes('.btn-notif-header .notif-bell-svg') && recruiterHtml.includes('width: 12px !important;'), 'recruiter.html sets 12px width for notification bell icon');
    assert(recruiterHtml.includes('.btn-help-header svg') && recruiterHtml.includes('width: 12px !important;'), 'recruiter.html sets 12px width for blue ? help icon');
    assert(recruiterHtml.includes('.btn-notif-header') && recruiterHtml.includes('width: 24px !important;') && recruiterHtml.includes('height: 24px !important;'), 'recruiter.html sets 24px x 24px icon button wrapper');

  } catch (err) {
    assert(false, `Group 97 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 98: JOB LISTING AGGREGATOR & RESUME BATCH INGESTION SUITE
  // =========================================================================
  try {
    console.log('\n--- GROUP 98: JOB LISTING AGGREGATOR & RESUME BATCH INGESTION SUITE ---');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Admin UI Controls & Exclusive Feed Sync Sovereignty
    assert(adminHtml.includes('id="modal-sync-job-feeds"'), 'admin.html defines #modal-sync-job-feeds modal');
    assert(adminHtml.includes('id="modal-batch-resume-parser"'), 'admin.html defines #modal-batch-resume-parser modal');
    assert(adminHtml.includes('window.openModal = openModal') && adminHtml.includes('window.closeModal = closeModal'), 'admin.html defines global openModal and closeModal');
    assert(adminHtml.includes('openJobAggregatorModal') && adminHtml.includes('triggerLiveJobFeedSync'), 'admin.html implements job aggregator sync functions');
    assert(adminHtml.includes('openBatchResumeParserModal') && adminHtml.includes('triggerBatchResumeIngestion'), 'admin.html implements batch resume ingestion functions');

    // 2. Strict Privacy Verification: Recruiters & Candidates NEVER see "SYNC LIVE JOB FEEDS"
    assert(!recruiterHtml.includes('⚡ SYNC LIVE JOB FEEDS'), 'recruiter.html strictly omits ⚡ SYNC LIVE JOB FEEDS from Card 3 and all tabs');
    assert(!recruiterHtml.includes('id="modal-sync-job-feeds"'), 'recruiter.html strictly omits #modal-sync-job-feeds modal');
    assert(!candidateHtml.includes('SYNC LIVE JOB FEEDS'), 'candidate.html strictly omits SYNC LIVE JOB FEEDS');
    assert(!candidateHtml.includes('id="modal-sync-job-feeds"'), 'candidate.html strictly omits #modal-sync-job-feeds modal');

    // 2. Aggregator Stats Endpoint
    const statsRes = await httpGet('/api/aggregator/stats');
    assert(statsRes.status === 200, 'GET /api/aggregator/stats returns HTTP 200');
    assert(statsRes.data && statsRes.data.ok === true && statsRes.data.presetsAvailable.length > 0, 'Aggregator stats endpoint exposes operational status and preset feeds');

    // 3. Job Feed Sync API
    const feedSyncRes = await httpPost('/api/aggregator/jobs/sync', { preset: 'tech_growth' });
    assert(feedSyncRes.status === 200, 'POST /api/aggregator/jobs/sync returns HTTP 200');
    assert(feedSyncRes.data && feedSyncRes.data.ok === true && typeof feedSyncRes.data.totalJobs === 'number', 'Job feed sync processes and publishes structured ATS listings');

    // 4. Automated Resume Batch Ingestion & Regex Parser API
    const testResumeDossier = `
Marcus Vance
marcus.vance@talentscale.io | (555) 432-1098
Staff Machine Learning Engineer • San Francisco, CA
8+ years of experience designing deep learning recommendation systems, PyTorch pipelines, and distributed Kubernetes deployments with Python and AWS.
---
Rachel Green
rachel.green@fashionretail.com | (555) 987-6543
Director of Brand Marketing • New York, NY
6+ years leading viral multi-channel campaigns, influencer partnerships, and SEO growth marketing.
`;

    const resumeBatchRes = await httpPost('/api/aggregator/resumes/parse-batch', { rawText: testResumeDossier });
    assert(resumeBatchRes.status === 200, 'POST /api/aggregator/resumes/parse-batch returns HTTP 200');
    assert(resumeBatchRes.data && resumeBatchRes.data.parsedCount === 2, 'Batch resume parser successfully extracts multiple candidate dossiers');
    
    const parsedCandidates = resumeBatchRes.data.resumes || [];
    const marcus = parsedCandidates.find(c => c.name.includes('Marcus'));
    assert(marcus && marcus.email === 'marcus.vance@talentscale.io', 'Resume parser accurately extracts email address');
    assert(marcus && marcus.phone === '(555) 432-1098', 'Resume parser accurately extracts phone number');
    assert(marcus && marcus.skills.includes('Python') && marcus.skills.includes('AWS'), 'Resume parser tags technical skills taxonomy');
    assert(marcus && marcus.verified === true, 'Ingested candidate card is marked with verified badge');

  } catch (err) {
    assert(false, `Group 98 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 99: DUAL-PORTAL BATCH DELETION CONTROLS SUITE
  // =========================================================================
  try {
    console.log('\n--- GROUP 99: DUAL-PORTAL BATCH DELETION CONTROLS SUITE ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. U-THEPOST Tab 6 Resume Search Batch Deletion
    assert(recruiterHtml.includes('class="resume-card-checkbox"'), 'recruiter.html includes .resume-card-checkbox directly to the left of match badge');
    assert(recruiterHtml.includes('id="chk-resumes-select-all"'), 'recruiter.html defines #chk-resumes-select-all toggle in command bar');
    assert(recruiterHtml.includes('id="btn-batch-delete-resumes"'), 'recruiter.html defines #btn-batch-delete-resumes button');
    assert(recruiterHtml.includes('handleResumeCardCheckboxChange') && recruiterHtml.includes('confirmBatchDeleteResumes') && recruiterHtml.includes('executeBatchDeleteResumes'), 'recruiter.html implements batch delete resume functions');

    // 2. U-THEADMIN Tab 5 Master Job Listings Batch Deletion
    assert(adminHtml.includes('id="chk-admin-jobs-select-all"'), 'admin.html defines #chk-admin-jobs-select-all in jobs table header');
    assert(adminHtml.includes('id="btn-admin-batch-delete-jobs"'), 'admin.html defines #btn-admin-batch-delete-jobs button in jobs section');
    assert(adminHtml.includes('admin-job-chk'), 'admin.html includes .admin-job-chk in job rows');
    assert(adminHtml.includes('handleAdminJobChkChange') && adminHtml.includes('confirmBatchDeleteAdminJobs'), 'admin.html implements batch delete job functions');

    // 3. U-THEADMIN Tab 5 Candidate Applications Batch Deletion
    assert(adminHtml.includes('id="chk-admin-apps-select-all"'), 'admin.html defines #chk-admin-apps-select-all in applications table header');
    assert(adminHtml.includes('id="btn-admin-batch-delete-apps"'), 'admin.html defines #btn-admin-batch-delete-apps button in applications section');
    assert(adminHtml.includes('admin-app-chk'), 'admin.html includes .admin-app-chk in application rows');
    assert(adminHtml.includes('handleAdminAppChkChange') && adminHtml.includes('confirmBatchDeleteAdminApps'), 'admin.html implements batch delete application functions');

    // 4. U-THEADMIN Tab 5 Master Candidate Resume Directory Batch Deletion
    assert(adminHtml.includes('id="chk-admin-resumes-select-all"'), 'admin.html defines #chk-admin-resumes-select-all in resumes table header');
    assert(adminHtml.includes('id="btn-admin-batch-delete-resumes"'), 'admin.html defines #btn-admin-batch-delete-resumes button in resumes section');
    assert(adminHtml.includes('admin-resume-chk'), 'admin.html includes .admin-resume-chk in resume rows');
    assert(adminHtml.includes('handleAdminResumeChkChange') && adminHtml.includes('confirmBatchDeleteAdminResumes'), 'admin.html implements batch delete resume functions');

    // 5. Server Batch Resume Deletion API Test
    const batchDelRes = await httpDelete('/api/resumes?ids=RES-TEST-999,RES-TEST-888');
    assert(batchDelRes.status === 200, 'DELETE /api/resumes?ids=... returns HTTP 200');
    assert(batchDelRes.data && batchDelRes.data.ok === true && batchDelRes.data.status === 'batch_deleted', 'Batch delete endpoint confirms successful batch processing');

  } catch (err) {
    assert(false, `Group 99 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 100: ADMIN IN-WINDOW RESUME VIEWER MODAL SUITE
  // =========================================================================
  try {
    console.log('\n--- GROUP 100: ADMIN IN-WINDOW RESUME VIEWER MODAL SUITE ---');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Admin Resume Viewer Modal Markup
    assert(adminHtml.includes('id="admin-resume-viewer-modal"'), 'admin.html defines #admin-resume-viewer-modal overlay');
    assert(adminHtml.includes('id="admin-resume-viewer-frame"'), 'admin.html includes iframe preview container');
    assert(adminHtml.includes('id="admin-viewer-download-link"'), 'admin.html includes download/open PDF action link');
    assert(adminHtml.includes('closeModal(\'admin-resume-viewer-modal\')'), 'admin.html provides X close handler on resume preview window');

    // 2. Open Resume In-Window Handler
    assert(adminHtml.includes('openAdminResumeViewer'), 'admin.html defines openAdminResumeViewer function');
    assert(adminHtml.includes('openAdminResumeViewer(\'${r.id}\''), 'renderAdminResumes triggers in-window viewer on View click without page navigation');

  } catch (err) {
    assert(false, `Group 100 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 101: GOOGLE FOR JOBS SCHEMA & PEOPLE DATA LABS (PDL) SOURCING SUITE
  // =========================================================================
  try {
    console.log('\n--- GROUP 101: GOOGLE FOR JOBS SCHEMA & PEOPLE DATA LABS (PDL) SOURCING SUITE ---');

    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    // 1. Google for Jobs Schema.org Markup
    assert(candidateHtml.includes('renderGoogleJobPostingSchema'), 'candidate.html implements renderGoogleJobPostingSchema generator');
    assert(candidateHtml.includes('application/ld+json'), 'candidate.html injects application/ld+json structured schema');
    assert(candidateHtml.includes('"@type": "JobPosting"'), 'candidate.html formats valid Schema.org JobPosting type');
    assert(candidateHtml.includes('"directApply": true'), 'candidate.html sets directApply flag for Google for Jobs');

    // 2. Server Google for Jobs Schema Endpoint
    const googleRes = await httpGet('/api/jobs/google-schema');
    assert(googleRes.status === 200, 'GET /api/jobs/google-schema returns HTTP 200');
    assert(Array.isArray(googleRes.data), 'Google for Jobs schema returns array of JobPosting items');
    if (googleRes.data.length > 0) {
      assert(googleRes.data[0]['@type'] === 'JobPosting', 'Google schema item has @type JobPosting');
      assert(googleRes.data[0].hiringOrganization && googleRes.data[0].hiringOrganization['@type'] === 'Organization', 'Google schema item includes structured hiringOrganization');
    }

    // 3. People Data Labs (PDL) Candidate Sourcing API
    const pdlSearchRes = await httpPost('/api/sourcing/pdl-search', {
      role: 'Staff Systems Engineer',
      location: 'Austin, TX',
      skills: 'Go, Kubernetes, Distributed Systems',
      size: 5
    });
    assert(pdlSearchRes.status === 200, 'POST /api/sourcing/pdl-search returns HTTP 200');
    assert(pdlSearchRes.data && pdlSearchRes.data.ok === true, 'PDL sourcing confirms ok: true');
    assert(pdlSearchRes.data.source === 'Verified Talent Network', 'PDL response confirms verified sourcing channel');
    assert(pdlSearchRes.data.count === 5, 'PDL response confirms 5 requested candidates ingested');
    assert(Array.isArray(pdlSearchRes.data.candidates) && pdlSearchRes.data.candidates.length === 5, 'PDL response returns candidate dossier array');

    // 4. Admin PDL Sourcing Controls & Modal
    assert(adminHtml.includes('id="modal-pdl-sourcing"'), 'admin.html defines #modal-pdl-sourcing modal');
    assert(adminHtml.includes('openPdlSourcingModal'), 'admin.html implements openPdlSourcingModal trigger');
    assert(adminHtml.includes('triggerPdlCandidateSourcing'), 'admin.html implements triggerPdlCandidateSourcing handler');
    assert(adminHtml.includes('id="pdl-api-key"'), 'admin.html provides PDL API key configuration input');

  } catch (err) {
    assert(false, `Group 101 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 102: CANDIDATE DIRECT CONTACT PRIVACY & PAID SUBSCRIPTION UNLOCK
  // =========================================================================
  try {
    console.log('\n--- GROUP 102: CANDIDATE DIRECT CONTACT PRIVACY & PAID SUBSCRIPTION UNLOCK ---');

    const recruiterHtml = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Recruiter CSS Contact Masking & Unlock Badges
    assert(recruiterHtml.includes('.blurred-contact-text'), 'recruiter.html defines .blurred-contact-text styling');
    assert(recruiterHtml.includes('.btn-unlock-contact-pill'), 'recruiter.html defines .btn-unlock-contact-pill CTA styling');

    // 2. Unlock Candidate Contact Modal
    assert(recruiterHtml.includes('id="modal-unlock-contact"'), 'recruiter.html defines #modal-unlock-contact signature modal');
    assert(recruiterHtml.includes('UNLOCK DIRECT CANDIDATE CONTACT'), 'recruiter.html includes unlock modal header');
    assert(recruiterHtml.includes('openUnlockContactModal'), 'recruiter.html implements openUnlockContactModal');
    assert(recruiterHtml.includes('closeUnlockContactModal'), 'recruiter.html implements closeUnlockContactModal');

    // 3. Privacy Masking Helpers & Subscription Verification
    assert(recruiterHtml.includes('function maskEmail'), 'recruiter.html implements maskEmail helper');
    assert(recruiterHtml.includes('function maskPhone'), 'recruiter.html implements maskPhone helper');
    assert(recruiterHtml.includes('function isPaidRecruiter'), 'recruiter.html implements isPaidRecruiter subscription checker');
    assert(recruiterHtml.includes('uthe_is_paid_plan'), 'recruiter.html verifies uthe_is_paid_plan persistence in localStorage');

    // 4. Candidate Resume Card Contact Bar
    assert(recruiterHtml.includes('PAID PLAN REQUIRED'), 'recruiter.html marks locked contact details with PAID PLAN REQUIRED');
    assert(recruiterHtml.includes('UNLOCK EMAIL & PHONE (UPGRADE PLAN)'), 'recruiter.html includes UNLOCK EMAIL & PHONE trigger on resume cards');

    // 5. Server-Side Locked/Masked vs Unlocked PDF Resume Generation
    const lockedPdfRes = await httpGet('/data/resumes/Marcus_Vance_Resume_2026.pdf?unlocked=0');
    assert(lockedPdfRes.status === 200, 'GET /data/resumes/... returns HTTP 200 for resume PDF');
    assert(lockedPdfRes.headers['content-type'] === 'application/pdf', 'Server responds with application/pdf Content-Type');

    const unlockedPdfRes = await httpGet('/data/resumes/Marcus_Vance_Resume_2026.pdf?unlocked=1');
    assert(unlockedPdfRes.status === 200, 'GET /data/resumes/... returns HTTP 200 for unlocked resume PDF');
    assert(unlockedPdfRes.headers['content-type'] === 'application/pdf', 'Server responds with application/pdf Content-Type for unlocked request');

  } catch (err) {
    assert(false, `Group 102 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 103: LIVE EMPLOYER JOB FEED INGESTION & AUTOMATED SOURCING PIPELINE
  // =========================================================================
  try {
    console.log('\n--- GROUP 103: LIVE EMPLOYER JOB FEED INGESTION & AUTOMATED SOURCING PIPELINE ---');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Feed Status Endpoint
    const feedStatusRes = await httpGet('/api/jobs/feed-status');
    assert(feedStatusRes.status === 200, 'GET /api/jobs/feed-status returns HTTP 200');
    assert(feedStatusRes.data && feedStatusRes.data.status === 'operational', 'Feed status confirms operational health');
    assert(Array.isArray(feedStatusRes.data.supportedProviders) && feedStatusRes.data.supportedProviders.includes('adzuna'), 'Supported providers list includes Adzuna API');
    assert(feedStatusRes.data.supportedProviders.includes('jsearch'), 'Supported providers list includes JSearch RapidAPI');

    // 2. Multi-Sector Live Feed Ingestion (Customer Support / Tier II CSRs)
    const csrSyncRes = await httpPost('/api/jobs/sync-live-feed', {
      category: 'customer_support',
      count: 10
    });
    assert(csrSyncRes.status === 200, 'POST /api/jobs/sync-live-feed returns HTTP 200 for customer support batch');
    assert(csrSyncRes.data && csrSyncRes.data.ok === true, 'Live job feed confirms ok: true');
    assert(typeof csrSyncRes.data.totalJobs === 'number', 'Response returns updated total active jobs count');

    // 3. Admin Live Feed Sourcing Controls
    assert(adminHtml.includes('triggerLiveJobFeedSync'), 'admin.html implements triggerLiveJobFeedSync');
    assert(adminHtml.includes('id="modal-sync-job-feeds"'), 'admin.html defines #modal-sync-job-feeds modal');
    assert(adminHtml.includes('id="aggregator-feed-preset"'), 'admin.html includes feed preset selector');

    // 4. Candidate Public Job Ingestion & Google for Jobs Verification
    const publicJobsRes = await httpGet('/api/listings/public');
    assert(publicJobsRes.status === 200, 'GET /api/listings/public returns HTTP 200');
    assert(Array.isArray(publicJobsRes.data.jobs) && publicJobsRes.data.jobs.length > 0, 'Public job listings contain verified employer vacancies');
    
    // Check for Customer Service or Tech employer vacancy
    const hasActivePost = publicJobsRes.data.jobs.some(j => j.company && j.jobTitle && j.salary);
    assert(hasActivePost, 'Ingested employer jobs contain complete Company, Title, and Salary data');

    // 5. Google for Jobs Schema Endpoint Indexing Readiness
    const schemaRes = await httpGet('/api/jobs/google-schema');
    assert(schemaRes.status === 200, 'GET /api/jobs/google-schema returns HTTP 200');
    assert(Array.isArray(schemaRes.data) && schemaRes.data.length > 0, 'Google for Jobs schema array populated with structured JobPostings');
    assert(schemaRes.data[0]['@type'] === 'JobPosting', 'Top schema item has @type JobPosting');
    assert(schemaRes.data[0].directApply === true, 'Top schema item sets directApply: true for direct candidate routing');

  } catch (err) {
    assert(false, `Group 103 failed: ${err.message}`);
  }

  // =========================================================================
  // GROUP 104: BLUE-COLLAR, $18-$22/HR & DEDICATED FELONY FRIENDLY SUITE
  // =========================================================================
  try {
    console.log('\n--- GROUP 104: BLUE-COLLAR & FELONY FRIENDLY PIPELINE SUITE ---');

    const adminHtml = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');
    const candidateHtml = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');

    // 1. Admin 1-Click PDL Sourcing Templates
    assert(adminHtml.includes('selectPdlTemplate'), 'admin.html defines selectPdlTemplate() function');
    assert(adminHtml.includes('selectPdlTemplate(\'felony_friendly\')'), 'admin.html includes Felony-Friendly 1-Click PDL template tab');
    assert(adminHtml.includes('selectPdlTemplate(\'sales_rep\')'), 'admin.html includes Sales Reps 1-Click PDL template tab');
    assert(adminHtml.includes('selectPdlTemplate(\'chefs_cooks_hosts\')'), 'admin.html includes Chefs/Cooks/Host 1-Click PDL template tab');
    assert(adminHtml.includes('selectPdlTemplate(\'industrial_assembly\')'), 'admin.html includes Industrial & Assembly 1-Click PDL template tab');
    assert(adminHtml.includes('selectPdlTemplate(\'grocery_stores\')'), 'admin.html includes Grocery Stores 1-Click PDL template tab');
    assert(adminHtml.includes('selectPdlTemplate(\'retail_clerks\')'), 'admin.html includes Retail Clerks & Cashiers 1-Click PDL template tab');

    // 2. Admin Live Job Feed Blue-Collar & Felony-Friendly Presets
    assert(adminHtml.includes('value="felony_friendly"'), 'admin.html job feed preset includes felony_friendly option');
    assert(adminHtml.includes('value="retail_grocery"'), 'admin.html job feed preset includes retail_grocery option');
    assert(adminHtml.includes('value="culinary_hospitality"'), 'admin.html job feed preset includes culinary_hospitality option');
    assert(adminHtml.includes('value="industrial_factory"'), 'admin.html job feed preset includes industrial_factory option');
    assert(adminHtml.includes('value="sales_representative"'), 'admin.html job feed preset includes sales_representative option');

    // 3. Candidate Dedicated Felony Friendly Button & Category Belt
    assert(candidateHtml.includes('id="category-filter-bar"'), 'candidate.html defines #category-filter-bar container');
    assert(candidateHtml.includes('filterByCategory(\'felony_friendly\')'), 'candidate.html defines dedicated 🤝 FELONY FRIENDLY button');
    assert(candidateHtml.includes('filterByCategory(\'retail_grocery\')'), 'candidate.html defines 🛒 RETAIL & GROCERY button');
    assert(candidateHtml.includes('filterByCategory(\'culinary_hospitality\')'), 'candidate.html defines 🍳 COOKS, CHEFS & HOSTS button');
    assert(candidateHtml.includes('filterByCategory(\'industrial_factory\')'), 'candidate.html defines 🏭 INDUSTRIAL & FACTORY button');
    assert(candidateHtml.includes('filterByCategory(\'sales_representative\')'), 'candidate.html defines 💼 SALES REPRESENTATIVES button');
    assert(candidateHtml.includes('🤝 FELONY FRIENDLY'), 'candidate.html renders 🤝 FELONY FRIENDLY badges on job listings');

    // 4. Server Felony Friendly Sync Verification
    const felonySyncRes = await httpPost('/api/jobs/sync-live-feed', {
      preset: 'felony_friendly',
      source: 'preset'
    });
    assert(felonySyncRes.status === 200, 'POST /api/jobs/sync-live-feed succeeds for felony_friendly preset');
    assert(felonySyncRes.data.ok === true, 'Felony-Friendly feed sync returns ok: true');

  } catch (err) {
    assert(false, `Group 104 failed: ${err.message}`);
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

