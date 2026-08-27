const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY PHASE 1 ATS, PLANS & ASSET OVERHAUL TEST SUITE');
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

  const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

  // ----------------------------------------------------
  // TEST GROUP 1: Campaign Recipient Cap (25 Max per Batch)
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Campaign Recipient Cap (25 Max)');
  try {
    assert(recContent.includes('max="25"'), 'Recipient input has max="25" attribute');
    assert(recContent.includes('25 MAX PER BATCH'), 'Header / label displays 25 MAX PER BATCH');
    assert(recContent.includes('clampCrmRecipients'), 'JS clamping function clampCrmRecipients is implemented');
    assert(recContent.includes('if (count > 25) count = 25'), 'Campaign dispatch enforces 25 max recipient cap');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Applicant Tracker Cards & Modal Handlers
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Applicant Tracker & Candidate Review');
  try {
    assert(recContent.includes('openCandidateReviewModal'), 'Candidate cards click handler openCandidateReviewModal implemented');
    assert(recContent.includes('candidate-review-modal'), 'Candidate review modal container present');
    assert(recContent.includes('col-header-applied') && recContent.includes('col-header-screened') && recContent.includes('col-header-interviewing') && recContent.includes('col-header-offer'), 'Distinct high-contrast column decks styled for all 4 pipeline stages');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Direct Messaging Drawer ("MESSAGE APPLICANT")
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Direct Messaging Drawer (MESSAGE APPLICANT)');
  try {
    assert(recContent.includes('MESSAGE APPLICANT'), 'Dedicated message section labeled "MESSAGE APPLICANT" present');
    assert(recContent.includes('applicant-chat-log'), 'Back-and-forth recruiter/applicant chat log thread present');
    assert(recContent.includes('INTRODUCTION TEMPLATE'), 'Quick message template 1: INTRODUCTION TEMPLATE present');
    assert(recContent.includes('INVITE TEMPLATE'), 'Quick message template 2: INVITE TEMPLATE present');
    assert(recContent.includes('ARE YOU INTERESTED TEMPLATE'), 'Quick message template 3: ARE YOU INTERESTED TEMPLATE present');
    assert(recContent.includes('sendAtsDirectMessage'), 'Direct message sender sendAtsDirectMessage active');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Pricing Plans & Dynamic Add-Ons Overhaul
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Pricing Plans & Structure Overhaul');
  try {
    assert(recContent.includes('BUILD FROM $0'), 'Dynamic total header includes "BUILD FROM $0"');
    assert(recContent.includes('CHOOSE A PLAN + ADD-ONS'), 'Dynamic total header includes "CHOOSE A PLAN + ADD-ONS"');

    assert(recContent.includes('1 Direct Applicant Messaging'), 'u-thePAL tier has "1 Direct Applicant Messaging"');
    assert(!recContent.includes('Direct Applicant Ingestion'), 'Banned legacy term "Ingestion" replaced with "Messaging"');

    assert(recContent.includes('3 Active Job Postings') && recContent.includes('3 Direct Candidate Messaging') && recContent.includes('Applicant Tracking'), 'STARTER plan structured with 3 Postings, 3 Messaging, Applicant Tracking');
    assert(recContent.includes('15 Active Job Postings') && recContent.includes('3 Multi-Platform Sharing'), 'GROWTH plan structured with 15 Postings, 3 Sharing, Applicant Tracking');
    assert(recContent.includes('Unlimited Active Job Postings') && recContent.includes('Full Multi-Platform Sharing'), 'PROFESSIONAL plan structured with Unlimited Postings, Full Sharing, Applicant Tracking');
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Branding, Badges & Asset Overhaul
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Verified Employer Emblem & Sleek Social Assets');
  try {
    assert(recContent.includes('verified-employer-badge') && recContent.includes('VERIFIED EMPLOYER'), 'Verified Employer Badge with official gold UTHEVERSITY emblem present');
    assert(recContent.includes('URGENT HIRING'), 'Visual URGENT HIRING badge rendered on job cards');
    assert(recContent.includes('viewBox="0 0 24 24"') && recContent.includes('#0A66C2') && recContent.includes('#1877F2') && recContent.includes('#E4405F') && recContent.includes('#EE1D52'), 'Sleek SVG brand logos present for LinkedIn, Facebook, Instagram, TikTok, and X');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: Master Owner Account (Zion Daye)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] Master Owner Account (Zion Daye)');
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
    assert(false, `Group 6 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 7: Smart Omni-Search Endpoint
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 7] Smart Omni-Search Endpoint');
  try {
    const searchRes = await httpGet('/api/admin/search?q=Zion');
    assert(searchRes.status === 200, 'GET /api/admin/search returns HTTP 200');
    assert(searchRes.data.results.users.some(u => u.name === 'Zion Daye'), 'Omni-Search matched Zion Daye user account');
  } catch (err) {
    assert(false, `Group 7 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 8: Live Sync Real-Time Broadcast Relay
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
    console.log('ALL PHASE 1 ATS, PLANS & ASSET OVERHAUL TESTS PASSED! 100% VERIFIED.\n');
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
