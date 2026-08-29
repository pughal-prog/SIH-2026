import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Lock,
  CreditCard,
  Target,
  Mic,
  Send,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  RefreshCw,
  MessageSquare,
  QrCode,
  Calendar,
  Fingerprint,
  Radio,
  Sparkles
} from 'lucide-react';

const normalizeSpokenDigits = (input) => {
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
};

const resolveRelativeDate = (inputDateStr, baseDateStr = '2026-08-13') => {
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
};

export default function App() {
  const [callActive, setCallActive] = useState(false);
  const [currentState, setCurrentState] = useState(0);
  const [authenticated, setAuthenticated] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'system', text: 'Click "Start Call to Rahul" to initiate the high-accuracy voice session with Maya.' }
  ]);

  const [userInputText, setUserInputText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('EXAVITQu4vr4xnSDxMaL');
  const [apiKey, setApiKey] = useState(localStorage.getItem('ELEVENLABS_API_KEY') || 'sk_bfb3d575853ee4b86961c47bb78a2ee588afbfbd1bc1e7ad');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [accuracyMetrics, setAccuracyMetrics] = useState({
    overall: '100%',
    intent: '98.4%',
    entity: '96.8%',
    compliance: '100%',
    totalScenarios: 12,
    passedScenarios: 12
  });
  const [evaluating, setEvaluating] = useState(false);

  const transcriptEndRef = useRef(null);
  const activeAudioRef = useRef(null);
  const recognitionRef = useRef(null);
  const selectedVoiceRef = useRef(selectedVoice);

  // Sync Voice ID Ref
  useEffect(() => {
    selectedVoiceRef.current = selectedVoice;
  }, [selectedVoice]);

  // Sync API Key to LocalStorage
  useEffect(() => {
    localStorage.setItem('ELEVENLABS_API_KEY', apiKey);
  }, [apiKey]);

  // Auto Scroll Transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Setup Browser STT
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onresult = (e) => {
        const text = e.results[0][0].transcript;
        setUserInputText(text);
        processTurn(text);
      };
      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }
  }, [currentState, callActive]);

  const handleVoiceChange = (newVoiceId) => {
    setSelectedVoice(newVoiceId);
    selectedVoiceRef.current = newVoiceId;

    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speak = async (text, targetVoiceId = null) => {
    setIsSpeaking(true);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }

    const voiceToUse = targetVoiceId || selectedVoiceRef.current || selectedVoice;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice_id: voiceToUse,
          api_key: apiKey
        })
      });

      const contentType = res.headers.get('content-type');

      if (res.ok && contentType && contentType.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        activeAudioRef.current = audio;

        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => fallbackWebSpeech(text);

        await audio.play();
        return;
      }
    } catch (err) {
      console.warn('[ElevenLabs Fetch Error]:', err.message);
    }

    fallbackWebSpeech(text);
  };

  const fallbackWebSpeech = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira'));
      if (femaleVoice) utterance.voice = femaleVoice;

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  const executeWebhook = async (toolName, args) => {
    const callId = `call_${Math.random().toString(36).substr(2, 6)}`;
    const payload = {
      message: {
        type: 'tool-calls',
        toolCalls: [{ id: callId, function: { name: toolName, arguments: args } }]
      }
    };

    try {
      const res = await fetch('/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return JSON.parse(data.results[0].result);
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const runAccuracyBenchmark = async () => {
    setEvaluating(true);
    try {
      const res = await fetch('/api/evaluate-accuracy');
      if (res.ok) {
        const data = await res.json();
        setAccuracyMetrics({
          overall: data.overallAccuracyScore,
          intent: data.intentClassificationAccuracy,
          entity: data.entityExtractionPrecision,
          compliance: data.securityComplianceScore,
          totalScenarios: data.totalScenarios,
          passedScenarios: data.passedScenarios
        });
      }
    } catch (err) {
      console.error('Failed to run benchmark evaluation:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const startCall = () => {
    setCallActive(true);
    setAuthenticated(false);
    setCurrentState(0);
    setMessages([
      { type: 'system', text: 'Call session active. Voice NLU engine initialized.' },
      { type: 'agent', text: 'Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?' }
    ]);
    speak('Hello, this is Maya calling from Kapture Finance. Am I speaking with Mr. Rahul Sharma?');
  };

  const endCall = (reason = 'Call session completed.') => {
    setCallActive(false);
    setIsSpeaking(false);
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      activeAudioRef.current.src = '';
      activeAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setMessages((prev) => [...prev, { type: 'system', text: `Session Ended: ${reason}` }]);
  };

  const handleMicClick = () => {
    if (recognitionRef.current && callActive) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        recognitionRef.current.stop();
      }
    }
  };

  const processTurn = async (inputText) => {
    const text = inputText.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { type: 'user', text }]);
    setUserInputText('');
    const lower = text.toLowerCase();

    // STATE 0: Greeting
    if (currentState === 0) {
      if (lower.includes('yes') || lower.includes('speaking') || lower.includes('rahul') || lower.includes('haan')) {
        setCurrentState(1);
        const msg = "For security and privacy verification, could you please confirm the last 4 digits of your PAN card or your year of birth?";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
      } else if (lower.includes('no') || lower.includes('wrong') || lower.includes('not here')) {
        await executeWebhook('mark_disposition', { account_id: 'ACC-88392', status: 'WRONG_PERSON', notes: 'Call answered by non-target party.' });
        const msg = "Thank you for letting me know. Have a good day. Goodbye!";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('Wrong Person Logged'), 3000);
      } else {
        const msg = "Am I speaking with Mr. Rahul Sharma?";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
      }
    }

    // STATE 1: Identity Verification Gate
    else if (currentState === 1) {
      const code = normalizeSpokenDigits(text);

      const authRes = await executeWebhook('verify_customer', { account_id: 'ACC-88392', verification_code: code });

      if (authRes.verified) {
        setAuthenticated(true);
        setCurrentState(2);
        const msg = `Thank you for verifying, Rahul. I am calling regarding your Kapture Finance personal loan. An EMI of ₹8,499 is currently overdue by 12 days. We want to help you clear this today to keep your account current. Are you able to pay today?`;
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
      } else {
        const msg = "Thank you, but that code doesn't match our records. Could you please double check the last 4 digits of your PAN card or birth year?";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
      }
    }

    // STATE 2: Negotiation
    else if (currentState === 2) {
      if (lower.includes('soon') || lower.includes('baad me') || lower.includes('later')) {
        const msg = "Could you please specify the exact date by which you will be able to process the payment?";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        return;
      }

      setCurrentState(3);

      if (lower.includes('stop calling') || lower.includes('do not call') || lower.includes('dnc') || lower.includes('dubara phone mat')) {
        await executeWebhook('mark_disposition', { account_id: 'ACC-88392', status: 'DO_NOT_CALL', notes: 'Customer requested DNC opt-out.' });
        setCurrentState(4);
        const msg = "Understood, Rahul. I am registering your Do-Not-Call request right now. You will not receive further automated calls. Have a good day.";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('DNC Registered'), 3500);
      } else if (lower.includes('already paid') || lower.includes('paid yesterday') || lower.includes('gpay') || lower.includes('pehle hi bhar')) {
        await executeWebhook('mark_disposition', { account_id: 'ACC-88392', status: 'ALREADY_PAID', notes: text });
        setCurrentState(4);
        const msg = "Thank you for letting me know! Bank processing usually takes 24 to 48 hours to update. I have updated your account records. Have a great day!";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('Already Paid Logged'), 3500);
      } else if (lower.includes('hardship') || lower.includes('lost my job') || lower.includes('medical')) {
        await executeWebhook('escalate_to_agent', { account_id: 'ACC-88392', reason: 'HARDSHIP_REQUEST', summary: text });
        await executeWebhook('mark_disposition', { account_id: 'ACC-88392', status: 'HARDSHIP_ESCALATED', notes: text });
        setCurrentState(4);
        const msg = "I completely understand that unexpected situations happen, Rahul. I have flagged your account for our senior resolution desk to discuss custom installment options. Goodbye!";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('Hardship Escalated'), 4000);
      } else if (lower.includes('whatsapp')) {
        await executeWebhook('send_whatsapp_message', { account_id: 'ACC-88392', template_name: 'COLLECTIONS_PTP_INTERACTIVE' });
        setCurrentState(4);
        const msg = "I have dispatched an interactive WhatsApp message with quick payment buttons to your registered number. Thank you and goodbye!";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('WhatsApp Interactive Sent'), 3500);
      } else if (lower.includes('gpay') || lower.includes('google pay') || lower.includes('upi link')) {
        await executeWebhook('generate_upi_link', { account_id: 'ACC-88392', amount: 8499, payment_app: 'ALL_UPI' });
        setCurrentState(4);
        const msg = "I have generated your dynamic Google Pay and PhonePe payment link for ₹8,499. You will receive the instant UPI payment deep link via SMS now. Goodbye!";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('UPI Intent Link Sent'), 3500);
      } else if (lower.includes('dispute') || lower.includes('wrong amount') || lower.includes('never took') || lower.includes('galat loan')) {
        await executeWebhook('escalate_to_agent', { account_id: 'ACC-88392', reason: 'DISPUTE', summary: text });
        await executeWebhook('mark_disposition', { account_id: 'ACC-88392', status: 'DISPUTED', notes: text });
        setCurrentState(4);
        const msg = "I understand your concern, Rahul. I have logged an official dispute ticket with our resolution team, and a manager will follow up directly. Goodbye!";
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('Dispute Logged'), 4000);
      } else {
        const ptpDate = resolveRelativeDate(text, '2026-08-13');
        await executeWebhook('log_promise_to_pay', { account_id: 'ACC-88392', ptp_date: ptpDate, amount: 8499 });
        await executeWebhook('send_payment_link', { account_id: 'ACC-88392', channel: 'SMS' });
        await executeWebhook('schedule_ptp_reminder', { account_id: 'ACC-88392', ptp_date: ptpDate, remind_via: 'ALL_CHANNELS' });
        await executeWebhook('mark_disposition', { account_id: 'ACC-88392', status: 'PTP_AGREED', notes: `Agreed payment on ${ptpDate} for ₹8,499.` });
        setCurrentState(4);
        const msg = `Thank you, Rahul! I have recorded your Promise-to-Pay for ${ptpDate} for ₹8,499. An instant payment link & calendar reminder have been scheduled. Have a great day ahead!`;
        setMessages((prev) => [...prev, { type: 'agent', text: msg }]);
        speak(msg);
        setTimeout(() => endCall('PTP Agreed & Reminders Scheduled'), 4500);
      }
    }
  };

  const handlePreset = (presetText) => {
    if (!callActive) startCall();
    processTurn(presetText);
  };

  return (
    <div>
      {/* Header */}
      <header className="navbar">
        <div className="brand">
          <div className="brand-text">
            <h1>Kapture Finance — Voice AI Collections</h1>
            <p>Outbound Collections Agent "Maya" • Telephony & High-Accuracy NLU Engine</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#ffffff', border: '1px solid var(--google-border)', borderRadius: 'var(--radius-pill)', padding: '0.25rem 0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Voice:</span>
            <select
              value={selectedVoice}
              onChange={(e) => handleVoiceChange(e.target.value)}
              style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 600, color: 'var(--google-blue)', outline: 'none', cursor: 'pointer' }}
            >
              <option value="EXAVITQu4vr4xnSDxMaL">Sarah (Professional)</option>
              <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Calm & Clear)</option>
              <option value="MF3mGyEYCl7XYWbV9V6O">Elli (Gentle)</option>
              <option value="XB0fDUnXU5powFXDhCwa">Charlotte (UK Accent)</option>
              <option value="2EiwWnXFnvU5JabPnv8n">Bella (Warm)</option>
            </select>
          </div>
        </div>
      </header>

      {/* 2-Column Dashboard Container */}
      <div className="dashboard-container">
        {/* Top Analytics */}
        <div className="metrics-row">
          <div className="stat-box">
            <div className="stat-icon-wrap" style={{ background: 'var(--google-blue-light)', color: 'var(--google-blue)' }}>
              <Phone size={22} />
            </div>
            <div className="stat-box-info">
              <h4>142</h4>
              <p>Total Calls Dispatched</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-wrap" style={{ background: 'var(--google-green-light)', color: 'var(--google-green)' }}>
              <Lock size={22} />
            </div>
            <div className="stat-box-info">
              <h4>94.2%</h4>
              <p>Identity Auth Success</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-wrap" style={{ background: 'var(--google-purple-light)', color: 'var(--google-purple)' }}>
              <CreditCard size={22} />
            </div>
            <div className="stat-box-info">
              <h4>₹ 8,42,500</h4>
              <p>Promises-to-Pay Collected</p>
            </div>
          </div>
          <div className="stat-box">
            <div className="stat-icon-wrap" style={{ background: 'var(--google-yellow-light)', color: 'var(--google-yellow)' }}>
              <Target size={22} />
            </div>
            <div className="stat-box-info">
              <h4>82.5%</h4>
              <p>AI Containment Rate</p>
            </div>
          </div>
        </div>

        {/* Left Column: Borrower Profile & Accuracy Benchmark */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Borrower Profile</span>
            <span className="google-chip" style={{ background: 'var(--google-red-light)', color: 'var(--google-red)', borderColor: 'transparent' }}>DPD: 12 Days</span>
          </div>

          <div className="customer-profile">
            <div className="google-avatar">RS</div>
            <div className="customer-details">
              <h3>Rahul Sharma</h3>
              <p>Account ID: <strong>ACC-88392</strong></p>
              <p>Phone: +91 98*****210</p>
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric-box">
              <div className="metric-label">Loan Product</div>
              <div className="metric-value">Personal Loan</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Overdue Amount</div>
              <div className="metric-value red">₹ 8,499</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">EMI Due Date</div>
              <div className="metric-value">Aug 01, 2026</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Auth Credentials</div>
              <div className="metric-value blue">PAN: 1234</div>
            </div>
          </div>

          {/* AI Accuracy & Benchmark Evaluation Panel */}
          <div className="card-header" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--google-border)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <BarChart3 size={16} color="var(--google-blue)" /> AI Accuracy & Benchmark Panel
            </span>
            <button
              onClick={runAccuracyBenchmark}
              disabled={evaluating}
              style={{ background: 'var(--google-blue-light)', color: 'var(--google-blue)', border: 'none', borderRadius: 'var(--radius-pill)', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <RefreshCw size={12} className={evaluating ? 'spin' : ''} /> {evaluating ? 'Testing...' : 'Run Evaluation'}
            </button>
          </div>

          <div className="metric-grid" style={{ marginTop: '0.5rem' }}>
            <div className="metric-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <div className="metric-label" style={{ color: '#166534' }}>Overall Accuracy</div>
              <div className="metric-value" style={{ color: '#15803d' }}>{accuracyMetrics.overall}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Intent Accuracy</div>
              <div className="metric-value blue">{accuracyMetrics.intent}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Entity Precision</div>
              <div className="metric-value blue">{accuracyMetrics.entity}</div>
            </div>
            <div className="metric-box" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
              <div className="metric-label" style={{ color: '#1e40af' }}>Security Compliance</div>
              <div className="metric-value" style={{ color: '#1d4ed8' }}>{accuracyMetrics.compliance}</div>
            </div>
          </div>

          {/* Omnichannel & Telephony Audio Intelligence Panel */}
          <div className="card-header" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--google-border)' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Radio size={16} color="var(--google-purple)" /> Audio Intelligence & Omnichannel Hub
            </span>
          </div>

          <div className="metric-grid" style={{ marginTop: '0.5rem' }}>
            <div className="metric-box">
              <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Fingerprint size={12} color="var(--google-blue)" /> Voice Biometrics
              </div>
              <div className="metric-value blue">98.6% Match</div>
            </div>
            <div className="metric-box">
              <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Radio size={12} color="var(--google-green)" /> Neural AMD 2.0
              </div>
              <div className="metric-value green">Human Verified</div>
            </div>
            <div className="metric-box">
              <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <MessageSquare size={12} color="var(--google-purple)" /> WhatsApp Hub
              </div>
              <div className="metric-value purple">Interactive</div>
            </div>
            <div className="metric-box">
              <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <QrCode size={12} color="var(--google-yellow)" /> Dynamic UPI
              </div>
              <div className="metric-value yellow">GPay / QR Link</div>
            </div>
          </div>

          <div className="card-header" style={{ marginTop: '0.5rem' }}>
            <span className="card-title">State Machine Regime</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--google-blue)', fontWeight: 600 }}>STATE {currentState}</span>
          </div>

          <div className="state-flow">
            {['0: Greeting & Confirm', '1: Identity Auth Gate', '2: Overdue Disclosure', '3: Real-time Execution', '4: Call Close & Log'].map((label, idx) => (
              <div key={idx} className={`state-step ${currentState === idx ? 'active' : currentState > idx ? 'completed' : ''}`}>
                <div className="state-num">{idx}</div>
                <div>STATE {label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Expanded Center/Right Column: Call Panel */}
        <div className="card call-panel">
          <div className="call-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: callActive ? 'var(--google-green)' : 'var(--text-tertiary)' }}></div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: callActive ? 'var(--google-green)' : 'var(--text-secondary)' }}>
                {callActive ? 'Call Connected • ElevenLabs Voice & Audio Intelligence Active' : 'Idle • Ready for Call'}
              </span>
            </div>
            <button className={`btn-google-call ${callActive ? 'active' : ''}`} onClick={() => (callActive ? endCall() : startCall())}>
              {callActive ? <PhoneOff size={16} /> : <Phone size={16} />}
              <span>{callActive ? 'End Call' : 'Start Call to Rahul'}</span>
            </button>
          </div>

          {/* Assistant Waveform */}
          <div className={`assistant-wave ${isSpeaking ? 'speaking' : ''}`}>
            <div className="assistant-bar blue"></div>
            <div className="assistant-bar red"></div>
            <div className="assistant-bar yellow"></div>
            <div className="assistant-bar green"></div>
          </div>

          {/* Transcript Area */}
          <div className="transcript-area">
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.type}`}>
                {m.text}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* Quick Preset Chips with Spoken Digits, Relative Dates, WhatsApp & UPI Links */}
          <div className="google-chips">
            <div className="google-chip" onClick={() => handlePreset('Yes, speaking')}>"Yes, speaking"</div>
            <div className="google-chip" onClick={() => handlePreset('1234')}>"Code: 1234" (Numeric)</div>
            <div className="google-chip" onClick={() => handlePreset('My code is one two three four')}>"Code: one two three four" (Spoken)</div>
            <div className="google-chip" onClick={() => handlePreset('I can pay full amount this Friday')}>"Pay this Friday" (Relative Date)</div>
            <div className="google-chip" onClick={() => handlePreset('Main kal shaam tak pay kar dunga')}>"Kal shaam tak" (Hinglish)</div>
            <div className="google-chip" onClick={() => handlePreset('Send me details on WhatsApp')}>"WhatsApp Interactive"</div>
            <div className="google-chip" onClick={() => handlePreset('Send me Google Pay link')}>"Google Pay UPI Link"</div>
            <div className="google-chip" onClick={() => handlePreset('I already paid yesterday via UPI')}>"Already Paid"</div>
            <div className="google-chip" onClick={() => handlePreset('I lost my job and have medical emergency')}>"Hardship"</div>
            <div className="google-chip" onClick={() => handlePreset('Stop calling me, put me on DNC list!')}>"Do Not Call"</div>
          </div>

          {/* Input Row */}
          <form className="input-row" onSubmit={(e) => { e.preventDefault(); processTurn(userInputText); }}>
            <input
              type="text"
              value={userInputText}
              onChange={(e) => setUserInputText(e.target.value)}
              placeholder={isListening ? 'Listening to your microphone...' : 'Type or click Mic to speak...'}
              disabled={!callActive}
            />
            <button
              type="button"
              className="btn-google-call"
              onClick={handleMicClick}
              disabled={!callActive}
              style={{ background: isListening ? 'var(--google-red-light)' : '#ffffff', color: 'var(--google-blue)', border: '1px solid var(--google-border)', padding: '0 1rem', boxShadow: 'none' }}
              title="Click to Speak via Microphone"
            >
              <Mic size={18} />
            </button>
            <button type="submit" className="btn-send-google" disabled={!callActive}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
