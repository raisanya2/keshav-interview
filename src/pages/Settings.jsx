import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const nav = useNavigate()
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved]   = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [popupMsg, setPopupMsg] = useState('')
  const [msgSaved, setMsgSaved] = useState(false)

  useEffect(() => {
    setApiKey(localStorage.getItem('gemini_api_key') || '')
    setPopupMsg(localStorage.getItem('popup_custom_message') || '')
  }, [])

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey.trim())
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  const testKey = async () => {
    if (!apiKey.trim()) { setTestResult({ ok:false, msg:'Enter an API key first.' }); return }
    setTesting(true); setTestResult(null)
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey.trim()}`,
        {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ contents:[{ parts:[{ text:'Reply with exactly: GEMINI ONLINE' }] }] })
        }
      )
      const d = await res.json()
      if (d.error) throw new Error(d.error.message)
      setTestResult({ ok:true, msg:'✅ Gemini API key is valid and online!' })
    } catch(e) {
      setTestResult({ ok:false, msg:`❌ ${e.message}` })
    } finally { setTesting(false) }
  }

  const savePopupMsg = () => {
    localStorage.setItem('popup_custom_message', popupMsg)
    setMsgSaved(true); setTimeout(() => setMsgSaved(false), 2000)
    alert('Message saved! It will show next time Keshav opens the site. To reset daily trigger, clear browser localStorage.')
  }

  const resetPopup = () => {
    localStorage.removeItem('popup_last_seen')
    alert('Popup will show on next page reload!')
  }

  return (
    <div style={{ minHeight:'100vh', position:'relative', zIndex:1, paddingTop:58, maxWidth:720, margin:'0 auto', padding:'70px 24px 40px' }}>
      <div style={{ marginBottom:32 }}>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', letterSpacing:3, marginBottom:10 }}>SYSTEM CONFIGURATION</p>
        <h1 style={{ fontFamily:'var(--font-hud)', fontSize:32, fontWeight:800, letterSpacing:1, color:'var(--text)' }}>CONFIG PANEL</h1>
      </div>

      {/* Gemini API Key */}
      <Section title="GEMINI API KEY" color="var(--plasma)">
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text3)', lineHeight:1.7, marginBottom:18, fontWeight:300 }}>
          Free Gemini API key from Google AI Studio unlocks AI feedback, dynamic follow-up questions, and YouTube video analysis.
          Get yours free at{' '}
          <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" style={{ color:'var(--plasma)', textDecoration:'underline' }}>aistudio.google.com</a>
        </p>
        <div style={{ display:'flex', gap:10, marginBottom:12 }}>
          <div style={{ flex:1, position:'relative' }}>
            <input type={showKey?'text':'password'} value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width:'100%', padding:'12px 44px 12px 16px', borderRadius:8,
                background:'rgba(5,11,26,0.9)', border:'1px solid var(--rim2)',
                color:'var(--text)', fontSize:13, outline:'none',
                fontFamily:'var(--font-mono)', boxSizing:'border-box'
              }} />
            <button onClick={() => setShowKey(!showKey)} style={{
              position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
              background:'transparent', color:'var(--text3)', fontSize:15
            }}>{showKey?'🙈':'👁️'}</button>
          </div>
          <button onClick={handleSave} style={{
            padding:'12px 20px', borderRadius:8,
            fontFamily:'var(--font-hud)', fontSize:10, letterSpacing:1.5, fontWeight:700,
            background: saved ? 'var(--pulsar)' : 'var(--plasma)', color:'#000',
            minWidth:90, transition:'background 0.3s'
          }}>{saved ? 'SAVED ✓' : 'SAVE'}</button>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={testKey} disabled={testing} style={{
            padding:'8px 16px', borderRadius:6,
            fontFamily:'var(--font-hud)', fontSize:10, letterSpacing:1,
            background:'var(--surface2)', border:'1px solid var(--rim2)', color:'var(--text2)'
          }}>{testing ? '⏳ PINGING...' : '◎ TEST CONNECTION'}</button>
          {testResult && <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color: testResult.ok?'var(--pulsar)':'var(--supernova)' }}>{testResult.msg}</span>}
        </div>
        <div style={{ marginTop:14, padding:'12px 14px', borderRadius:8, background:'rgba(0,0,0,0.2)', border:'1px solid var(--rim)' }}>
          <p style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text3)', lineHeight:1.6 }}>
            🔒 Your API key is stored only in your browser localStorage. Never sent to any server except Google's Gemini API directly.
          </p>
        </div>
      </Section>

      {/* Popup Message Editor */}
      <Section title="PERSONAL MESSAGE TO KESHAV" color="var(--nova2)">
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'var(--text3)', lineHeight:1.7, marginBottom:16, fontWeight:300 }}>
          Edit the popup message that appears when Keshav opens the website. To edit the sender name or other popup settings, edit <code style={{ color:'var(--plasma)', background:'rgba(0,245,255,0.08)', padding:'1px 6px', borderRadius:4 }}>src/components/PopupMessage.jsx</code> directly.
        </p>
        <textarea
          value={popupMsg}
          onChange={e => setPopupMsg(e.target.value)}
          placeholder="Type your personal message to Keshav here..."
          rows={6}
          style={{
            width:'100%', padding:'14px 16px', borderRadius:8, resize:'vertical',
            background:'rgba(5,11,26,0.9)', border:'1px solid var(--rim2)',
            color:'var(--text)', fontSize:13, outline:'none', lineHeight:1.8,
            fontFamily:'var(--font-body)', fontWeight:300, boxSizing:'border-box',
            marginBottom:12
          }}
        />
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={savePopupMsg} style={{
            padding:'10px 20px', borderRadius:8,
            fontFamily:'var(--font-hud)', fontSize:10, letterSpacing:1.5,
            background: msgSaved ? 'var(--pulsar)' : 'var(--nova)', color:'#fff', fontWeight:700
          }}>{msgSaved ? 'SAVED ✓' : 'SAVE MESSAGE'}</button>
          <button onClick={resetPopup} style={{
            padding:'10px 16px', borderRadius:8,
            fontFamily:'var(--font-mono)', fontSize:11,
            background:'transparent', border:'1px solid var(--rim2)', color:'var(--text2)'
          }}>RESET POPUP TRIGGER</button>
        </div>
        <p style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text3)', marginTop:10 }}>
          Note: To edit the full popup (emoji, title, sender name), open PopupMessage.jsx and update POPUP_CONFIG at the top.
        </p>
      </Section>

      {/* Feature Status */}
      <Section title="SYSTEM STATUS" color="var(--text3)">
        {[
          { f:'Mock Interview (Questions)',  s:'✅ ONLINE',  ok:true,  d:'100+ real DRDO/ISRO/NIC/NPCIL questions pre-loaded' },
          { f:'Gemini AI Feedback',          s: apiKey?'✅ ONLINE':'⚠️ OFFLINE', ok:!!apiKey, d:'Personalised scoring after each interview session' },
          { f:'AI Follow-up Questions',      s: apiKey?'✅ ONLINE':'⚠️ OFFLINE', ok:!!apiKey, d:'Gemini generates dynamic follow-ups based on your answers' },
          { f:'YouTube Question Extraction', s: apiKey?'✅ ONLINE':'⚠️ OFFLINE', ok:!!apiKey, d:'Gemini reads actual YouTube video content' },
          { f:'Voice Recognition (STT)',     s:'✅ ONLINE',  ok:true,  d:'Chrome built-in — use Google Chrome for best accuracy' },
          { f:'Interviewer Voice (TTS)',      s:'✅ ONLINE',  ok:true,  d:'Browser speech synthesis — interviewer speaks questions aloud' },
          { f:'Live Camera Feed',            s:'✅ ONLINE',  ok:true,  d:'Realistic mock interview experience with live camera' },
          { f:'Popup Message System',        s:'✅ ONLINE',  ok:true,  d:'Personal message shown when Keshav opens the site' },
        ].map(item => (
          <div key={item.f} style={{ padding:'11px 0', borderBottom:'1px solid var(--rim)', display:'flex', gap:14, alignItems:'flex-start' }}>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-hud)', fontSize:12, letterSpacing:0.5, color:'var(--text)', marginBottom:2 }}>{item.f}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'var(--text3)', fontWeight:300 }}>{item.d}</div>
            </div>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, whiteSpace:'nowrap', color: item.ok ? 'var(--pulsar)' : 'var(--solar)' }}>{item.s}</span>
          </div>
        ))}
      </Section>

      {/* Tips */}
      <Section title="MISSION TIPS" color="var(--solar)">
        {[
          'Use Google Chrome — best speech recognition accuracy',
          'Sit in a quiet, well-lit room and wear formal clothes',
          'Treat every practice session as the real interview',
          'After each session, study every question you couldn\'t answer',
          'Practice introduction daily — first impression matters most',
          'For DRDO/ISRO: focus on core ECE + domain specific theory',
          'For NIC: brush up networking, security, cloud concepts',
          'For NPCIL: instrumentation, safety systems, nuclear basics',
        ].map((t, i) => (
          <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid var(--rim)', fontFamily:'var(--font-body)', fontSize:13, color:'var(--text2)', fontWeight:300 }}>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--solar)', marginRight:10 }}>{String(i+1).padStart(2,'0')}</span>{t}
          </div>
        ))}
      </Section>

      <div style={{ display:'flex', gap:12, marginTop:8 }}>
        <button onClick={() => nav('/interview')} style={{
          flex:1, padding:'14px', borderRadius:12,
          fontFamily:'var(--font-hud)', fontSize:12, letterSpacing:2, fontWeight:800,
          background:'linear-gradient(135deg, var(--plasma2), var(--nova))', color:'#fff'
        }}>🚀 LAUNCH INTERVIEW</button>
        <button onClick={() => nav('/')} style={{
          padding:'14px 20px', borderRadius:12,
          fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:1,
          background:'var(--surface)', border:'1px solid var(--rim)', color:'var(--text3)'
        }}>⬡ HOME</button>
      </div>
    </div>
  )
}

function Section({ title, color, children }) {
  return (
    <div style={{ padding:'22px', borderRadius:14, background:'rgba(13,30,58,0.7)', border:'1px solid var(--rim)', marginBottom:16 }}>
      <div style={{ fontFamily:'var(--font-hud)', fontSize:11, letterSpacing:2, color: color||'var(--text3)', marginBottom:18,
        paddingBottom:12, borderBottom:'1px solid var(--rim)' }}>{title}</div>
      {children}
    </div>
  )
}
