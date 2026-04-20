import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motivationalQuotes, orgInfo } from '../data/questions.js'

export default function Home() {
  const nav = useNavigate()
  const [quote] = useState(() => motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)])
  const [time, setTime] = useState(new Date())
  const [hovered, setHovered] = useState(null)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    const r = setTimeout(() => setRevealed(true), 100)
    return () => { clearInterval(t); clearTimeout(r) }
  }, [])

  const greeting = () => {
    const h = time.getHours()
    if (h < 5)  return 'Late night grind'
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    if (h < 21) return 'Good evening'
    return 'Night shift, respect'
  }

  const missionDate = (() => {
    const d = time
    return `STARDATE ${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`
  })()

  return (
    <div style={{ minHeight: '100vh', position: 'relative', zIndex: 1, paddingTop: 58 }}>
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '48px 24px 60px' }}>

        {/* HUD top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 48, flexWrap: 'wrap', gap: 12,
          opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(16px)',
          transition: 'all 0.6s ease'
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['SYSTEM ONLINE','ECE CANDIDATE','MISSION ACTIVE'].map((s,i) => (
              <span key={s} style={{
                padding: '4px 12px', borderRadius: 4,
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
                background: 'rgba(0,245,255,0.06)', border: '1px solid rgba(0,245,255,0.15)',
                color: 'var(--plasma)', animation: `star-birth 0.4s ${i*0.1}s both`
              }}>{s}</span>
            ))}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>{missionDate}</span>
        </div>

        {/* Hero */}
        <div style={{
          marginBottom: 56,
          opacity: revealed ? 1 : 0, transform: revealed ? 'none' : 'translateY(24px)',
          transition: 'all 0.7s 0.1s ease'
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)', letterSpacing: 3, marginBottom: 14 }}>
            {greeting().toUpperCase()}, CADET —
          </p>
          <h1 style={{
            fontFamily: 'var(--font-hud)', fontWeight: 900,
            fontSize: 'clamp(40px, 7vw, 82px)', lineHeight: 1.05,
            marginBottom: 16, letterSpacing: -1
          }}>
            <span style={{ color: 'var(--text)' }}>KESHAV</span><br />
            <span style={{
              background: 'linear-gradient(90deg, var(--plasma) 0%, var(--nova2) 50%, var(--solar) 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', backgroundSize: '200%',
              animation: 'shimmer 4s linear infinite',
              display: 'inline-block'
            }}>MISSION HQ</span>
          </h1>
          <p style={{
            fontSize: 16, color: 'var(--text2)', maxWidth: 520, lineHeight: 1.8,
            fontWeight: 300
          }}>
            Your AI-powered mock interview command centre.<br />
            DRDO · ISRO · NIC · NPCIL — ECE Division.
          </p>
        </div>

        {/* Quote Card */}
        <div style={{
          padding: '24px 28px', borderRadius: 16, marginBottom: 56,
          background: 'linear-gradient(135deg, rgba(0,245,255,0.04), rgba(124,58,237,0.04))',
          border: '1px solid rgba(0,245,255,0.12)',
          position: 'relative', overflow: 'hidden',
          opacity: revealed ? 1 : 0, transition: 'all 0.7s 0.2s ease'
        }}>
          {/* Scan line effect */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, var(--plasma), transparent)',
            animation: 'scanline 6s linear infinite', opacity: 0.3
          }} />
          <div style={{
            position: 'absolute', top: -30, right: -30,
            fontSize: 120, fontFamily: 'Georgia, serif', color: 'var(--plasma)',
            opacity: 0.04, lineHeight: 1, pointerEvents: 'none'
          }}>"</div>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 300,
            color: 'var(--text)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 12
          }}>"{quote.text}"</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--plasma)', letterSpacing: 1 }}>
            — {quote.author}
          </p>
        </div>

        {/* Target Organisations */}
        <div style={{
          marginBottom: 56,
          opacity: revealed ? 1 : 0, transition: 'all 0.7s 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: 13, letterSpacing: 3, color: 'var(--plasma)' }}>
              ◈ TARGET SYSTEMS
            </h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(0,245,255,0.3), transparent)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>
            {Object.entries(orgInfo).map(([key, org], i) => (
              <OrgCard key={key} orgKey={key} org={org} delay={i * 80}
                onStart={() => nav(`/interview?org=${key}`)} />
            ))}
          </div>
        </div>

        {/* Quick Action Pods */}
        <div style={{
          opacity: revealed ? 1 : 0, transition: 'all 0.7s 0.45s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'var(--font-hud)', fontSize: 13, letterSpacing: 3, color: 'var(--text3)' }}>
              ◎ LAUNCH PODS
            </h2>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.06), transparent)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <PodCard icon="🎙️" title="FULL MISSION" desc="Complete 3-phase interview with camera, voice, and AI evaluation" color="var(--plasma)" onClick={() => nav('/interview')} />
            <PodCard icon="📡" title="SIGNAL EXTRACT" desc="Paste a YouTube interview experience link — AI reads it and extracts real questions" color="var(--supernova)" onClick={() => nav('/youtube-extract')} />
            <PodCard icon="⚙️" title="SYSTEM CONFIG" desc="Add your free Gemini API key to unlock AI feedback and YouTube extraction" color="var(--solar)" onClick={() => nav('/settings')} />
          </div>
        </div>

        {/* Stats */}
        <div style={{
          marginTop: 56, padding: '20px 28px',
          borderRadius: 12, border: '1px solid var(--rim)',
          background: 'rgba(13,30,58,0.5)',
          display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'center',
          opacity: revealed ? 1 : 0, transition: 'all 0.7s 0.55s ease'
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 2 }}>MISSION STATS</div>
          {[['100+','Questions Loaded'],['4','Organisations'],['3','Interview Phases'],['FREE','Gemini Powered']].map(([v,l]) => (
            <div key={l}>
              <div style={{ fontFamily: 'var(--font-hud)', fontSize: 22, fontWeight: 700, color: 'var(--plasma)' }}>{v}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', letterSpacing: 1 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrgCard({ orgKey, org, onStart, delay }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onStart}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '22px 20px', borderRadius: 14, cursor: 'pointer',
        background: hover ? `rgba(${hexRgb(org.color)},0.08)` : 'rgba(13,30,58,0.6)',
        border: `1px solid ${hover ? org.color : 'var(--rim)'}`,
        transform: hover ? 'translateY(-4px) scale(1.01)' : 'none',
        boxShadow: hover ? `0 12px 40px ${org.glow}` : 'none',
        transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        animation: `star-birth 0.5s ${delay}ms both`,
        position: 'relative', overflow: 'hidden'
      }}>
      {/* Corner decoration */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 40, height: 40,
        borderLeft: `1px solid ${hover ? org.color : 'transparent'}`,
        borderBottom: `1px solid ${hover ? org.color : 'transparent'}`,
        transition: 'all 0.3s', opacity: 0.5
      }} />
      <div style={{ fontSize: 30, marginBottom: 10 }}>{org.emoji}</div>
      <div style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 4, marginBottom: 10,
        background: `rgba(${hexRgb(org.color)},0.12)`,
        fontFamily: 'var(--font-hud)', fontSize: 11, letterSpacing: 2, color: org.color
      }}>{orgKey}</div>
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
        {org.fullName}
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text3)', marginBottom: 14, letterSpacing: 0.5 }}>
        {org.short}
      </div>
      <div style={{
        padding: '8px 14px', borderRadius: 8, textAlign: 'center',
        background: hover ? org.color : 'transparent',
        border: `1px solid ${hover ? org.color : 'var(--rim)'}`,
        fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 1.5,
        color: hover ? '#000' : 'var(--text2)',
        transition: 'all 0.2s', fontWeight: 700
      }}>INITIATE INTERVIEW</div>
    </div>
  )
}

function PodCard({ icon, title, desc, color, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        padding: '22px 20px', borderRadius: 14, cursor: 'pointer',
        background: hover ? 'rgba(13,30,58,0.9)' : 'rgba(13,30,58,0.5)',
        border: `1px solid ${hover ? 'var(--rim2)' : 'var(--rim)'}`,
        transform: hover ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s ease'
      }}>
      <div style={{ fontSize: 26, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontFamily: 'var(--font-hud)', fontSize: 12, letterSpacing: 2, color, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text3)', lineHeight: 1.6, fontWeight: 300 }}>{desc}</div>
    </div>
  )
}

function hexRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? `${parseInt(r[1],16)},${parseInt(r[2],16)},${parseInt(r[3],16)}` : '0,245,255'
}
