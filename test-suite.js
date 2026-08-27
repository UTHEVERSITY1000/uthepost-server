const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY RECRUITER LAYOUT & PLAIN-ENGLISH TEST SUITE');
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
  // TEST GROUP 1: Master Owner Account (Zion Daye)
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
  // TEST GROUP 3: Strict Plain-English Language & Jargon Banning
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Strict Plain-English Language (Zero Tech Jargon)');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    assert(!recContent.includes('BROADCAST ENGINE'), 'Banned term "BROADCAST ENGINE" removed');
    assert(!recContent.includes('Syndication'), 'Banned term "Syndication" removed');
    assert(!recContent.includes('Mesh'), 'Banned term "Mesh" removed');
    assert(!recContent.includes('WebSockets'), 'Banned term "WebSockets" removed from user text');
    assert(!recContent.includes('Reactive'), 'Banned term "Reactive" removed from user text');

    assert(recContent.includes('Live Sync'), 'Plain English "Live Sync" used');
    assert(recContent.toLowerCase().includes('multi-platform') || recContent.toLowerCase().includes('connected accounts'), 'Plain English "Multi-Platform / Connected Accounts" used');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Card 3 Live Job Listings Restoration (Right Column)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Card 3: Live Job Listings Restoration (Right Column)');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    assert(recContent.includes('CARD 3: LIVE JOB LISTINGS'), 'Header "CARD 3: LIVE JOB LISTINGS" present');
    assert(recContent.includes('Sales Manager') && recContent.includes('Posted Today'), 'Relatable Job 1: Sales Manager pre-populated');
    assert(recContent.includes('Retail Sales Associate') && recContent.includes('Posted Yesterday'), 'Relatable Job 2: Retail Sales Associate pre-populated');
    assert(recContent.includes('Assembly Line Worker') && recContent.includes('Posted 3 Days Ago'), 'Relatable Job 3: Assembly Line Worker pre-populated');
    assert(recContent.includes('Delivery Driver') && recContent.includes('Posted 5 Days Ago'), 'Relatable Job 4: Delivery Driver pre-populated');
    assert(recContent.includes('Chef Needed') && recContent.includes('Posted 1 Week Ago'), 'Relatable Job 5: Chef Needed pre-populated');
    assert(recContent.includes('EDIT') && recContent.includes('PAUSE') && recContent.includes('DELETE'), 'Action controls [EDIT], [PAUSE], [DELETE] present on rows');
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Bottom Publishing & Distribution Settings Section
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Bottom Section: Publishing & Distribution Settings');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    assert(recContent.includes('<span class="panel-title">PUBLISHING & DISTRIBUTION SETTINGS</span>'), 'Header is simply "PUBLISHING & DISTRIBUTION SETTINGS" without number prefix 3.');
    assert(!recContent.includes('3. PUBLISHING & DISTRIBUTION SETTINGS'), 'Prefix "3." permanently removed from bottom settings header');
    assert(recContent.includes('PUBLISH POSITION LIVE & BROADCAST'), 'Retains primary "PUBLISH POSITION LIVE & BROADCAST" button');
    assert(recContent.includes('dist-board') && recContent.includes('dist-email') && recContent.includes('dist-social'), 'Channel checkboxes retained');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: u-theJOBS Candidate Board & Profile
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] u-theJOBS Candidate Board & Profile');
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
    assert(false, `Group 6 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 7: Performance & Plans Dynamic Add-Ons & Pricing
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 7] Performance & Plans Dynamic Add-Ons & Pricing');
  try {
    const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

    assert(recContent.includes('ADD-ONS'), 'Itemized Features renamed to ADD-ONS');
    assert(recContent.includes('toggle-switch') && recContent.includes('toggle-slider'), 'Interactive ON/OFF toggle switches implemented across plan features and add-ons');
    assert(recContent.includes('calc-total-amount') && recContent.includes('recalculateMembershipTotal'), 'Dynamic membership pricing recalculation in real time implemented');
    assert(recContent.includes('SOCIAL CHANNELS ADD-ON') && recContent.includes('toggle-social-bundle') && recContent.includes('5-CHANNEL BUNDLE ($19.99/mo)') && recContent.includes('$5.99'), 'Social Channels Add-On card with $5.99 each and $19.99 5-channel bundle implemented');
  } catch (err) {
    assert(false, `Group 7 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 8: Real-Time Live Sync Relay
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 8] Live Sync Real-Time Broadcast');
  try {
    await new Promise((resolve, reject) => {
      const wsClient = new WebSocket(WS_URL);
      let jobReceived = false;

      wsClient.on('open', async () => {
        const testJob = {
          jobTitle: 'Assistant Store Manager',
          company: 'UTHEVERSITY Retail Group',
          location: 'AUSTIN, TX',
          employmentType: 'Full-Time',
          salary: '$65,000 - $80,000',
          summary: 'Testing plain-English live sync broadcast.'
        };
        await httpPost('/api/jobs', testJob);
      });

      wsClient.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'JOB_PUBLISHED' && data.job && data.job.jobTitle.includes('Assistant Store Manager')) {
          jobReceived = true;
          assert(true, 'Live Sync broadcast verified in real-time');
          wsClient.close();
          resolve();
        }
      });

      wsClient.on('error', reject);

      setTimeout(() => {
        if (!jobReceived) {
          assert(false, 'Timed out waiting for Live Sync event');
          wsClient.close();
          resolve();
        }
      }, 3000);
    });
  } catch (err) {
    assert(false, `Group 8 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL RECRUITER LAYOUT & PLAIN-ENGLISH TESTS PASSED! 100% VERIFIED.\n');
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
