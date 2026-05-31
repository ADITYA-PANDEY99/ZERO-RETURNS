import { useEffect, useRef, useState } from 'react'
import { useThemeStore } from '../../store/themeStore'

export default function CursorTrail() {
  const canvasRef = useRef(null)
  const particles = useRef([])
  const mousePos = useRef({ x: -999, y: -999 })
  const animRef = useRef(null)
  const { theme } = useThemeStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getTrailColors = () => {
    const themeColors = {
      glass: { colors: ['#8B5CF6', '#7C3AED', '#06B6D4', '#A78BFA'], glow: 'rgba(139,92,246,0.6)' },
      'dark-luxury': { colors: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'], glow: 'rgba(37,99,235,0.6)' },
      'deep-space': { colors: ['#F59E0B', '#FCD34D', '#FB923C', '#FBBF24'], glow: 'rgba(245,158,11,0.6)' },
      arctic: { colors: ['#06B6D4', '#0891B2', '#0EA5E9', '#67E8F9'], glow: 'rgba(6,182,212,0.6)' },
      ember: { colors: ['#F97316', '#EF4444', '#FBBF24', '#FB923C'], glow: 'rgba(249,115,22,0.6)' },
    }
    return themeColors[theme] || themeColors.glass
  }

  useEffect(() => {
    if (isMobile) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouseMove = (e) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    const createParticle = () => {
      const { colors } = getTrailColors()
      const color = colors[Math.floor(Math.random() * colors.length)]
      const size = Math.random() * 6 + 2
      return {
        x: mousePos.current.x + (Math.random() - 0.5) * 10,
        y: mousePos.current.y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.5,
        life: 1,
        decay: Math.random() * 0.02 + 0.02,
        size,
        color,
        originalSize: size,
      }
    }

    let frame = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Add new particles every few frames
      frame++
      if (frame % 2 === 0 && mousePos.current.x > 0) {
        for (let i = 0; i < 3; i++) {
          particles.current.push(createParticle())
        }
      }

      // Keep particle count manageable
      if (particles.current.length > 150) {
        particles.current = particles.current.slice(-150)
      }

      // Update and draw particles
      particles.current = particles.current.filter(p => p.life > 0)
      particles.current.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // gravity
        p.life -= p.decay
        p.size = p.originalSize * p.life

        ctx.save()
        ctx.globalAlpha = p.life * 0.8
        ctx.shadowBlur = 15
        ctx.shadowColor = p.color
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(0, p.size), 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animRef.current)
    }
  }, [theme, isMobile])

  if (isMobile) return null

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        mixBlendMode: 'screen',
      }}
    />
  )
}
