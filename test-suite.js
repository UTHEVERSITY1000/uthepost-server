const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const BASE_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('UTHEVERSITY CANDIDATE NOTIFICATIONS & MESSAGING TEST SUITE');
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

  const candContent = fs.readFileSync(path.join(__dirname, 'candidate.html'), 'utf8');
  const recContent = fs.readFileSync(path.join(__dirname, 'recruiter.html'), 'utf8');

  // ----------------------------------------------------
  // TEST GROUP 1: Candidate Notification Alert Badge (candidate.html)
  // ----------------------------------------------------
  console.log('[TEST GROUP 1] Candidate Notification Alert Badge (candidate.html)');
  try {
    assert(candContent.includes('btn-candidate-notif') && candContent.includes('notif-counter-badge'), 'Notification alert bell icon and counter badge present in header');
    assert(candContent.includes('notif-badge-count'), 'Live unread counter badge id "notif-badge-count" present');
    assert(candContent.includes('openCandidateMessageDrawer()'), 'Clicking notification alert triggers openCandidateMessageDrawer()');

    const headerHtml = candContent.slice(candContent.indexOf('<header>'), candContent.indexOf('</header>'));
    const notifIdx = headerHtml.indexOf('btn-candidate-notif');
    const profileIdx = headerHtml.indexOf('btn-profile-header');
    assert(notifIdx !== -1 && profileIdx !== -1 && notifIdx < profileIdx, 'Notification alert is positioned directly to the left of [MY PROFILE]');
  } catch (err) {
    assert(false, `Group 1 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 2: Candidate Message Center & Quick Responses
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 2] Candidate Message Center & Quick Responses');
  try {
    assert(candContent.includes('candidate-messages-modal'), 'Candidate Message Drawer modal container present');
    assert(candContent.includes('candidate-chat-log'), 'Candidate chat history thread element present');
    assert(candContent.includes('cand-reply-input') && candContent.includes('SEND REPLY'), 'Reply text input and [SEND REPLY] button present');

    assert(candContent.includes("I'M INTERESTED — LET'S TALK"), 'Quick response tag 1: [I\'M INTERESTED — LET\'S TALK] present');
    assert(candContent.includes('ACCEPTED INTERVIEW TIME'), 'Quick response tag 2: [ACCEPTED INTERVIEW TIME] present');
    assert(candContent.includes('PLEASE SEND MORE DETAILS'), 'Quick response tag 3: [PLEASE SEND MORE DETAILS] present');
    assert(candContent.includes('applyCandidateQuickReply'), 'Quick response tag applicator function implemented');
  } catch (err) {
    assert(false, `Group 2 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 3: Server.js Two-Way Messaging REST API
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 3] Server.js Two-Way Messaging API');
  try {
    const getRes = await httpGet('/api/messages');
    assert(getRes.status === 200, 'GET /api/messages returns HTTP 200');
    assert(Array.isArray(getRes.data.messages), 'Messages endpoint returns array of message items');

    const postCandidateMsg = await httpPost('/api/messages', {
      applicantId: 'APP-701',
      senderRole: 'candidate',
      senderName: 'Marcus Vance',
      company: 'Quantum Retail Corp',
      jobTitle: 'Sales Manager',
      text: 'I am very interested in the position and available for an interview this Thursday.'
    });
    assert(postCandidateMsg.status === 201, 'POST /api/messages from candidate returns HTTP 201 Created');
    assert(postCandidateMsg.data.message.senderRole === 'candidate', 'Candidate message recorded with senderRole=candidate');

    const postRecruiterMsg = await httpPost('/api/messages', {
      applicantId: 'APP-701',
      senderRole: 'recruiter',
      senderName: 'Quantum Talent Acquisition',
      company: 'Quantum Retail Corp',
      jobTitle: 'Sales Manager',
      text: 'Great, Thursday at 2:00 PM CST works perfectly for our hiring team.'
    });
    assert(postRecruiterMsg.status === 201, 'POST /api/messages from recruiter returns HTTP 201 Created');
    assert(postRecruiterMsg.data.message.senderRole === 'recruiter', 'Recruiter message recorded with senderRole=recruiter');
  } catch (err) {
    assert(false, `Group 3 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 4: Real-Time Two-Way WebSocket Relay
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 4] Real-Time Two-Way Message WebSocket Broadcast');
  try {
    await new Promise((resolve, reject) => {
      const wsClient = new WebSocket(WS_URL);
      let candMsgReceived = false;

      wsClient.on('open', async () => {
        const testCandidateReply = {
          applicantId: 'APP-701',
          senderRole: 'candidate',
          senderName: 'Marcus Vance',
          company: 'Quantum Retail Corp',
          jobTitle: 'Sales Manager',
          text: 'WebSocket Live sync message test from candidate.'
        };
        await httpPost('/api/messages', testCandidateReply);
      });

      wsClient.on('message', (msg) => {
        const data = JSON.parse(msg.toString());
        if (data.type === 'CANDIDATE_MESSAGE_SENT' && data.message && data.message.text.includes('WebSocket Live sync')) {
          candMsgReceived = true;
          assert(true, 'CANDIDATE_MESSAGE_SENT broadcast verified in real-time over WebSocket');
          wsClient.close();
          resolve();
        }
      });

      wsClient.on('error', reject);

      setTimeout(() => {
        if (!candMsgReceived) {
          assert(false, 'Timed out waiting for CANDIDATE_MESSAGE_SENT event');
          wsClient.close();
          resolve();
        }
      }, 3000);
    });
  } catch (err) {
    assert(false, `Group 4 failed: ${err.message}`);
  }

  // ----------------------------------------------------
  // TEST GROUP 5: Recruiter Studio Message Sync
  // ----------------------------------------------------
  console.log('\n[TEST GROUP 5] Recruiter Studio Message Sync (recruiter.html)');
  try {
    assert(recContent.includes('MESSAGE APPLICANT'), 'Recruiter ATS contains MESSAGE APPLICANT section');
    assert(recContent.includes('applicant-chat-log'), 'Recruiter ATS contains applicant-chat-log');
    assert(recContent.includes('CANDIDATE_MESSAGE_SENT'), 'Recruiter ATS handles CANDIDATE_MESSAGE_SENT event to update chat');
    assert(recContent.includes('sendAtsDirectMessage'), 'Recruiter ATS dispatches direct messages via sendAtsDirectMessage');
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

  console.log('\n================================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED / ${failed} FAILED`);
  console.log('================================================================');

  if (failed === 0) {
    console.log('ALL CANDIDATE NOTIFICATIONS & MESSAGING TESTS PASSED! 100% VERIFIED.\n');
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
