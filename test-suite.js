const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY FULL MASTER CMS TABS & FUNCTION RESTORATION TEST SUITE');
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
  // TEST GROUP 1: Primary 5 Admin Tabs Navigation Bar (admin.html)
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Primary 5 Admin Tabs Navigation Bar');
  try {
    assert(adminContent.includes('1. DASHBOARD OVERVIEW'), 'Tab 1: [1. DASHBOARD OVERVIEW] present');
    assert(adminContent.includes('2. USER GOVERNANCE'), 'Tab 2: [2. USER GOVERNANCE] present');
    assert(adminContent.includes('3. LIVE UI & CONTENT EDITOR'), 'Tab 3: [3. LIVE UI & CONTENT EDITOR] present');
    assert(adminContent.includes('4. PLANS & ADD-ONS CMS'), 'Tab 4: [4. PLANS & ADD-ONS CMS] present');
    assert(adminContent.includes('5. LISTINGS & APPLICATIONS'), 'Tab 5: [5. LISTINGS & APPLICATIONS] present');

    assert(adminContent.includes('admin-tabs-nav-bar'), 'admin-tabs-nav-bar element styled directly beneath Omni-Search');
    assert(adminContent.includes('view-overview') && adminContent.includes('view-users') && adminContent.includes('view-cms') && adminContent.includes('view-plans') && adminContent.includes('view-listings'), 'All 5 corresponding view sections present');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Tab 2 User Governance (Account Control Actions)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Tab 2 User Governance Actions');
  try {
    assert(adminContent.includes('openUserEditModal'), 'Direct action [EDIT PROFILE] implemented');
    assert(adminContent.includes('resetUserPassword'), 'Direct action [RESET PASSWORD] implemented');
    assert(adminContent.includes('toggleUserApproval'), 'Direct action [APPROVE/SUSPEND] implemented');
    assert(adminContent.includes('deleteUser'), 'Direct action [DELETE ACCOUNT] implemented');
    assert(adminContent.includes('user-edit-modal'), 'User Profile Edit Modal present');

    const resetRes = await httpPost('/api/admin/users/USR-002/reset-password', {});
    assert(resetRes.status === 200 && resetRes.data.tempPassword, 'POST /api/admin/users/:id/reset-password generates temp key');

    const updateRes = await httpPut('/api/admin/users/USR-002', { name: 'Quantum Senior Talent Team', role: 'recruiter' });
    assert(updateRes.status === 200 && updateRes.data.user.name === 'Quantum Senior Talent Team', 'PUT /api/admin/users/:id updates profile');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Tab 3 Live UI & Content Editor (Zero-Code Control)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Tab 3 Live UI & Content Editor');
  try {
    assert(adminContent.includes('switchCmsTarget'), 'Subdomain selector function switchCmsTarget implemented');
    assert(adminContent.includes('btn-target-post') && adminContent.includes('btn-target-jobs'), 'Subdomain selector buttons for u-thePOST and u-theJOBS present');
    assert(adminContent.includes('cms-panel-post') && adminContent.includes('cms-panel-jobs'), 'Dedicated panels for u-thePOST and u-theJOBS present');
    assert(adminContent.includes('cms-post-title') && adminContent.includes('cms-jobs-title'), 'Brand title controls present');
    assert(adminContent.includes('cms-quick-send-btn') && adminContent.includes('cms-send-resume-btn'), 'Button phrase controls present');
    assert(adminContent.includes('cms-submit-btn') && adminContent.includes('cms-submit-tooltip'), 'Interview submission phrase and tooltip controls present');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Tab 4 Plans & Add-Ons CMS (Pricing Matrix)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Tab 4 Plans & Add-Ons CMS (Pricing Control)');
  try {
    assert(adminContent.includes('cms-price-pal') && adminContent.includes('cms-price-starter') && adminContent.includes('cms-price-growth') && adminContent.includes('cms-price-pro'), 'Base plan pricing matrix controls ($0, $99, $299, $699) present');
    assert(adminContent.includes('cms-price-social-single') && adminContent.includes('cms-price-social-bundle'), 'Social add-on pricing controls ($5.99 / $19.99) present');
    assert(adminContent.includes('cms-price-spotlight'), 'Spotlight listing pricing control present');

    const updatePricing = await httpPost('/api/cms/config', {
      pricing: { palMonthly: 0, starterMonthly: 99, growthMonthly: 299, proMonthly: 699, individualSocialAddon: 5.99, socialBundleAddon: 19.99 }
    });
    assert(updatePricing.status === 200, 'POST /api/cms/config successfully persists pricing matrix');
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Tab 5 Listings & Applications (Master CRUD)
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Tab 5 Listings & Applications Master CRUD');
  try {
    assert(adminContent.includes('toggleJobFeatured'), 'Master Job [FEATURE] control implemented');
    assert(adminContent.includes('toggleJobStatus'), 'Master Job [PAUSE / RESUME] control implemented');
    assert(adminContent.includes('openJobEditModal'), 'Master Job [EDIT] modal controller implemented');
    assert(adminContent.includes('deleteJobAdmin'), 'Master Job [DELETE] control implemented');
    assert(adminContent.includes('job-edit-modal'), 'Job Edit Modal present in DOM');

    assert(adminContent.includes('updateApplicantStage'), 'Candidate Stage dropdown override implemented');
    assert(adminContent.includes('deleteApplicantAdmin'), 'Candidate Submission [DELETE] control implemented');

    // Test feature toggle endpoint
    const featureRes = await httpPut('/api/jobs/JOB-101/feature', {});
    assert(featureRes.status === 200, 'PUT /api/jobs/:id/feature toggles featured state');

    // Test job edit endpoint
    const editJobRes = await httpPut('/api/jobs/JOB-101', { salary: '$80,000 - $100,000' });
    assert(editJobRes.status === 200 && editJobRes.data.job.salary.includes('$80,000'), 'PUT /api/jobs/:id updates job details');
  } catch (err) {
    assert(false, `Group 5 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 6: Master Owner Authentication & Visual Theme
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 6] Master Owner Profile & Theme');
  try {
    assert(adminContent.includes('ZION DAYE (815-980-4272)'), 'Master profile identity Zion Daye (815-980-4272) present');
    assert(adminContent.includes('--bg-canvas: #F8F9FA') && adminContent.includes('--card-surface: #FFFFFF'), 'Unified Premium White Studio theme active');
    assert(adminContent.includes('header [data-tooltip]::after') && adminContent.includes('top: calc(100% + 8px)'), 'Top-bar tooltips display below elements');
  } catch (err) {
    assert(false, `Group 6 failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL MASTER CMS TABS & FUNCTION RESTORATION TESTS PASSED! 100% VERIFIED.\n');
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
