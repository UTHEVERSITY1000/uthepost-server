const http = require('http');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('STRICT SUBDOMAIN ISOLATION & MULTI-ROLE VERIFICATION TEST SUITE');
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

  function httpDelete(path) {
    return new Promise((resolve, reject) => {
      const req = http.request(`${BASE_URL}${path}`, { method: 'DELETE' }, (res) => {
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
      req.end();
    });
  }

  // TEST GROUP 1: Core Engine & Healthcheck
  console.log('[TEST GROUP 1] Core Engine & Healthcheck Endpoint');
  try {
    const health = await httpGet('/api/health');
    assert(health.status === 200, 'Healthcheck endpoint returned HTTP 200 OK');
    assert(health.data.status === 'healthy', 'Engine status reported as healthy');
    assert(health.data.version === '2.0.0-ENTERPRISE', 'Engine version matches 2.0.0-ENTERPRISE');
  } catch (err) {
    assert(false, `Healthcheck failed: ${err.message}`);
  }

  // TEST GROUP 2: Strict Subdomain Isolation
  console.log('\n[TEST GROUP 2] Strict Subdomain Isolation & Role Separation');
  try {
    // 2a. post.utheversity.com -> Serves ONLY recruiter.html
    const postRes = await httpGet('/', { 'Host': 'post.utheversity.com' });
    assert(postRes.status === 200, 'post.utheversity.com returned HTTP 200');
    assert(postRes.raw.includes('U-THEPOST') && postRes.raw.includes('RECRUITER WORKSPACE'), 'post.utheversity.com correctly served standalone recruiter.html');
    assert(!postRes.raw.includes('50 / 50 Split View') && !postRes.raw.includes('pane-iframe'), 'post.utheversity.com has ZERO staging hub controls or iframes (Strict Isolation)');

    // 2b. jobs.utheversity.com -> Serves ONLY candidate.html
    const jobsRes = await httpGet('/', { 'Host': 'jobs.utheversity.com' });
    assert(jobsRes.status === 200, 'jobs.utheversity.com returned HTTP 200');
    assert(jobsRes.raw.includes('U-THEJOBS') && jobsRes.raw.includes('CANDIDATE BOARD'), 'jobs.utheversity.com correctly served standalone candidate.html');
    assert(!jobsRes.raw.includes('50 / 50 Split View') && !jobsRes.raw.includes('pane-iframe'), 'jobs.utheversity.com has ZERO staging hub controls or iframes (Strict Isolation)');

    // 2c. admin.utheversity.com -> Serves ONLY admin.html
    const adminRes = await httpGet('/', { 'Host': 'admin.utheversity.com' });
    assert(adminRes.status === 200, 'admin.utheversity.com returned HTTP 200');
    assert(adminRes.raw.includes('U-THEADMIN') && adminRes.raw.includes('MASTER SUITE'), 'admin.utheversity.com correctly served standalone admin.html');
    assert(!adminRes.raw.includes('50 / 50 Split View') && !adminRes.raw.includes('pane-iframe'), 'admin.utheversity.com has ZERO staging hub controls or iframes (Strict Isolation)');

    // 2d. Fallback / Direct IP -> Serves preview-hub.html
    const fallbackRes = await httpGet('/', { 'Host': '127.0.0.1:3000' });
    assert(fallbackRes.status === 200, 'Fallback/Direct IP returned HTTP 200');
    assert(fallbackRes.raw.includes('STAGING HUB') && fallbackRes.raw.includes('50 / 50 Split View'), 'Fallback/Direct IP correctly served preview-hub.html staging canvas');

    // 2e. Clean alias routes (/recruiter, /candidate, /admin, /preview)
    const aliasRec = await httpGet('/recruiter');
    assert(aliasRec.status === 200 && aliasRec.raw.includes('RECRUITER WORKSPACE'), 'Clean alias /recruiter served recruiter.html');
    const aliasCand = await httpGet('/candidate');
    assert(aliasCand.status === 200 && aliasCand.raw.includes('CANDIDATE BOARD'), 'Clean alias /candidate served candidate.html');
    const aliasAdmin = await httpGet('/admin');
    assert(aliasAdmin.status === 200 && aliasAdmin.raw.includes('MASTER SUITE'), 'Clean alias /admin served admin.html');
    const aliasPrev = await httpGet('/preview');
    assert(aliasPrev.status === 200 && aliasPrev.raw.includes('STAGING HUB'), 'Clean alias /preview served preview-hub.html');
  } catch (err) {
    assert(false, `Subdomain isolation test failed: ${err.message}`);
  }

  // TEST GROUP 3: Admin Telemetry & Metrics API
  console.log('\n[TEST GROUP 3] Admin Governance & Telemetry API');
  try {
    const adminStats = await httpGet('/api/admin/stats');
    assert(adminStats.status === 200, 'Admin stats endpoint returned HTTP 200');
    assert(adminStats.data.status === 'success', 'Admin node reports status success');
    assert(adminStats.data.roles && adminStats.data.roles.recruiter.target === 'recruiter.html', 'Recruiter target mapped to recruiter.html');
    assert(adminStats.data.roles && adminStats.data.roles.candidate.target === 'candidate.html', 'Candidate target mapped to candidate.html');
    assert(adminStats.data.roles && adminStats.data.roles.admin.target === 'admin.html', 'Admin target mapped to admin.html');
  } catch (err) {
    assert(false, `Admin telemetry test failed: ${err.message}`);
  }

  // TEST GROUP 4: Hunter.io API v2 Integration
  console.log('\n[TEST GROUP 4] Hunter.io API v2 Integration');
  try {
    const hunter = await httpGet('/api/hunter/domain-search?domain=stripe.com&department=hr,management&seniority=executive,senior');
    assert(hunter.status === 200, 'Hunter.io domain-search endpoint returned HTTP 200');
    assert(hunter.data.data && Array.isArray(hunter.data.data.emails), 'Hunter.io returned emails array payload');
    assert(hunter.data.data.emails.length >= 3, `Discovered ${hunter.data.data.emails.length} verified hiring managers`);

    const verify = await httpGet('/api/hunter/email-verifier?email=sarah.jenkins@stripe.com');
    assert(verify.status === 200 && verify.data.data.result === 'deliverable', 'Email verifier validated deliverability status');
  } catch (err) {
    assert(false, `Hunter.io test failed: ${err.message}`);
  }

  // TEST GROUP 5: Open-Source Job Feed Aggregator
  console.log('\n[TEST GROUP 5] Open-Source Aggregation & Schema Normalizer');
  try {
    const agg = await httpGet('/api/jobs/aggregate');
    assert(agg.status === 200, 'Aggregator endpoint returned HTTP 200');
    assert(agg.data.feeds && agg.data.feeds.length >= 3, `Ingested ${agg.data.feeds.length} external feeds`);
  } catch (err) {
    assert(false, `Aggregator test failed: ${err.message}`);
  }

  // TEST GROUP 6: Job Publishing & Lifecycle CRUD
  console.log('\n[TEST GROUP 6] Job Serialization & Lifecycle CRUD');
  let createdJobId = null;
  try {
    const newJobPayload = {
      jobTitle: 'Subdomain Isolation Engineer',
      company: 'Antigravity Infrastructure',
      location: 'SAN FRANCISCO, CA',
      employmentType: 'Full-Time',
      payStructure: 'Salary Range',
      minCompensation: '150000',
      maxCompensation: '195000',
      paidVacation: 'Unlimited PTO',
      healthCoverage: 'Platinum Tier',
      retirement: '401(k) Match',
      additionalPerks: 'Autonomous Agent Allowance',
      applyLinkUrl: 'https://careers.antigravity.dev/apply/iso',
      summary: 'Enforce strict role-based subdomain routing and standalone application isolation.'
    };

    const postRes = await httpPost('/api/jobs', newJobPayload);
    assert(postRes.status === 201, 'Job created successfully with HTTP 201');
    createdJobId = postRes.data.job.id;

    const delRes = await httpDelete(`/api/jobs/${createdJobId}`);
    assert(delRes.status === 200, `Job ${createdJobId} deleted successfully`);
  } catch (err) {
    assert(false, `Job lifecycle test failed: ${err.message}`);
  }

  // TEST GROUP 7: Candidate Applicant Ingestion
  console.log('\n[TEST GROUP 7] Candidate Ingestion & ATS Pipeline');
  try {
    const candPayload = {
      jobId: 'JOB-101',
      jobTitle: 'Senior Full-Stack Engineer',
      name: 'Isolation Candidate',
      email: 'cand@iso.dev',
      phone: '+1 (555) 777-1111',
      skills: ['TypeScript', 'WebSockets', 'Subdomain Routing'],
      resumeSummary: 'Expert in host-header routing and cross-tab event synchronization.'
    };

    const candRes = await httpPost('/api/applicants', candPayload);
    assert(candRes.status === 201, 'Candidate application accepted with HTTP 201');
  } catch (err) {
    assert(false, `Applicant ingestion test failed: ${err.message}`);
  }

  // TEST GROUP 8: WebSocket Synchronization Mesh Round-Trip
  console.log('\n[TEST GROUP 8] WebSocket Synchronization Mesh Latency');
  try {
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(WS_URL);
      const start = Date.now();

      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'PING_BENCHMARK', timestamp: start }));
      });

      ws.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'INITIAL_STATE') {
          const latency = Date.now() - start;
          assert(latency < 100, `WebSocket sync handshake completed in ${latency}ms (< 100ms requirement)`);
          ws.close();
          resolve();
        }
      });

      ws.on('error', reject);
    });
  } catch (err) {
    assert(false, `WebSocket sync test failed: ${err.message}`);
  }

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL STRICT SUBDOMAIN ISOLATION TESTS PASSED! 100% VERIFIED.\n');
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
