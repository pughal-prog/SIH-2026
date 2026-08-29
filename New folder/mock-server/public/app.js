/**
 * Kapture Finance Google Minimalist Voice AI Collections Dashboard Frontend Engine
 * Voice-to-Voice Engine: Microphone STT + ElevenLabs TTS Synthesis with Female Voice Selection
 */

const state = {
  callActive: false,
  currentState: 0,
  authenticated: false,
  account_id: 'ACC-88392',
  customer_name: 'Rahul Sharma',
  overdue_amount: 8499,
  dpd: 12
};

// SVG Icon Constants
const SVG_PHONE_CALL = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81-.7A2 2 0 0 1 22 16.92z"/></svg>`;
const SVG_PHONE_OFF = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M16.5 16.5A16 16 0 0 1 8.09 9.91L9.91 8.09a2 2 0 0 0 .45-2.11 12.84 12.84 0 0 0-.7-2.81 2 2 0 0 0-2.11-.45L4.11 3.18a2 2 0 0 0-1.72 2.18A19.79 19.79 0 0 0 5.46 14a19.5 19.5 0 0 0 6 6 19.79 19.79 0 0 0 8.67 3.07 2 2 0 0 0 2.18-1.72l.46-3.44a2 2 0 0 0-.45-2.11 12.84 12.84 0 0 0-2.81-.7 2 2 0 0 0-2.11.45l-1.82 1.82z"/></svg>`;

// DOM Elements
const btnCall = document.getElementById('btn-toggle-call');
const btnCallIcon = document.getElementById('btn-call-icon');
const btnCallText = document.getElementById('btn-call-text');
const callDot = document.getElementById('call-dot');
const callStatusText = document.getElementById('call-status-text');
const audioWave = document.getElementById('audio-wave');
const transcriptBox = document.getElementById('transcript-box');
const logContainer = document.getElementById('log-container');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const btnMic = document.getElementById('btn-mic');
const voiceSelector = document.getElementById('voice-selector');
const elevenApiKeyInput = document.getElementById('eleven-api-key');
const currentStateLabel = document.getElementById('current-state-label');

let activeAudio = null;
let recognition = null;

// Initialize ElevenLabs API Key from localStorage
if (localStorage.getItem('ELEVENLABS_API_KEY')) {
  elevenApiKeyInput.value = localStorage.getItem('ELEVENLABS_API_KEY');
}

elevenApiKeyInput.addEventListener('input', () => {
  localStorage.setItem('ELEVENLABS_API_KEY', elevenApiKeyInput.value.trim());
});

// Setup Speech Recognition (Mic Input for Voice-to-Voice)
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    btnMic.style.background = 'var(--google-red-light)';
    btnMic.style.borderColor = 'var(--google-red)';
    userInput.placeholder = 'Listening to your voice...';
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    userInput.value = transcript;
    handleUserTurn();
  };

  recognition.onerror = (err) => {
    console.warn('[STT Error]:', err.error);
    btnMic.style.background = '#ffffff';
    btnMic.style.borderColor = 'var(--google-border)';
    userInput.placeholder = 'Type or click Mic to speak as Rahul...';
  };

  recognition.onend = () => {
    btnMic.style.background = '#ffffff';
    btnMic.style.borderColor = 'var(--google-border)';
    userInput.placeholder = 'Type or click Mic to speak as Rahul...';
  };
}

btnMic.addEventListener('click', () => {
  if (recognition && state.callActive) {
    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
    }
  }
});

// 🎙️ ElevenLabs Text-to-Speech (TTS) Engine with Voice Selection
async function speak(text) {
  audioWave.classList.add('speaking');
  
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }

  const selectedVoiceId = voiceSelector.value || 'EXAVITQu4vr4xnSDxMaL';
  const userApiKey = elevenApiKeyInput.value.trim() || localStorage.getItem('ELEVENLABS_API_KEY') || '';

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        voice_id: selectedVoiceId,
        api_key: userApiKey
      })
    });

    const contentType = res.headers.get('content-type');

    if (res.ok && contentType && contentType.includes('audio')) {
      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      activeAudio = new Audio(audioUrl);

      activeAudio.onended = () => audioWave.classList.remove('speaking');
      activeAudio.onerror = () => fallbackWebSpeech(text);

      await activeAudio.play();
      const voiceName = voiceSelector.options[voiceSelector.selectedIndex].text;
      appendLog('ElevenLabs TTS Stream', { text_length: text.length, voice: voiceName, voice_id: selectedVoiceId }, { status: 'AUDIO_PLAYING' }, true);
      return;
    }
  } catch (err) {
    console.warn('[ElevenLabs Fetch Error]:', err.message);
  }

  fallbackWebSpeech(text);
}

function fallbackWebSpeech(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira'));
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => audioWave.classList.remove('speaking');
    utterance.onerror = () => audioWave.classList.remove('speaking');
    window.speechSynthesis.speak(utterance);
  } else {
    setTimeout(() => audioWave.classList.remove('speaking'), 2000);
  }
}

// Log Inspector Helper
function appendLog(toolName, requestArgs, responseBody, isSuccess = true) {
  const entry = document.createElement('div');
  entry.className = `inspector-item ${isSuccess ? 'success' : 'error'}`;
  
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `
    <div class="inspector-meta">
      <span>TOOL / ENGINE: <strong>${toolName}</strong></span>
      <span>${time}</span>
    </div>
    <div class="json-view" style="color: var(--google-blue);">REQ: ${JSON.stringify(requestArgs)}</div>
    <div class="json-view" style="color: ${isSuccess ? 'var(--google-green)' : 'var(--google-red)'}; margin-top: 3px;">RESP: ${JSON.stringify(responseBody)}</div>
  `;
  
  logContainer.prepend(entry);
}

// State Machine Visualizer Updater
function updateStateNodes(targetState) {
  state.currentState = targetState;
  const labels = [
    'STATE 0: GREETING',
    'STATE 1: AUTH GATE',
    'STATE 2: NEGOTIATION',
    'STATE 3: EXECUTION',
    'STATE 4: WRAP-UP'
  ];
  currentStateLabel.textContent = labels[targetState] || `STATE ${targetState}`;

  for (let i = 0; i <= 4; i++) {
    const node = document.getElementById(`state-node-${i}`);
    if (node) {
      node.classList.remove('active', 'completed');
      if (i < targetState) node.classList.add('completed');
      else if (i === targetState) node.classList.add('active');
    }
  }
}

// Append Chat Message
function appendMessage(sender, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.textContent = text;
  transcriptBox.appendChild(bubble);
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

// Call Webhook API
async function executeWebhook(toolName, args) {
  const callId = `call_${Math.random().toString(36).substr(2, 6)}`;
  const payload = {
    message: {
      type: 'tool-calls',
      toolCalls: [{
        id: callId,
        function: { name: toolName, arguments: args }
      }]
    }
  };

  try {
    const res = await fetch('/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    const resultObj = JSON.parse(data.results[0].result);
    appendLog(toolName, args, resultObj, resultObj.verified !== false && resultObj.success !== false);
    return resultObj;
  } catch (e) {
    appendLog(toolName, args, { error: e.message }, false);
    return { success: false, error: e.message };
  }
}

// Start Call Handler
function startCall() {
  state.callActive = true;
  state.authenticated = false;
  updateStateNodes(0);

  btnCall.classList.add('active');
  btnCallIcon.innerHTML = SVG_PHONE_OFF;
  btnCallText.textContent = 'End Call';
  callDot.style.background = 'var(--google-green)';
  callStatusText.textContent = 'Call Connected • ElevenLabs Voice Stream';
  callStatusText.style.color = 'var(--google-green)';

  userInput.disabled = false;
  btnSend.disabled = false;
  btnMic.disabled = false;
  userInput.focus();

  transcriptBox.innerHTML = '';
  appendMessage('system', 'Call session active. Connected to ElevenLabs Voice-to-Voice Engine.');

  const greeting = "Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?";
  appendMessage('agent', greeting);
  speak(greeting);
}

// End Call Handler
function endCall(reason = 'Call session completed.') {
  state.callActive = false;
  btnCall.classList.remove('active');
  btnCallIcon.innerHTML = SVG_PHONE_CALL;
  btnCallText.textContent = 'Start Call to Rahul';
  callDot.style.background = 'var(--text-tertiary)';
  callStatusText.textContent = 'Idle • Ready for Call';
  callStatusText.style.color = 'var(--text-secondary)';

  userInput.disabled = true;
  btnSend.disabled = true;
  btnMic.disabled = true;
  audioWave.classList.remove('speaking');

  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }

  appendMessage('system', `Session Ended: ${reason}`);
}

// Quick Preset Chip Loader
function selectPreset(text) {
  if (!state.callActive) startCall();
  userInput.value = text;
  handleUserTurn();
}

// Conversation Turn Manager
async function handleUserTurn() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage('user', text);
  userInput.value = '';
  const lower = text.toLowerCase();

  // STATE 0: Greeting & Confirmation
  if (state.currentState === 0) {
    if (lower.includes('yes') || lower.includes('speaking') || lower.includes('rahul') || lower.includes('haan')) {
      updateStateNodes(1);
      const msg = "For security and privacy verification, could you please confirm the last 4 digits of your PAN card or your year of birth?";
      appendMessage('agent', msg);
      speak(msg);
    } else if (lower.includes('no') || lower.includes('wrong') || lower.includes('not here')) {
      await executeWebhook('mark_disposition', {
        account_id: state.account_id,
        status: 'WRONG_PERSON',
        notes: 'Call answered by non-target party.'
      });
      const msg = "Thank you for letting me know. Have a good day. Goodbye!";
      appendMessage('agent', msg);
      speak(msg);
      setTimeout(() => endCall('Wrong Person Logged'), 3000);
    } else {
      const msg = "Am I speaking with Mr. Rahul Sharma?";
      appendMessage('agent', msg);
      speak(msg);
    }
  }

  // STATE 1: Identity Authentication Gate
  else if (state.currentState === 1) {
    const codeMatch = text.match(/\b\d{4}\b/);
    const code = codeMatch ? codeMatch[0] : text;

    const authRes = await executeWebhook('verify_customer', {
      account_id: state.account_id,
      verification_code: code
    });

    if (authRes.verified) {
      state.authenticated = true;
      updateStateNodes(2);
      const msg = `Thank you for verifying, Rahul. I am calling regarding your Kapture Finance personal loan. An EMI of ₹8,499 is currently overdue by 12 days. We want to help you clear this today to keep your account current. Are you able to pay today?`;
      appendMessage('agent', msg);
      speak(msg);
    } else {
      const msg = "Thank you, but that code doesn't match our records. Could you please double check the last 4 digits of your PAN card or birth year?";
      appendMessage('agent', msg);
      speak(msg);
    }
  }

  // STATE 2: Payment Negotiation (Post-Auth)
  else if (state.currentState === 2) {
    updateStateNodes(3);

    // DNC Opt-Out
    if (lower.includes('stop calling') || lower.includes('do not call') || lower.includes('dnc') || lower.includes('remove my number')) {
      await executeWebhook('mark_disposition', {
        account_id: state.account_id,
        status: 'DO_NOT_CALL',
        notes: 'Customer requested DNC opt-out.'
      });
      updateStateNodes(4);
      const msg = "Understood, Rahul. I am registering your Do-Not-Call request right now. You will not receive further automated calls. Have a good day.";
      appendMessage('agent', msg);
      speak(msg);
      setTimeout(() => endCall('DNC Opt-out Registered'), 3500);
    }

    // Already Paid
    else if (lower.includes('already paid') || lower.includes('paid yesterday') || lower.includes('gpay') || lower.includes('upi')) {
      await executeWebhook('mark_disposition', {
        account_id: state.account_id,
        status: 'ALREADY_PAID',
        notes: text
      });
      updateStateNodes(4);
      const msg = "Thank you for letting me know! Bank processing usually takes 24 to 48 hours to update. I have updated your account records. Have a great day!";
      appendMessage('agent', msg);
      speak(msg);
      setTimeout(() => endCall('Already Paid Logged'), 3500);
    }

    // Financial Hardship
    else if (lower.includes('hardship') || lower.includes('lost my job') || lower.includes('medical') || lower.includes('cannot pay full')) {
      await executeWebhook('escalate_to_agent', {
        account_id: state.account_id,
        reason: 'HARDSHIP_REQUEST',
        summary: text
      });
      await executeWebhook('mark_disposition', {
        account_id: state.account_id,
        status: 'HARDSHIP_ESCALATED',
        notes: text
      });
      updateStateNodes(4);
      const msg = "I completely understand that unexpected situations happen, Rahul. I have flagged your account for our senior resolution desk to discuss custom installment options. Goodbye!";
      appendMessage('agent', msg);
      speak(msg);
      setTimeout(() => endCall('Hardship Escalated'), 4000);
    }

    // Dispute
    else if (lower.includes('dispute') || lower.includes('wrong amount') || lower.includes('never took')) {
      await executeWebhook('escalate_to_agent', {
        account_id: state.account_id,
        reason: 'DISPUTE',
        summary: text
      });
      await executeWebhook('mark_disposition', {
        account_id: state.account_id,
        status: 'DISPUTED',
        notes: text
      });
      updateStateNodes(4);
      const msg = "I understand your concern, Rahul. I have logged an official dispute ticket with our resolution team, and a manager will follow up directly. Goodbye!";
      appendMessage('agent', msg);
      speak(msg);
      setTimeout(() => endCall('Dispute Logged'), 4000);
    }

    // Promise to Pay (PTP)
    else {
      await executeWebhook('log_promise_to_pay', {
        account_id: state.account_id,
        ptp_date: '2026-08-14',
        amount: 8499
      });
      await executeWebhook('send_payment_link', {
        account_id: state.account_id,
        channel: 'SMS'
      });
      await executeWebhook('mark_disposition', {
        account_id: state.account_id,
        status: 'PTP_AGREED',
        notes: 'Agreed payment on 2026-08-14 for ₹8,499.'
      });
      updateStateNodes(4);
      const msg = "Thank you, Rahul! I have recorded your Promise-to-Pay for August 14th for ₹8,499. An instant payment link has been dispatched to your mobile via SMS. Have a great day ahead!";
      appendMessage('agent', msg);
      speak(msg);
      setTimeout(() => endCall('PTP Agreed & Link Sent'), 4500);
    }
  }
}

// Event Listeners
btnCall.addEventListener('click', () => {
  if (!state.callActive) startCall();
  else endCall();
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  handleUserTurn();
});
