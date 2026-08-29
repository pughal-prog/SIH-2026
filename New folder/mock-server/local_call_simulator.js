/**
 * Kapture Voice AI "Maya" Local Interactive Call Simulator
 * Simulates a real-time outbound voice call turn-by-turn with live webhook execution against localhost:3000
 */

const readline = require('readline');
const http = require('http');

const SERVER_URL = 'http://localhost:3000/webhook';

// Account State
const accountContext = {
  account_id: 'ACC-88392',
  customer_name: 'Rahul Sharma',
  overdue_amount: 8499,
  dpd: 12,
  authenticated: false,
  state: 'STATE_0_GREETING'
};

function callWebhook(name, args) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      message: {
        type: 'tool-calls',
        toolCalls: [
          {
            id: `call_${Math.random().toString(36).substr(2, 6)}`,
            function: { name, arguments: args }
          }
        ]
      }
    });

    const req = http.request(
      'http://localhost:3000/webhook',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            const toolResult = JSON.parse(parsed.results[0].result);
            resolve(toolResult);
          } catch (e) {
            resolve({ error: 'Failed to parse response' });
          }
        });
      }
    );
    req.on('error', (err) => resolve({ error: err.message }));
    req.write(payload);
    req.end();
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function printAgent(text) {
  console.log(`\n🤖 MAYA (Voice Agent): "${text}"`);
}

function printTool(name, result) {
  console.log(`⚡ [LIVE TOOL EXECUTED: ${name}] ->`, JSON.stringify(result));
}

console.log('\n=================================================================');
console.log('📞 KAPTURE FINANCE - OUTBOUND VOICE CALL SIMULATOR ("MAYA")');
console.log('=================================================================');
console.log('Connected to Local Webhook Server: http://localhost:3000/webhook');
console.log('Target Customer: Rahul Sharma | Overdue Amount: ₹8,499 | DPD: 12 Days');
console.log('-----------------------------------------------------------------\n');

printAgent("Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?");

function normalizeSpokenDigits(input) {
  if (!input) return '';
  const numWords = {
    zero: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9',
    ek: '1', do: '2', teen: '3', chaar: '4', paanch: '5', chha: '6', saath: '7', aath: '8', nau: '9'
  };
  let text = String(input).toLowerCase().trim();
  for (const [word, digit] of Object.entries(numWords)) {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    text = text.replace(regex, digit);
  }
  text = text.replace(/\s+/g, '');
  const match = text.match(/\d{4}/);
  return match ? match[0] : (text.match(/\d+/g)?.join('') || String(input).trim());
}

function resolveRelativeDate(inputDateStr, baseDateStr = '2026-08-13') {
  if (!inputDateStr) return '2026-08-14';
  const text = String(inputDateStr).toLowerCase().trim();
  const baseDate = new Date(baseDateStr);

  if (text.includes('today') || text.includes('aaj')) {
    return baseDate.toISOString().split('T')[0];
  }
  if (text.includes('tomorrow') || text.includes('kal') || text.includes('friday')) {
    const tom = new Date(baseDate);
    tom.setDate(tom.getDate() + 1);
    return tom.toISOString().split('T')[0];
  }
  if (text.includes('day after tomorrow') || text.includes('parso')) {
    const parso = new Date(baseDate);
    parso.setDate(parso.getDate() + 2);
    return parso.toISOString().split('T')[0];
  }
  if (text.includes('monday') || text.includes('somwar')) {
    const mon = new Date(baseDate);
    mon.setDate(mon.getDate() + 4);
    return mon.toISOString().split('T')[0];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const fallback = new Date(baseDate);
  fallback.setDate(fallback.getDate() + 1);
  return fallback.toISOString().split('T')[0];
}

async function promptUser() {
  rl.question('\n👤 YOU (Rahul): ', async (input) => {
    const text = input.trim();
    if (!text || text.toLowerCase() === 'exit' || text.toLowerCase() === 'quit') {
      console.log('\n[Call Disconnected]');
      rl.close();
      return;
    }

    const lower = text.toLowerCase();

    // STATE 0: Greeting
    if (accountContext.state === 'STATE_0_GREETING') {
      if (lower.includes('yes') || lower.includes('speaking') || lower.includes('rahul') || lower.includes('haan')) {
        accountContext.state = 'STATE_1_AUTH_PENDING';
        printAgent("For security and privacy verification, could you please confirm the last 4 digits of your PAN card or your year of birth?");
      } else if (lower.includes('no') || lower.includes('wrong number') || lower.includes('not here')) {
        const res = await callWebhook('mark_disposition', {
          account_id: accountContext.account_id,
          status: 'WRONG_PERSON',
          notes: 'Call answered by non-target party'
        });
        printTool('mark_disposition', res);
        printAgent("Thank you for letting me know. Have a good day. Goodbye!");
        rl.close();
        return;
      } else {
        printAgent("Am I speaking with Mr. Rahul Sharma?");
      }
    }

    // STATE 1: Identity Verification
    else if (accountContext.state === 'STATE_1_AUTH_PENDING') {
      const code = normalizeSpokenDigits(text);

      console.log(`\n⏳ Executing verify_customer tool for normalized code '${code}'...`);
      const authRes = await callWebhook('verify_customer', {
        account_id: accountContext.account_id,
        verification_code: code
      });
      printTool('verify_customer', authRes);

      if (authRes.verified) {
        accountContext.authenticated = true;
        accountContext.state = 'STATE_2_NEGOTIATION';
        printAgent(`Thank you for verifying, Rahul. I am calling regarding your Kapture Finance personal loan. An EMI of ₹8,499 is currently overdue by 12 days. We want to help you clear this today to keep your account current. Are you able to pay today?`);
      } else {
        printAgent("Thank you, but that code doesn't match our records. Could you please double check the last 4 digits of your PAN card or birth year?");
      }
    }

    // STATE 2: Payment Negotiation (Post-Auth)
    else if (accountContext.state === 'STATE_2_NEGOTIATION') {
      // DNC Opt-Out
      if (lower.includes('stop calling') || lower.includes('do not call') || lower.includes('dnc') || lower.includes('remove my number') || lower.includes('dubara phone mat')) {
        const res = await callWebhook('mark_disposition', {
          account_id: accountContext.account_id,
          status: 'DO_NOT_CALL',
          notes: 'Customer requested DNC opt-out.'
        });
        printTool('mark_disposition', res);
        printAgent("Understood, Rahul. I am registering your Do-Not-Call request right now. You will not receive further automated calls. Have a good day.");
        rl.close();
        return;
      }
      // Already Paid
      else if (lower.includes('already paid') || lower.includes('paid yesterday') || lower.includes('gpay') || lower.includes('upi') || lower.includes('pehle hi bhar')) {
        const res = await callWebhook('mark_disposition', {
          account_id: accountContext.account_id,
          status: 'ALREADY_PAID',
          notes: `Customer stated payment made via: ${text}`
        });
        printTool('mark_disposition', res);
        printAgent("Thank you for letting me know! Bank processing usually takes 24 to 48 hours to update. I have updated your account records. Goodbye!");
        rl.close();
        return;
      }
      // Financial Hardship
      else if (lower.includes('hardship') || lower.includes('lost my job') || lower.includes('medical') || lower.includes('cannot pay full')) {
        const escRes = await callWebhook('escalate_to_agent', {
          account_id: accountContext.account_id,
          reason: 'HARDSHIP_REQUEST',
          summary: text
        });
        printTool('escalate_to_agent', escRes);

        const dispRes = await callWebhook('mark_disposition', {
          account_id: accountContext.account_id,
          status: 'HARDSHIP_ESCALATED',
          notes: text
        });
        printTool('mark_disposition', dispRes);

        printAgent("I completely understand that unexpected situations happen, Rahul. I have flagged your account for our senior resolution desk to discuss custom installment options. Goodbye!");
        rl.close();
        return;
      }
      // Dispute
      else if (lower.includes('dispute') || lower.includes('wrong amount') || lower.includes('never took') || lower.includes('galat loan')) {
        const escRes = await callWebhook('escalate_to_agent', {
          account_id: accountContext.account_id,
          reason: 'DISPUTE',
          summary: text
        });
        printTool('escalate_to_agent', escRes);

        const dispRes = await callWebhook('mark_disposition', {
          account_id: accountContext.account_id,
          status: 'DISPUTED',
          notes: text
        });
        printTool('mark_disposition', dispRes);

        printAgent("I understand your concern, Rahul. I have logged an official dispute ticket with our resolution team. A representative will reach out shortly. Goodbye!");
        rl.close();
        return;
      }
      // Ambiguous commitment handling
      else if (lower.includes('soon') || lower.includes('baad me') || lower.includes('later')) {
        printAgent("Could you please specify the exact date by which you will be able to process the payment?");
        return;
      }
      // Promise to Pay (PTP) with Relative Date calculation
      else {
        const ptpDate = resolveRelativeDate(text, '2026-08-13');
        const ptpRes = await callWebhook('log_promise_to_pay', {
          account_id: accountContext.account_id,
          ptp_date: ptpDate,
          amount: 8499
        });
        printTool('log_promise_to_pay', ptpRes);

        const linkRes = await callWebhook('send_payment_link', {
          account_id: accountContext.account_id,
          channel: 'SMS'
        });
        printTool('send_payment_link', linkRes);

        const dispRes = await callWebhook('mark_disposition', {
          account_id: accountContext.account_id,
          status: 'PTP_AGREED',
          notes: `Agreed payment on ${ptpDate} for ₹8,499.`
        });
        printTool('mark_disposition', dispRes);

        printAgent(`Thank you, Rahul! I have recorded your Promise-to-Pay for ${ptpDate} for ₹8,499. An instant payment link has been dispatched to your mobile via SMS. Have a great day ahead!`);
        rl.close();
        return;
      }
    }

    promptUser();
  });
}

promptUser();
