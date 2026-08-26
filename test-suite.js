const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UI REFINEMENTS, CANDIDATE FLOW & MOBILE TOUCH ATS TEST SUITE');
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

  function httpGet(path, headers = {}) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}${path}`);
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
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }).on('error', reject);
    });
  }

  function httpPost(path, payload) {
    return new Promise((resolve, reject) => {
      const dataStr = JSON.stringify(payload);
      const req = http.request(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(dataStr)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data), raw: data });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      });
      req.on('error', reject);
      req.write(dataStr);
      req.end();
    });
  }

  // TEST GROUP 1: Core Engine Health & Host Routing
  console.log('[TEST GROUP 1] Core Engine & Subdomain Isolation');
  try {
    const health = await httpGet('/api/health');
    assert(health.status === 200, 'Healthcheck endpoint returned HTTP 200 OK');
    assert(health.data.version === '2.0.0-ENTERPRISE', 'Engine version matches 2.0.0-ENTERPRISE');

    const postRes = await httpGet('/', { 'Host': 'post.utheversity.com' });
    assert(postRes.raw.includes('RECRUITER WORKSPACE') && !postRes.raw.includes('pane-iframe'), 'post.utheversity.com serves recruiter.html with zero staging leakage');

    const jobsRes = await httpGet('/', { 'Host': 'jobs.utheversity.com' });
    assert(jobsRes.raw.includes('CANDIDATE BOARD') && !jobsRes.raw.includes('pane-iframe'), 'jobs.utheversity.com serves candidate.html with zero staging leakage');

    const adminRes = await httpGet('/', { 'Host': 'admin.utheversity.com' });
    assert(adminRes.raw.includes('MASTER SUITE') && !adminRes.raw.includes('pane-iframe'), 'admin.utheversity.com serves admin.html with zero staging leakage');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // TEST GROUP 2: Recruiter Navigation Tabs
  console.log('\n[TEST GROUP 2] Recruiter Navigation Tabs (Restricted to 4 Tabs)');
  try {
    const recruiterContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    assert(recruiterContent.includes('1. JOB STUDIO'), 'Tab 1: 1. JOB STUDIO present');
    assert(recruiterContent.includes('2. OMNICHANNEL CRM'), 'Tab 2: 2. OMNICHANNEL CRM present');
    assert(recruiterContent.includes('3. APPLICANT TRACKER'), 'Tab 3: 3. APPLICANT TRACKER present');
    assert(recruiterContent.includes('4. PERFORMANCE & PLANS'), 'Tab 4: 4. PERFORMANCE & PLANS present');
    
    // Check that customer header navigation does not have removed tabs
    const headerNavSection = recruiterContent.match(/<div class="header-center-tabs">[\s\S]*?<\/div>/)[0];
    assert(!headerNavSection.includes('B2B LEAD ENGINE'), 'B2B Lead Engine removed from customer header tabs');
    assert(!headerNavSection.includes('JOB AGGREGATOR'), 'Job Aggregator removed from customer header tabs');
    assert(!headerNavSection.includes('SYSTEM DIAGNOSTICS'), 'System Diagnostics removed from customer header tabs');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // TEST GROUP 3: Candidate Board & Application Form
  console.log('\n[TEST GROUP 3] Candidate Board & Application Flow');
  try {
    const candidateContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(candidateContent.includes('QUICK SEND'), 'Button renamed to QUICK SEND');
    assert(candidateContent.includes('SUBMIT INTERVIEW REQUEST'), 'Submit button renamed to SUBMIT INTERVIEW REQUEST');
    assert(candidateContent.includes('REMOVE ATS'), 'Submit button has "REMOVE ATS" tooltip');
    assert(candidateContent.includes('UPLOAD RESUME AND COVER LETTER'), 'Main modal header is "UPLOAD RESUME AND COVER LETTER"');
    assert(candidateContent.includes('INTERVIEW REQUEST'), 'Secondary header is "INTERVIEW REQUEST"');
    assert(candidateContent.includes('What do you want the employer to know to advance your resume?'), 'Interview Request field tooltip is present');
    assert(candidateContent.includes('Quick About Me / Why Hire Me...'), 'Body placeholder "Quick About Me / Why Hire Me..." is present');
    assert(candidateContent.includes('Best Time to Contact'), 'Best Time to Contact dropdown is present');
    assert(candidateContent.includes('file-upload-snug') || candidateContent.includes('cand-resume-file'), 'Resume upload button is present beneath phone');
    assert(!candidateContent.includes('OPENINGS ('), 'Openings counter badge header removed from candidate board');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // TEST GROUP 4: Tooltip System Overhaul
  console.log('\n[TEST GROUP 4] Tooltip System Overhaul');
  try {
    const filesToCheck = ['recruiter.html', 'candidate.html', 'admin.html', 'preview-hub.html'];
    filesToCheck.forEach(file => {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      assert(content.includes('max-width: 200px'), `${file}: Tooltip max-width set to 200px`);
      assert(content.includes('font-size: 11px'), `${file}: Tooltip font-size set to 11px`);
      assert(content.includes('z-index: 99999'), `${file}: Tooltip z-index set to 99999`);
    });
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // TEST GROUP 5: Mobile Touch ATS Drag & Drop
  console.log('\n[TEST GROUP 5] Mobile Touch Drag & Drop on ATS');
  try {
    const recruiterContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    assert(recruiterContent.includes('touchstart'), 'Native touchstart event listener implemented');
    assert(recruiterContent.includes('touchmove'), 'Native touchmove event listener implemented');
    assert(recruiterContent.includes('touchend'), 'Native touchend event listener implemented');
    assert(recruiterContent.includes('touch-action: none'), 'touch-action: none style configured for smooth drag');
    assert(recruiterContent.includes('touch-dragging'), 'touch-dragging class defined for elevation feedback');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // TEST GROUP 6: Admin Secret Shortcut & Footer Access
  console.log('\n[TEST GROUP 6] Admin Secret Shortcut & Footer Trigger');
  try {
    const recruiterContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');
    const candidateContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
    assert(recruiterContent.includes('[ADMIN]') && recruiterContent.includes('Ctrl+Shift+A'), 'recruiter.html has discrete [ADMIN] footer link and shortcut');
    assert(candidateContent.includes('[ADMIN]') && candidateContent.includes('Ctrl+Shift+A'), 'candidate.html has discrete [ADMIN] footer link and shortcut');
  } catch (err) {
    assert(false, `Group 6 failed: ${err.message}`);
  }

  // TEST GROUP 7: Real-Time Live Sync & WebSocket Broadcast
  console.log('\n[TEST GROUP 7] Real-Time Live Sync Across Dual Portals');
  try {
    await new Promise((resolve, reject) => {
      const wsClient = new WebSocket(WS_URL);
      let receivedPublishedJob = false;

      wsClient.on('open', async () => {
        // Post a new job via HTTP API
        const testJob = {
          jobTitle: 'Real-Time Sync Test Engineer',
          company: 'Live Mesh Corp',
          location: 'REMOTE',
          employmentType: 'Full-Time',
          salary: '$160,000 - $200,000',
          minCompensation: '160000',
          maxCompensation: '200000',
          summary: 'Verifying real-time instant sync without browser refresh.'
        };

        await httpPost('/api/jobs', testJob);
      });

      wsClient.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'JOB_PUBLISHED' && data.job && data.job.jobTitle === 'Real-Time Sync Test Engineer') {
          receivedPublishedJob = true;
          assert(true, 'WebSocket client received JOB_PUBLISHED event in real-time');
          wsClient.close();
          resolve();
        }
      });

      wsClient.on('error', reject);

      setTimeout(() => {
        if (!receivedPublishedJob) {
          assert(false, 'Timed out waiting for real-time WebSocket JOB_PUBLISHED event');
          wsClient.close();
          resolve();
        }
      }, 3000);
    });
  } catch (err) {
    assert(false, `Group 7 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL UI REFINEMENTS, CANDIDATE FLOW & MOBILE ATS TESTS PASSED! 100% VERIFIED.\n');
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
