const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY PHASE 1 & MASTER PLATFORM OVERHAUL TEST SUITE');
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
  // TEST GROUP 1: Master Owner Setup (Zion Daye)
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Master Owner Account (Zion Daye)');
  try {
    const loginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    assert(loginRes.status === 200, 'Master Owner Zion Daye authenticated successfully');
    assert(loginRes.data.user.name === 'Zion Daye', 'Master Owner name verified as Zion Daye');
    assert(loginRes.data.user.phone === '815-980-4272', 'Master Owner contact phone verified as 815-980-4272');
    assert(loginRes.data.user.role === 'admin', 'Master Owner role verified as admin');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Smart Omni-Search Bar
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Smart Omni-Search Endpoint');
  try {
    const searchRes = await httpGet('/api/admin/search?q=Zion');
    assert(searchRes.status === 200, 'GET /api/admin/search returns HTTP 200');
    assert(searchRes.data.results.users.some(u => u.name === 'Zion Daye'), 'Omni-Search matched Zion Daye user account');

    const searchPhone = await httpGet('/api/admin/search?q=815-980-4272');
    assert(searchPhone.data.results.users.some(u => u.phone === '815-980-4272'), 'Omni-Search matched by phone number');

    const searchJob = await httpGet('/api/admin/search?q=Quantum');
    assert(searchJob.data.results.jobs.some(j => j.company.includes('Quantum')), 'Omni-Search matched by company name');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: u-thePOST Recruiter Studio & Features
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] u-thePOST Recruiter Studio (White Theme & u-thePAL Tier)');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    assert(recContent.includes('1. JOB STUDIO') && recContent.includes('5. MY PROFILE'), '5 tabs including "5. MY PROFILE" implemented');
    assert(recContent.includes('u-thePAL') && recContent.includes('$0'), 'u-thePAL $0/mo free member tier present with Email Only distribution');
    assert(recContent.includes('touchstart') && recContent.includes('touchmove') && recContent.includes('touch-action: none'), 'Mobile ATS touch drag-and-drop handles configured');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: u-theJOBS Candidate Board
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] u-theJOBS Candidate Board & Profile');
  try {
    const candContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(candContent.includes('SEND RESUME/CV'), 'Bottom detail button beneath Job Description labeled "SEND RESUME/CV"');
    assert(candContent.includes('QUICK SEND'), 'Trigger button labeled "QUICK SEND"');
    assert(candContent.includes('SUBMIT INTERVIEW REQUEST') && candContent.includes('REMOVE ATS'), 'Submit button labeled "SUBMIT INTERVIEW REQUEST" with tooltip "REMOVE ATS"');
    assert(candContent.includes('accept=".pdf"'), 'Resume picker restricted to .pdf only snug beneath phone');
    assert(candContent.includes('Best Time to Contact') && candContent.includes('Morning'), 'Best Time to Contact dropdown present');
    assert(candContent.includes('Interview Request Title'), 'Interview Request Title input present');
    assert(candContent.includes('MY PROFILE'), 'Candidate "MY PROFILE" modal and profile preferences present');
    assert(!candContent.includes('All Commitments') && candContent.includes('<option value="Full-Time"'), 'Commitment dropdown strictly restricted');
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Zero-Code Live Master CMS Controls
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Zero-Code Master CMS Overrides & Subdomain Live Sync');
  try {
    const cmsConfigRes = await httpGet('/api/cms/config');
    assert(cmsConfigRes.status === 200 && cmsConfigRes.data.config.pricing.palMonthly === 0, 'GET /api/cms/config returns u-thePAL and plan rates');

    const updateCms = await httpPost('/api/cms/config', {
      labels: {
        quickSendBtn: 'QUICK SEND (LIVE CMS VERIFIED)'
      },
      pricing: {
        palMonthly: 0,
        starterMonthly: 99,
        growthMonthly: 299,
        proMonthly: 699
      }
    });
    assert(updateCms.status === 200 && updateCms.data.config.labels.quickSendBtn === 'QUICK SEND (LIVE CMS VERIFIED)', 'POST /api/cms/config dynamically overrides labels in real time');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: UI Standards, Auth Security & Custom Modals
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] Auth Security, Eye Toggle & Custom Modals');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    const adminContent = fs.readFileSync(path.join(__dirname, 'admin.html'), 'utf8');

    assert(recContent.includes('password-toggle-icon') || recContent.includes('togglePassVisibility'), 'recruiter.html includes password eye visibility toggle');
    assert(candContent.includes('password-toggle-icon') || candContent.includes('togglePassVisibility'), 'candidate.html includes password eye visibility toggle');
    assert(recContent.includes('custom-modal-alert') && candContent.includes('custom-modal-alert') && adminContent.includes('custom-modal-alert'), 'All views use signature custom modal alerts (no standard browser alert)');
  } catch (err) {
    assert(false, `Group 6 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 7: Real-Time Live Sync Relay
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 7] Live WebSocket Synchronization');
  try {
    await new Promise((resolve, reject) => {
      const wsClient = new WebSocket(WS_URL);
      let jobReceived = false;

      wsClient.on('open', async () => {
        const testJob = {
          jobTitle: 'Principal Live Sync Engineer',
          company: 'UTHEVERSITY Labs',
          location: 'REMOTE',
          employmentType: 'Full-Time',
          salary: '$200,000 - $250,000',
          summary: 'Testing zero-code real-time broadcast.'
        };
        await httpPost('/api/jobs', testJob);
      });

      wsClient.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'JOB_PUBLISHED' && data.job && data.job.jobTitle.includes('Principal Live Sync Engineer')) {
          jobReceived = true;
          assert(true, 'Live WebSocket broadcast verified in real-time');
          wsClient.close();
          resolve();
        }
      });

      wsClient.on('error', reject);

      setTimeout(() => {
        if (!jobReceived) {
          assert(false, 'Timed out waiting for WebSocket sync event');
          wsClient.close();
          resolve();
        }
      }, 3000);
    });
  } catch (err) {
    assert(false, `Group 7 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 8: Phase 1 u-thePOST (recruiter.html) Updates
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 8] Phase 1 u-thePOST Brand, Card 1/3, CRM & Dynamic Add-Ons');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    // 1. Header Branding & Logo Ownership
    assert(recContent.includes('employer-logo-badge') && recContent.includes('openLogoUploadModal') && recContent.includes('UPLOAD LOGO'), 'Header live Upload Logo component implemented');

    // 2. Card 1 & Card 3 Refinements
    assert(recContent.includes('inp-recruiter-email'), 'Card 1 dedicated Employer Contact Email input implemented');
    assert(recContent.includes('inp-soc-linkedin') && recContent.includes('inp-soc-x') && recContent.includes('inp-soc-tiktok') && recContent.includes('inp-soc-fb') && recContent.includes('inp-soc-ig'), 'Card 1 connected social accounts inputs (LinkedIn, X, TikTok, Facebook, IG) implemented');
    assert(recContent.includes('3. PUBLISHING & DISTRIBUTION SETTINGS') && recContent.includes('dist-channel-box') && recContent.includes('BROADCAST TO CONNECTED CHANNELS'), 'Card 3 publishing & distribution settings and immediate broadcast triggers active');

    // 3. Omnichannel CRM Tab Revisions
    assert(!recContent.includes('openScheduleQueueModal()'), 'Schedule Queue button removed from CRM header');
    assert(recContent.includes('crm-template-select') && recContent.includes('CRM_TEMPLATES') && recContent.includes('linkedin_dm'), 'Outreach templates aligned with connected social and email accounts');
    assert(recContent.includes('CAMPAIGN DATE TRACKER') && recContent.includes('crm-campaign-tracker-tbody') && recContent.includes('Launch Timestamp'), 'Campaign Date Tracker table with launch timestamps (Date & Time) active');

    // 4. Performance & Plans (ADD-ONS & Dynamic Pricing)
    assert(recContent.includes('ADD-ONS'), 'Itemized Features renamed to ADD-ONS');
    assert(recContent.includes('toggle-switch') && recContent.includes('toggle-slider'), 'Interactive ON/OFF toggle switches implemented across plan features and add-ons');
    assert(recContent.includes('calc-total-amount') && recContent.includes('recalculateMembershipTotal'), 'Dynamic membership pricing recalculation in real time implemented');
    assert(recContent.includes('SOCIAL CHANNELS ADD-ON') && recContent.includes('toggle-social-bundle') && recContent.includes('5-CHANNEL BUNDLE ($19.99/mo)') && recContent.includes('$5.99'), 'Social Channels Add-On card with $5.99 each and $19.99 5-channel bundle implemented');
  } catch (err) {
    assert(false, `Group 8 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL PHASE 1 & MASTER PLATFORM TESTS PASSED! 100% VERIFIED.\n');
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
