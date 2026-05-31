import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Mic, MicOff, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/helpers'

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Namaste! I am ZeroReturn AI. 🤖 I can help you analyze risk scores, return rates, or recommend listings enhancements. Ask me anything!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ])
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)
  const recognitionRef = useRef(null)

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Setup Web Speech API for voice commands
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onstart = () => setIsListening(true)
      rec.onend = () => setIsListening(false)
      rec.onresult = (event) => {
        const text = event.results[0][0].transcript
        setInput(text)
        toast.success(`Voice captured: "${text}"`)
      }
      rec.onerror = () => {
        toast.error('Voice recognition failed. Try speaking clearer.')
        setIsListening(false)
      }
      recognitionRef.current = rec
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Web Speech API is not supported in this browser.')
      return
    }
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const handleSend = (e) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    const query = input.toLowerCase()
    setInput('')

    // Simulate typing
    setIsTyping(true)
    setTimeout(() => {
      let responseText = "I'm processing your request. ZeroReturn ML models are analyzing listing data now. Try asking about 'return rate', 'electronics category', or 'reduce returns'!"

      if (query.includes('return rate')) {
        responseText = `Our current overall store return rate is ₹18.3% (down 3.2% this week). Electronics category remains the highest risk element, while Books have the lowest return rate of 6%.`
      } else if (query.includes('electronics')) {
        responseText = `Electronics category has an high-risk factor of 82/100, accounting for ${formatCurrency(1240000)} of our revenue at risk. The primary causes are description mismatches regarding technical specifications and size details.`
      } else if (query.includes('reduce') || query.includes('fix')) {
        responseText = `Here are 3 high-impact actions you can take today:
1. Add standard sizing charts to high-risk Clothing & Footwear categories.
2. Refine specifications in Electronics listings to resolve size/interface discrepancies.
3. Optimize listing images under studio lighting to resolve color mismatch reviews.`
      } else if (query.includes('chart') || query.includes('show')) {
        responseText = `I have loaded your Return Trend Line. We had a return rate spike on Day 15 (Electronics category) where return levels touched 24%. It has since stabilized to 18.3%.`
      } else if (query.includes('hi') || query.includes('hello')) {
        responseText = `Hello! How can I assist you with e-commerce return analytics today? You can ask me to evaluate return rate or suggest listings improvements.`
      }

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setIsTyping(false)
    }, 1200)
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          border: 'none',
          boxShadow: '0 8px 32px 0 rgba(139, 92, 246, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          cursor: 'pointer',
          zIndex: 9999,
          outline: 'none',
        }}
        className="chatbot-fab"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Chat Window Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="glass-card"
            style={{
              position: 'fixed',
              bottom: '96px',
              right: '24px',
              width: '380px',
              height: '520px',
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 9998,
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              background: 'rgba(10, 8, 20, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))'
            }}>
              <div>
                <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  ZeroReturn AI
                </h3>
                <span className="badge badge-low" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-secondary)' }}>
                  Powered by LLaMA 3
                </span>
              </div>
              <button
                onClick={() => {
                  toast.success('Offline mode: Backend integration required for advanced actions.')
                }}
                className="btn-ghost"
                style={{
                  padding: '6px',
                  borderRadius: '8px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer'
                }}
              >
                <BarChart2 size={14} />
                <span>Generate Chart</span>
              </button>
            </div>

            {/* Chat History Messages */}
            <div style={{
              flex: 1,
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              {messages.map((msg) => {
                const isBot = msg.sender === 'bot'
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isBot ? 'flex-start' : 'flex-end',
                      width: '100%'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                      flexDirection: isBot ? 'row' : 'row-reverse'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isBot ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))' : 'rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#fff'
                      }}>
                        {isBot ? '🤖' : '👤'}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{msg.time}</span>
                    </div>

                    <div style={{
                      maxWidth: '85%',
                      padding: '12px 16px',
                      borderRadius: isBot ? '0 16px 16px 16px' : '16px 0 16px 16px',
                      background: isBot ? 'rgba(255, 255, 255, 0.03)' : 'var(--accent-primary)',
                      border: isBot ? '1px solid var(--glass-border)' : 'none',
                      color: '#fff',
                      fontSize: '0.8125rem',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line'
                    }}>
                      {msg.text}
                    </div>
                  </div>
                )
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem'
                  }}>
                    🤖
                  </div>
                  <div style={{
                    padding: '10px 16px',
                    borderRadius: '0 16px 16px 16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    gap: '4px',
                    alignItems: 'center'
                  }}>
                    <span className="dot-loading" />
                    <span className="dot-loading" />
                    <span className="dot-loading" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form
              onSubmit={handleSend}
              style={{
                padding: '16px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(0,0,0,0.2)'
              }}
            >
              <button
                type="button"
                onClick={toggleListening}
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isListening ? 'var(--text-danger, #EF4444)' : 'rgba(255,255,255,0.05)',
                  color: isListening ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                type="text"
                placeholder="Ask ZeroReturn AI..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  color: '#fff',
                  fontSize: '0.8125rem',
                  outline: 'none',
                  transition: 'border-color 0.2s ease'
                }}
              />

              <button
                type="submit"
                style={{
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'var(--accent-primary)',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
