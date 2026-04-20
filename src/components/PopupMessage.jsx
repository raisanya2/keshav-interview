import React, { useState, useEffect } from 'react'

// ╔══════════════════════════════════════════════════╗
// ║  EDIT YOUR MESSAGE TO KESHAV HERE ↓              ║
// ╚══════════════════════════════════════════════════╝
const POPUP_CONFIG = {
  enabled: true,           // set false to disable popup
  showOnce: true,          // true = only shows once per day | false = every visit
  senderName: "Your biggest fan 💫",
  message: `Hey Keshav! 🚀

I made this just for you. Every question here is from real DRDO, ISRO, NIC and NPCIL interviews — practice them like it's the real thing.

You've worked so hard for this. I believe in you more than you know. Today's practice = tomorrow's selection letter. 

Go crack it. I'm proud of you already. 💙`,
  emoji: "💌",
  title: "A message for you, Keshav"
}

export default function PopupMessage() {
  const [show, setShow] = useState(false)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!POPUP_CONFIG.enabled) return
    if (POPUP_CONFIG.showOnce) {
      const lastSeen = localStorage.getItem('popup_last_seen')
      const today = new Date().toDateString()
      if (lastSeen === today) return
    }
    const t = setTimeout(() => setShow(true), 1200)
    return () => clearTimeout(t)
  }, [])

  const close = () => {
    setClosing(true)
    if (POPUP_CONFIG.showOnce) {
      localStorage.setItem('popup_last_seen', new Date().toDateString())
    }
    setTimeout(() => { setShow(false); setClosing(false) }, 400)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,15,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      animation: closing ? 'fadeIn 0.4s ease reverse' : 'fadeIn 0.4s ease both'
    }} onClick={close}>
      <div onClick={e => e.stopPropagation()} style={{
        maxWidth: 480, width: '100%',
        background: 'linear-gradient(145deg, #0a1628, #0d1e3a)',
        border: '1px solid rgba(0,245,255,0.3)',
        borderRadius: 20,
        boxShadow: '0 0 80px rgba(0,245,255,0.15), 0 0 200px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
        overflow: 'hidden',
        animation: closing ? 'modal-enter 0.4s ease reverse' : 'modal-enter 0.5s cubic-bezier(0.34,1.56,0.64,1) both'
      }}>
        {/* Top bar */}
        <div style={{
          padding: '14px 20px',
          background: 'linear-gradient(90deg, rgba(0,245,255,0.08), rgba(124,58,237,0.08))',
          borderBottom: '1px solid rgba(0,245,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: 'var(--plasma)',
              animation: 'blink 2s infinite', boxShadow: '0 0 8px var(--plasma)'
            }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--plasma)', letterSpacing: 2 }}>
              INCOMING TRANSMISSION
            </span>
          </div>
          <button onClick={close} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--text2)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 28px 24px' }}>
          {/* Emoji + Title */}
          <div style={{ textAlign: 'center', marginBottom: 22 }}>
            <div style={{
              fontSize: 48, marginBottom: 12,
              animation: 'float 3s ease-in-out infinite',
              display: 'inline-block'
            }}>{POPUP_CONFIG.emoji}</div>
            <div style={{
              fontFamily: 'var(--font-hud)', fontSize: 14, fontWeight: 600,
              color: 'var(--plasma)', letterSpacing: 1
            }}>{POPUP_CONFIG.title}</div>
          </div>

          {/* Message */}
          <div style={{
            padding: '18px 20px', borderRadius: 12,
            background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,245,255,0.1)',
            marginBottom: 20
          }}>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 14.5, color: 'var(--text)',
              lineHeight: 1.85, whiteSpace: 'pre-line', fontStyle: 'italic',
              fontWeight: 300
            }}>{POPUP_CONFIG.message}</p>
          </div>

          {/* Sender */}
          <div style={{
            textAlign: 'right',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', marginBottom: 20
          }}>— {POPUP_CONFIG.senderName}</div>

          {/* Stars decoration */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 22 }}>
            {['var(--plasma)','var(--nova2)','var(--solar)','var(--nova2)','var(--plasma)'].map((c,i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%', background: c,
                opacity: 0.7, animation: `twinkle ${1.5+i*0.3}s ${i*0.2}s ease-in-out infinite`
              }} />
            ))}
          </div>

          {/* Button */}
          <button onClick={close} style={{
            width: '100%', padding: '14px',
            borderRadius: 12, fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-hud)', letterSpacing: 1,
            background: 'linear-gradient(135deg, var(--plasma2), var(--nova))',
            color: '#fff', border: 'none',
            boxShadow: '0 4px 20px rgba(0,245,255,0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.target.style.transform='scale(1.02)'}
          onMouseLeave={e => e.target.style.transform='scale(1)'}
          >
            LET'S DO THIS 🚀
          </button>
        </div>
      </div>
    </div>
  )
}
