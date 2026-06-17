import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Mic, MicOff, FileText, Database, Compass, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendChatMessage } from '../../utils/api'

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Namaste! I am ZeroReturn AI Copilot. 🤖 Ask me questions in plain English, and I will query the data warehouse (NL2SQL) and retrieve glossary definitions (RAG) automatically!',
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

  const handleSend = async (e) => {
    if (e) e.preventDefault()
    if (!input.trim()) return

    const userText = input
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const res = await sendChatMessage({ message: userText })
      const botData = res.data

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botData.reply,
        dataContext: botData.data_context, // contains SQL & RAG metadata
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      toast.error("Copilot request failed.")
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Sorry, I am having trouble connecting to the decision engine.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
    } finally {
      setIsTyping(false)
    }
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
              width: '420px',
              height: '600px',
              maxHeight: 'calc(100vh - 120px)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 9998,
              border: '1px solid var(--glass-border)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              background: 'rgba(10, 8, 20, 0.96)',
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
                  ZeroReturn AI Copilot
                </h3>
                <span className="badge badge-low" style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-secondary)' }}>
                  Llama 3.3 • SQL & RAG Ingest
                </span>
              </div>
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
                const hasCtx = msg.dataContext
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
                      maxWidth: '90%',
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

                      {/* Display Copilot Context details inside bot chat bubbles */}
                      {isBot && hasCtx && (
                        <div style={{ marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 10 }}>
                          
                          {/* 1. Generated SQL block */}
                          {hasCtx.sql_details && (
                            <div style={{ marginBottom: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                <Database size={11} /> GENERATED SQL:
                              </span>
                              <pre style={{
                                margin: '4px 0',
                                padding: 8,
                                background: 'rgba(0,0,0,0.4)',
                                borderRadius: 6,
                                overflowX: 'auto',
                                fontSize: 10,
                                color: '#A7F3D0'
                              }}>{hasCtx.sql_details.sql}</pre>
                              
                              {/* Small Results Table */}
                              {hasCtx.sql_details.results && hasCtx.sql_details.results.length > 0 && (
                                <div style={{ overflowX: 'auto', marginTop: 6 }}>
                                  <table style={{ width: '100%', fontSize: 9, borderCollapse: 'collapse', background: 'rgba(255,255,255,0.02)' }}>
                                    <thead>
                                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                        {Object.keys(hasCtx.sql_details.results[0]).slice(0, 3).map(k => (
                                          <th key={k} style={{ textAlign: 'left', padding: 4, color: 'var(--text-muted)' }}>{k}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {hasCtx.sql_details.results.slice(0, 3).map((row, rIdx) => (
                                        <tr key={rIdx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                          {Object.values(row).slice(0, 3).map((val, vIdx) => (
                                            <td key={vIdx} style={{ padding: 4 }}>{typeof val === 'number' ? val.toLocaleString() : String(val)}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. RAG glossary context details */}
                          {hasCtx.rag_hits && hasCtx.rag_hits.length > 0 && (
                            <div style={{ marginBottom: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                                <Compass size={11} /> GLOSSARY (RAG KNOWLEDGE):
                              </span>
                              {hasCtx.rag_hits.map((hit, hIdx) => (
                                <div key={hIdx} style={{ fontSize: 10, margin: '4px 0', padding: 6, background: 'rgba(139,92,246,0.08)', borderLeft: '2px solid var(--accent-primary)', borderRadius: 4 }}>
                                  <strong>{hit.title}:</strong> {hit.content}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 3. Expected impact summary */}
                          {hasCtx.expected_impact && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#10B981', fontWeight: 700 }}>
                              <CheckCircle size={12} /> Expected savings: {hasCtx.expected_impact}
                            </div>
                          )}

                        </div>
                      )}

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
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFF', animate: 'ping 1s infinite' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFF', animate: 'ping 1s infinite', animationDelay: '0.2s' }} />
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFF', animate: 'ping 1s infinite', animationDelay: '0.4s' }} />
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
                  background: isListening ? '#EF4444' : 'rgba(255,255,255,0.05)',
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
                placeholder="Ask Copilot (e.g. show categories, what is CLV?)..."
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
