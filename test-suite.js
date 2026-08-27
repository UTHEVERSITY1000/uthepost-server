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
    const cmsUpdate = await httpPost('/api/cms/config', {
      postStudio: { card1Title: 'CUSTOM CARD 1 HEADER' },
      jobsBoard: { submitTooltip: 'DOUBLE CHECK CONTACT INFO ON RESUME' },
      pricing: { palMonthly: 0, starterMonthly: 99, individualSocialAddon: 5.99, socialBundleAddon: 19.99 }
    });
    assert(cmsUpdate.status === 200, 'POST /api/cms/config successfully saved field-by-field updates');
    assert(cmsUpdate.data.config.postStudio.card1Title === 'CUSTOM CARD 1 HEADER', 'postStudio schema persisted');
    assert(cmsUpdate.data.config.jobsBoard.submitTooltip === 'DOUBLE CHECK CONTACT INFO ON RESUME', 'jobsBoard schema persisted');

    // Test live WebSocket sync
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      let received = false;
      ws.on('open', async () => {
        await httpPost('/api/cms/config', { jobsBoard: { boardTitle: 'U-THEJOBS LIVE' } });
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

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL COMPACT UI SCALE & FIELD-FOR-FIELD CMS TESTS PASSED! 100% VERIFIED.\n');
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
