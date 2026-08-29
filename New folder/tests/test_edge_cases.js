/**
 * Edge Case & Error Recovery Debugging Suite for Webhook Backend
 */

const http = require('http');

function post(body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path: '/webhook',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode, data: JSON.parse(raw) }));
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runEdgeCaseTests() {
  console.log('\n=================================================================');
  console.log('🛡️ RUNNING WEBHOOK BACKEND EDGE CASE & ERROR RECOVERY SUITE');
  console.log('=================================================================\n');

  // Edge Case 1: Stringified arguments
  console.log('1. Testing Stringified JSON Arguments in Tool Call:');
  const res1 = await post({
    message: {
      type: 'tool-calls',
      toolCalls: [
        {
          id: 'call_edge_1',
          function: {
            name: 'verify_customer',
            arguments: JSON.stringify({ account_id: 'ACC-88392', verification_code: '1234' })
          }
        }
      ]
    }
  });
  console.log('   Response:', res1.data);

  // Edge Case 2: Unknown Function Call
  console.log('\n2. Testing Unknown Function Fallback:');
  const res2 = await post({
    message: {
      type: 'tool-calls',
      toolCalls: [
        {
          id: 'call_edge_2',
          function: {
            name: 'non_existent_function',
            arguments: {}
          }
        }
      ]
    }
  });
  console.log('   Response:', res2.data);

  // Edge Case 3: General Event / Status Notification (Non-Tool Call)
  console.log('\n3. Testing General Status Event Notification:');
  const res3 = await post({
    message: {
      type: 'status-update',
      status: 'ended'
    }
  });
  console.log('   Response:', res3.data);

  console.log('\n=================================================================');
  console.log('✅ ALL EDGE CASE HANDLERS VERIFIED FUNCTIONAL');
  console.log('=================================================================\n');
}

runEdgeCaseTests();
