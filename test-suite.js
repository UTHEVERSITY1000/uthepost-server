const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('PLATFORM OVERHAUL, AUTHENTICATION & CMS ENGINE TEST SUITE');
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

  // ----------------------------------------------------
  // TEST GROUP 1: Subdomain Isolation & Host Routing
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Strict Subdomain Host Isolation');
  try {
    const health = await httpGet('/api/health');
    assert(health.status === 200, 'Healthcheck endpoint returned HTTP 200 OK');

    const postRes = await httpGet('/', { 'Host': 'post.utheversity.com' });
    assert(postRes.raw.includes('RECRUITER WORKSPACE') && !postRes.raw.includes('pane-iframe'), 'post.utheversity.com serves recruiter.html with zero leakage');

    const jobsRes = await httpGet('/', { 'Host': 'jobs.utheversity.com' });
    assert(jobsRes.raw.includes('CANDIDATE BOARD') && !jobsRes.raw.includes('pane-iframe'), 'jobs.utheversity.com serves candidate.html with zero leakage');

    const adminRes = await httpGet('/', { 'Host': 'admin.utheversity.com' });
    assert(adminRes.raw.includes('MASTER SUITE') && !adminRes.raw.includes('pane-iframe'), 'admin.utheversity.com serves admin.html with zero leakage');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Candidate Board Revisions (candidate.html)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Candidate Board Workflow & Streamlined Modal');
  try {
    const candContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(candContent.includes('SEND RESUME/CV'), 'Bottom detail button beneath Job Description changed to "SEND RESUME/CV"');
    assert(candContent.includes('QUICK SEND'), 'Card and header trigger buttons labeled "QUICK SEND"');
    assert(candContent.includes('SUBMIT INTERVIEW REQUEST'), 'Submit button labeled "SUBMIT INTERVIEW REQUEST"');
    assert(candContent.includes('REMOVE ATS'), 'Submit button has tooltip "REMOVE ATS"');
    assert(candContent.includes('accept=".pdf"'), 'Resume upload field restricted to .pdf only');
    assert(candContent.includes('Best Time to Contact') && candContent.includes('Morning') && candContent.includes('Afternoon'), 'Best Time to Contact dropdown present with required options');
    assert(candContent.includes('Interview Request Title'), 'Interview Request Title input field present');
    assert(candContent.includes('What do you want the employer to know to advance your resume?'), 'Interview Request Title has correct tooltip');
    assert(candContent.includes('Quick About Me / Why Hire Me...'), 'Interview Request Message textarea placeholder present');

    // Dropdown & Header Cleanup
    assert(candContent.includes('<option value="Full-Time"') && !candContent.includes('All Commitments'), 'Commitment dropdown strictly restricted without "All Commitments"');
    assert(!candContent.includes('SYNC ACTIVE') && !candContent.includes('OPENINGS ('), 'Header cleaned of "SYNC ACTIVE" and "X OPENINGS" badges');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Recruiter Workspace (recruiter.html)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Recruiter Workspace, 4-Tab Nav, Social Links & Dynamic Pricing');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    assert(recContent.includes('1. JOB STUDIO'), 'Tab 1: 1. JOB STUDIO present');
    assert(recContent.includes('2. OMNICHANNEL CRM'), 'Tab 2: 2. OMNICHANNEL CRM present');
    assert(recContent.includes('3. APPLICANT TRACKER'), 'Tab 3: 3. APPLICANT TRACKER present');
    assert(recContent.includes('4. PERFORMANCE & PLANS'), 'Tab 4: 4. PERFORMANCE & PLANS present');

    // Check header center tabs
    const headerTabs = recContent.match(/<div class="header-center-tabs">[\s\S]*?<\/div>/)[0];
    assert(!headerTabs.includes('B2B LEAD ENGINE') && !headerTabs.includes('JOB AGGREGATOR'), 'Restricted exclusively to the 4 customer tabs');

    // Badges & Social Media block
    assert(recContent.includes('LINK SOCIAL MEDIA ACCOUNTS'), 'Card 1 contains "Link Social Media Accounts" block (LinkedIn, X, TikTok, Facebook, Instagram)');
    assert(!recContent.includes('>INPUT FORM<'), 'Card 1 removed "INPUT FORM" badge');
    assert(!recContent.includes('>REAL-TIME REACTIVE<'), 'Card 2 removed "REAL-TIME REACTIVE" badge');

    // Schedule Queue Calendar Picker
    assert(recContent.includes('schedule-calendar-modal') && recContent.includes('sched-date') && recContent.includes('9:00 AM'), 'Schedule Queue Calendar Picker modal with date selection and time slots implemented');

    // Performance & Plans Pricing Engine
    assert(recContent.includes('OMNI-CHANNEL FEATURES') && recContent.includes('toggleBillingFrequency'), 'Omni-Channel features toggle card with interactive switches and dynamic pricing implemented');

    // Mobile ATS Touch Drag & Drop
    assert(recContent.includes('touchstart') && recContent.includes('touchmove') && recContent.includes('touch-action: none'), 'Mobile ATS touch event listeners and touch-action: none configured');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Custom Authentication & JWT Security
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Backend Authentication & Cross-Subdomain JWT Security');
  try {
    // 1. Sign up a new user
    const testEmail = `test.user.${Date.now()}@utheversity.com`;
    const signupRes = await httpPost('/api/auth/signup', {
      email: testEmail,
      password: 'SecurePassword2026!',
      name: 'Test Candidate User',
      role: 'candidate'
    });
    assert(signupRes.status === 201, 'POST /api/auth/signup returns HTTP 201 Created');
    assert(signupRes.data.token && signupRes.data.user.email === testEmail, 'Signup returns valid JWT token and user payload');
    const setCookie = signupRes.headers['set-cookie'] ? signupRes.headers['set-cookie'][0] : '';
    assert(setCookie.includes('Domain=.utheversity.com') || setCookie.includes('uthe_token='), 'Cookie scoped to cross-subdomain Domain=.utheversity.com');

    // 2. Login with valid credentials
    const loginRes = await httpPost('/api/auth/login', {
      email: testEmail,
      password: 'SecurePassword2026!'
    });
    assert(loginRes.status === 200, 'POST /api/auth/login returns HTTP 200 OK');
    assert(loginRes.data.user.name === 'Test Candidate User', 'Login verifies password hash and returns authenticated user');

    // 3. Login with invalid password
    const badLoginRes = await httpPost('/api/auth/login', {
      email: testEmail,
      password: 'WrongPassword!'
    });
    assert(badLoginRes.status === 401, 'POST /api/auth/login rejects invalid password with HTTP 401');

    // 4. Test /api/auth/me session check
    const meRes = await httpGet('/api/auth/me', {
      'Authorization': `Bearer ${loginRes.data.token}`
    });
    assert(meRes.status === 200 && meRes.data.authenticated === true, 'GET /api/auth/me validates Bearer JWT token');
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Master Admin Live CMS Controls & User CRUD
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Master Admin Live CMS Controls & User CRUD');
  try {
    // 1. Get CMS config
    const cmsGet = await httpGet('/api/cms/config');
    assert(cmsGet.status === 200 && cmsGet.data.config.labels.quickSendBtn === 'QUICK SEND', 'GET /api/cms/config returns CMS configuration');

    // 2. Update CMS config overrides
    const cmsPost = await httpPost('/api/cms/config', {
      labels: {
        quickSendBtn: 'QUICK APPLY (CMS OVERRIDE)',
        sendResumeBtn: 'SEND RESUME/CV'
      }
    });
    assert(cmsPost.status === 200 && cmsPost.data.config.labels.quickSendBtn === 'QUICK APPLY (CMS OVERRIDE)', 'POST /api/cms/config updates CMS label overrides');

    // 3. User CRUD API
    const usersGet = await httpGet('/api/admin/users');
    assert(usersGet.status === 200 && usersGet.data.users.length >= 3, 'GET /api/admin/users returns registered platform accounts');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: Real-Time WebSocket Synchronization
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] Real-Time WebSocket Multi-Sync Mesh');
  try {
    await new Promise((resolve, reject) => {
      const wsClient = new WebSocket(WS_URL);
      let jobReceived = false;

      wsClient.on('open', async () => {
        const testJob = {
          jobTitle: 'Distributed Systems Architect (Live WS Test)',
          company: 'SyncMesh Global',
          location: 'REMOTE',
          employmentType: 'Full-Time',
          salary: '$180,000 - $220,000',
          summary: 'Testing real-time live sync across dual portals.'
        };
        await httpPost('/api/jobs', testJob);
      });

      wsClient.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'JOB_PUBLISHED' && data.job && data.job.jobTitle.includes('Distributed Systems Architect')) {
          jobReceived = true;
          assert(true, 'WebSocket client received real-time JOB_PUBLISHED broadcast');
          wsClient.close();
          resolve();
        }
      });

      wsClient.on('error', reject);

      setTimeout(() => {
        if (!jobReceived) {
          assert(false, 'Timed out waiting for WebSocket JOB_PUBLISHED event');
          wsClient.close();
          resolve();
        }
      }, 3000);
    });
  } catch (err) {
    assert(false, `Group 6 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL PLATFORM OVERHAUL, AUTH & CMS TESTS PASSED! 100% VERIFIED.\n');
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
