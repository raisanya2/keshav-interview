import React, { useEffect, useRef } from 'react'

export default function StarField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let W = canvas.width = window.innerWidth
    let H = canvas.height = window.innerHeight
    let raf

    const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight }
    window.addEventListener('resize', resize)

    // Stars
    const stars = Array.from({ length: 280 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.8 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.003 + 0.001,
      color: ['#ffffff','#aad4ff','#ffeedd','#ccddff'][Math.floor(Math.random()*4)]
    }))

    // Shooting stars
    const shooters = []
    const addShooter = () => {
      shooters.push({
        x: Math.random() * W * 0.7,
        y: Math.random() * H * 0.4,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 8 + 6,
        angle: Math.PI / 5,
        life: 1, decay: Math.random() * 0.015 + 0.01
      })
    }
    setInterval(addShooter, 2800)

    // Nebula blobs
    const nebulas = [
      { x: W*0.15, y: H*0.25, r: 220, color: 'rgba(124,58,237,0.07)' },
      { x: W*0.85, y: H*0.6,  r: 280, color: 'rgba(0,245,255,0.05)' },
      { x: W*0.5,  y: H*0.8,  r: 200, color: 'rgba(16,185,129,0.04)' },
      { x: W*0.7,  y: H*0.15, r: 160, color: 'rgba(251,191,36,0.04)' },
    ]

    let t = 0
    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      // Deep space gradient
      const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H))
      bg.addColorStop(0, '#020818')
      bg.addColorStop(0.5, '#010510')
      bg.addColorStop(1, '#00000f')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Nebulas
      nebulas.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.color)
        g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI*2)
        ctx.fill()
      })

      // Stars
      t += 0.01
      stars.forEach(s => {
        s.a = 0.3 + 0.7 * Math.abs(Math.sin(t * s.speed * 100 + s.x))
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI*2)
        ctx.fillStyle = s.color
        ctx.globalAlpha = s.a
        ctx.fill()
        ctx.globalAlpha = 1
        // Glow for bright stars
        if (s.r > 1.4) {
          ctx.beginPath()
          ctx.arc(s.x, s.y, s.r * 2.5, 0, Math.PI*2)
          ctx.fillStyle = s.color
          ctx.globalAlpha = s.a * 0.15
          ctx.fill()
          ctx.globalAlpha = 1
        }
      })

      // Shooting stars
      for (let i = shooters.length - 1; i >= 0; i--) {
        const sh = shooters[i]
        sh.x += Math.cos(sh.angle) * sh.speed
        sh.y += Math.sin(sh.angle) * sh.speed
        sh.life -= sh.decay
        if (sh.life <= 0) { shooters.splice(i, 1); continue }
        const grad = ctx.createLinearGradient(
          sh.x, sh.y,
          sh.x - Math.cos(sh.angle) * sh.len,
          sh.y - Math.sin(sh.angle) * sh.len
        )
        grad.addColorStop(0, `rgba(0,245,255,${sh.life * 0.9})`)
        grad.addColorStop(0.3, `rgba(255,255,255,${sh.life * 0.6})`)
        grad.addColorStop(1, 'transparent')
        ctx.strokeStyle = grad
        ctx.lineWidth = sh.life * 1.5
        ctx.beginPath()
        ctx.moveTo(sh.x, sh.y)
        ctx.lineTo(sh.x - Math.cos(sh.angle)*sh.len, sh.y - Math.sin(sh.angle)*sh.len)
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={canvasRef} style={{
      position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none'
    }} />
  )
}
