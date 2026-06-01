import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * OnboardingTour — Driver.js powered guided tour
 * Triggers automatically on first visit (stored in localStorage)
 * Can also be triggered manually via triggerTour()
 */
export default function OnboardingTour() {
  const navigate = useNavigate()
  const location = useLocation()
  const tourRef = useRef(null)
  const TOUR_KEY = 'zeroreturns-tour-done'

  useEffect(() => {
    // Only run tour on dashboard page
    if (location.pathname !== '/dashboard') return

    // Check if tour already done
    const tourDone = localStorage.getItem(TOUR_KEY)
    if (tourDone) return

    // Dynamically import driver.js to keep bundle lean
    import('driver.js').then(({ driver }) => {
      const driverObj = driver({
        animate: true,
        overlayOpacity: 0.6,
        smoothScroll: true,
        allowClose: true,
        overlayColor: '#0a0a14',
        popoverClass: 'zr-driver-popover',
        onDestroyStarted: () => {
          localStorage.setItem(TOUR_KEY, 'true')
          driverObj.destroy()
        },
        steps: [
          {
            element: '#sidebar-nav',
            popover: {
              title: '🚀 Welcome to ZeroReturn!',
              description: 'This is your main navigation. Access Dashboard, Analytics, Uploads and Settings from here.',
              side: 'right',
              align: 'start',
            },
          },
          {
            element: '#kpi-cards',
            popover: {
              title: '📊 Live KPI Cards',
              description: 'Watch your Total Orders, Return Rate, Revenue at Risk and Returns Prevented — all updating in real time via WebSocket.',
              side: 'bottom',
              align: 'center',
            },
          },
          {
            element: '#anomaly-banner',
            popover: {
              title: '🚨 Smart Anomaly Detection',
              description: 'Our Isolation Forest ML model detects unusual return spikes in your categories and alerts you instantly.',
              side: 'bottom',
            },
          },
          {
            element: '#trend-chart',
            popover: {
              title: '📈 Return Trend Chart',
              description: 'Track 30-day return patterns. Toggle Orders / Returns / Revenue lines and get AI-generated insights below the chart.',
              side: 'top',
            },
          },
          {
            element: '#category-heatmap',
            popover: {
              title: '🔥 Category Risk Heatmap',
              description: 'Instantly see which product categories carry the highest return risk. Cells turn red as risk increases.',
              side: 'left',
            },
          },
          {
            element: '#risk-table',
            popover: {
              title: '📋 Orders Risk Table',
              description: 'Every order is scored 0–100 for return probability. Filter, search and sort — then click "Fix Now" to analyze and fix high-risk listings.',
              side: 'top',
            },
          },
          {
            element: '#chatbot-fab',
            popover: {
              title: '💬 AI Chatbot',
              description: 'Ask questions in plain English or Hindi! Powered by LLaMA 3 via Groq. Also supports voice input.',
              side: 'left',
            },
          },
          {
            popover: {
              title: '🎉 You\'re all set!',
              description: 'Upload your order data, explore your return analytics, and start preventing returns today. Good luck! 🚀',
            },
          },
        ],
      })

      tourRef.current = driverObj

      // Small delay so page elements render first
      setTimeout(() => driverObj.drive(), 800)
    }).catch(() => {
      // driver.js failed to load — skip tour silently
    })
  }, [location.pathname])

  // Nothing to render — this is a side-effect-only component
  return null
}

/**
 * Manually re-trigger the tour (e.g. from Settings page "Take Tour" button)
 */
export function useTriggerTour() {
  return () => {
    localStorage.removeItem('zeroreturns-tour-done')
    window.location.href = '/dashboard'
  }
}
