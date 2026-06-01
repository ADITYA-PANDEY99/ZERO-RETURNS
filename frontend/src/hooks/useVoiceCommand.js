import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

/**
 * useVoiceCommand — Web Speech API based voice navigation
 * 
 * Supported commands:
 * "go to dashboard"      → /dashboard
 * "open analytics"       → /analytics
 * "upload data"          → /upload
 * "show orders"          → /orders
 * "open settings"        → /settings
 * "go home"              → /
 * "show high risk"       → filters orders by High
 * "stop listening"       → stops recognition
 */
export function useVoiceCommand() {
  const navigate = useNavigate()
  const recognitionRef = useRef(null)
  const [isListening, setIsListening] = useState(false)
  const [lastCommand, setLastCommand] = useState('')

  const COMMANDS = [
    { patterns: ['go to dashboard', 'open dashboard', 'dashboard'], action: () => navigate('/dashboard') },
    { patterns: ['open analytics', 'analytics', 'show analytics'], action: () => navigate('/analytics') },
    { patterns: ['upload data', 'upload', 'upload file'], action: () => navigate('/upload') },
    { patterns: ['show orders', 'orders', 'open orders'], action: () => navigate('/orders') },
    { patterns: ['open settings', 'settings', 'preferences'], action: () => navigate('/settings') },
    { patterns: ['go home', 'home', 'landing'], action: () => navigate('/') },
    { patterns: ['go back'], action: () => window.history.back() },
  ]

  const processCommand = useCallback((transcript) => {
    const text = transcript.toLowerCase().trim()
    setLastCommand(text)

    let matched = false
    for (const cmd of COMMANDS) {
      if (cmd.patterns.some(p => text.includes(p))) {
        cmd.action()
        toast.success(`🎤 Command: "${text}"`, { duration: 3000 })
        matched = true
        break
      }
    }

    if (!matched) {
      toast(`🎤 Command not recognized: "${text}"`, { icon: '🤷', duration: 3000 })
    }
  }, [navigate])

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Voice commands not supported in this browser.')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = 'en-IN'
    rec.continuous = true
    rec.interimResults = false

    rec.onstart = () => setIsListening(true)
    rec.onend = () => setIsListening(false)
    rec.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      if (result.isFinal) {
        processCommand(result[0].transcript)
      }
    }
    rec.onerror = (event) => {
      console.warn('[VoiceCommand] Error:', event.error)
      setIsListening(false)
    }

    recognitionRef.current = rec
    rec.start()
  }, [processCommand])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening()
  }, [stopListening])

  return { isListening, toggleListening, startListening, stopListening, lastCommand }
}
