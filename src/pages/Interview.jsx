import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { questionBank, orgInfo } from '../data/questions.js'

const PHASES = ['intro', 'technical', 'hr']
const PHASE_LABELS = { intro: 'INTRO', technical: 'TECHNICAL', hr: 'HR ROUND' }
const Q_TIME = 120

// ── Gemini API helper ──────────────────────────────────────────
async function callGemini(apiKey, prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export default function Interview() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const initOrg = params.get('org') || 'DRDO'

  const [stage, setStage] = useState('setup')
  const [selectedOrg, setSelectedOrg] = useState(initOrg)
  const [phaseIdx, setPhaseIdx] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [questions, setQuestions] = useState([])
  const [currentQ, setCurrentQ] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [answers, setAnswers] = useState([])
  const [feedback, setFeedback] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [qTimeLeft, setQTimeLeft] = useState(Q_TIME)
  const [aiFollowUp, setAiFollowUp] = useState(null)
  const [followUpMode, setFollowUpMode] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recogRef = useRef(null)
  const mainTimerRef = useRef(null)
  const qTimerRef = useRef(null)

  const apiKey = localStorage.getItem('gemini_api_key') || ''
  const customQs = JSON.parse(localStorage.getItem('extracted_questions') || '[]')

  const buildQuestions = useCallback((org) => {
    const bank = questionBank[org]
    const qs = []
    bank.intro.slice(0, 3).forEach(q => qs.push({ phase: 'intro', q }))
    const tech = [...bank.technical].sort(() => Math.random() - 0.5).slice(0, 10)
    tech.forEach(q => qs.push({ phase: 'technical', q }))
    bank.hr.slice(0, 3).forEach(q => qs.push({ phase: 'hr', q }))
    customQs.slice(0, 4).forEach(q => qs.push({ phase: 'technical', q }))
    return qs
  }, [customQs])

  // Camera
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      streamRef.current = s
      setCameraOn(true)
      if (videoRef.current) videoRef.current.srcObject = s
    } catch { alert('Camera permission denied. Please allow camera access in browser settings.') }
  }
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }

  // TTS
  const speak = (text, cb) => {
    window.speechSynthesis?.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.88; utt.pitch = 1
    const voices = window.speechSynthesis?.getVoices() || []
    const v = voices.find(v => v.lang === 'en-IN') || voices.find(v => v.lang.startsWith('en'))
    if (v) utt.voice = v
    utt.onstart = () => setIsSpeaking(true)
    utt.onend = () => { setIsSpeaking(false); cb?.() }
    utt.onerror = () => { setIsSpeaking(false); cb?.() }
    window.speechSynthesis?.speak(utt)
  }

  // STT
  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Speech recognition requires Google Chrome. Please open in Chrome.'); return }
    const r = new SR()
    r.continuous = true; r.interimResults = true; r.lang = 'en-IN'
    r.onresult = e => {
      let f = '', im = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) f += e.results[i][0].transcript
        else im += e.results[i][0].transcript
      }
      setTranscript(p => p + f + (im ? ` ${im}` : ''))
    }
    r.onerror = () => setIsListening(false)
    recogRef.current = r
    r.start()
    setIsListening(true)
  }
  const stopListening = () => { recogRef.current?.stop(); setIsListening(false) }

  // Timers
  useEffect(() => {
    if (stage === 'active') {
      mainTimerRef.current = setInterval(() => setTimeElapsed(t => t + 1), 1000)
      return () => clearInterval(mainTimerRef.current)
    }
  }, [stage])

  useEffect(() => {
    if (stage !== 'active' || isSpeaking) return
    clearInterval(qTimerRef.current)
    setQTimeLeft(Q_TIME)
    qTimerRef.current = setInterval(() => {
      setQTimeLeft(t => {
        if (t <= 1) { clearInterval(qTimerRef.current); handleNext(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(qTimerRef.current)
  }, [currentQ, stage, isSpeaking])

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const startInterview = async () => {
    const qs = buildQuestions(selectedOrg)
    setQuestions(qs)
    setStage('briefing')
    speak(
      `Welcome Keshav. I am your AI interviewer for the ${selectedOrg} mock interview. We have three phases: Introduction, Technical, and HR. Please maintain eye contact with the camera and answer clearly. All the best.`,
      () => { setStage('active'); askQuestion(qs, 0) }
    )
  }

  const askQuestion = (qs, idx) => {
    if (idx >= qs.length) { finishInterview(); return }
    clearInterval(qTimerRef.current)
    stopListening()
    const q = qs[idx]
    setCurrentQ(q.q)
    setPhaseIdx(PHASES.indexOf(q.phase))
    setQIndex(idx)
    setTranscript('')
    setFollowUpMode(false)
    setAiFollowUp(null)
    const phaseChange = idx > 0 && qs[idx-1]?.phase !== q.phase
      ? `Moving to the ${q.phase} round. ` : ''
    speak(`${phaseChange}${q.q}`)
  }

  const handleNext = async () => {
    clearInterval(qTimerRef.current)
    stopListening()
    const ans = transcript.replace(/\s+/g,' ').trim()
    const saved = [...answers, { q: questions[qIndex].q, a: ans, phase: questions[qIndex].phase }]
    setAnswers(saved)
    setTranscript('')

    // Generate AI follow-up if API key present and answer is substantial
    if (apiKey && ans.length > 30 && questions[qIndex]?.phase === 'technical') {
      try {
        const followUp = await callGemini(apiKey,
          `You are a ${selectedOrg} interviewer for an ECE candidate named Keshav.
The question was: "${questions[qIndex].q}"
Keshav's answer: "${ans}"
Generate ONE sharp follow-up question (max 20 words) to probe deeper or test understanding.
Reply with only the follow-up question, nothing else.`)
        if (followUp.trim().length > 10) {
          setAiFollowUp(followUp.trim())
          setFollowUpMode(true)
          speak(followUp.trim())
          return
        }
      } catch {}
    }
    askQuestion(questions, qIndex + 1)
  }

  const skipFollowUp = () => {
    setFollowUpMode(false)
    setAiFollowUp(null)
    askQuestion(questions, qIndex + 1)
  }

  const finishInterview = async () => {
    stopListening(); stopCamera()
    window.speechSynthesis?.cancel()
    clearInterval(mainTimerRef.current); clearInterval(qTimerRef.current)
    setStage('loading')
    const fb = await getAiFeedback(answers)
    setFeedback(fb)
    setStage('feedback')
  }

  const getAiFeedback = async (ans) => {
    if (!apiKey) return defaultFeedback()
    try {
      const prompt = `You are an expert recruitment evaluator for ${selectedOrg} (ECE position) in India.
Candidate name: Keshav

Interview Q&A:
${ans.map((a,i)=>`Q${i+1} [${a.phase}]: ${a.q}\nAnswer: ${a.a||'(no answer)'}`).join('\n\n')}

Evaluate and respond ONLY in this exact JSON (no other text, no markdown):
{
  "overall": <0-100>,
  "summary": "<2-3 sentences overall honest assessment>",
  "strengths": ["<point>","<point>","<point>"],
  "improve": ["<specific actionable tip>","<tip>","<tip>"],
  "phaseScores": {"intro":<0-100>,"technical":<0-100>,"hr":<0-100>},
  "recommendation": "<one specific preparation tip for ${selectedOrg} ECE interview>"
}`
      const text = await callGemini(apiKey, prompt)
      const clean = text.replace(/```json|```/g,'').trim()
      return JSON.parse(clean)
    } catch { return defaultFeedback() }
  }

  const defaultFeedback = () => ({
    overall: 70, summary: "Interview complete! Add your Gemini API key in Settings for AI-powered detailed feedback.",
    strengths: ["Completed the full interview session","Attempted all phases","Practice builds confidence"],
    improve: ["Add Gemini API key in Settings for personalized feedback","Review unanswered questions","Practice technical definitions"],
    phaseScores: { intro: 72, technical: 68, hr: 74 },
    recommendation: "Keep practising daily. Consistency is the key to cracking government PSU interviews."
  })

  // ── RENDERS ──────────────────────────────────────────────────

  if (stage === 'setup') return (
    <SetupScreen selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg}
      onStart={startInterview} videoRef={videoRef}
      cameraOn={cameraOn} startCamera={startCamera} stopCamera={stopCamera}
      apiKey={apiKey} nav={nav} customQCount={customQs.length} />
  )
  if (stage === 'briefing') return <LoadingScreen text="Establishing secure channel... Briefing commences." />
  if (stage === 'loading')  return <LoadingScreen text="Analysing mission performance... Generating evaluation report..." spinner />
  if (stage === 'feedback') return (
    <FeedbackScreen feedback={feedback} org={selectedOrg} answers={answers}
      timeElapsed={timeElapsed} nav={nav}
      onRetry={() => { setStage('setup'); setAnswers([]); setFeedback(null); setTimeElapsed(0) }} />
  )

  const orgData = orgInfo[selectedOrg]
  const progress = questions.length > 0 ? (qIndex / questions.length) * 100 : 0
  const timerCritical = qTimeLeft <= 30 && !isSpeaking

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, paddingTop: 58 }}>
      {/* Mission HUD Bar */}
      <div style={{
        position: 'fixed', top: 58, left: 0, right: 0, zIndex: 200,
        background: 'rgba(2,5,16,0.96)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,245,255,0.08)',
        padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap'
      }}>
        <span style={{
          fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 2, padding: '4px 10px',
          borderRadius: 4, background: `rgba(${hexRgb(orgData.color)},0.12)`,
          border: `1px solid ${orgData.color}`, color: orgData.color
        }}>{selectedOrg}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>
          {PHASE_LABELS[PHASES[phaseIdx]]}
        </span>
        <div style={{ flex: 1, height: 2, background: 'var(--rim)', borderRadius: 1 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${orgData.color}, var(--plasma))`, borderRadius: 1, transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{qIndex}/{questions.length}</span>
        <span style={{
          fontFamily: 'var(--font-hud)', fontSize: 13, fontWeight: 700, minWidth: 52, textAlign: 'center',
          color: timerCritical ? 'var(--supernova)' : 'var(--text2)',
          animation: timerCritical ? 'countdown-flash 1s infinite' : 'none'
        }}>{fmt(qTimeLeft)}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)' }}>{fmt(timeElapsed)}</span>
      </div>

      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '90px 24px 40px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* LEFT */}
        <div>
          {/* AI Question */}
          <div style={{
            padding: '24px 26px', borderRadius: 16, marginBottom: 18,
            background: 'rgba(13,30,58,0.8)', backdropFilter: 'blur(10px)',
            border: `1px solid ${isSpeaking ? orgData.color : 'var(--rim)'}`,
            boxShadow: isSpeaking ? `0 0 40px ${orgData.glow}` : 'none',
            transition: 'all 0.4s', position: 'relative', overflow: 'hidden'
          }}>
            {isSpeaking && <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: `linear-gradient(90deg, transparent, ${orgData.color}, transparent)`,
              animation: 'scanline 2s linear infinite'
            }} />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: `linear-gradient(135deg, ${orgData.color}, var(--plasma))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                boxShadow: isSpeaking ? `0 0 20px ${orgData.glow}` : 'none', transition: 'all 0.3s'
              }}>🤖</div>
              <div>
                <div style={{ fontFamily: 'var(--font-hud)', fontSize: 12, letterSpacing: 1, color: 'var(--text)' }}>AI INTERVIEWER</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: isSpeaking ? orgData.color : 'var(--text3)', letterSpacing: 1 }}>
                  {isSpeaking ? '● TRANSMITTING' : followUpMode ? '● FOLLOW-UP' : '● AWAITING RESPONSE'}
                </div>
              </div>
              {followUpMode && <span style={{
                marginLeft: 'auto', padding: '3px 10px', borderRadius: 4,
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1,
                background: 'rgba(251,191,36,0.1)', border: '1px solid var(--solar)', color: 'var(--solar)'
              }}>AI FOLLOW-UP</span>}
            </div>
            <p style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.75, fontWeight: 400 }}>
              {followUpMode ? aiFollowUp : currentQ}
            </p>
          </div>

          {/* Answer Area */}
          <div style={{
            padding: '20px 24px', borderRadius: 16, marginBottom: 18,
            background: 'rgba(13,30,58,0.6)',
            border: `1px solid ${isListening ? 'var(--pulsar)' : 'var(--rim)'}`,
            minHeight: 130, transition: 'border-color 0.3s',
            boxShadow: isListening ? '0 0 30px rgba(16,185,129,0.1)' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 2, color: 'var(--text3)' }}>YOUR RESPONSE</span>
              {isListening && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--pulsar)', animation: 'blink 1s infinite' }}>● RECORDING</span>}
            </div>
            <p style={{ fontSize: 14, color: transcript ? 'var(--text)' : 'var(--text3)', lineHeight: 1.8, fontStyle: transcript ? 'normal' : 'italic', fontFamily: transcript ? 'var(--font-body)' : 'var(--font-mono)' }}>
              {transcript || 'Press START TRANSMISSION to speak your answer...'}
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={isListening ? stopListening : startListening}
              disabled={isSpeaking}
              style={{
                padding: '12px 22px', borderRadius: 10, fontFamily: 'var(--font-hud)',
                fontSize: 11, letterSpacing: 1.5, fontWeight: 700,
                background: isListening ? 'var(--supernova)' : isSpeaking ? 'var(--rim)' : 'var(--pulsar)',
                color: isSpeaking ? 'var(--text3)' : '#000',
                boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.4)' : 'none',
                animation: isListening ? 'plasma-pulse 2s infinite' : 'none',
                transition: 'all 0.2s', opacity: isSpeaking ? 0.5 : 1
              }}>
              {isListening ? '⏹ STOP' : '🎙 START TRANSMISSION'}
            </button>
            {followUpMode ? (
              <>
                <button onClick={handleNext} style={{ padding: '12px 20px', borderRadius: 10, fontFamily: 'var(--font-hud)', fontSize: 11, letterSpacing: 1.5, background: 'var(--plasma)', color: '#000' }}>ANSWER FOLLOW-UP →</button>
                <button onClick={skipFollowUp} style={{ padding: '12px 16px', borderRadius: 10, fontFamily: 'var(--font-hud)', fontSize: 11, letterSpacing: 1, background: 'transparent', border: '1px solid var(--rim)', color: 'var(--text3)' }}>SKIP</button>
              </>
            ) : (
              <>
                <button onClick={handleNext} style={{ padding: '12px 20px', borderRadius: 10, fontFamily: 'var(--font-hud)', fontSize: 11, letterSpacing: 1.5, background: 'var(--surface2)', border: '1px solid var(--rim2)', color: 'var(--text)' }}>NEXT QUESTION →</button>
                <button onClick={finishInterview} style={{ padding: '12px 16px', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11, background: 'transparent', border: '1px solid var(--rim)', color: 'var(--text3)' }}>ABORT MISSION</button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div>
          {/* Camera */}
          <div style={{
            borderRadius: 14, overflow: 'hidden', marginBottom: 12,
            border: `2px solid ${cameraOn ? orgData.color : 'var(--rim)'}`,
            background: 'var(--cosmos)', aspectRatio: '4/3',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            boxShadow: cameraOn ? `0 0 30px ${orgData.glow}` : 'none'
          }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display: cameraOn?'block':'none', transform:'scaleX(-1)' }} />
            {!cameraOn && (
              <div style={{ textAlign:'center', padding:20 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📡</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text3)', letterSpacing:2 }}>NO SIGNAL</div>
              </div>
            )}
            {cameraOn && (
              <>
                <div style={{ position:'absolute', top:8, left:8, padding:'3px 8px', borderRadius:4, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--supernova)', display:'inline-block', animation:'blink 1s infinite' }} />
                  <span style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text)', letterSpacing:1 }}>LIVE</span>
                </div>
                {/* Corner HUD decorations */}
                {['0 0','0 auto','auto 0','auto auto'].map((m,i) => (
                  <div key={i} style={{
                    position:'absolute',
                    top: i<2 ? 6 : 'auto', bottom: i>=2 ? 6 : 'auto',
                    left: i%2===0 ? 6 : 'auto', right: i%2===1 ? 6 : 'auto',
                    width:12, height:12,
                    borderTop: i<2 ? `1px solid ${orgData.color}` : 'none',
                    borderBottom: i>=2 ? `1px solid ${orgData.color}` : 'none',
                    borderLeft: i%2===0 ? `1px solid ${orgData.color}` : 'none',
                    borderRight: i%2===1 ? `1px solid ${orgData.color}` : 'none',
                    opacity: 0.7
                  }} />
                ))}
              </>
            )}
          </div>
          <button onClick={cameraOn ? stopCamera : startCamera} style={{
            width:'100%', padding:'9px', borderRadius:8, marginBottom:14,
            fontFamily:'var(--font-hud)', fontSize:10, letterSpacing:2,
            background: cameraOn ? 'var(--surface2)' : `rgba(${hexRgb(orgData.color)},0.1)`,
            border: `1px solid ${cameraOn ? 'var(--rim)' : orgData.color}`,
            color: cameraOn ? 'var(--text3)' : orgData.color, transition:'all 0.2s'
          }}>{cameraOn ? '⬛ DISABLE FEED' : '📡 ENABLE CAMERA'}</button>

          {/* Phase tracker */}
          <div style={{ padding:'16px', borderRadius:12, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text3)', letterSpacing:2, marginBottom:12 }}>MISSION PHASES</div>
            {PHASES.map((p, i) => (
              <div key={p} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, opacity: i <= phaseIdx ? 1 : 0.35 }}>
                <div style={{
                  width:26, height:26, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:'var(--font-hud)', fontSize:10, fontWeight:700,
                  background: i < phaseIdx ? 'var(--pulsar)' : i===phaseIdx ? orgData.color : 'var(--surface)',
                  border: i===phaseIdx ? `1px solid ${orgData.color}` : '1px solid var(--rim)',
                  color: i<phaseIdx ? '#000' : i===phaseIdx ? '#000' : 'var(--text3)',
                  boxShadow: i===phaseIdx ? `0 0 12px ${orgData.glow}` : 'none'
                }}>
                  {i < phaseIdx ? '✓' : i+1}
                </div>
                <span style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:1, color: i===phaseIdx ? 'var(--text)' : 'var(--text3)' }}>
                  {PHASE_LABELS[p]}
                </span>
                {i===phaseIdx && <span style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:9, color:orgData.color, animation:'blink 2s infinite' }}>ACTIVE</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Setup Screen ──────────────────────────────────────────────
function SetupScreen({ selectedOrg, setSelectedOrg, onStart, videoRef, cameraOn, startCamera, stopCamera, apiKey, nav, customQCount }) {
  const org = orgInfo[selectedOrg]
  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1, paddingTop:58, maxWidth:840, margin:'0 auto', padding:'70px 24px 40px' }}>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', letterSpacing:3, marginBottom:10 }}>PRE-MISSION BRIEFING</p>
        <h1 style={{ fontFamily:'var(--font-hud)', fontSize:32, fontWeight:800, letterSpacing:1, color:'var(--text)', marginBottom:6 }}>
          CONFIGURE MISSION
        </h1>
        <p style={{ color:'var(--text3)', fontFamily:'var(--font-body)', fontWeight:300 }}>Select your target organisation and verify systems before launch, Keshav.</p>
      </div>
      <div style={{ display:'grid', gap:16 }}>
        {/* Org selector */}
        <div style={{ padding:'22px', borderRadius:14, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)' }}>
          <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color:'var(--text3)', marginBottom:16 }}>SELECT TARGET</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {Object.entries(orgInfo).map(([key, o]) => (
              <button key={key} onClick={() => setSelectedOrg(key)} style={{
                padding:'16px 10px', borderRadius:10, textAlign:'center',
                background: selectedOrg===key ? `rgba(${hexRgb(o.color)},0.12)` : 'rgba(5,11,26,0.8)',
                border: `2px solid ${selectedOrg===key ? o.color : 'var(--rim)'}`,
                color: selectedOrg===key ? o.color : 'var(--text3)', transition:'all 0.2s',
                boxShadow: selectedOrg===key ? `0 0 20px ${o.glow}` : 'none'
              }}>
                <div style={{ fontSize:26, marginBottom:6 }}>{o.emoji}</div>
                <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:1 }}>{key}</div>
              </button>
            ))}
          </div>
          {org && <div style={{ marginTop:14, padding:12, borderRadius:8, background:'rgba(0,0,0,0.3)', border:'1px solid var(--rim)' }}>
            <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)' }}>💡 {org.tip}</p>
          </div>}
        </div>

        {/* Camera test */}
        <div style={{ padding:'22px', borderRadius:14, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)' }}>
          <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color:'var(--text3)', marginBottom:16 }}>VISUAL FEED CHECK</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ borderRadius:10, overflow:'hidden', background:'var(--cosmos)', border:'1px solid var(--rim)', aspectRatio:'4/3', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <video ref={videoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', display:cameraOn?'block':'none', transform:'scaleX(-1)' }} />
              {!cameraOn && <div style={{ textAlign:'center', color:'var(--text3)', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:2 }}>📡<br/>NO SIGNAL</div>}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, justifyContent:'center' }}>
              <button onClick={cameraOn ? stopCamera : startCamera} style={{
                padding:'12px', borderRadius:10, fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:1,
                background: cameraOn ? 'var(--supernova)' : 'var(--pulsar)', color:'#000'
              }}>{cameraOn ? 'DISABLE FEED' : 'TEST CAMERA'}</button>
              <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:cameraOn?'var(--pulsar)':'var(--text3)', lineHeight:1.6 }}>
                {cameraOn ? '✅ Feed active. Systems nominal.' : 'Activate camera for live feed during interview.'}
              </p>
            </div>
          </div>
        </div>

        {/* System status */}
        <div style={{ padding:'18px 22px', borderRadius:14, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)', display:'flex', gap:20, flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ fontFamily:'var(--font-hud)', fontSize:10, letterSpacing:2, color:'var(--text3)' }}>SYSTEM STATUS</div>
          {[
            { l:'GEMINI API', s: apiKey ? '✅ ONLINE' : '⚠️ OFFLINE', ok:!!apiKey, action:!apiKey?()=>nav('/settings'):null },
            { l:'CUSTOM Qs', s: customQCount>0 ? `✅ ${customQCount} LOADED` : 'ℹ️ NONE', ok:true },
            { l:'MICROPHONE', s:'🎙 READY', ok:true },
          ].map(s => (
            <div key={s.l} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color: s.ok?'var(--text2)':'var(--solar)' }}>{s.l}: {s.s}</span>
              {s.action && <button onClick={s.action} style={{ padding:'3px 10px', borderRadius:4, fontFamily:'var(--font-hud)', fontSize:9, letterSpacing:1, background:'var(--solar)', color:'#000' }}>CONFIG</button>}
            </div>
          ))}
        </div>

        {/* Launch */}
        <button onClick={onStart} style={{
          padding:'18px', borderRadius:14, fontFamily:'var(--font-hud)',
          fontSize:14, letterSpacing:3, fontWeight:800,
          background: `linear-gradient(135deg, ${org?.color||'var(--plasma)'}, var(--plasma))`,
          color:'#000', animation:'plasma-pulse 3s infinite',
          display:'flex', alignItems:'center', justifyContent:'center', gap:14
        }}>
          🚀 LAUNCH {selectedOrg} MISSION
        </button>
      </div>
    </div>
  )
}

// ── Loading Screen ────────────────────────────────────────────
function LoadingScreen({ text, spinner }) {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      flexDirection:'column', gap:28, padding:40, textAlign:'center', position:'relative', zIndex:1
    }}>
      {spinner
        ? <div style={{ width:56, height:56, borderRadius:'50%', border:'2px solid var(--rim)', borderTop:`2px solid var(--plasma)`, animation:'spin 0.9s linear infinite' }} />
        : <div style={{ fontSize:56, animation:'float 3s ease-in-out infinite' }}>🤖</div>
      }
      <p style={{ fontFamily:'var(--font-hud)', fontSize:16, color:'var(--text)', maxWidth:460, lineHeight:1.7, letterSpacing:1 }}>{text}</p>
      <div style={{ display:'flex', gap:8 }}>
        {[0.1,0.3,0.5].map(d => (
          <div key={d} style={{ width:6, height:6, borderRadius:'50%', background:'var(--plasma)', animation:`blink 1.2s ${d}s infinite` }} />
        ))}
      </div>
    </div>
  )
}

// ── Feedback Screen ───────────────────────────────────────────
function FeedbackScreen({ feedback, org, answers, timeElapsed, nav, onRetry }) {
  const orgData = orgInfo[org]
  const score = feedback?.overall || 0
  const fmt = s => `${Math.floor(s/60)}m ${s%60}s`
  const scoreColor = score>=80 ? 'var(--pulsar)' : score>=60 ? 'var(--solar)' : 'var(--supernova)'

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1, paddingTop:58, maxWidth:900, margin:'0 auto', padding:'70px 24px 40px' }}>
      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ fontSize:56, marginBottom:16, animation:'float 3s ease-in-out infinite' }}>
          {score>=80 ? '🏆' : score>=60 ? '🎖️' : '💪'}
        </div>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', letterSpacing:3, marginBottom:8 }}>MISSION DEBRIEF</p>
        <h1 style={{ fontFamily:'var(--font-hud)', fontSize:28, fontWeight:800, color:'var(--text)', letterSpacing:1 }}>
          EVALUATION COMPLETE
        </h1>
      </div>

      {/* Score card */}
      <div style={{
        padding:28, borderRadius:16, marginBottom:20, textAlign:'center',
        background:'rgba(13,30,58,0.8)', border:`1px solid ${scoreColor}`,
        boxShadow: `0 0 60px rgba(${hexRgb(scoreColor==='var(--pulsar)'?'#10b981':scoreColor==='var(--solar)'?'#fbbf24':'#ef4444')},0.2)`
      }}>
        <div style={{ fontFamily:'var(--font-hud)', fontSize:80, fontWeight:900, color:scoreColor, lineHeight:1, letterSpacing:-2 }}>{score}%</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', letterSpacing:2, marginBottom:14 }}>OVERALL SCORE</div>
        <p style={{ color:'var(--text2)', maxWidth:580, margin:'0 auto', lineHeight:1.8, fontWeight:300 }}>{feedback?.summary}</p>
        <div style={{ display:'flex', justifyContent:'center', gap:32, marginTop:22, flexWrap:'wrap' }}>
          {Object.entries(feedback?.phaseScores||{}).map(([ph,s]) => (
            <div key={ph}>
              <div style={{ fontFamily:'var(--font-hud)', fontSize:24, fontWeight:800, color:'var(--plasma)' }}>{s}%</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)', letterSpacing:1, textTransform:'uppercase' }}>{ph}</div>
            </div>
          ))}
          <div>
            <div style={{ fontFamily:'var(--font-hud)', fontSize:24, fontWeight:800, color:'var(--plasma)' }}>{fmt(timeElapsed)}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text3)', letterSpacing:1 }}>DURATION</div>
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div style={{ padding:'20px', borderRadius:14, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)' }}>
          <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color:'var(--pulsar)', marginBottom:14 }}>MISSION STRENGTHS</div>
          {(feedback?.strengths||[]).map((s,i) => (
            <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--rim)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', lineHeight:1.6, fontWeight:300 }}>✓ {s}</div>
          ))}
        </div>
        <div style={{ padding:'20px', borderRadius:14, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)' }}>
          <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color:'var(--solar)', marginBottom:14 }}>IMPROVEMENT VECTORS</div>
          {(feedback?.improve||[]).map((s,i) => (
            <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--rim)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text)', lineHeight:1.6, fontWeight:300 }}>→ {s}</div>
          ))}
        </div>
      </div>

      {feedback?.recommendation && (
        <div style={{ padding:'18px 20px', borderRadius:14, marginBottom:16, background:`rgba(${hexRgb(orgData.color)},0.06)`, border:`1px solid ${orgData.color}` }}>
          <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color:orgData.color, marginBottom:10 }}>◈ {org} MISSION BRIEF</div>
          <p style={{ fontFamily:'var(--font-body)', fontSize:14, color:'var(--text)', lineHeight:1.8, fontWeight:300 }}>{feedback.recommendation}</p>
        </div>
      )}

      {/* Q&A Review */}
      <div style={{ padding:'20px', borderRadius:14, marginBottom:24, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)' }}>
        <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color:'var(--text3)', marginBottom:16 }}>TRANSMISSION LOG</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {answers.map((qa, i) => (
            <div key={i} style={{ padding:'12px 16px', borderRadius:10, background:'rgba(5,11,26,0.7)', border:'1px solid var(--rim)' }}>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text3)', letterSpacing:1, marginBottom:5 }}>Q{i+1} · {qa.phase.toUpperCase()}</div>
              <p style={{ fontSize:13, color:'var(--text2)', marginBottom:6, lineHeight:1.5 }}>{qa.q}</p>
              <p style={{ fontSize:13, color: qa.a?'var(--text)':'var(--text3)', fontStyle:qa.a?'normal':'italic', lineHeight:1.6, fontWeight:qa.a?400:300 }}>
                {qa.a || '(no response recorded)'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', gap:12 }}>
        <button onClick={onRetry} style={{
          flex:1, padding:'16px', borderRadius:12, fontFamily:'var(--font-hud)',
          fontSize:12, letterSpacing:2, fontWeight:800,
          background:`linear-gradient(135deg, ${orgData.color}, var(--plasma))`, color:'#000'
        }}>⟳ RETRY MISSION</button>
        <button onClick={() => nav('/')} style={{
          padding:'16px 20px', borderRadius:12, fontFamily:'var(--font-hud)',
          fontSize:12, letterSpacing:2,
          background:'var(--surface)', border:'1px solid var(--rim)', color:'var(--text2)'
        }}>⬡ HOME BASE</button>
      </div>
    </div>
  )
}

function hexRgb(hex) {
  if (!hex || hex.startsWith('var')) return '0,245,255'
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '0,245,255'
}
