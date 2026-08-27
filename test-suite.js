const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY PHASE 3 MASTER ADMIN & ZERO-CODE CMS TEST SUITE');
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
  // TEST GROUP 1: Visual Theme Unification (Premium White Studio)
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Visual Theme Unification (Premium White Studio)');
  try {
    assert(adminContent.includes('--bg-canvas: #F8F9FA'), 'admin.html uses Premium White Studio canvas background #F8F9FA');
    assert(adminContent.includes('--card-surface: #FFFFFF'), 'admin.html uses crisp white card surfaces #FFFFFF');
    assert(adminContent.includes('--text-main: #0F172A'), 'admin.html uses dark slate typography #0F172A');
    assert(adminContent.includes('--uthe-gold: #E5A800'), 'admin.html uses signature gold accent palette');
    assert(!adminContent.includes('--bg-dark: #080C14'), 'Legacy dark background permanently replaced');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Master Owner Account & Authentication (Zion Daye)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Master Owner Account (Zion Daye)');
  try {
    assert(adminContent.includes('ZION DAYE (815-980-4272)'), 'Header displays Zion Daye identity with phone 815-980-4272');
    assert(adminContent.includes('admin-auth-modal'), 'Master authentication modal configured');
    assert(adminContent.includes('checkAdminPassLength') && adminContent.includes('admin-recaptcha'), 'Password length indicator & reCAPTCHA spam shield present');

    const loginRes = await httpPost('/api/auth/login', {
      email: 'contact@utheversity.com',
      password: 'ZionAdmin2026!'
    });
    assert(loginRes.status === 200, 'Master Owner Zion Daye authenticated successfully via JWT');
    assert(loginRes.data.user.name === 'Zion Daye', 'Master Owner name verified as Zion Daye');
    assert(loginRes.data.user.phone === '815-980-4272', 'Master Owner contact phone verified as 815-980-4272');
    assert(loginRes.data.user.role === 'admin', 'Master Owner role verified as admin');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Smart Omni-Search Engine
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Smart Omni-Search Engine');
  try {
    assert(adminContent.includes('omni-search-input') && adminContent.includes('handleOmniSearch'), 'Omni-Search bar and live event handler present');

    const searchUser = await httpGet('/api/admin/search?q=Zion');
    assert(searchUser.status === 200 && searchUser.data.results.users.some(u => u.name === 'Zion Daye'), 'Omni-Search finds users by name');

    const searchPhone = await httpGet('/api/admin/search?q=815-980-4272');
    assert(searchPhone.status === 200 && searchPhone.data.results.users.some(u => u.phone === '815-980-4272'), 'Omni-Search finds accounts by phone number');

    const searchJob = await httpGet('/api/admin/search?q=Senior');
    assert(searchJob.status === 200 && searchJob.data.results.jobs.length > 0, 'Omni-Search finds jobs by title');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Zero-Code Master CMS Override Panel & WebSocket Broadcast
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Zero-Code Master CMS Overrides & Broadcast');
  try {
    assert(adminContent.includes('cms-post-title') && adminContent.includes('cms-jobs-title'), 'Brand title CMS input controls present');
    assert(adminContent.includes('cms-quick-send-btn') && adminContent.includes('cms-send-resume-btn'), 'Button phrase CMS input controls present');
    assert(adminContent.includes('cms-price-social-single') && adminContent.includes('cms-price-social-bundle'), 'Social add-on pricing controls ($5.99 / $19.99) present');

    const cmsGet = await httpGet('/api/cms/config');
    assert(cmsGet.status === 200 && cmsGet.data.config, 'GET /api/cms/config returns active CMS schema');

    const cmsUpdate = await httpPost('/api/cms/config', {
      labels: { postTitle: 'U-THEPOST STUDIO' },
      pricing: { starterMonthly: 99, individualSocialAddon: 5.99, socialBundleAddon: 19.99 }
    });
    assert(cmsUpdate.status === 200 && cmsUpdate.data.config.labels.postTitle === 'U-THEPOST STUDIO', 'POST /api/cms/config persists overrides');

    // Test live WebSocket sync
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      let received = false;
      ws.on('open', async () => {
        await httpPost('/api/cms/config', { labels: { jobsTitle: 'U-THEJOBS VERIFIED' } });
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
  // TEST GROUP 5: User Approvals, Role Permissions & Stage Overrides
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] User Approvals, Role Permissions & Stage Overrides');
  try {
    const userRoleUpdate = await httpPut('/api/admin/users/USR-003', { role: 'candidate', approved: true });
    assert(userRoleUpdate.status === 200 && userRoleUpdate.data.user.approved === true, 'User approval status updated via PUT /api/admin/users/:id');

    const jobStatusUpdate = await httpPut('/api/jobs/JOB-101/status', { status: 'Active' });
    assert(jobStatusUpdate.status === 200 && jobStatusUpdate.data.job.status === 'Active', 'Job status updated via PUT /api/jobs/:id/status');

    const applicantStageUpdate = await httpPut('/api/applicants/APP-701/status', { status: 'Interviewing' });
    assert(applicantStageUpdate.status === 200 && applicantStageUpdate.data.applicant.status === 'Interviewing', 'Applicant stage updated via PUT /api/applicants/:id/status');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: Top-Bar Tooltip Boundary Fix & Custom Popups
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] Top-Bar Tooltip Boundary Fix & Custom Popups');
  try {
    assert(adminContent.includes('header [data-tooltip]::after') && adminContent.includes('top: calc(100% + 8px)'), 'Top header tooltips positioned downward below elements');
    assert(adminContent.includes('overflow: visible !important'), 'Header container overflow set to visible to prevent clipping');
    assert(adminContent.includes('initSmartTooltipPositioning') && adminContent.includes('rect.top < 60'), 'Viewport edge auto-detection (top < 60px) implemented');
    assert(adminContent.includes('showCustomModalAlert') && adminContent.includes('custom-modal-alert'), 'Signature custom popup card implemented (no browser alerts)');
  } catch (err) {
    assert(false, `Group 6 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL PHASE 3 MASTER ADMIN & ZERO-CODE CMS TESTS PASSED! 100% VERIFIED.\n');
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
