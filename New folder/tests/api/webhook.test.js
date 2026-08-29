const assert = require('assert');
const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function sendToolCall(name, args) {
  return post('/webhook', {
    message: {
      type: 'tool-calls',
      toolCalls: [{ id: `call_api_${Math.random()}`, function: { name, arguments: args } }]
    }
  });
}

async function runAPITests() {
  console.log('🌐 RUNNING API ENDPOINT & TOOL CALL INTEGRATION TESTS...');

  // 1. Health Check
  const healthReq = await new Promise((resolve) => {
    http.get('http://localhost:3000/health', (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(raw) }));
    });
  });
  assert.strictEqual(healthReq.statusCode, 200);
  assert.strictEqual(healthReq.body.status, 'UP');
  console.log('  ✅ /health endpoint verified.');

  // 2. Auth Tool Verification
  const authValid = await sendToolCall('verify_customer', { account_id: 'ACC-88392', verification_code: '1234' });
  const authRes = JSON.parse(authValid.data.results[0].result);
  assert.strictEqual(authRes.verified, true);
  assert.strictEqual(authRes.account_id, 'ACC-88392');
  console.log('  ✅ verify_customer (valid) verified.');

  // 3. PTP Logging
  const ptpRes = await sendToolCall('log_promise_to_pay', { account_id: 'ACC-88392', ptp_date: '2026-08-14', amount: 8499 });
  const ptpOut = JSON.parse(ptpRes.data.results[0].result);
  assert.strictEqual(ptpOut.success, true);
  assert.strictEqual(ptpOut.confirmed_date, '2026-08-14');
  console.log('  ✅ log_promise_to_pay verified.');

  // 4. WhatsApp Interactive Message
  const waRes = await sendToolCall('send_whatsapp_message', { account_id: 'ACC-88392', template_name: 'COLLECTIONS_PTP_INTERACTIVE' });
  const waOut = JSON.parse(waRes.data.results[0].result);
  assert.strictEqual(waOut.success, true);
  assert.strictEqual(waOut.delivery_status, 'DELIVERED_TO_WHATSAPP');
  console.log('  ✅ send_whatsapp_message verified.');

  // 5. Dynamic UPI Deep Link
  const upiRes = await sendToolCall('generate_upi_link', { account_id: 'ACC-88392', amount: 8499, payment_app: 'GooglePay' });
  const upiOut = JSON.parse(upiRes.data.results[0].result);
  assert.strictEqual(upiOut.success, true);
  assert(upiOut.upi_deep_link.includes('upi://pay'));
  console.log('  ✅ generate_upi_link verified.');

  // 6. Voice Biometrics
  const bioRes = await sendToolCall('verify_voiceprint', { account_id: 'ACC-88392' });
  const bioOut = JSON.parse(bioRes.data.results[0].result);
  assert.strictEqual(bioOut.verified, true);
  assert.strictEqual(bioOut.confidence_score, '98.6%');
  console.log('  ✅ verify_voiceprint verified.');

  // 7. Unknown Tool Fallback
  const unkRes = await sendToolCall('unknown_function_test', {});
  const unkOut = JSON.parse(unkRes.data.results[0].result);
  assert.strictEqual(unkOut.success, false);
  console.log('  ✅ Unknown tool call graceful fallback verified.');

  console.log('🎉 ALL API ENDPOINT TESTS PASSED!');
}

runAPITests().catch(err => {
  console.error('❌ API Test Failure:', err);
  process.exit(1);
});
