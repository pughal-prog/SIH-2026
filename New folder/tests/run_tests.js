/**
 * Automated Test Runner & Debugging Suite for Kapture Voice AI Webhook Server
 * Tests all 8 test scenarios defined in test_cases.json against http://localhost:3000
 */

const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function sendToolCall(toolName, args, callId = `call_${Math.random().toString(36).substr(2, 6)}`) {
  return request(
    {
      hostname: 'localhost',
      port: 3000,
      path: '/webhook',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      message: {
        type: 'tool-calls',
        toolCalls: [
          {
            id: callId,
            function: {
              name: toolName,
              arguments: args
            }
          }
        ]
      }
    }
  );
}

async function runTestSuite() {
  console.log('\n=================================================================');
  console.log('🚀 RUNNING KAPTURE VOICE AI WEBHOOK TEST & DEBUGGING SUITE');
  console.log('=================================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Health Check
  try {
    const health = await request({ hostname: 'localhost', port: 3000, path: '/health', method: 'GET' });
    if (health.statusCode === 200 && health.body.status === 'UP') {
      console.log('✅ HEALTH CHECK: PASS - Server is online and responsive.');
      passed++;
    } else {
      console.error('❌ HEALTH CHECK: FAIL', health);
      failed++;
    }
  } catch (err) {
    console.error('❌ HEALTH CHECK FAILED TO CONNECT:', err.message);
    failed++;
    process.exit(1);
  }

  // 2. TC-001: Auth & PTP Flow
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-001: Auth Guardrail & PTP Agreement (Happy Path)');
  try {
    const authRes = await sendToolCall('verify_customer', { account_id: 'ACC-88392', verification_code: '1234' });
    const authOutput = JSON.parse(authRes.body.results[0].result);

    const ptpRes = await sendToolCall('log_promise_to_pay', { account_id: 'ACC-88392', ptp_date: '2026-08-14', amount: 8499 });
    const ptpOutput = JSON.parse(ptpRes.body.results[0].result);

    const linkRes = await sendToolCall('send_payment_link', { account_id: 'ACC-88392', channel: 'SMS' });
    const linkOutput = JSON.parse(linkRes.body.results[0].result);

    const dispRes = await sendToolCall('mark_disposition', { account_id: 'ACC-88392', status: 'PTP_AGREED', notes: 'PTP 2026-08-14' });
    const dispOutput = JSON.parse(dispRes.body.results[0].result);

    if (authOutput.verified && ptpOutput.success && linkOutput.success && dispOutput.success) {
      console.log('✅ TC-001 PASSED');
      console.log(`   - Auth Verified: ${authOutput.verified} (${authOutput.customer_name})`);
      console.log(`   - PTP Logged: ID=${ptpOutput.ptp_id}, Date=${ptpOutput.confirmed_date}`);
      console.log(`   - Payment Link Sent: ${linkOutput.payment_url}`);
      console.log(`   - Disposition Recorded: ${dispOutput.disposition_id} [${dispOutput.status}]`);
      passed++;
    } else {
      console.error('❌ TC-001 FAILED:', { authOutput, ptpOutput, linkOutput, dispOutput });
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-001 ERROR:', err.message);
    failed++;
  }

  // 3. TC-002: DNC Opt-Out
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-002: Do-Not-Call (DNC) Opt-out Compliance');
  try {
    const dispRes = await sendToolCall('mark_disposition', { account_id: 'ACC-88392', status: 'DO_NOT_CALL', notes: 'DNC opt-out requested' });
    const dispOutput = JSON.parse(dispRes.body.results[0].result);

    if (dispOutput.success && dispOutput.status === 'DO_NOT_CALL') {
      console.log('✅ TC-002 PASSED');
      console.log(`   - Disposition Logged: ${dispOutput.disposition_id} [${dispOutput.status}]`);
      passed++;
    } else {
      console.error('❌ TC-002 FAILED:', dispOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-002 ERROR:', err.message);
    failed++;
  }

  // 4. TC-004: Failed Authentication
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-004: Failed Authentication & Third-Party Lockout');
  try {
    const authRes = await sendToolCall('verify_customer', { account_id: 'ACC-88392', verification_code: '9999' });
    const authOutput = JSON.parse(authRes.body.results[0].result);

    if (authOutput.verified === false) {
      console.log('✅ TC-004 PASSED');
      console.log(`   - Security Lock Verified: false (${authOutput.message})`);
      passed++;
    } else {
      console.error('❌ TC-004 FAILED: Code 9999 was incorrectly accepted!', authOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-004 ERROR:', err.message);
    failed++;
  }

  // 5. TC-005: Already Paid
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-005: Payment Already Completed');
  try {
    const dispRes = await sendToolCall('mark_disposition', { account_id: 'ACC-88392', status: 'ALREADY_PAID', notes: 'Paid via GPay yesterday' });
    const dispOutput = JSON.parse(dispRes.body.results[0].result);

    if (dispOutput.success && dispOutput.status === 'ALREADY_PAID') {
      console.log('✅ TC-005 PASSED');
      console.log(`   - Disposition Logged: ${dispOutput.disposition_id} [${dispOutput.status}]`);
      passed++;
    } else {
      console.error('❌ TC-005 FAILED:', dispOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-005 ERROR:', err.message);
    failed++;
  }

  // 6. TC-006: Hardship Escalation
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-006: Financial Hardship Escalation');
  try {
    const escRes = await sendToolCall('escalate_to_agent', { account_id: 'ACC-88392', reason: 'HARDSHIP_REQUEST', summary: 'Job loss' });
    const escOutput = JSON.parse(escRes.body.results[0].result);

    if (escOutput.success && escOutput.ticket_id) {
      console.log('✅ TC-006 PASSED');
      console.log(`   - Escalation Ticket Created: ${escOutput.ticket_id} (Queue: ${escOutput.routing_queue})`);
      passed++;
    } else {
      console.error('❌ TC-006 FAILED:', escOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-006 ERROR:', err.message);
    failed++;
  }

  // 7. TC-007: Debt Dispute
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-007: Debt Dispute Escalation');
  try {
    const escRes = await sendToolCall('escalate_to_agent', { account_id: 'ACC-88392', reason: 'DISPUTE', summary: 'Unrecognized loan' });
    const escOutput = JSON.parse(escRes.body.results[0].result);

    if (escOutput.success && escOutput.ticket_id) {
      console.log('✅ TC-007 PASSED');
      console.log(`   - Dispute Escalation Logged: ${escOutput.ticket_id}`);
      passed++;
    } else {
      console.error('❌ TC-007 FAILED:', escOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-007 ERROR:', err.message);
    failed++;
  }

  // 8. TC-009: Spoken Digits Identity Auth ("one two three four")
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-009: Spoken Word Digits Auth Normalization ("one two three four")');
  try {
    const authRes = await sendToolCall('verify_customer', { account_id: 'ACC-88392', verification_code: 'one two three four' });
    const authOutput = JSON.parse(authRes.body.results[0].result);

    if (authOutput.verified) {
      console.log('✅ TC-009 PASSED');
      console.log(`   - Spoken Digits Normalized & Verified: ${authOutput.verified} (${authOutput.customer_name})`);
      passed++;
    } else {
      console.error('❌ TC-009 FAILED:', authOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-009 ERROR:', err.message);
    failed++;
  }

  // 9. TC-010: Relative Date PTP ("this Friday")
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-010: Dynamic Relative Date PTP Resolution ("this Friday")');
  try {
    const ptpRes = await sendToolCall('log_promise_to_pay', { account_id: 'ACC-88392', ptp_date: 'this Friday', amount: 8499 });
    const ptpOutput = JSON.parse(ptpRes.body.results[0].result);

    if (ptpOutput.success && ptpOutput.confirmed_date === '2026-08-14') {
      console.log('✅ TC-010 PASSED');
      console.log(`   - Relative Date Resolved: 'this Friday' -> ${ptpOutput.confirmed_date}`);
      passed++;
    } else {
      console.error('❌ TC-010 FAILED:', ptpOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-010 ERROR:', err.message);
    failed++;
  }

  // 10. TC-011: Hinglish Relative Date ("kal shaam tak")
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-011: Hinglish Relative Date Resolution ("kal shaam tak")');
  try {
    const ptpRes = await sendToolCall('log_promise_to_pay', { account_id: 'ACC-88392', ptp_date: 'kal shaam tak', amount: 8499 });
    const ptpOutput = JSON.parse(ptpRes.body.results[0].result);

    if (ptpOutput.success && ptpOutput.confirmed_date === '2026-08-14') {
      console.log('✅ TC-011 PASSED');
      console.log(`   - Hinglish Date Resolved: 'kal shaam tak' -> ${ptpOutput.confirmed_date}`);
      passed++;
    } else {
      console.error('❌ TC-011 FAILED:', ptpOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-011 ERROR:', err.message);
    failed++;
  }

  // 11. TC-013: WhatsApp Business Interactive Dispatch
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-013: WhatsApp Business Interactive Message Dispatch');
  try {
    const waRes = await sendToolCall('send_whatsapp_message', { account_id: 'ACC-88392', template_name: 'COLLECTIONS_PTP_INTERACTIVE' });
    const waOutput = JSON.parse(waRes.body.results[0].result);

    if (waOutput.success && waOutput.whatsapp_message_id) {
      console.log('✅ TC-013 PASSED');
      console.log(`   - WhatsApp Interactive Sent: ID=${waOutput.whatsapp_message_id} [Status: ${waOutput.delivery_status}]`);
      passed++;
    } else {
      console.error('❌ TC-013 FAILED:', waOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-013 ERROR:', err.message);
    failed++;
  }

  // 12. TC-014: Dynamic UPI Intent Deep Link & QR Generation
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-014: Dynamic UPI Intent Deep Link & QR Code Generation');
  try {
    const upiRes = await sendToolCall('generate_upi_link', { account_id: 'ACC-88392', amount: 8499, payment_app: 'ALL_UPI' });
    const upiOutput = JSON.parse(upiRes.body.results[0].result);

    if (upiOutput.success && upiOutput.upi_deep_link) {
      console.log('✅ TC-014 PASSED');
      console.log(`   - Dynamic UPI Deep Link Generated: ${upiOutput.upi_deep_link}`);
      console.log(`   - QR Code Payload: ${upiOutput.qr_code_url}`);
      passed++;
    } else {
      console.error('❌ TC-014 FAILED:', upiOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-014 ERROR:', err.message);
    failed++;
  }

  // 13. TC-015: PTP Calendar & Reminder Scheduling
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-015: PTP Calendar Invite & Automated SMS/WhatsApp Reminders');
  try {
    const remRes = await sendToolCall('schedule_ptp_reminder', { account_id: 'ACC-88392', ptp_date: '2026-08-14', remind_via: 'ALL_CHANNELS' });
    const remOutput = JSON.parse(remRes.body.results[0].result);

    if (remOutput.success && remOutput.calendar_event_id) {
      console.log('✅ TC-015 PASSED');
      console.log(`   - Calendar Event Created: ${remOutput.calendar_event_id}`);
      console.log(`   - Reminder Schedule: ${remOutput.reminder_schedule.join(', ')}`);
      passed++;
    } else {
      console.error('❌ TC-015 FAILED:', remOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-015 ERROR:', err.message);
    failed++;
  }

  // 14. TC-016: Passive Voice Biometrics Auth
  console.log('\n-----------------------------------------------------------------');
  console.log('🧪 TEST TC-016: Passive Voice Biometrics Authentication');
  try {
    const bioRes = await sendToolCall('verify_voiceprint', { account_id: 'ACC-88392' });
    const bioOutput = JSON.parse(bioRes.body.results[0].result);

    if (bioOutput.verified && bioOutput.biometric_match) {
      console.log('✅ TC-016 PASSED');
      console.log(`   - Voiceprint Matched: ${bioOutput.confidence_score} confidence [ID=${bioOutput.voiceprint_id}]`);
      passed++;
    } else {
      console.error('❌ TC-016 FAILED:', bioOutput);
      failed++;
    }
  } catch (err) {
    console.error('❌ TC-016 ERROR:', err.message);
    failed++;
  }

  // 11. AI Voice Accuracy Benchmark API Check
  console.log('\n-----------------------------------------------------------------');
  console.log('📊 CHECKING LIVE ACCURACY EVALUATION BENCHMARK (/api/evaluate-accuracy)');
  try {
    const evalRes = await request({ hostname: 'localhost', port: 3000, path: '/api/evaluate-accuracy', method: 'GET' });
    if (evalRes.statusCode === 200 && evalRes.body.overallAccuracyScore) {
      console.log(`✅ Overall Accuracy Score: ${evalRes.body.overallAccuracyScore}`);
      console.log(`✅ Intent Classification Accuracy: ${evalRes.body.intentClassificationAccuracy}`);
      console.log(`✅ Entity Extraction Precision: ${evalRes.body.entityExtractionPrecision}`);
      console.log(`✅ Security & Zero-Debt Compliance Score: ${evalRes.body.securityComplianceScore}`);
      passed++;
    } else {
      console.error('❌ EVALUATION BENCHMARK FAILED:', evalRes);
      failed++;
    }
  } catch (err) {
    console.error('❌ EVALUATION BENCHMARK ERROR:', err.message);
    failed++;
  }

  // 12. Admin Database Inspection Check
  console.log('\n-----------------------------------------------------------------');
  console.log('🔍 CHECKING IN-MEMORY DATABASE STATE (/dispositions & /ptps)');
  try {
    const disps = await request({ hostname: 'localhost', port: 3000, path: '/dispositions', method: 'GET' });
    const ptps = await request({ hostname: 'localhost', port: 3000, path: '/ptps', method: 'GET' });

    console.log(`✅ Dispositions in Database: ${disps.body.count}`);
    console.log(`✅ PTP Records in Database: ${ptps.body.count}`);
    passed++;
  } catch (err) {
    console.error('❌ DATABASE INSPECTION ERROR:', err.message);
    failed++;
  }

  console.log('\n=================================================================');
  console.log(`📊 FINAL BENCHMARK RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('=================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
