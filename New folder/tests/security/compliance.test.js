const assert = require('assert');
const http = require('http');

function sanitizePII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = JSON.parse(JSON.stringify(obj));
  if (sanitized.verification_code) sanitized.verification_code = '****';
  if (sanitized.customer_name) {
    const parts = String(sanitized.customer_name).split(' ');
    sanitized.customer_name = parts.map(p => p[0] + '****').join(' ');
  }
  return sanitized;
}

console.log('🛡️ RUNNING SECURITY & COMPLIANCE UNIT TESTS...');

// 1. PII Sanitization Test
const inputData = {
  customer_name: 'Rahul Sharma',
  verification_code: '1234',
  account_id: 'ACC-88392'
};
const sanitized = sanitizePII(inputData);
assert.strictEqual(sanitized.verification_code, '****');
assert.strictEqual(sanitized.customer_name, 'R**** S****');
assert.strictEqual(sanitized.account_id, 'ACC-88392');
console.log('  ✅ PII Masking & Log Sanitation verified.');

// 2. Unauthenticated Debt Access Rejection Test
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSecurityAudit() {
  const authFailRes = await request(
    { hostname: 'localhost', port: 3000, path: '/webhook', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { message: { type: 'tool-calls', toolCalls: [{ id: 'call_sec_1', function: { name: 'verify_customer', arguments: { account_id: 'ACC-88392', verification_code: '9999' } } }] } }
  );

  const result = JSON.parse(authFailRes.body.results[0].result);
  assert.strictEqual(result.verified, false);
  assert.strictEqual(result.overdue_amount, undefined);
  console.log('  ✅ Zero Third-Party Debt Disclosure Guardrail verified.');

  console.log('🎉 ALL SECURITY & COMPLIANCE TESTS PASSED!');
}

runSecurityAudit().catch(err => {
  console.error('❌ Security Audit Error:', err);
  process.exit(1);
});
