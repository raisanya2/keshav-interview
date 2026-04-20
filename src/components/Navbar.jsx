import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Navbar() {
  const nav = useNavigate()
  const loc = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', s)
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => { window.removeEventListener('scroll', s); clearInterval(t) }
  }, [])

  const links = [
    { path: '/', label: 'HOME', icon: '⬡' },
    { path: '/interview', label: 'MISSION', icon: '◈' },
    { path: '/youtube-extract', label: 'EXTRACT', icon: '◎' },
    { path: '/settings', label: 'CONFIG', icon: '⚙' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(2,5,16,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(20px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,245,255,0.1)' : 'none',
      padding: '0 32px',
      height: 58,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      transition: 'all 0.4s ease'
    }}>
      {/* Logo */}
      <div onClick={() => nav('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
        <div style={{ position: 'relative', width: 34, height: 34 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--plasma), var(--nova))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-hud)', fontSize: 14, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 20px rgba(0,245,255,0.4)'
          }}>K</div>
          <div style={{
            position: 'absolute', inset: -3,
            border: '1px solid rgba(0,245,255,0.4)',
            borderRadius: '50%', animation: 'spin 8s linear infinite'
          }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-hud)', fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: 2 }}>
            KESHAV<span style={{ color: 'var(--plasma)' }}>.AI</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text3)', letterSpacing: 1 }}>MISSION CONTROL</div>
        </div>
      </div>

      {/* Links */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {links.map(l => {
          const active = loc.pathname === l.path
          return (
            <button key={l.path} onClick={() => nav(l.path)} style={{
              padding: '7px 16px', borderRadius: 6,
              fontFamily: 'var(--font-hud)', fontSize: 10, letterSpacing: 1.5, fontWeight: 600,
              background: active ? 'rgba(0,245,255,0.1)' : 'transparent',
              color: active ? 'var(--plasma)' : 'var(--text3)',
              border: active ? '1px solid rgba(0,245,255,0.25)' : '1px solid transparent',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6
            }}
            onMouseEnter={e => { if(!active){e.currentTarget.style.color='var(--text2)'; e.currentTarget.style.borderColor='rgba(0,245,255,0.1)'} }}
            onMouseLeave={e => { if(!active){e.currentTarget.style.color='var(--text3)'; e.currentTarget.style.borderColor='transparent'} }}
            >
              <span style={{ fontSize: 11 }}>{l.icon}</span> {l.label}
            </button>
          )
        })}
      </div>

      {/* Clock */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', letterSpacing: 1 }}>
        {time.toLocaleTimeString('en-IN', { hour12: false })}
      </div>
    </nav>
  )
}
